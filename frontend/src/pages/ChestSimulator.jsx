import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, ShieldAlert, Award, Star, RefreshCw, Layers } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const CHEST_TYPES = {
  silver: {
    name: 'Silver Chest',
    cost: 0,
    cardCount: 3,
    guaranteedRarity: 'Common',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_silver.png',
    description: 'A standard chest containing common resources.'
  },
  golden: {
    name: 'Golden Chest',
    cost: 0,
    cardCount: 6,
    guaranteedRarity: 'Rare',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_gold.png',
    description: 'Guarantees at least 1 Rare card with increased gold.'
  },
  magical: {
    name: 'Magical Chest',
    cost: 0,
    cardCount: 10,
    guaranteedRarity: 'Epic',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_magical.png',
    description: 'Guarantees at least 2 Epic cards and multiple Rares!'
  },
  legendary: {
    name: 'Legendary Chest',
    cost: 0,
    cardCount: 1,
    guaranteedRarity: 'Legendary',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_legendary.png',
    description: 'Contains a single, guaranteed Legendary card!'
  },
  mega: {
    name: 'Mega Lightning Chest',
    cost: 0,
    cardCount: 18,
    guaranteedRarity: 'Legendary',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_megalightning.png',
    description: 'Massive card stacks with a guaranteed Legendary and strikes to swap cards!'
  },
  pro: {
    name: "King's Elite Pro Chest",
    cost: 0,
    cardCount: 25,
    guaranteedRarity: 'Champion',
    image: 'https://royaleapi.github.io/cr-api-assets/chests/chest_champion.png',
    description: "Exclusive Pro Mode chest! Guarantees multiple Champions and Evolution cards with crystal glows!"
  }
};

export default function ChestSimulator({ 
  unlockedCards, 
  setUnlockedCards, 
  collectionCount, 
  setCollectionCount, 
  useCollectionMode, 
  setUseCollectionMode,
  onViewCardDetails,
  proMode
}) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingChest, setOpeningChest] = useState(null); // 'silver', 'golden', etc.
  const [chestState, setChestState] = useState('closed'); // 'closed', 'shaking', 'opened'
  const [revealedCards, setRevealedCards] = useState([]); // cards drawn in current opening
  const [currentRevealIdx, setCurrentRevealIdx] = useState(-1);
  const [strikesLeft, setStrikesLeft] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/cards`)
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cards for chest simulator:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Loading card database...</p>;
  }

  // Draw cards based on chest logic
  const drawCards = (chestKey) => {
    const chest = CHEST_TYPES[chestKey];
    const drawn = [];
    
    const commons = cards.filter(c => c.rarity === 'Common');
    const rares = cards.filter(c => c.rarity === 'Rare');
    const epics = cards.filter(c => c.rarity === 'Epic');
    const legendaries = cards.filter(c => c.rarity === 'Legendary');

    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    if (chestKey === 'legendary') {
      drawn.push({ ...getRandom(legendaries), count: 1 });
    } else if (chestKey === 'pro') {
      const champions = cards.filter(c => c.rarity === 'Champion');
      const evos = cards.filter(c => c.isEvo);
      
      // Draw 2 Champions
      for (let i = 0; i < 2; i++) {
        const champ = getRandom(champions);
        const existing = drawn.find(d => d.key === champ.key);
        if (existing) existing.count += 1;
        else drawn.push({ ...champ, count: 1 });
      }

      // Draw 3 Evos
      for (let i = 0; i < 3; i++) {
        const evo = getRandom(evos);
        const existing = drawn.find(d => d.key === evo.key);
        if (existing) existing.count += 1;
        else drawn.push({ ...evo, count: 1 });
      }

      // Draw remaining 20 cards randomly (primarily Legendary & Epic)
      for (let i = 0; i < 20; i++) {
        const roll = Math.random() * 100;
        let cardPool = epics;
        let count = Math.floor(Math.random() * 3) + 1; // 1 to 3 copies
        
        if (roll > 60 && legendaries.length > 0) {
          cardPool = legendaries;
          count = 1;
        } else if (roll > 90 && champions.length > 0) {
          cardPool = champions;
          count = 1;
        }
        
        const rolledCard = getRandom(cardPool);
        const existing = drawn.find(d => d.key === rolledCard.key);
        if (existing) {
          existing.count += count;
        } else {
          drawn.push({ ...rolledCard, count });
        }
      }
    } else {
      // Logic for multi-card chests
      let cardsToDraw = chest.cardCount;

      // Handle guarantees
      if (chest.guaranteedRarity === 'Legendary') {
        drawn.push({ ...getRandom(legendaries), count: 1 });
        cardsToDraw--;
      }
      if (chest.guaranteedRarity === 'Epic' || chestKey === 'mega') {
        const count = chestKey === 'mega' ? 3 : 2;
        drawn.push({ ...getRandom(epics), count });
        cardsToDraw -= count;
      }
      if (chest.guaranteedRarity === 'Rare' || chestKey === 'mega' || chestKey === 'magical') {
        const count = chestKey === 'mega' ? 5 : chestKey === 'magical' ? 3 : 1;
        drawn.push({ ...getRandom(rares), count });
        cardsToDraw -= count;
      }

      // Draw remaining cards randomly based on weight distributions
      for (let i = 0; i < cardsToDraw; i++) {
        const roll = Math.random() * 100;
        let cardPool = commons;
        let count = Math.floor(Math.random() * 4) + 1; // 1 to 4 copies
        
        if (roll > 98 && legendaries.length > 0) {
          cardPool = legendaries;
          count = 1;
        } else if (roll > 90 && epics.length > 0) {
          cardPool = epics;
          count = Math.floor(Math.random() * 2) + 1;
        } else if (roll > 70 && rares.length > 0) {
          cardPool = rares;
          count = Math.floor(Math.random() * 3) + 1;
        }

        const rolledCard = getRandom(cardPool);
        // Avoid duplicate entries in the same chest draw, just increase stack count
        const existing = drawn.find(d => d.key === rolledCard.key);
        if (existing) {
          existing.count += count;
        } else {
          drawn.push({ ...rolledCard, count });
        }
      }
    }

    return drawn;
  };

  const startOpening = (chestKey) => {
    if (chestState !== 'closed') return;
    setOpeningChest(chestKey);
    setChestState('shaking');
    
    // Set lightning strikes for mega chest & pro chest
    if (chestKey === 'mega') {
      setStrikesLeft(3);
    } else if (chestKey === 'pro') {
      setStrikesLeft(5);
    } else {
      setStrikesLeft(0);
    }

    // Shake for 800ms, then move to revealed state
    setTimeout(() => {
      const drawn = drawCards(chestKey);
      setRevealedCards(drawn);
      setChestState('opened');
      setCurrentRevealIdx(0);
      
      // Update unlocked collection
      const newUnlocked = new Set(unlockedCards);
      const newCollection = { ...collectionCount };

      drawn.forEach(c => {
        newUnlocked.add(c.key);
        newCollection[c.key] = (newCollection[c.key] || 0) + c.count;
      });

      setUnlockedCards(Array.from(newUnlocked));
      setCollectionCount(newCollection);
    }, 800);
  };

  const handleNextCard = () => {
    if (currentRevealIdx < revealedCards.length - 1) {
      setCurrentRevealIdx(currentRevealIdx + 1);
    } else {
      // Finished opening
      setChestState('closed');
      setOpeningChest(null);
      setRevealedCards([]);
      setCurrentRevealIdx(-1);
    }
  };

  const handleStrike = () => {
    if (strikesLeft <= 0 || currentRevealIdx === -1) return;
    
    // Strike current card, draw another card of the same rarity
    const currentCard = revealedCards[currentRevealIdx];
    const sameRarityPool = cards.filter(c => c.rarity === currentCard.rarity && c.key !== currentCard.key);
    
    if (sameRarityPool.length === 0) return;
    
    const newCard = sameRarityPool[Math.floor(Math.random() * sameRarityPool.length)];
    const newRevealed = [...revealedCards];
    
    // Replace in revealed stack
    newRevealed[currentRevealIdx] = { ...newCard, count: currentCard.count };
    setRevealedCards(newRevealed);
    setStrikesLeft(strikesLeft - 1);

    // Update collection
    const newUnlocked = new Set(unlockedCards);
    const newCollection = { ...collectionCount };

    // Remove old card copies (approximate)
    newCollection[currentCard.key] = Math.max(0, (newCollection[currentCard.key] || 0) - currentCard.count);
    if (newCollection[currentCard.key] === 0) {
      // Check if it is completely gone
      newUnlocked.delete(currentCard.key);
    }

    // Add new card copies
    newUnlocked.add(newCard.key);
    newCollection[newCard.key] = (newCollection[newCard.key] || 0) + currentCard.count;

    setUnlockedCards(Array.from(newUnlocked));
    setCollectionCount(newCollection);
  };

  const resetCollection = () => {
    if (window.confirm('Are you sure you want to reset your card collection progress?')) {
      setUnlockedCards([]);
      setCollectionCount({});
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common': return '#cfd8dc';
      case 'Rare': return '#ff9800';
      case 'Epic': return '#e040fb';
      case 'Legendary': return '#00e5ff';
      default: return '#fff';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Chest Shop & collection</h1>
          <p className="page-subtitle">Test your luck, open magical chests to unlock cards, and toggle restrictions to build custom decks only using cards you possess.</p>
        </div>
        
        {/* Toggle constraints */}
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>COLLECTION DECK-BUILD MODE</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {useCollectionMode ? 'Limit analyzer to unlocked cards' : 'All cards usable in builder'}
            </span>
          </div>
          <button 
            onClick={() => setUseCollectionMode(!useCollectionMode)}
            className={`btn ${useCollectionMode ? '' : 'btn-secondary'}`}
            style={{ 
              padding: '0.45rem 1rem', 
              fontSize: '0.8rem'
            }}
          >
            {useCollectionMode ? 'ENABLED (Progression)' : 'DISABLED (Free)'}
          </button>
        </div>
      </div>

      {/* OPENING OVERLAY SCREEN */}
      {openingChest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div className="modal-header-banner" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="cr-panel-title">Opening {CHEST_TYPES[openingChest].name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--cr-gold)' }}>
                {currentRevealIdx >= 0 ? `${currentRevealIdx + 1} / ${revealedCards.length} Cards` : 'Shaking...'}
              </span>
            </div>
            
            <div className="modal-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {chestState === 'shaking' && (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={CHEST_TYPES[openingChest].image} 
                    alt="Chest" 
                    className="chest-image shake" 
                  />
                  <p style={{ marginTop: '1rem', fontSize: '1.2rem' }} className="pulse-glow">
                    UNLOCKING...
                  </p>
                </div>
              )}

              {chestState === 'opened' && revealedCards[currentRevealIdx] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'popIn 0.3s ease-out' }}>
                  {/* Flash Effect */}
                  <div className="chest-sparkles"></div>
                  
                  {/* Cards stack size */}
                  <div style={{ fontSize: '1.8rem', color: 'var(--cr-gold)', marginBottom: '0.5rem' }}>
                    x{revealedCards[currentRevealIdx].count}
                  </div>

                  {/* Card Display */}
                  <div 
                    onClick={() => onViewCardDetails(revealedCards[currentRevealIdx].key)}
                    className={`cr-card ${revealedCards[currentRevealIdx].rarity.toLowerCase()}`} 
                    style={{ width: '150px', height: '210px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  >
                    <span className="elixir-badge" style={{ top: '5px', left: '5px' }}>
                      {revealedCards[currentRevealIdx].elixir}
                    </span>
                    <img src={revealedCards[currentRevealIdx].image} alt={revealedCards[currentRevealIdx].name} className="cr-card-img" style={{ width: '82%', marginTop: '15px' }} />
                    <span className="cr-card-name" style={{ fontSize: '0.9rem', padding: '4px' }}>
                      {revealedCards[currentRevealIdx].name}
                    </span>
                  </div>

                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ 
                      fontSize: '1.2rem', 
                      color: getRarityColor(revealedCards[currentRevealIdx].rarity),
                      fontWeight: 'bold'
                    }}>
                      {revealedCards[currentRevealIdx].rarity} Card
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{revealedCards[currentRevealIdx].role.replace('-', ' ')}</span>
                  </div>

                  {/* Lightning strike function for Mega chest */}
                  {strikesLeft > 0 && (
                    <button 
                      onClick={handleStrike}
                      className="btn" 
                      style={{ 
                        marginTop: '1rem', 
                        background: 'var(--rarity-epic)', 
                        color: 'white', 
                        border: 'none',
                        fontSize: '0.85rem'
                      }}
                    >
                      ⚡ Lightning Strike ({strikesLeft} Left)
                    </button>
                  )}

                  <button 
                    onClick={handleNextCard}
                    className="btn btn-secondary" 
                    style={{ marginTop: '1.5rem', width: '150px', justifyContent: 'center' }}
                  >
                    {currentRevealIdx === revealedCards.length - 1 ? 'Finish Open' : 'Next Card'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT: CHESTS ROAD & COLLECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: CHEST SHOP */}
        <div className="cr-panel">
          <div className="cr-panel-header">
            <span className="cr-panel-title">Royal Chest Chests</span>
            <span className="cr-league-badge cr-badge-master">SHOP</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Click on a chest to open it instantly and add the rewards to your Clash collection.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.keys(CHEST_TYPES).map(key => {
              const chest = CHEST_TYPES[key];
              const isProLocked = key === 'pro' && !proMode;
              
              return (
                <div 
                  key={key} 
                  onClick={() => !isProLocked && startOpening(key)}
                  className={`glass-panel ${key === 'pro' ? 'crystal-chest-card' : ''}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    padding: '1rem', 
                    opacity: isProLocked ? 0.5 : 1,
                    cursor: isProLocked ? 'not-allowed' : 'pointer'
                  }}
                  onMouseOver={(e) => {
                    if (!isProLocked) e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    if (!isProLocked) e.currentTarget.style.transform = 'none';
                  }}
                >
                  <img src={chest.image} alt={chest.name} style={{ width: '65px', height: '65px', objectFit: 'contain', filter: isProLocked ? 'grayscale(100%)' : 'none' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', color: key === 'pro' ? 'var(--cr-gold)' : 'white' }}>{chest.name}</h4>
                      <span 
                        className={isProLocked ? "cr-league-badge cr-badge-challenger" : "cr-league-badge cr-badge-ultimate"}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {isProLocked ? 'PRO REQUIRED' : 'Free Entry'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.3' }}>
                      {isProLocked ? '⚠️ Unlocks in PRO Version. Enable by clicking the crown in the top header.' : chest.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: CARD COLLECTION GALLERY */}
        <div className="cr-panel" style={{ gridColumn: 'span 1' }}>
          <div className="cr-panel-header">
            <span className="cr-panel-title">My Collection Cards</span>
            <span style={{ fontFamily: 'var(--font-clash)', fontSize: '0.85rem', color: 'var(--cr-gold)' }}>
              {unlockedCards.length} / {cards.length} Unlocked
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total collection copies gathered.
            </span>
            <button 
              onClick={resetCollection}
              className="btn" 
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.75rem', 
                background: 'var(--cr-red)',
                color: 'white',
                border: 'none'
              }}
            >
              Reset Progress
            </button>
          </div>

          {unlockedCards.length > 0 ? (
            <div className="cards-grid" style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
              {cards.map(card => {
                const isUnlocked = unlockedCards.includes(card.key);
                const copies = collectionCount[card.key] || 0;
                
                // Calculate simulated card level based on count
                // Level 1: 0 count, Level 2: 2, Level 3: 5, Level 4: 10, Level 5: 20
                let level = 1;
                if (copies >= 37) level = 5;
                else if (copies >= 17) level = 4;
                else if (copies >= 7) level = 3;
                else if (copies >= 2) level = 2;

                return (
                  <div 
                    key={card.key}
                    onClick={() => isUnlocked && onViewCardDetails(card.key)}
                    className={`cr-card ${card.rarity.toLowerCase()}`}
                    style={{ 
                      opacity: isUnlocked ? 1 : 0.25,
                      filter: isUnlocked ? 'none' : 'grayscale(100%)',
                      cursor: isUnlocked ? 'pointer' : 'default',
                      position: 'relative'
                    }}
                  >
                    <span className="elixir-badge">{card.elixir}</span>
                    <img src={card.image} alt={card.name} className="cr-card-img" />
                    
                    {isUnlocked && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'var(--secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        zIndex: 10
                      }}>
                        Lvl {level}
                      </span>
                    )}

                    <span className="cr-card-name" style={{ fontSize: '0.62rem' }}>
                      {card.name}
                    </span>
                    
                    {isUnlocked && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '1px' }}>
                        {/* Copies bar */}
                        <div style={{ height: '4px', background: '#331a00', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(100, (copies / 40) * 100)}%`, 
                            background: 'var(--cr-blue)' 
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.5rem', color: '#8fa0c0', textAlign: 'center' }}>x{copies}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', border: '1px dashed var(--border-glass)', borderRadius: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <Layers size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem' }}>Your card deck collection is empty!</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Open a Silver, Golden or Magical Chest on the left to start unlocking cards.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
