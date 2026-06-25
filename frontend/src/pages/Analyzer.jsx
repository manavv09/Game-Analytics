import React, { useState, useEffect } from 'react';
import { Shield, Swords, Activity, Zap, Trash2, Search, ArrowRight, HelpCircle, CheckCircle, AlertTriangle, Share2, Clipboard, Info } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Analyzer({ initialDeck, onViewCardDetails, useCollectionMode, unlockedCards, proMode }) {
  const [cards, setCards] = useState([]);
  const [deck, setDeck] = useState(initialDeck || ["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [elixirFilter, setElixirFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  
  const [analysis, setAnalysis] = useState(null);
  const [selectedCardKey, setSelectedCardKey] = useState("knight");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  // Fetch all cards on mount
  useEffect(() => {
    fetch(`${API_BASE}/cards`)
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching cards:", err);
        setLoading(false);
      });
  }, []);

  // Run analysis whenever deck changes
  useEffect(() => {
    if (deck.length === 8) {
      fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck })
      })
        .then(res => res.json())
        .then(data => setAnalysis(data))
        .catch(err => console.error("Error analyzing deck:", err));
    }
  }, [deck]);

  // Fetch card replacement recommendations
  useEffect(() => {
    if (deck.length === 8 && selectedCardKey && deck.includes(selectedCardKey)) {
      setSuggestLoading(true);
      fetch(`${API_BASE}/analyze/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck, cardToReplace: selectedCardKey })
      })
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
          setSuggestLoading(false);
        })
        .catch(err => {
          console.error("Error fetching replacements:", err);
          setSuggestLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [deck, selectedCardKey]);

  // Remove card from deck
  const handleRemoveCard = (key) => {
    const newDeck = deck.filter(c => c !== key);
    setDeck(newDeck);
    if (selectedCardKey === key) {
      setSelectedCardKey(newDeck[0] || "");
    }
  };

  // Add card to deck
  const handleAddCard = (key) => {
    if (deck.includes(key)) return;
    if (deck.length >= 8) {
      // If full, replace selected card
      if (selectedCardKey) {
        const newDeck = deck.map(c => c === selectedCardKey ? key : c);
        setDeck(newDeck);
        setSelectedCardKey(key);
      }
    } else {
      const newDeck = [...deck, key];
      setDeck(newDeck);
      if (!selectedCardKey) setSelectedCardKey(key);
    }
  };

  // Swap replacement card directly
  const handleSwapReplacement = (newCardKey) => {
    if (!selectedCardKey) return;
    const newDeck = deck.map(c => c === selectedCardKey ? newCardKey : c);
    setDeck(newDeck);
    setSelectedCardKey(newCardKey);
  };

  // Load a preset deck (e.g. from meta lists)
  const handleLoadPreset = (presetCards) => {
    setDeck(presetCards);
    setSelectedCardKey(presetCards[0]);
  };

  // Copy share deck link to clipboard
  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopyFeedback("Link copied!");
        setTimeout(() => setCopyFeedback(""), 2000);
      })
      .catch(err => console.error("Could not copy deck link:", err));
  };

  // Filter available cards
  const filteredCards = cards.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? c.role === roleFilter : true;
    const matchesElixir = elixirFilter ? c.elixir === parseInt(elixirFilter) : true;
    const matchesRarity = rarityFilter ? c.rarity === rarityFilter : true;
    const matchesCollection = useCollectionMode ? unlockedCards.includes(c.key) : true;
    return matchesSearch && matchesRole && matchesElixir && matchesRarity && matchesCollection;
  });

  // Calculate cheapest 4-card cycle cost
  const sortedElixirs = [...deck].map(key => cards.find(c => c.key === key)?.elixir || 0).sort((a, b) => a - b);
  const cheapest4Cycle = sortedElixirs.slice(0, 4).reduce((sum, cost) => sum + cost, 0);

  // Helper to resolve score to a Clash Royale league name and badge class
  const getLeagueDetails = (val) => {
    if (val >= 8) return { label: 'Ultimate Champion', className: 'cr-badge-ultimate' };
    if (val >= 6) return { label: 'Grand Champion', className: 'cr-badge-champion' };
    if (val >= 4) return { label: 'Master League', className: 'cr-badge-master' };
    if (val >= 2) return { label: 'Challenger', className: 'cr-badge-challenger' };
    return { label: 'Training Camp', className: 'cr-badge-challenger' };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Battle Deck Analyzer</h1>
          <p className="page-subtitle">Build your custom 8-card battle deck and receive real-time archetype ratings, synergy evaluations, and upgrade recommendations.</p>
        </div>
        {useCollectionMode && (
          <span className="cr-league-badge cr-badge-master">COLLECTION LOCKED MODE</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVE DECK & REPLACEMENT DRAWER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Deck Builder */}
          <div className="cr-panel">
            <div className="cr-panel-header">
              <span className="cr-panel-title">Active Battle Deck</span>
              <span className="cr-league-badge cr-badge-ultimate">
                {deck.length} / 8 Cards
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {Array.from({ length: 8 }).map((_, idx) => {
                const cardKey = deck[idx];
                const card = cards.find(c => c.key === cardKey);
                const isSelected = selectedCardKey === cardKey;

                if (!card) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      style={{ 
                        aspectRatio: '5/7', 
                        borderRadius: '12px', 
                        border: '2px dashed var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        cursor: 'default'
                      }}
                    >
                      <HelpCircle size={20} style={{ marginBottom: '4px' }} />
                      Slot {idx + 1}
                    </div>
                  );
                }

                return (
                  <div 
                    key={card.key}
                    onClick={() => setSelectedCardKey(card.key)}
                    className={`cr-card ${card.rarity.toLowerCase()} ${card.isEvo ? 'evo' : ''}`}
                    style={{ 
                      borderColor: isSelected ? 'var(--cr-gold)' : '',
                      boxShadow: isSelected ? '0 0 0 1px var(--cr-gold)' : ''
                    }}
                  >
                    <span className="elixir-badge">{card.elixir}</span>
                    <img src={card.image} alt={card.name} className="cr-card-img" />
                    <span className="cr-card-name">{card.name}</span>
                    
                    {card.isEvo && (
                      <span                      style={{
                        position: 'absolute',
                        bottom: '18px',
                        right: '4px',
                        background: 'var(--cr-elixir)',
                        color: 'white',
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        padding: '1px 3px',
                        borderRadius: '3px',
                        zIndex: 10
                      }}>
                        EVO
                      </span>
                    )}

                    {/* Info toggle button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCardDetails(card.key);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'var(--foreground)',
                        borderRadius: '4px',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 12
                      }}
                      title="View detailed statistics"
                    >
                      <Info size={10} />
                    </button>
                    
                    {/* Delete overlay button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCard(card.key);
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 12
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            {deck.length < 8 && (
              <p style={{ color: 'var(--color-warning)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                Add {8 - deck.length} more card(s) from the grid below to compile analytics.
              </p>
            )}

            {/* Sharing Clipboard Section */}
            {deck.length === 8 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DECK SHARE LINK</span>
                <div className="deck-code-box">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`} 
                    className="deck-code-input"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="btn btn-secondary" 
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Share2 size={12} /> {copyFeedback || "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Replacement suggestions */}
          {deck.length === 8 && selectedCardKey && (
            <div className="cr-panel">
              <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
                <span className="cr-panel-title">Smart Replacements</span>
                <span className="cr-league-badge cr-badge-challenger">IDEAS</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Top candidates to replace <strong style={{ color: 'white' }}>{cards.find(c => c.key === selectedCardKey)?.name}</strong>:
              </p>

              {suggestLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing statistical replacement models...</p>
              ) : suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {suggestions.map((s) => (
                    <div 
                      key={s.card.key}
                      className="glass-panel"
                      style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.01)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <div 
                          className={`cr-card ${s.card.rarity.toLowerCase()}`} 
                          style={{ width: '48px', height: '67px', flexShrink: 0 }}
                          onClick={() => onViewCardDetails(s.card.key)}
                        >
                          <span className="elixir-badge" style={{ width: '16px', height: '16px', fontSize: '0.55rem', top: '1px', left: '1px' }}>{s.card.elixir}</span>
                          <img src={s.card.image} alt={s.card.name} className="cr-card-img" style={{ marginTop: '4px' }} />
                          <span className="cr-card-name" style={{ fontSize: '0.5rem', padding: '1px' }}>{s.card.name}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>{s.card.name}</span>
                            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '1px 3px' }}>
                              +{s.score}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>{s.reason}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSwapReplacement(s.card.key)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      >
                        Swap In <ArrowRight size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No replacement candidates resolved for this slot.</p>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ANALYTICS DASHBOARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {deck.length === 8 && analysis ? (
            <div className="cr-panel">
              <div className="cr-panel-header">
                <span className="cr-panel-title">Real-time Deck Intelligence</span>
                <span className="cr-league-badge cr-badge-champion">TELEMETRY</span>
              </div>

              {/* Elixir & Synergy Dashboard Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>AVERAGE ELIXIR</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-clash)', color: 'var(--cr-elixir)' }}>
                    {analysis.averageElixir}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: analysis.averageElixir > 4.2 ? 'var(--cr-red)' : analysis.averageElixir < 2.8 ? 'var(--cr-gold)' : '#4ade80' }}>
                    {analysis.averageElixir > 4.2 ? 'Heavy Beatdown' : analysis.averageElixir < 2.8 ? 'Fast Cycle' : 'Balanced Deck'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>DECK SYNERGY</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-clash)', color: 'var(--cr-gold)' }}>
                    {analysis.synergyScore}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: analysis.synergyScore >= 85 ? '#4ade80' : analysis.synergyScore >= 60 ? 'var(--cr-gold)' : 'var(--cr-red)' }}>
                    {analysis.synergyScore >= 85 ? 'Highly Synergistic' : analysis.synergyScore >= 60 ? 'Moderate Synergy' : 'Imbalanced Deck'}
                  </div>
                </div>
              </div>

              {/* Elixir Cycle Calculation */}
              <div className="elixir-cycle-display" style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                <Zap size={16} fill="var(--cr-elixir)" style={{ color: 'var(--cr-elixir)' }} />
                <span>
                  Cheapest 4-Card Cycle: <strong style={{ color: 'white' }}>{cheapest4Cycle} Elixir</strong>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {cheapest4Cycle <= 6 ? 'Ultra Cycle' : cheapest4Cycle <= 9 ? 'Fast cycle' : 'Standard pacing'}
                </span>
              </div>

              {/* Strength Gauges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>PERFORMANCE METRICS</h3>
                
                <div className="stat-bar-container">
                  <div className="stat-bar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Shield size={14} style={{ color: '#00e5ff' }} /> Ground Defense</span>
                    <span className={`cr-league-badge ${getLeagueDetails(analysis.metrics.defense).className}`} style={{ fontSize: '0.62rem', padding: '1px 4px', border: '1px solid white' }}>
                      {getLeagueDetails(analysis.metrics.defense).label} ({analysis.metrics.defense}/10)
                    </span>
                  </div>
                  <div className="stat-bar-outer" style={{ height: '10px', marginTop: '4px' }}>
                    <div className="stat-bar-inner" style={{ width: `${analysis.metrics.defense * 10}%`, background: 'var(--cr-blue)' }}></div>
                  </div>
                </div>

                <div className="stat-bar-container">
                  <div className="stat-bar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Swords size={14} style={{ color: 'var(--cr-red)' }} /> Tower Offense</span>
                    <span className={`cr-league-badge ${getLeagueDetails(analysis.metrics.offense).className}`} style={{ fontSize: '0.62rem', padding: '1px 4px', border: '1px solid white' }}>
                      {getLeagueDetails(analysis.metrics.offense).label} ({analysis.metrics.offense}/10)
                    </span>
                  </div>
                  <div className="stat-bar-outer" style={{ height: '10px', marginTop: '4px' }}>
                    <div className="stat-bar-inner" style={{ width: `${analysis.metrics.offense * 10}%`, background: 'var(--cr-red)' }}></div>
                  </div>
                </div>

                <div className="stat-bar-container">
                  <div className="stat-bar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Activity size={14} style={{ color: '#4ade80' }} /> Versatility</span>
                    <span className={`cr-league-badge ${getLeagueDetails(analysis.metrics.versatility).className}`} style={{ fontSize: '0.62rem', padding: '1px 4px', border: '1px solid white' }}>
                      {getLeagueDetails(analysis.metrics.versatility).label} ({analysis.metrics.versatility}/10)
                    </span>
                  </div>
                  <div className="stat-bar-outer" style={{ height: '10px', marginTop: '4px' }}>
                    <div className="stat-bar-inner" style={{ width: `${analysis.metrics.versatility * 10}%`, background: 'var(--cr-gold)' }}></div>
                  </div>
                </div>
              </div>

              {/* Archetype Checklist */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>ARCHETYPE REQUIREMENT CHECKLIST</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Win Condition (Tower Taker)</span>
                    {analysis.checklist.winCondition.met ? (
                      <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--cr-red)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Tank Killer (Heavy Defense)</span>
                    {analysis.checklist.tankKiller.met ? (
                      <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--cr-gold)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Air Defense (At least 2)</span>
                    {analysis.checklist.airDefense.met ? (
                      <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--cr-red)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Small Damage Spell (Log/Zap)</span>
                    {analysis.checklist.smallSpell.met ? (
                      <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--cr-gold)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem' }}>Heavy Damage Spell (Fireball/Poison)</span>
                    {analysis.checklist.bigSpell.met ? (
                      <CheckCircle size={16} style={{ color: '#4ade80' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--cr-gold)' }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses Detailed Badges */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>TACTICAL EVALUATION</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analysis.strengths.map((str, idx) => (
                    <div key={`str-${idx}`} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(74, 222, 128, 0.05)', borderLeft: '3px solid #22c55e', padding: '0.75rem', borderRadius: '4px' }}>
                      <CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#a7f3d0' }}>{str.title}</div>
                        <p style={{ fontSize: '0.72rem', color: '#d1fae5', lineHeight: '1.3' }}>{str.desc}</p>
                      </div>
                    </div>
                  ))}
                  {analysis.weaknesses.map((weak, idx) => (
                    <div key={`weak-${idx}`} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--cr-red)', padding: '0.75rem', borderRadius: '4px' }}>
                      <AlertTriangle size={16} style={{ color: 'var(--cr-red)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.82rem', color: '#fca5a5' }}>{weak.title}</div>
                        <p style={{ fontSize: '0.72rem', color: '#fee2e2', lineHeight: '1.3' }}>{weak.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="cr-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <p>Add 8 cards to your active deck on the left to review stats and recommendations.</p>
            </div>
          )}

          {/* PRO MODE MATCHUP PREDICTOR MATRIX (Only visible under Pro Mode) */}
          {proMode && deck.length === 8 && analysis && (() => {
            const getMatchupPercentage = (metaKey, defenseVal, offenseVal, averageElixir, synergyScore) => {
              let base = 50;
              base += (synergyScore - 70) * 0.15;
              if (metaKey === 'hog') {
                base += (defenseVal - 5) * 4;
                base += (3.5 - averageElixir) * 3;
              } else if (metaKey === 'pekka') {
                base += (defenseVal - 6) * 5;
              } else if (metaKey === 'golem') {
                base += (defenseVal - 5) * 3;
                base += (offenseVal - 5) * 2;
                if (averageElixir < 3.0) base -= 4;
              } else if (metaKey === 'bait') {
                base += (defenseVal - 5) * 3;
                if (averageElixir < 3.2) base += 5;
              } else if (metaKey === 'graveyard') {
                base += (offenseVal - 5) * 4;
              }
              return Math.round(Math.max(32, Math.min(68, base)));
            };

            const matchupsList = [
              {
                key: 'hog',
                name: 'Hog 2.6 Cycle',
                archetype: 'Fast Cycle',
                difficulty: 'Medium',
                winRate: getMatchupPercentage('hog', analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore),
                strategy: 'Protect your cannon/building. Force them into defensive fireballs.'
              },
              {
                key: 'pekka',
                name: 'Pekka Bridge Spam',
                archetype: 'Bridge Spam',
                difficulty: 'Hard',
                winRate: getMatchupPercentage('pekka', analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore),
                strategy: 'Avoid low-health deployments near the bridge. Tank their Bandit with Knight.'
              },
              {
                key: 'golem',
                name: 'Golem Beatdown',
                archetype: 'Heavy Beatdown',
                difficulty: 'Medium',
                winRate: getMatchupPercentage('golem', analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore),
                strategy: 'Punish opposite lane when Golem is deployed behind their King tower.'
              },
              {
                key: 'bait',
                name: 'Log Bait',
                archetype: 'Spell Bait',
                difficulty: 'Easy',
                winRate: getMatchupPercentage('bait', analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore),
                strategy: 'Save Log/small spell strictly for Goblin Barrel. Splash them down.'
              },
              {
                key: 'graveyard',
                name: 'Giant Graveyard',
                archetype: 'Control',
                difficulty: 'Hard',
                winRate: getMatchupPercentage('graveyard', analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore),
                strategy: 'Clear Skeletons instantly. Do not let their Giant cross the bridge for free.'
              }
            ];

            return (
              <div className="cr-panel" style={{ borderColor: 'var(--cr-gold)', marginTop: '2rem' }}>
                <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
                  <span className="cr-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ⚔️ AI Battle Matchup Predictor Matrix
                  </span>
                  <span className="cr-league-badge cr-badge-ultimate">PRO ENG.</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Simulating deck combat models against top meta archetypes. Win rates predict matchup viability.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {matchupsList.map(m => {
                    const isFavorable = m.winRate >= 50;
                    return (
                      <div 
                        key={m.key} 
                        className="glass-panel" 
                        style={{ 
                          padding: '1rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.5rem',
                          background: 'rgba(255,255,255,0.01)',
                          border: isFavorable ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '0.95rem', color: 'white', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{m.name}</h4>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.archetype} • Diff: <strong>{m.difficulty}</strong></span>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ 
                              fontSize: '1.25rem', 
                              fontWeight: 'bold', 
                              color: isFavorable ? '#4ade80' : '#f87171', 
                              fontFamily: 'var(--font-clash)',
                              textShadow: '1px 1px 0 #000' 
                            }}>
                              {m.winRate}% Win
                            </span>
                            <span style={{ display: 'block', fontSize: '0.62rem', color: isFavorable ? '#a7f3d0' : '#fca5a5' }}>
                              {isFavorable ? '★ Favorable Matchup' : '▲ Deficit Matchup'}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.72rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                          <strong>Tip:</strong> "{m.strategy}"
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          
        </div>
      </div>

      {/* BOTTOM SECTION: CARD CATALOG GRID FOR CARD SELECTION */}
      <div className="cr-panel">
        <div className="cr-panel-header">
          <span className="cr-panel-title">Royal Card Gallery</span>
          <span className="cr-league-badge cr-badge-ultimate">INDEX</span>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', border: '2px solid #2d3765', borderRadius: '10px', padding: '0.5rem 1rem', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search cards..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <option value="">All Roles</option>
            <option value="win-condition">Win Condition</option>
            <option value="tank-killer">Tank Killer</option>
            <option value="air-defense">Air Defense</option>
            <option value="tank">Tanks</option>
            <option value="support">Splash & Support</option>
            <option value="cycle">Cycle & Spirits</option>
            <option value="spell-small">Small Spells</option>
            <option value="spell-big">Big Spells</option>
            <option value="building-defensive">Defensive Buildings</option>
          </select>

          <select 
            value={rarityFilter} 
            onChange={(e) => setRarityFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <option value="">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
            <option value="Champion">Champion</option>
          </select>

          <select 
            value={elixirFilter} 
            onChange={(e) => setElixirFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <option value="">All Elixir Costs</option>
            <option value="1">1 Elixir</option>
            <option value="2">2 Elixir</option>
            <option value="3">3 Elixir</option>
            <option value="4">4 Elixir</option>
            <option value="5">5 Elixir</option>
            <option value="6">6 Elixir</option>
            <option value="7">7 Elixir</option>
            <option value="8">8 Elixir</option>
          </select>
        </div>

        {/* Card Catalog Grid */}
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading card assets database...</p>
        ) : filteredCards.length > 0 ? (
          <div className="cards-grid">
            {filteredCards.map((card) => {
              const inDeck = deck.includes(card.key);
              return (
                <div 
                  key={card.key}
                  onClick={() => inDeck ? handleRemoveCard(card.key) : handleAddCard(card.key)}
                  className={`cr-card ${card.rarity.toLowerCase()} ${card.isEvo ? 'evo' : ''}`}
                  style={{
                    opacity: inDeck ? 0.4 : 1,
                    borderColor: inDeck ? 'var(--cr-gold)' : '',
                    boxShadow: inDeck ? '0 0 12px rgba(251, 192, 45, 0.4)' : ''
                  }}
                >
                  <span className="elixir-badge">{card.elixir}</span>
                  
                  {/* Detailed statistics toggle button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewCardDetails(card.key);
                    }}
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      background: 'rgba(27, 110, 243, 0.95)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 15
                    }}
                  >
                    <Info size={10} />
                  </button>

                  <img src={card.image} alt={card.name} className="cr-card-img" />
                  <span className="cr-card-name">{card.name}</span>
                  
                  {card.isEvo && (
                    <span style={{
                      position: 'absolute',
                      bottom: '18px',
                      right: '4px',
                      background: 'linear-gradient(180deg, #d946ef 0%, #701a75 100%)',
                      color: 'white',
                      fontSize: '0.5rem',
                      fontWeight: 'bold',
                      padding: '1px 3px',
                      borderRadius: '3px',
                      border: '0.5px solid white',
                      textShadow: '0.5px 0.5px 0 black',
                      zIndex: 10,
                      fontFamily: 'var(--font-clash)'
                    }}>
                      EVO
                    </span>
                  )}
                  
                  {inDeck && (
                    <div style={{
                      position: 'absolute',
                      bottom: '22px',
                      left: '4px',
                      background: 'var(--cr-gold)',
                      borderRadius: '4px',
                      width: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 15
                    }}>
                      <CheckCircle size={10} style={{ color: 'white' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No cards matched your filter query.</p>
        )}
      </div>

      {/* Preset Fast Deck Injectors */}
      <div className="cr-panel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Quick Presets:</span>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
          onClick={() => handleLoadPreset(["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"])}
          disabled={useCollectionMode && !["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"].every(k => unlockedCards.includes(k))}
        >
          Hog 2.6 Cycle
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
          onClick={() => handleLoadPreset(["golem", "baby-dragon", "night-witch", "lumberjack", "tornado", "poison", "skeletons", "bomber"])}
          disabled={useCollectionMode && !["golem", "baby-dragon", "night-witch", "lumberjack", "tornado", "poison", "skeletons", "bomber"].every(k => unlockedCards.includes(k))}
        >
          Golem Beatdown
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
          onClick={() => handleLoadPreset(["pekka", "bandit", "battle-ram", "electro-wizard", "royal-ghost", "dark-prince", "poison", "zap"])}
          disabled={useCollectionMode && !["pekka", "bandit", "battle-ram", "electro-wizard", "royal-ghost", "dark-prince", "poison", "zap"].every(k => unlockedCards.includes(k))}
        >
          Pekka Bridge Spam
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
          onClick={() => handleLoadPreset(["goblin-barrel", "knight", "valkyrie", "inferno-tower", "the-log", "archers", "skeletons", "fireball"])}
          disabled={useCollectionMode && !["goblin-barrel", "knight", "valkyrie", "inferno-tower", "the-log", "archers", "skeletons", "fireball"].every(k => unlockedCards.includes(k))}
        >
          Log Bait
        </button>
      </div>

    </div>
  );
}
