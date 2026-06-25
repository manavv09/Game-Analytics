import React, { useState, useEffect } from 'react';
import { Sparkles, Play, ShieldAlert, Award, Star, CheckCircle, Info } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Recommender({ onImportDeck, onViewCardDetails, useCollectionMode, unlockedCards }) {
  const [cards, setCards] = useState([]);
  const [metaDecks, setMetaDecks] = useState([]);
  const [selectedFavs, setSelectedFavs] = useState([]);
  const [arena, setArena] = useState("12"); // default highest arena
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/cards`).then(res => res.json()),
      fetch(`${API_BASE}/meta/decks`).then(res => res.json())
    ])
      .then(([cardsData, decksData]) => {
        setCards(cardsData);
        setMetaDecks(decksData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading recommender databases:", err);
        setLoading(false);
      });
  }, []);

  // Handle favorite card clicks (max 3)
  const toggleFavCard = (key) => {
    if (selectedFavs.includes(key)) {
      setSelectedFavs(selectedFavs.filter(k => k !== key));
    } else {
      if (selectedFavs.length >= 3) return; // max 3
      setSelectedFavs([...selectedFavs, key]);
    }
  };

  // Run Recommendation Engine
  const handleRecommend = () => {
    const selectedArena = parseInt(arena);
    
    // Filter out cards that are above the selected arena, AND filter collection if collection mode active
    const availableCards = cards.filter(c => {
      const matchesArena = c.arena <= selectedArena;
      const matchesCollection = useCollectionMode ? unlockedCards.includes(c.key) : true;
      return matchesArena && matchesCollection;
    });
    
    // 1. Search for matching Meta Decks
    const metaMatches = metaDecks.filter(deck => {
      // Check if all selected favorites are in the deck
      const matchesFavs = selectedFavs.every(fav => deck.cards.includes(fav));
      // Check if all cards in the deck are unlocked at this arena/collection
      const matchesArenaAndCollection = deck.cards.every(cKey => {
        const fullCard = cards.find(c => c.key === cKey);
        if (!fullCard) return false;
        const matchesArena = fullCard.arena <= selectedArena;
        const matchesCollection = useCollectionMode ? unlockedCards.includes(cKey) : true;
        return matchesArena && matchesCollection;
      });
      return matchesFavs && matchesArenaAndCollection;
    });

    const recommendationResults = [];

    // Push meta matches
    metaMatches.forEach(m => {
      recommendationResults.push({
        type: 'Meta Match',
        name: m.name,
        cards: m.cards,
        winRate: m.winRate,
        popularity: m.popularity,
        averageElixir: m.averageElixir,
        archetype: m.archetype,
        difficulty: m.difficulty,
        reason: `Matches your locked card(s) and is an active meta deck with a ${m.winRate}% win rate.`
      });
    });

    // 2. If meta matches are sparse, or to offer variety: Generate a custom algorithmic deck!
    if (recommendationResults.length < 3) {
      // Let's run our dynamic deck generator!
      // We will try to build a custom deck starting with our selectedFavs.
      // If no favs are selected, we pick a popular win condition to start.
      let customDeck = [...selectedFavs];
      
      const cardsDb = availableCards; // use filtered cards database!
      
      // Ensure we have a win condition
      const hasWinCond = customDeck.some(k => cardsDb.find(c => c.key === k)?.role === 'win-condition');
      if (!hasWinCond && customDeck.length < 8) {
        // Find top win condition unlocked in this arena/collection
        const winConditions = cardsDb.filter(c => c.role === 'win-condition' && !customDeck.includes(c.key));
        winConditions.sort((a, b) => b.winRate - a.winRate);
        if (winConditions[0]) {
          customDeck.push(winConditions[0].key);
        }
      }

      // Archetype helper to add missing roles greedily
      const getRoleCounts = (deckKeys) => {
        const counts = { winCond: 0, airDef: 0, smallSpell: 0, bigSpell: 0, tankKiller: 0, cycle: 0 };
        deckKeys.forEach(k => {
          const c = cardsDb.find(card => card.key === k);
          if (!c) return;
          if (c.role === 'win-condition') counts.winCond++;
          if (c.targets === 'air-ground') counts.airDef++;
          if (c.role === 'spell-small') counts.smallSpell++;
          if (c.role === 'spell-big') counts.bigSpell++;
          if (c.role === 'tank-killer') counts.tankKiller++;
          if (c.role === 'cycle') counts.cycle++;
        });
        return counts;
      };

      // Greedily fill remaining slots up to 8
      while (customDeck.length < 8) {
        const roles = getRoleCounts(customDeck);
        const candidates = cardsDb.filter(c => !customDeck.includes(c.key));

        if (candidates.length === 0) break; // safety if collection is too small!

        // Score candidates based on deck balance
        const scoredCandidates = candidates.map(c => {
          let score = 50;

          // Crucial role weights
          if (roles.airDef < 2 && c.targets === 'air-ground') score += 40;
          if (roles.smallSpell < 1 && c.role === 'spell-small') score += 35;
          if (roles.bigSpell < 1 && c.role === 'spell-big') score += 30;
          if (roles.tankKiller < 1 && c.role === 'tank-killer') score += 30;
          if (roles.cycle < 1 && c.role === 'cycle') score += 15;

          // Synergy score check (how well does this candidate synergize with current customDeck?)
          let synergiesCount = 0;
          customDeck.forEach(dk => {
            if (c.synergies && c.synergies.includes(dk)) synergiesCount++;
            const dkObj = cardsDb.find(card => card.key === dk);
            if (dkObj && dkObj.synergies && dkObj.synergies.includes(c.key)) synergiesCount++;
          });
          score += synergiesCount * 12;

          // Elixir curve check (avoid pushing average elixir too high or low)
          const tempDeck = [...customDeck, c.key];
          const tempTotalElixir = tempDeck.reduce((sum, k) => sum + (cardsDb.find(card => card.key === k)?.elixir || 0), 0);
          const tempAvg = tempTotalElixir / tempDeck.length;
          const diffFromOptimal = Math.abs(tempAvg - 3.4);
          score += (1.5 - diffFromOptimal) * 10;

          // Card base quality
          score += (c.winRate - 50) * 1.5;

          return { key: c.key, score };
        });

        // Sort candidates by score and add the best one
        scoredCandidates.sort((a, b) => b.score - a.score);
        if (scoredCandidates[0]) {
          customDeck.push(scoredCandidates[0].key);
        } else {
          break; // safety
        }
      }

      if (customDeck.length === 8) {
        // Compute statistics for our custom deck
        const customTotalElixir = customDeck.reduce((sum, k) => sum + (cards.find(c => c.key === k)?.elixir || 0), 0);
        const customAvg = parseFloat((customTotalElixir / 8).toFixed(2));
        
        // Heuristic custom win rate based on cards baseline
        const customWinRate = parseFloat((customDeck.reduce((sum, k) => sum + (cards.find(c => c.key === k)?.winRate || 50), 0) / 8).toFixed(1));

        recommendationResults.push({
          type: 'AI Custom Deck',
          name: `Custom ${cards.find(c => c.key === selectedFavs[0])?.name || 'Knight'} Synergy`,
          cards: customDeck,
          winRate: customWinRate,
          popularity: 1.5,
          averageElixir: customAvg,
          archetype: customAvg > 3.8 ? 'Control-Beatdown' : customAvg < 3.0 ? 'Cycle' : 'Balanced',
          difficulty: 'Medium',
          reason: 'Algorithmic custom build compiled to maximize direct synergies, maintain Elixir curve limits, and complete defensive requirements.'
        });
      }
    }

    setResults(recommendationResults);
  };

  // Run on mount or when favorite selections change
  useEffect(() => {
    if (!loading) {
      handleRecommend();
    }
  }, [selectedFavs, arena, loading, useCollectionMode, unlockedCards]);

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Synchronizing deck models...</p>;
  }

  // Filter cards unlocked in current arena, AND unlocked in collection if collection mode active
  const availableArenaCards = cards.filter(c => {
    const matchesArena = c.arena <= parseInt(arena);
    const matchesCollection = useCollectionMode ? unlockedCards.includes(c.key) : true;
    return matchesArena && matchesCollection;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Clan Cards (Deck Finder)</h1>
          <p className="page-subtitle">Select up to 3 core cards you want to play, lock your current Arena unlock limit, and our engine will search meta profiles or algorithmically build a synergistic deck.</p>
        </div>
        {useCollectionMode && (
          <span className="cr-league-badge cr-badge-master">COLLECTION LOCKED MODE</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: FILTERS & CARD LOCKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="cr-panel">
            <div className="cr-panel-header">
              <span className="cr-panel-title">Deck Constraints</span>
              <span className="cr-league-badge cr-badge-challenger">FILTERS</span>
            </div>

            {/* Arena Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>CURRENT ARENA LEVEL</label>
              <select 
                value={arena} 
                onChange={(e) => setArena(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem' }}
              >
                <option value="0">Arena 0 (Training Camp)</option>
                <option value="1">Arena 1 (Goblin Stadium)</option>
                <option value="2">Arena 2 (Bone Pit)</option>
                <option value="3">Arena 3 (Barbarian Bowl)</option>
                <option value="4">Arena 4 (P.E.K.K.A Playhouse)</option>
                <option value="5">Arena 5 (Spell Valley)</option>
                <option value="6">Arena 6 (Builder Workshop)</option>
                <option value="7">Arena 7 (Royal Arena)</option>
                <option value="8">Arena 8 (Frozen Peak)</option>
                <option value="9">Arena 9 (Jungle Arena)</option>
                <option value="10">Arena 10 (Hog Mountain)</option>
                <option value="11">Arena 11 (Electro Valley)</option>
                <option value="12">Arena 12+ (Spooky Town & Legendary)</option>
              </select>
            </div>

            {/* Selected Locks info */}
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>LOCKED CORE CARDS (MAX 3)</label>
              {selectedFavs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  {selectedFavs.map(favKey => {
                    const card = cards.find(c => c.key === favKey);
                    return (
                      <div 
                        key={favKey} 
                        onClick={() => toggleFavCard(favKey)}
                        className={`cr-card ${card?.rarity.toLowerCase()} ${card?.isEvo ? 'evo' : ''}`}
                        style={{ borderColor: 'var(--cr-gold)', position: 'relative' }}
                      >
                        <span className="elixir-badge">{card?.elixir}</span>
                        <img src={card?.image} alt={card?.name} className="cr-card-img" />
                        <span className="cr-card-name" style={{ fontSize: '0.65rem' }}>{card?.name}</span>
                        
                        {/* Info details toggle */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCardDetails(favKey);
                          }}
                          style={{
                            position: 'absolute',
                            top: '3px',
                            left: '3px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'var(--foreground)',
                            borderRadius: '4px',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 15
                          }}
                        >
                          <Info size={8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '1rem', border: '1px dashed var(--border-glass)', borderRadius: '8px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  No cards locked. Click cards below to set favorites.
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid to Select Locks */}
          <div className="cr-panel">
            <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
              <span className="cr-panel-title">Tap to Lock Card</span>
              <span className="cr-league-badge cr-badge-master">POOL</span>
            </div>
            <div className="cards-grid" style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
              {availableArenaCards.map(card => {
                const isSelected = selectedFavs.includes(card.key);
                return (
                  <div 
                    key={card.key}
                    onClick={() => toggleFavCard(card.key)}
                    className={`cr-card ${card.rarity.toLowerCase()} ${card.isEvo ? 'evo' : ''}`}
                    style={{
                      borderColor: isSelected ? 'var(--cr-gold)' : '',
                      boxShadow: isSelected ? '0 0 0 1px var(--cr-gold)' : '',
                      opacity: !isSelected && selectedFavs.length >= 3 ? 0.4 : 1,
                      pointerEvents: !isSelected && selectedFavs.length >= 3 ? 'none' : 'auto'
                    }}
                  >
                    <span className="elixir-badge">{card.elixir}</span>

                    {/* Info button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCardDetails(card.key);
                      }}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'var(--foreground)',
                        borderRadius: '4px',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 15
                      }}
                    >
                      <Info size={8} />
                    </button>

                    <img src={card.image} alt={card.name} className="cr-card-img" />
                    <span className="cr-card-name" style={{ fontSize: '0.65rem' }}>{card.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RECOMMENDATION RESULTS */}
        <div className="cr-panel" style={{ gridColumn: 'span 1' }}>
          <div className="cr-panel-header">
            <span className="cr-panel-title">Algorithmic Recommendations</span>
            <span className="cr-league-badge cr-badge-ultimate">DECKS</span>
          </div>

          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {results.map((deck, idx) => (
                <div 
                  key={idx}
                  className="glass-panel" 
                  style={{ 
                    padding: '1.25rem', 
                    borderLeft: `3px solid ${deck.type === 'Meta Match' ? '#4ade80' : 'var(--cr-blue)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginRight: '0.5rem', background: deck.type === 'Meta Match' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(27, 110, 243, 0.15)', color: deck.type === 'Meta Match' ? '#4ade80' : '#60a5fa' }}>
                        {deck.type}
                      </span>
                      <h3 style={{ display: 'inline-block', fontFamily: 'var(--font-clash)', fontSize: '1.15rem', fontWeight: 'bold', textShadow: '1px 1px 0 #000' }}>
                        {deck.name}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.3' }}>{deck.reason}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EST. WIN-RATE</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4ade80', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>
                          {deck.winRate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Deck view */}
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', marginBottom: '1rem' }}>
                    {deck.cards.map(cKey => {
                      const c = cards.find(card => card.key === cKey);
                      return (
                        <div 
                          key={cKey}
                          onClick={() => onViewCardDetails(cKey)}
                          style={{ 
                            width: '46px', 
                            height: '64px', 
                            borderRadius: '6px', 
                            overflow: 'hidden', 
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                            flexShrink: 0,
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          title={c ? `${c.name} (${c.elixir} Elixir) - Click for Info` : cKey}
                        >
                          <img src={c?.image} alt={c?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <span style={{ color: 'var(--cr-elixir)', fontWeight: 'bold' }}>Elixir: {deck.averageElixir}</span>
                      <span style={{ color: 'var(--cr-gold)', fontWeight: 'bold' }}>Archetype: {deck.archetype}</span>
                    </div>

                    <button 
                      onClick={() => onImportDeck(deck.cards)}
                      className="btn" 
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Play size={12} fill="white" /> Load Deck
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p>No recommendations could be compiled for your active filters.</p>
              {useCollectionMode && (
                <p style={{ fontSize: '0.75rem', color: 'var(--cr-red)', marginTop: '0.5rem' }}>
                  Try opening more Chests in the Chest Shop to expand your card collection options.
                </p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
