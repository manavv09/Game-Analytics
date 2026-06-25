import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Recommender from './pages/Recommender';
import Coach from './pages/Coach';
import Support from './pages/Support';
import News from './pages/News';
import { getCardDetailedStats } from './utils/cardStats';
import { Activity, ShieldAlert, Sparkles, Zap, Swords, MessageSquare, Award, Users, Shield, Crown, HelpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [cards, setCards] = useState([]);
  
  // Shared deck state across components
  const [sharedDeck, setSharedDeck] = useState(["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"]);

  // Progression collection states (Chest opening simulator)
  const [unlockedCards, setUnlockedCards] = useState(() => {
    const saved = localStorage.getItem('cr_unlocked_cards');
    return saved ? JSON.parse(saved) : [];
  });
  const [collectionCount, setCollectionCount] = useState(() => {
    const saved = localStorage.getItem('cr_collection_count');
    return saved ? JSON.parse(saved) : {};
  });
  const [useCollectionMode, setUseCollectionMode] = useState(() => {
    const saved = localStorage.getItem('cr_collection_mode');
    return saved === 'true';
  });

  // Pro Mode Theme State
  const [proMode, setProMode] = useState(() => {
    const saved = localStorage.getItem('cr_pro_mode');
    return saved !== 'false'; // Default to PRO ON to wow immediately!
  });

  // Player Profile States
  const [kingLevel, setKingLevel] = useState(() => localStorage.getItem('cr_king_level') || '14');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('cr_player_name') || 'RoyalChallenger');
  const [trophies, setTrophies] = useState(() => localStorage.getItem('cr_trophies') || '7250');
  const [clanName, setClanName] = useState(() => localStorage.getItem('cr_clan_name') || 'Alpha Royale');
  const [winRate, setWinRate] = useState(() => localStorage.getItem('cr_win_rate') || '54.5');
  const [winsCount, setWinsCount] = useState(() => localStorage.getItem('cr_wins_count') || '1820');
  const [playerTag, setPlayerTag] = useState(() => localStorage.getItem('cr_player_tag') || '#VYR0RR');

  // Modal details states
  const [selectedCardDetailsKey, setSelectedCardDetailsKey] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile Form States (for editing inside modal)
  const [editName, setEditName] = useState(playerName);
  const [editLevel, setEditLevel] = useState(kingLevel);
  const [editTrophies, setEditTrophies] = useState(trophies);
  const [editClan, setEditClan] = useState(clanName);
  const [editWinRate, setEditWinRate] = useState(winRate);
  const [editWins, setEditWins] = useState(winsCount);
  const [editPlayerTag, setEditPlayerTag] = useState(playerTag);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('cr_logged_in') === 'true');
  const [loginTag, setLoginTag] = useState("");
  const [loginError, setLoginError] = useState("");

  // Fetch cards globally
  useEffect(() => {
    fetch(`${API_BASE}/cards`)
      .then(res => res.json())
      .then(data => setCards(data))
      .catch(err => console.error("Error fetching cards globally:", err));
  }, []);

  // Auto-sync player profile on initial page load if logged in
  useEffect(() => {
    if (isLoggedIn && playerTag && playerTag !== '#VYR0RR') {
      const cleanTag = playerTag.replace('#', '').trim();
      fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPlayerName(data.name);
            setKingLevel(data.kingLevel.toString());
            setTrophies(data.trophies.toString());
            setClanName(data.clanName);
            setWinRate(data.winRate.toString());
            setWinsCount(data.wins.toString());
            setPlayerTag(data.tag);
            
            if (data.activeDeck && data.activeDeck.length === 8) {
              setSharedDeck(data.activeDeck);
              setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
            }

            localStorage.setItem('cr_player_name', data.name);
            localStorage.setItem('cr_king_level', data.kingLevel.toString());
            localStorage.setItem('cr_trophies', data.trophies.toString());
            localStorage.setItem('cr_clan_name', data.clanName);
            localStorage.setItem('cr_win_rate', data.winRate.toString());
            localStorage.setItem('cr_wins_count', data.wins.toString());
            localStorage.setItem('cr_player_tag', data.tag);
          }
        })
        .catch(err => console.error("Error auto-syncing profile on load:", err));
    }
  }, []);

  // Save collection & profile changes
  useEffect(() => {
    localStorage.setItem('cr_unlocked_cards', JSON.stringify(unlockedCards));
  }, [unlockedCards]);

  useEffect(() => {
    localStorage.setItem('cr_collection_count', JSON.stringify(collectionCount));
  }, [collectionCount]);

  useEffect(() => {
    localStorage.setItem('cr_collection_mode', useCollectionMode);
  }, [useCollectionMode]);

  useEffect(() => {
    localStorage.setItem('cr_pro_mode', proMode);
    if (proMode) {
      document.body.classList.add('pro-mode');
    } else {
      document.body.classList.remove('pro-mode');
    }
  }, [proMode]);

  const saveProfile = () => {
    setPlayerName(editName);
    setKingLevel(editLevel);
    setTrophies(editTrophies);
    setClanName(editClan);
    setWinRate(editWinRate);
    setWinsCount(editWins);
    setPlayerTag(editPlayerTag);
    
    localStorage.setItem('cr_player_name', editName);
    localStorage.setItem('cr_king_level', editLevel);
    localStorage.setItem('cr_trophies', editTrophies);
    localStorage.setItem('cr_clan_name', editClan);
    localStorage.setItem('cr_win_rate', editWinRate);
    localStorage.setItem('cr_wins_count', editWins);
    localStorage.setItem('cr_player_tag', editPlayerTag);
    
    setShowProfileModal(false);
  };

  const handleSyncProfile = (tagToSync) => {
    if (!tagToSync) {
      setSyncError("Please enter a player tag!");
      return;
    }
    setSyncing(true);
    setSyncError("");
    
    const cleanTag = tagToSync.toUpperCase().replace(/O/g, '0').replace('#', '').trim();
    fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
      .then(res => res.json())
      .then(data => {
        setSyncing(false);
        if (data.success) {
          setPlayerName(data.name);
          setKingLevel(data.kingLevel.toString());
          setTrophies(data.trophies.toString());
          setClanName(data.clanName);
          setWinRate(data.winRate.toString());
          setWinsCount(data.wins.toString());
          setPlayerTag(data.tag);
          
          if (data.activeDeck && data.activeDeck.length === 8) {
            setSharedDeck(data.activeDeck);
            setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
          }

          setEditName(data.name);
          setEditLevel(data.kingLevel.toString());
          setEditTrophies(data.trophies.toString());
          setEditClan(data.clanName);
          setEditWinRate(data.winRate.toString());
          setEditWins(data.wins.toString());
          setEditPlayerTag(data.tag);

          localStorage.setItem('cr_player_name', data.name);
          localStorage.setItem('cr_king_level', data.kingLevel.toString());
          localStorage.setItem('cr_trophies', data.trophies.toString());
          localStorage.setItem('cr_clan_name', data.clanName);
          localStorage.setItem('cr_win_rate', data.winRate.toString());
          localStorage.setItem('cr_wins_count', data.wins.toString());
          localStorage.setItem('cr_player_tag', data.tag);
          
          const isSimulated = data.source && data.source.includes('Simulated');
          if (isSimulated) {
            alert(`⚠️ DEMO MODE: Aapka real data nahi aaya!\n\nYeh ek simulated/fake profile hai. Aapka asli deck aur info alag ho sakti hai.\n\nReal data ke liye:\n1. developer.clashroyale.com pe apna current IP whitelist karo\n2. Phir dobara Sync karo`);
          } else {
            alert(`✅ Profile synced from ${data.source}!`);
          }
        } else {
          setSyncError(data.error || "Failed to sync profile. Player tag check karo.");
        }
      })
      .catch(err => {
        console.error("Error syncing profile tag:", err);
        setSyncing(false);
        setSyncError("Sync failed. Check connection to backend.");
      });
  };

  // Synchronize edit states when modal opens
  const handleOpenProfile = () => {
    setEditName(playerName);
    setEditLevel(kingLevel);
    setEditTrophies(trophies);
    setEditClan(clanName);
    setEditWinRate(winRate);
    setEditWins(winsCount);
    setEditPlayerTag(playerTag);
    setSyncError("");
    setShowProfileModal(true);
  };

  // URL query parameter parsing to import shared decks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deckParam = params.get('deck');
    if (deckParam) {
      const deckCards = deckParam.split(',').map(c => c.trim().toLowerCase());
      if (deckCards.length === 8) {
        setSharedDeck(deckCards);
        setActivePage('analyzer');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleImportDeck = (deckCards) => {
    setSharedDeck(deckCards);
    setActivePage('analyzer');
  };

  const handleViewCardDetails = (cardKey) => {
    setSelectedCardDetailsKey(cardKey);
  };

  const handleAddCardToDeckFromModal = (key) => {
    if (sharedDeck.includes(key)) return;
    if (sharedDeck.length >= 8) {
      alert("Deck is full! Select slot in Battle Deck page to swap.");
    } else {
      setSharedDeck([...sharedDeck, key]);
    }
  };

  const handleRemoveCardFromDeckFromModal = (key) => {
    setSharedDeck(sharedDeck.filter(k => k !== key));
  };

  const activeCardObj = cards.find(c => c.key === selectedCardDetailsKey);
  const cardDetails = getCardDetailedStats(activeCardObj);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            onImportDeck={handleImportDeck} 
            onViewCardDetails={handleViewCardDetails} 
            useCollectionMode={useCollectionMode}
            unlockedCards={unlockedCards}
            proMode={proMode}
          />
        );
      case 'analyzer':
        return (
          <Analyzer 
            key={sharedDeck.join(',')} 
            initialDeck={sharedDeck} 
            onViewCardDetails={handleViewCardDetails}
            useCollectionMode={useCollectionMode}
            unlockedCards={unlockedCards}
            proMode={proMode}
          />
        );
      case 'recommender':
        return (
          <Recommender 
            onImportDeck={handleImportDeck} 
            onViewCardDetails={handleViewCardDetails}
            useCollectionMode={useCollectionMode}
            unlockedCards={unlockedCards}
            proMode={proMode}
          />
        );
      case 'coach':
        return <Coach proMode={proMode} sharedDeck={sharedDeck} cards={cards} />;
      case 'support':
        return <Support playerTag={playerTag} playerName={playerName} />;
      case 'news':
        return <News proMode={proMode} />;
      default:
        return <Dashboard onImportDeck={handleImportDeck} onViewCardDetails={handleViewCardDetails} proMode={proMode} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-logo-container">
            <svg viewBox="0 0 24 24" width="48" height="48" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.55))', marginBottom: '4px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGradLogin)" stroke="#eab308" strokeWidth="1.5" />
              <path d="M8 14l1.5-4L12 12l2.5-2L16 14H8z" fill="#fff" stroke="#1e293b" strokeWidth="1" />
              <circle cx="12" cy="9" r="0.75" fill="#fff" />
              <defs>
                <linearGradient id="goldGradLogin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="login-logo">Royale Insights AI</h1>
            <p className="login-subtitle">AI-powered Battle Deck recommendations, real-time matchup simulation telemetries, and smart arena analytics.</p>
          </div>

          <div className="login-input-group">
            <label>CONNECT PLAYER PROFILE TAG</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Enter Player Tag (e.g. #VYR0RR)" 
                value={loginTag} 
                onChange={(e) => setLoginTag(e.target.value.toUpperCase())} 
                style={{ flex: 1, padding: '0.6rem 1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}
                disabled={syncing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!loginTag) {
                      setLoginError("Please enter a player tag!");
                      return;
                    }
                    setSyncing(true);
                    setLoginError("");
                    const cleanTag = loginTag.toUpperCase().replace(/O/g, '0').replace('#', '').trim();
                    fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
                      .then(res => res.json())
                      .then(data => {
                        setSyncing(false);
                        if (data.success) {
                          setPlayerName(data.name);
                          setKingLevel(data.kingLevel.toString());
                          setTrophies(data.trophies.toString());
                          setClanName(data.clanName);
                          setWinRate(data.winRate.toString());
                          setWinsCount(data.wins.toString());
                          setPlayerTag(data.tag);
                          if (data.activeDeck && data.activeDeck.length === 8) {
                            setSharedDeck(data.activeDeck);
                            setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
                          }
                          localStorage.setItem('cr_player_name', data.name);
                          localStorage.setItem('cr_king_level', data.kingLevel.toString());
                          localStorage.setItem('cr_trophies', data.trophies.toString());
                          localStorage.setItem('cr_clan_name', data.clanName);
                          localStorage.setItem('cr_win_rate', data.winRate.toString());
                          localStorage.setItem('cr_wins_count', data.wins.toString());
                          localStorage.setItem('cr_player_tag', data.tag);
                          setIsLoggedIn(true);
                          localStorage.setItem('cr_logged_in', 'true');
                        } else {
                          setLoginError(data.error || "Player tag nahi mila. Sahi tag enter karo.");
                        }
                      })
                      .catch(err => {
                        console.error("Login tag sync failed:", err);
                        setSyncing(false);
                        setLoginError("Sync failed. Check connection to backend.");
                      });
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (!loginTag) {
                    setLoginError("Please enter a player tag!");
                    return;
                  }
                  setSyncing(true);
                  setLoginError("");
                  const cleanTag = loginTag.toUpperCase().replace(/O/g, '0').replace('#', '').trim();
                  fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
                    .then(res => res.json())
                    .then(data => {
                      setSyncing(false);
                      if (data.success) {
                        setPlayerName(data.name);
                        setKingLevel(data.kingLevel.toString());
                        setTrophies(data.trophies.toString());
                        setClanName(data.clanName);
                        setWinRate(data.winRate.toString());
                        setWinsCount(data.wins.toString());
                        setPlayerTag(data.tag);
                        if (data.activeDeck && data.activeDeck.length === 8) {
                          setSharedDeck(data.activeDeck);
                          setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
                        }
                        localStorage.setItem('cr_player_name', data.name);
                        localStorage.setItem('cr_king_level', data.kingLevel.toString());
                        localStorage.setItem('cr_trophies', data.trophies.toString());
                        localStorage.setItem('cr_clan_name', data.clanName);
                        localStorage.setItem('cr_win_rate', data.winRate.toString());
                        localStorage.setItem('cr_wins_count', data.wins.toString());
                        localStorage.setItem('cr_player_tag', data.tag);
                        setIsLoggedIn(true);
                        localStorage.setItem('cr_logged_in', 'true');
                      } else {
                        setLoginError(data.error || "Player tag nahi mila. Sahi tag enter karo.");
                      }
                    })
                    .catch(err => {
                      console.error("Login tag sync failed:", err);
                      setSyncing(false);
                      setLoginError("Sync failed. Check connection to backend.");
                    });
                }}
                className="btn" 
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Enter Arena'}
              </button>
            </div>
            {loginError && <span style={{ fontSize: '0.72rem', color: 'var(--cr-red)', marginTop: '4px' }}>{loginError}</span>}
          </div>

          <div className="login-divider">OR</div>

          <button 
            className="login-guest-btn"
            onClick={() => {
              setIsLoggedIn(true);
              localStorage.setItem('cr_logged_in', 'true');
            }}
          >
            ENTER AS ROYAL CHALLENGER (GUEST)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Navigation with Clash Royale style theme */}
      <nav className="nav-container">
        <div className="nav-logo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setActivePage('dashboard')}>
          <svg viewBox="0 0 24 24" width="28" height="28" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))', marginRight: '8px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGrad)" stroke="#eab308" strokeWidth="1.5" />
            <path d="M8 14l1.5-4L12 12l2.5-2L16 14H8z" fill="#fff" stroke="#1e293b" strokeWidth="1" />
            <circle cx="12" cy="9" r="0.75" fill="#fff" />
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
          Royale Insights AI
        </div>
        
        {/* Main Tab Links */}
        <div className="nav-links">
          <button 
            onClick={() => setActivePage('dashboard')} 
            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
          >
            <Activity size={16} /> Trophy Road
          </button>
          <button 
            onClick={() => setActivePage('analyzer')} 
            className={`nav-link ${activePage === 'analyzer' ? 'active' : ''}`}
          >
            <ShieldAlert size={16} /> Battle Deck
          </button>
          <button 
            onClick={() => setActivePage('recommender')} 
            className={`nav-link ${activePage === 'recommender' ? 'active' : ''}`}
          >
            <Sparkles size={16} /> Clan Cards
          </button>
          <button 
            onClick={() => setActivePage('coach')} 
            className={`nav-link ${activePage === 'coach' ? 'active' : ''}`}
          >
            <Zap size={16} /> Training Camp
          </button>
          <button 
            onClick={() => setActivePage('support')} 
            className={`nav-link ${activePage === 'support' ? 'active' : ''}`}
          >
            <HelpCircle size={16} /> Help & Support
          </button>
          <button 
            onClick={() => setActivePage('news')} 
            className={`nav-link ${activePage === 'news' ? 'active' : ''}`}
          >
            <MessageSquare size={16} /> News Royale
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* GitHub Repository Link Button */}
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="pro-mode-toggle"
            title="View on GitHub"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}>
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <span>GitHub</span>
          </a>

          {/* Global Player Profile Nav Widget */}
          <div className="player-nav-widget" onClick={handleOpenProfile}>
            <div className="king-level-badge">{kingLevel}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: 'white' }}>{playerName}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--cr-gold)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                🏆 {trophies}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Page Layout */}
      <main className="main-layout">
        {renderPage()}
      </main>

      {/* GLOBAL CARD STATS DETAILS MODAL OVERLAY */}
      {selectedCardDetailsKey && cardDetails && (
        <div className="modal-overlay" onClick={() => setSelectedCardDetailsKey(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--border)' }}>
            <div className="modal-header-banner" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="cr-panel-title" style={{ color: 'white' }}>{cardDetails.name} Info</span>
              <button className="modal-close-btn" onClick={() => setSelectedCardDetailsKey(null)}>X</button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {/* 3D-like Card Display */}
                <div className={`cr-card ${cardDetails.rarity.toLowerCase()} ${cardDetails.isEvo ? 'evo' : ''}`} style={{ width: '130px', height: '182px', flexShrink: 0, cursor: 'default' }}>
                  <span className="elixir-badge">{cardDetails.elixir}</span>
                  <img src={cardDetails.image} alt={cardDetails.name} className="cr-card-img" style={{ marginTop: '10px' }} />
                  <span className="cr-card-name" style={{ fontSize: '0.75rem', padding: '2px' }}>{cardDetails.name}</span>
                </div>

                {/* Core description details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span className="badge" style={{ background: 'rgba(251, 192, 45, 0.15)', color: 'var(--cr-gold)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      Arena {cardDetails.arena}
                    </span>
                    <span className="badge" style={{ background: 'rgba(27, 110, 243, 0.15)', color: 'var(--cr-blue)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {cardDetails.rarity}
                    </span>
                    <span className="badge" style={{ background: 'rgba(255, 18, 133, 0.15)', color: 'var(--cr-elixir)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {cardDetails.type}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#b0c4de', lineHeight: '1.4', fontStyle: 'italic' }}>
                    "{cardDetails.description}"
                  </p>
                </div>
              </div>

              {/* Stats table */}
              <div className="glass-panel" style={{ padding: '0.75rem 1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--cr-gold)' }}>TACTICAL TELEMETRY STATISTICS</h4>
                <table className="card-stats-table">
                  <tbody>
                    <tr>
                      <td>Hitpoints (HP)</td>
                      <td>{cardDetails.hp || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Damage per Hit</td>
                      <td>{cardDetails.damage || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Damage per Second (DPS)</td>
                      <td style={{ color: 'var(--cr-red)' }}>{cardDetails.dps || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Attack Speed (Hit Speed)</td>
                      <td>{cardDetails.hitSpeed || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Movement Speed</td>
                      <td>{cardDetails.speed || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Targets & Range</td>
                      <td style={{ color: 'var(--cr-blue)' }}>{cardDetails.range || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Champion ability details */}
              {cardDetails.heroAbility && (
                 <div style={{ background: 'rgba(234, 179, 8, 0.02)', border: '1px solid var(--cr-gold)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ 
                      background: 'linear-gradient(180deg, #ffc107 0%, #ff8f00 100%)', 
                      color: 'white', 
                      fontSize: '0.6rem', 
                      fontWeight: 'bold', 
                      padding: '2px 5px', 
                      borderRadius: '4px',
                      textShadow: '0.5px 0.5px 0 black',
                      fontFamily: 'var(--font-clash)'
                    }}>HERO ABILITY</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--cr-gold)' }}>
                      {cardDetails.heroAbility.name} ({cardDetails.heroAbility.cost} Elixir)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#fffdf4', lineHeight: '1.3' }}>{cardDetails.heroAbility.description}</p>
                </div>
              )}

              {/* Evolution ability panel */}
              {cardDetails.evoDescription && (
                 <div style={{ background: 'rgba(236, 72, 153, 0.02)', border: '1px solid var(--cr-elixir)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    <span style={{ 
                      background: 'linear-gradient(180deg, #d946ef 0%, #701a75 100%)', 
                      color: 'white', 
                      fontSize: '0.6rem', 
                      fontWeight: 'bold', 
                      padding: '2px 5px', 
                      borderRadius: '4px',
                      textShadow: '0.5px 0.5px 0 black',
                      fontFamily: 'var(--font-clash)'
                    }}>EVO</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f472b6' }}>Evolution Perks Unlocked</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#fdf4ff', lineHeight: '1.3' }}>{cardDetails.evoDescription}</p>
                </div>
              )}

              {/* Deck actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                {sharedDeck.includes(cardDetails.key) ? (
                  <button 
                    onClick={() => {
                      handleRemoveCardFromDeckFromModal(cardDetails.key);
                      setSelectedCardDetailsKey(null);
                    }}
                    className="btn"                     style={{ background: 'var(--cr-red)', color: 'white', border: 'none', fontSize: '0.85rem' }}
                  >
                    Remove From Deck
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleAddCardToDeckFromModal(cardDetails.key);
                      setSelectedCardDetailsKey(null);
                    }}
                    className="btn"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Add to Deck
                  </button>
                )}
                
                <button 
                  onClick={() => setSelectedCardDetailsKey(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Dismiss
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PLAYER PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header-banner" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="cr-panel-title">My Arena Profile</span>
              <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>X</button>
            </div>
            
            <div className="modal-body">
              {/* Profile Card Summary */}
               <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="king-level-badge" style={{ width: '40px', height: '40px', fontSize: '1.4rem' }}>{kingLevel}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000', color: 'white' }}>
                      {playerName}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{playerTag}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    <span>Clan: <strong style={{ color: 'white' }}>{clanName}</strong></span>
                    <span>Trophies: <strong style={{ color: 'var(--cr-gold)' }}>🏆 {trophies}</strong></span>
                  </div>
                </div>
              </div>

              {/* Active Deck Row */}
              <div style={{ margin: '0.25rem 0' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--cr-gold)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>ACTIVE BATTLE DECK</h4>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', padding: '0.25rem 0' }}>
                  {sharedDeck.map(cardKey => {
                    const c = cards.find(card => card.key === cardKey);
                    return (
                      <div 
                        key={cardKey} 
                        onClick={() => {
                          setShowProfileModal(false);
                          handleViewCardDetails(cardKey);
                        }}
                          style={{ 
                            width: '42px', 
                            height: '59px', 
                            borderRadius: '6px', 
                            overflow: 'hidden', 
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                        title={c?.name}
                      >
                        <img src={c?.image} alt={c?.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career Stats Grid */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                 <div className="glass-panel" style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CAREER WINS</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                     {winsCount} Wins
                   </div>
                 </div>
                 <div className="glass-panel" style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WIN RATE</div>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>
                     {winRate}%
                   </div>
                 </div>
               </div>

              {/* Sync Section */}
               <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--cr-gold)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--cr-gold)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Crown size={14} fill="var(--cr-gold)" /> SYNC WITH SUPERCELL PLAYER TAG
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Player Tag (e.g. #VYR0RR)" 
                    value={editPlayerTag} 
                    onChange={e => setEditPlayerTag(e.target.value.toUpperCase())} 
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase' }}
                    disabled={syncing}
                  />
                  <button 
                    onClick={() => handleSyncProfile(editPlayerTag)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Sync Tag'}
                  </button>
                </div>
                {syncError && <span style={{ fontSize: '0.7rem', color: 'var(--cr-red)' }}>{syncError}</span>}
              </div>

              {/* Edit Form */}
               <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--cr-gold)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                  EDIT PROFILE INFO
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>USERNAME</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>CLAN NAME</label>
                    <input type="text" value={editClan} onChange={e => setEditClan(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>TROPHIES</label>
                    <input type="number" value={editTrophies} onChange={e => setEditTrophies(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>KING LEVEL</label>
                    <input type="number" value={editLevel} onChange={e => setEditLevel(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>WIN RATE %</label>
                    <input type="text" value={editWinRate} onChange={e => setEditWinRate(e.target.value)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <button 
                  onClick={() => {
                    setIsLoggedIn(false);
                    localStorage.setItem('cr_logged_in', 'false');
                    setShowProfileModal(false);
                  }}
                  className="btn" 
                  style={{ 
                    marginRight: 'auto', 
                    fontSize: '0.85rem',
                    background: 'var(--cr-red)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Log Out
                </button>

                <button 
                  onClick={saveProfile}
                  className="btn"
                  style={{ fontSize: '0.85rem' }}
                >
                  Save Profile
                </button>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
