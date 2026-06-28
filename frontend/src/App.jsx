import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Recommender from './pages/Recommender';
import Coach from './pages/Coach';
import Support from './pages/Support';
import News from './pages/News';
import { getCardDetailedStats } from './utils/cardStats';
import { btnPrimary, btnSecondary, btnDanger, cardBase, cardGradient } from './utils/ui';
import {
  Activity, ShieldAlert, Sparkles, Zap, MessageSquare, Crown, HelpCircle,
  Menu, X, Trophy
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const NAV_ITEMS = [
  { key: 'dashboard',  icon: Activity,     label: 'Meta' },
  { key: 'analyzer',   icon: ShieldAlert,  label: 'Deck' },
  { key: 'recommender',icon: Sparkles,     label: 'Finder' },
  { key: 'coach',      icon: Zap,          label: 'Coach' },
  { key: 'support',    icon: HelpCircle,   label: 'Support' },
  { key: 'news',       icon: MessageSquare,label: 'News' },
];

const ShieldLogo = ({ size = 28 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGrad)" stroke="#c9a227" strokeWidth="1.25" />
    <path d="M8 14l1.5-4L12 12l2.5-2L16 14H8z" fill="#fff" stroke="#1e293b" strokeWidth="0.75" />
    <circle cx="12" cy="9" r="0.75" fill="#fff" />
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f5c842" />
        <stop offset="100%" stopColor="#c9a227" />
      </linearGradient>
    </defs>
  </svg>
);

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [sharedDeck, setSharedDeck] = useState(["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"]);

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

  const [proMode, setProMode] = useState(() => {
    const saved = localStorage.getItem('cr_pro_mode');
    return saved !== 'false';
  });

  const [kingLevel, setKingLevel] = useState(() => localStorage.getItem('cr_king_level') || '14');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('cr_player_name') || 'RoyalChallenger');
  const [trophies, setTrophies] = useState(() => localStorage.getItem('cr_trophies') || '7250');
  const [clanName, setClanName] = useState(() => localStorage.getItem('cr_clan_name') || 'Alpha Royale');
  const [winRate, setWinRate] = useState(() => localStorage.getItem('cr_win_rate') || '54.5');
  const [winsCount, setWinsCount] = useState(() => localStorage.getItem('cr_wins_count') || '1820');
  const [playerTag, setPlayerTag] = useState(() => localStorage.getItem('cr_player_tag') || '#VYR0RR');

  const [selectedCardDetailsKey, setSelectedCardDetailsKey] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  useEffect(() => {
    fetch(`${API_BASE}/cards`)
      .then(res => res.json())
      .then(data => setCards(data))
      .catch(err => console.error("Error fetching cards globally:", err));
  }, []);

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

  useEffect(() => { localStorage.setItem('cr_unlocked_cards', JSON.stringify(unlockedCards)); }, [unlockedCards]);
  useEffect(() => { localStorage.setItem('cr_collection_count', JSON.stringify(collectionCount)); }, [collectionCount]);
  useEffect(() => { localStorage.setItem('cr_collection_mode', useCollectionMode); }, [useCollectionMode]);

  useEffect(() => {
    localStorage.setItem('cr_pro_mode', proMode);
    if (proMode) document.body.classList.add('pro-mode');
    else document.body.classList.remove('pro-mode');
  }, [proMode]);

  const saveProfile = () => {
    setPlayerName(editName); setKingLevel(editLevel); setTrophies(editTrophies);
    setClanName(editClan); setWinRate(editWinRate); setWinsCount(editWins); setPlayerTag(editPlayerTag);
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
    if (!tagToSync) { setSyncError("Please enter a player tag!"); return; }
    setSyncing(true); setSyncError("");
    const cleanTag = tagToSync.toUpperCase().replace(/O/g, '0').replace('#', '').trim();
    fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
      .then(res => res.json())
      .then(data => {
        setSyncing(false);
        if (data.success) {
          setPlayerName(data.name); setKingLevel(data.kingLevel.toString());
          setTrophies(data.trophies.toString()); setClanName(data.clanName);
          setWinRate(data.winRate.toString()); setWinsCount(data.wins.toString()); setPlayerTag(data.tag);
          if (data.activeDeck && data.activeDeck.length === 8) {
            setSharedDeck(data.activeDeck);
            setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
          }
          setEditName(data.name); setEditLevel(data.kingLevel.toString());
          setEditTrophies(data.trophies.toString()); setEditClan(data.clanName);
          setEditWinRate(data.winRate.toString()); setEditWins(data.wins.toString()); setEditPlayerTag(data.tag);
          localStorage.setItem('cr_player_name', data.name); localStorage.setItem('cr_king_level', data.kingLevel.toString());
          localStorage.setItem('cr_trophies', data.trophies.toString()); localStorage.setItem('cr_clan_name', data.clanName);
          localStorage.setItem('cr_win_rate', data.winRate.toString()); localStorage.setItem('cr_wins_count', data.wins.toString()); localStorage.setItem('cr_player_tag', data.tag);
          const isSimulated = data.source && data.source.includes('Simulated');
          if (isSimulated) {
            alert(`Demo mode: Using simulated profile data.\n\nFor real data, whitelist your IP at developer.clashroyale.com and sync again.`);
          } else {
            alert(`Profile synced from ${data.source}!`);
          }
        } else {
          setSyncError(data.error || "Failed to sync profile. Check your player tag.");
        }
      })
      .catch(err => { console.error("Error syncing profile tag:", err); setSyncing(false); setSyncError("Sync failed. Check backend connection."); });
  };

  const handleOpenProfile = () => {
    setEditName(playerName); setEditLevel(kingLevel); setEditTrophies(trophies);
    setEditClan(clanName); setEditWinRate(winRate); setEditWins(winsCount); setEditPlayerTag(playerTag);
    setSyncError(""); setShowProfileModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deckParam = params.get('deck');
    if (deckParam) {
      const deckCards = deckParam.split(',').map(c => c.trim().toLowerCase());
      if (deckCards.length === 8) {
        setSharedDeck(deckCards); setActivePage('analyzer');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleImportDeck = (deckCards) => { setSharedDeck(deckCards); setActivePage('analyzer'); };
  const handleViewCardDetails = (cardKey) => { setSelectedCardDetailsKey(cardKey); };
  const handleAddCardToDeckFromModal = (key) => {
    if (sharedDeck.includes(key)) return;
    if (sharedDeck.length >= 8) alert("Deck is full! Remove a card in the Deck page first.");
    else setSharedDeck([...sharedDeck, key]);
  };
  const handleRemoveCardFromDeckFromModal = (key) => { setSharedDeck(sharedDeck.filter(k => k !== key)); };

  const activeCardObj = cards.find(c => c.key === selectedCardDetailsKey);
  const cardDetails = getCardDetailedStats(activeCardObj);

  const doLogin = () => {
    if (!loginTag) { setLoginError("Please enter a player tag!"); return; }
    setSyncing(true); setLoginError("");
    const cleanTag = loginTag.toUpperCase().replace(/O/g, '0').replace('#', '').trim();
    fetch(`${API_BASE}/profile/${encodeURIComponent(cleanTag)}`)
      .then(res => res.json())
      .then(data => {
        setSyncing(false);
        if (data.success) {
          setPlayerName(data.name); setKingLevel(data.kingLevel.toString());
          setTrophies(data.trophies.toString()); setClanName(data.clanName);
          setWinRate(data.winRate.toString()); setWinsCount(data.wins.toString()); setPlayerTag(data.tag);
          if (data.activeDeck && data.activeDeck.length === 8) {
            setSharedDeck(data.activeDeck);
            setUnlockedCards(prev => [...new Set([...prev, ...data.activeDeck])]);
          }
          localStorage.setItem('cr_player_name', data.name); localStorage.setItem('cr_king_level', data.kingLevel.toString());
          localStorage.setItem('cr_trophies', data.trophies.toString()); localStorage.setItem('cr_clan_name', data.clanName);
          localStorage.setItem('cr_win_rate', data.winRate.toString()); localStorage.setItem('cr_wins_count', data.wins.toString()); localStorage.setItem('cr_player_tag', data.tag);
          setIsLoggedIn(true); localStorage.setItem('cr_logged_in', 'true');
        } else {
          setLoginError(data.error || "Player tag not found. Check and try again.");
        }
      })
      .catch(err => { console.error("Login tag sync failed:", err); setSyncing(false); setLoginError("Sync failed. Check backend connection."); });
  };

  const navigateTo = (key) => {
    setActivePage(key);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onImportDeck={handleImportDeck} onViewCardDetails={handleViewCardDetails} useCollectionMode={useCollectionMode} unlockedCards={unlockedCards} proMode={proMode} />;
      case 'analyzer':  return <Analyzer key={sharedDeck.join(',')} initialDeck={sharedDeck} onViewCardDetails={handleViewCardDetails} useCollectionMode={useCollectionMode} unlockedCards={unlockedCards} proMode={proMode} />;
      case 'recommender': return <Recommender onImportDeck={handleImportDeck} onViewCardDetails={handleViewCardDetails} useCollectionMode={useCollectionMode} unlockedCards={unlockedCards} proMode={proMode} />;
      case 'coach':   return <Coach proMode={proMode} sharedDeck={sharedDeck} cards={cards} />;
      case 'support': return <Support playerTag={playerTag} playerName={playerName} />;
      case 'news':    return <News proMode={proMode} />;
      default:        return <Dashboard onImportDeck={handleImportDeck} onViewCardDetails={handleViewCardDetails} proMode={proMode} />;
    }
  };

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = activePage === item.key;
    return (
      <button
        onClick={() => navigateTo(item.key)}
        className={`cr-nav-link${isActive ? ' active' : ''}${mobile ? '' : ''}`}
      >
        <Icon size={15} />
        {item.label}
      </button>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="cr-login-screen">
        <div className="cr-login-card">
          <div className="cr-login-logo">
            <ShieldLogo size={52} />
            <h1 className="cr-login-title">Royale Insights</h1>
            <p className="cr-login-sub">
              AI deck analysis, matchup insights, and arena analytics for Clash Royale players.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="cr-label">Player Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="#VYR0RR"
                value={loginTag}
                onChange={(e) => setLoginTag(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                disabled={syncing}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
              />
              <button onClick={doLogin} disabled={syncing} className={btnPrimary}>
                {syncing ? 'Syncing…' : 'Enter'}
              </button>
            </div>
            {loginError && <span className="text-xs cr-text-red">{loginError}</span>}
          </div>

          <div className="login-divider">or</div>

          <button
            onClick={() => { setIsLoggedIn(true); localStorage.setItem('cr_logged_in', 'true'); }}
            className={`${btnSecondary} w-full py-3`}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-app-shell">
      <nav className="cr-nav">
        <div className="cr-nav-inner">
          <div className="cr-nav-logo" onClick={() => navigateTo('dashboard')}>
            <ShieldLogo size={26} />
            <span className="cr-nav-logo-text hidden sm:inline">Royale Insights</span>
          </div>

          <div className="cr-nav-links no-scrollbar">
            {NAV_ITEMS.map(item => <NavLink key={item.key} item={item} />)}
          </div>

          <div className="cr-nav-actions">
            <button
              className="cr-nav-mobile-toggle"
              onClick={() => setMobileNavOpen(v => !v)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <a
              href="https://github.com/manavv09/Game-Analytics"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--cr-border)] text-[var(--cr-text-muted)] hover:text-[var(--cr-text)] hover:border-[var(--cr-border-hover)] transition-all"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>

            <div className="cr-player-chip" onClick={handleOpenProfile}>
              <div className="cr-player-level">{kingLevel}</div>
              <div className="hidden sm:block">
                <div className="cr-player-name">{playerName}</div>
                <div className="cr-player-trophies flex items-center gap-0.5">
                  <Trophy size={10} /> {trophies}
                </div>
              </div>
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="cr-nav-mobile-menu">
            {NAV_ITEMS.map(item => <NavLink key={item.key} item={item} mobile />)}
          </div>
        )}
      </nav>

      <main className="cr-main anim-slide-up">
        {renderPage()}
      </main>

      {selectedCardDetailsKey && cardDetails && (
        <div className="cr-modal-overlay" onClick={() => setSelectedCardDetailsKey(null)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()}>
            <div className="cr-modal-header">
              <span className="cr-modal-title">{cardDetails.name}</span>
              <button className="cr-modal-close" onClick={() => setSelectedCardDetailsKey(null)} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <div className="cr-modal-body">
              <div className="flex gap-5 items-start">
                <div
                  className={`${cardBase} ${cardGradient} flex-shrink-0 ${
                    cardDetails.rarity === 'legendary' ? 'anim-legendary' :
                    cardDetails.rarity === 'champion'  ? 'anim-champion'  :
                    cardDetails.isEvo                  ? 'anim-evo'       : ''
                  }`}
                  style={{ width: '120px', height: '168px' }}
                >
                  <span className="cr-card-elixir">{cardDetails.elixir}</span>
                  <img src={cardDetails.image} alt={cardDetails.name} className="w-[72%] object-contain mt-3" />
                  <span className="cr-card-name">{cardDetails.name}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    <span className="cr-badge cr-badge-gold">Arena {cardDetails.arena}</span>
                    <span className="cr-badge cr-badge-blue">{cardDetails.rarity}</span>
                    <span className="cr-badge cr-badge-pink">{cardDetails.type}</span>
                  </div>
                  <p className="text-sm cr-text-muted leading-relaxed italic">"{cardDetails.description}"</p>
                </div>
              </div>

              <div className="cr-glass px-4 py-3">
                <h4 className="cr-label cr-text-gold mb-2">Stats</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Hitpoints', cardDetails.hp, ''],
                      ['Damage', cardDetails.damage, ''],
                      ['DPS', cardDetails.dps, 'cr-text-red'],
                      ['Hit Speed', cardDetails.hitSpeed, ''],
                      ['Speed', cardDetails.speed, ''],
                      ['Range', cardDetails.range, 'cr-text-blue'],
                    ].map(([label, val, cls]) => (
                      <tr key={label} className="border-b border-[var(--cr-border)] last:border-0">
                        <td className="py-1.5 cr-text-muted">{label}</td>
                        <td className={`py-1.5 text-right font-medium ${cls || 'text-[var(--cr-text)]'}`}>{val || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {cardDetails.heroAbility && (
                <div className="cr-glass px-4 py-3 border-l-2 border-[var(--cr-gold)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="cr-badge cr-badge-gold">Hero</span>
                    <span className="text-sm font-semibold cr-text-gold">
                      {cardDetails.heroAbility.name} ({cardDetails.heroAbility.cost} elixir)
                    </span>
                  </div>
                  <p className="text-xs cr-text-muted leading-relaxed">{cardDetails.heroAbility.description}</p>
                </div>
              )}

              {cardDetails.evoDescription && (
                <div className="cr-glass px-4 py-3 border-l-2 border-[var(--cr-elixir)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="cr-badge cr-badge-pink">Evolution</span>
                  </div>
                  <p className="text-xs cr-text-muted leading-relaxed">{cardDetails.evoDescription}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                {sharedDeck.includes(cardDetails.key) ? (
                  <button onClick={() => { handleRemoveCardFromDeckFromModal(cardDetails.key); setSelectedCardDetailsKey(null); }} className={btnDanger}>
                    Remove from Deck
                  </button>
                ) : (
                  <button onClick={() => { handleAddCardToDeckFromModal(cardDetails.key); setSelectedCardDetailsKey(null); }} className={btnPrimary}>
                    Add to Deck
                  </button>
                )}
                <button onClick={() => setSelectedCardDetailsKey(null)} className={btnSecondary}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="cr-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="cr-modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="cr-modal-header">
              <span className="cr-modal-title">Profile</span>
              <button className="cr-modal-close" onClick={() => setShowProfileModal(false)} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <div className="cr-modal-body">
              <div className="cr-glass p-4 flex gap-3 items-center">
                <div className="cr-player-level w-10 h-10 text-base rounded-lg">{kingLevel}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="font-bold text-[var(--cr-text)] truncate">{playerName}</h3>
                    <span className="text-xs cr-text-muted font-mono flex-shrink-0">{playerTag}</span>
                  </div>
                  <div className="flex gap-3 text-xs cr-text-muted mt-0.5">
                    <span>Clan: <strong className="text-[var(--cr-text)]">{clanName}</strong></span>
                    <span className="cr-text-gold flex items-center gap-0.5"><Trophy size={10} /> {trophies}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="cr-label cr-text-gold mb-2">Active Deck</h4>
                <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
                  {sharedDeck.map(cardKey => {
                    const c = cards.find(card => card.key === cardKey);
                    return (
                      <div key={cardKey} onClick={() => { setShowProfileModal(false); handleViewCardDetails(cardKey); }}
                           title={c?.name}
                           className="w-10 h-14 rounded-md overflow-hidden border border-[var(--cr-border)] bg-[var(--cr-bg)] flex-shrink-0 cursor-pointer hover:border-[var(--cr-border-hover)] transition-all">
                        <img src={c?.image} alt={c?.name} className="w-full h-full object-contain" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[['Career Wins', `${winsCount}`], ['Win Rate', `${winRate}%`]].map(([lbl, val]) => (
                  <div key={lbl} className="cr-stat-box">
                    <div className="cr-stat-label">{lbl}</div>
                    <div className="cr-stat-value text-[var(--cr-text)]">{val}</div>
                  </div>
                ))}
              </div>

              <div className="cr-glass p-4 flex flex-col gap-2 border border-[rgba(245,200,66,0.15)]">
                <h4 className="text-sm font-semibold cr-text-gold flex items-center gap-1.5">
                  <Crown size={14} /> Sync Player Tag
                </h4>
                <div className="flex gap-2">
                  <input type="text" placeholder="#VYR0RR" value={editPlayerTag}
                         onChange={e => setEditPlayerTag(e.target.value.toUpperCase())}
                         className="flex-1 uppercase text-sm" disabled={syncing} />
                  <button onClick={() => handleSyncProfile(editPlayerTag)} disabled={syncing} className={btnSecondary}>
                    {syncing ? '…' : 'Sync'}
                  </button>
                </div>
                {syncError && <span className="text-xs cr-text-red">{syncError}</span>}
              </div>

              <div className="cr-glass p-4 flex flex-col gap-3">
                <h4 className="cr-label">Edit Profile</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="cr-label block mb-1">Name</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="cr-label block mb-1">Clan</label>
                    <input type="text" value={editClan} onChange={e => setEditClan(e.target.value)} className="w-full text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Trophies', 'number', editTrophies, setEditTrophies],
                    ['Level', 'number', editLevel, setEditLevel],
                    ['Win %', 'text', editWinRate, setEditWinRate],
                  ].map(([lbl, type, val, setter]) => (
                    <div key={lbl}>
                      <label className="cr-label block mb-1">{lbl}</label>
                      <input type={type} value={val} onChange={e => setter(e.target.value)} className="w-full text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-[var(--cr-border)] pt-4">
                <button onClick={() => { setIsLoggedIn(false); localStorage.setItem('cr_logged_in', 'false'); setShowProfileModal(false); }} className={`${btnDanger} mr-auto`}>
                  Log Out
                </button>
                <button onClick={saveProfile} className={btnPrimary}>Save</button>
                <button onClick={() => setShowProfileModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
