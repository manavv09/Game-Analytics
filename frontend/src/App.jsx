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
    return saved !== 'false';
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

  // Profile Form States
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

  useEffect(() => { localStorage.setItem('cr_unlocked_cards', JSON.stringify(unlockedCards)); }, [unlockedCards]);
  useEffect(() => { localStorage.setItem('cr_collection_count', JSON.stringify(collectionCount)); }, [collectionCount]);
  useEffect(() => { localStorage.setItem('cr_collection_mode', useCollectionMode); }, [useCollectionMode]);

  useEffect(() => {
    localStorage.setItem('cr_pro_mode', proMode);
    if (proMode) document.body.classList.add('pro-mode');
    else         document.body.classList.remove('pro-mode');
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
            alert(`⚠️ DEMO MODE: Aapka real data nahi aaya!\n\nYeh ek simulated/fake profile hai. Aapka asli deck aur info alag ho sakti hai.\n\nReal data ke liye:\n1. developer.clashroyale.com pe apna current IP whitelist karo\n2. Phir dobara Sync karo`);
          } else {
            alert(`✅ Profile synced from ${data.source}!`);
          }
        } else {
          setSyncError(data.error || "Failed to sync profile. Player tag check karo.");
        }
      })
      .catch(err => { console.error("Error syncing profile tag:", err); setSyncing(false); setSyncError("Sync failed. Check connection to backend."); });
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
    if (sharedDeck.length >= 8) alert("Deck is full! Select slot in Battle Deck page to swap.");
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
          setLoginError(data.error || "Player tag nahi mila. Sahi tag enter karo.");
        }
      })
      .catch(err => { console.error("Login tag sync failed:", err); setSyncing(false); setLoginError("Sync failed. Check connection to backend."); });
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

  /* ── LOGIN SCREEN ── */
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-zinc-950"
           style={{ backgroundImage: 'radial-gradient(at 50% 0%, rgba(39,39,42,.4) 0px, transparent 60%), radial-gradient(at 0% 100%, rgba(9,9,11,.95) 0px, transparent 50%)' }}>
        <div className="w-[90%] max-w-[420px] bg-zinc-900 border border-zinc-800 rounded-lg p-9 text-center flex flex-col gap-6 shadow-2xl anim-pop-in">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
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
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
              Royale Insights AI
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              AI-powered Battle Deck recommendations, real-time matchup simulation telemetries, and smart arena analytics.
            </p>
          </div>

          {/* Tag Input */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-[0.72rem] text-zinc-400 font-semibold uppercase tracking-wide">CONNECT PLAYER PROFILE TAG</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Player Tag (e.g. #VYR0RR)"
                value={loginTag}
                onChange={(e) => setLoginTag(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                disabled={syncing}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
              />
              <button
                onClick={doLogin}
                disabled={syncing}
                className="bg-white text-zinc-950 font-medium text-sm px-5 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Enter Arena'}
              </button>
            </div>
            {loginError && <span className="text-[0.72rem] text-red-500 mt-1">{loginError}</span>}
          </div>

          {/* Divider */}
          <div className="login-divider">OR</div>

          {/* Guest button */}
          <button
            onClick={() => { setIsLoggedIn(true); localStorage.setItem('cr_logged_in', 'true'); }}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-50 font-medium text-sm py-3 rounded-lg cursor-pointer transition-all hover:bg-zinc-700 hover:border-zinc-500"
          >
            ENTER AS ROYAL CHALLENGER (GUEST)
          </button>
        </div>
      </div>
    );
  }

  /* ── MAIN APP ── */
  return (
    <div>
      {/* ── NAV ── */}
      <div className="w-full sticky top-4 z-[100] px-4 md:px-8 mb-8">
        <nav className="flex items-center justify-between px-6 py-3.5 bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none"
               onClick={() => setActivePage('dashboard')}>
            <svg viewBox="0 0 24 24" width="28" height="28" className="drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGrad)" stroke="#eab308" strokeWidth="1.25" />
              <path d="M8 14l1.5-4L12 12l2.5-2L16 14H8z" fill="#fff" stroke="#1e293b" strokeWidth="0.75" />
              <circle cx="12" cy="9" r="0.75" fill="#fff" />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-clash)' }}>
                Royale Insights
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1 md:gap-1.5 overflow-x-auto max-w-full no-scrollbar px-2">
            {[
              { key: 'dashboard',  icon: <Activity size={15} />,    label: 'Trophy Road' },
              { key: 'analyzer',   icon: <ShieldAlert size={15} />, label: 'Battle Deck' },
              { key: 'recommender',icon: <Sparkles size={15} />,    label: 'Clan Cards' },
              { key: 'coach',      icon: <Zap size={15} />,         label: 'Training Camp' },
              { key: 'support',    icon: <HelpCircle size={15} />,  label: 'Help & Support' },
              { key: 'news',       icon: <MessageSquare size={15} />,label: 'News Royale' },
            ].map(({ key, icon, label }) => {
              const isActive = activePage === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePage(key)}
                  className={`flex items-center gap-2 text-[0.82rem] font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer border-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-zinc-50'}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* GitHub */}
            <a href="https://github.com/manavv09/Game-Analytics" target="_blank" rel="noopener noreferrer"
               title="GitHub Repository"
               className="flex items-center justify-center w-9 h-9 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700 cursor-pointer">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>

            {/* Player widget */}
            <div onClick={handleOpenProfile}
                 className="flex items-center gap-2 bg-gradient-to-r from-zinc-900 to-zinc-900/40 hover:from-zinc-800 hover:to-zinc-800/60 border border-zinc-800 hover:border-zinc-700 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[0.7rem] font-black shadow-[0_2px_8px_rgba(59,140,246,0.35)]">
                {kingLevel}
              </div>
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[0.75rem] font-bold text-zinc-100">{playerName}</span>
                <span className="text-[0.62rem] text-amber-400 font-semibold flex items-center gap-0.5">🏆 {trophies}</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-[1200px] mx-auto px-6 pb-12">
        {renderPage()}
      </main>

      {/* ── CARD DETAILS MODAL ── */}
      {selectedCardDetailsKey && cardDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm anim-fade-in"
             onClick={() => setSelectedCardDetailsKey(null)}>
          <div className="w-[90%] max-w-[480px] max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden anim-pop-in"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <span className="text-white font-extrabold text-base" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                {cardDetails.name} Info
              </span>
              <button onClick={() => setSelectedCardDetailsKey(null)}
                      className="flex items-center justify-center w-[26px] h-[26px] bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-sm hover:bg-zinc-700 hover:text-white cursor-pointer">
                X
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
              <div className="flex gap-6 items-center">
                {/* Card display */}
                <div className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-default border ${
                  cardDetails.rarity === 'legendary' ? 'anim-legendary' :
                  cardDetails.rarity === 'champion'  ? 'anim-champion'  :
                  cardDetails.isEvo                  ? 'anim-evo'       : 'border-zinc-700'
                }`}
                     style={{ width: '130px', height: '182px', flexShrink: 0,
                              background: 'linear-gradient(135deg, rgba(30,30,38,.95), rgba(15,15,20,.98))' }}>
                  <span className="absolute top-1 left-1 bg-pink-500 text-white px-[5px] py-[2px] rounded text-[0.65rem] font-semibold z-10">{cardDetails.elixir}</span>
                  <img src={cardDetails.image} alt={cardDetails.name} className="w-[75%] object-contain mt-3" />
                  <span className="text-[0.75rem] text-zinc-400 text-center w-full py-0.5 truncate">{cardDetails.name}</span>
                </div>

                {/* Description */}
                <div className="flex-1">
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className="text-[0.7rem] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(234,179,8,.15)', color: 'var(--cr-gold)' }}>Arena {cardDetails.arena}</span>
                    <span className="text-[0.7rem] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,.15)', color: 'var(--cr-blue)' }}>{cardDetails.rarity}</span>
                    <span className="text-[0.7rem] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(236,72,153,.15)', color: 'var(--cr-elixir)' }}>{cardDetails.type}</span>
                  </div>
                  <p className="text-[0.85rem] text-blue-200 leading-relaxed italic">"{cardDetails.description}"</p>
                </div>
              </div>

              {/* Stats table */}
              <div className="bg-white/[.03] border border-zinc-800 rounded-lg px-5 py-3" style={{ backdropFilter: 'blur(16px)' }}>
                <h4 className="text-[0.9rem] mb-2" style={{ color: 'var(--cr-gold)' }}>TACTICAL TELEMETRY STATISTICS</h4>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Hitpoints (HP)', cardDetails.hp, ''],
                      ['Damage per Hit', cardDetails.damage, ''],
                      ['Damage per Second (DPS)', cardDetails.dps, 'text-red-400'],
                      ['Attack Speed (Hit Speed)', cardDetails.hitSpeed, ''],
                      ['Movement Speed', cardDetails.speed, ''],
                      ['Targets & Range', cardDetails.range, 'text-blue-400'],
                    ].map(([label, val, cls]) => (
                      <tr key={label} className="border-b border-zinc-800 last:border-0">
                        <td className="py-1.5 text-zinc-400">{label}</td>
                        <td className={`py-1.5 text-right font-medium ${cls || 'text-zinc-50'}`}>{val || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Hero ability */}
              {cardDetails.heroAbility && (
                <div className="border rounded-lg px-4 py-3" style={{ background: 'rgba(234,179,8,.02)', borderColor: 'var(--cr-gold)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.6rem] font-bold text-white px-1.5 py-0.5 rounded"
                          style={{ background: 'linear-gradient(180deg,#ffc107,#ff8f00)', textShadow: '.5px .5px 0 black', fontFamily: 'var(--font-clash)' }}>
                      HERO ABILITY
                    </span>
                    <span className="text-[0.85rem] font-bold" style={{ color: 'var(--cr-gold)' }}>
                      {cardDetails.heroAbility.name} ({cardDetails.heroAbility.cost} Elixir)
                    </span>
                  </div>
                  <p className="text-[0.78rem] leading-snug" style={{ color: '#fffdf4' }}>{cardDetails.heroAbility.description}</p>
                </div>
              )}

              {/* Evo description */}
              {cardDetails.evoDescription && (
                <div className="border rounded-lg px-4 py-3" style={{ background: 'rgba(236,72,153,.02)', borderColor: 'var(--cr-elixir)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.6rem] font-bold text-white px-1.5 py-0.5 rounded"
                          style={{ background: 'linear-gradient(180deg,#d946ef,#701a75)', textShadow: '.5px .5px 0 black', fontFamily: 'var(--font-clash)' }}>
                      EVO
                    </span>
                    <span className="text-[0.85rem] font-bold text-pink-400">Evolution Perks Unlocked</span>
                  </div>
                  <p className="text-[0.78rem] leading-snug" style={{ color: '#fdf4ff' }}>{cardDetails.evoDescription}</p>
                </div>
              )}

              {/* Deck actions */}
              <div className="flex gap-4 justify-end mt-1">
                {sharedDeck.includes(cardDetails.key) ? (
                  <button onClick={() => { handleRemoveCardFromDeckFromModal(cardDetails.key); setSelectedCardDetailsKey(null); }}
                          className="bg-red-600 text-white border-0 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-red-500 transition-all">
                    Remove From Deck
                  </button>
                ) : (
                  <button onClick={() => { handleAddCardToDeckFromModal(cardDetails.key); setSelectedCardDetailsKey(null); }}
                          className="bg-white text-zinc-950 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                    Add to Deck
                  </button>
                )}
                <button onClick={() => setSelectedCardDetailsKey(null)}
                        className="bg-zinc-800 text-zinc-50 border border-zinc-700 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE MODAL ── */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm anim-fade-in"
             onClick={() => setShowProfileModal(false)}>
          <div className="w-[90%] max-w-[460px] max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden anim-pop-in"
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <span className="text-white font-extrabold text-base" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                My Arena Profile
              </span>
              <button onClick={() => setShowProfileModal(false)}
                      className="flex items-center justify-center w-[26px] h-[26px] bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-sm hover:bg-zinc-700 hover:text-white cursor-pointer">
                X
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Profile card */}
              <div className="flex gap-4 items-center bg-white/[.03] border border-zinc-800 rounded-lg p-4" style={{ backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded text-2xl font-semibold">{kingLevel}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>{playerName}</h3>
                    <span className="text-[0.7rem] text-zinc-400 font-mono">{playerTag}</span>
                  </div>
                  <div className="flex gap-4 text-[0.8rem] text-zinc-400 mt-0.5">
                    <span>Clan: <strong className="text-white">{clanName}</strong></span>
                    <span>Trophies: <strong style={{ color: 'var(--cr-gold)' }}>🏆 {trophies}</strong></span>
                  </div>
                </div>
              </div>

              {/* Active deck */}
              <div>
                <h4 className="text-[0.85rem] font-bold mb-2 tracking-wide" style={{ color: 'var(--cr-gold)' }}>ACTIVE BATTLE DECK</h4>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {sharedDeck.map(cardKey => {
                    const c = cards.find(card => card.key === cardKey);
                    return (
                      <div key={cardKey} onClick={() => { setShowProfileModal(false); handleViewCardDetails(cardKey); }}
                           title={c?.name}
                           className="w-[42px] h-[59px] rounded-md overflow-hidden border border-zinc-800 bg-zinc-950 flex-shrink-0 cursor-pointer hover:border-zinc-600 transition-all">
                        <img src={c?.image} alt={c?.name} className="w-full h-full object-contain" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Career stats */}
              <div className="grid grid-cols-2 gap-3">
                {[['CAREER WINS', `${winsCount} Wins`, 'text-white'], ['WIN RATE', `${winRate}%`, 'text-green-400']].map(([lbl, val, cls]) => (
                  <div key={lbl} className="bg-white/[.03] border border-zinc-800 rounded-lg px-3 py-2.5 text-center" style={{ backdropFilter: 'blur(16px)' }}>
                    <div className="text-[0.7rem] text-zinc-400">{lbl}</div>
                    <div className={`text-[1.2rem] font-bold ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Sync section */}
              <div className="bg-white/[.03] border rounded-lg p-4 flex flex-col gap-2" style={{ borderColor: 'var(--cr-gold)', backdropFilter: 'blur(16px)' }}>
                <h4 className="text-[0.9rem] flex items-center gap-1" style={{ color: 'var(--cr-gold)' }}>
                  <Crown size={14} fill="var(--cr-gold)" /> SYNC WITH SUPERCELL PLAYER TAG
                </h4>
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter Player Tag (e.g. #VYR0RR)"
                         value={editPlayerTag} onChange={e => setEditPlayerTag(e.target.value.toUpperCase())}
                         className="flex-1 uppercase" style={{ padding: '.4rem', fontSize: '.8rem' }}
                         disabled={syncing} />
                  <button onClick={() => handleSyncProfile(editPlayerTag)} disabled={syncing}
                          className="bg-zinc-800 text-zinc-50 border border-zinc-700 px-3 py-1.5 rounded-lg text-[0.8rem] font-medium cursor-pointer hover:bg-zinc-700 disabled:opacity-50">
                    {syncing ? 'Syncing...' : 'Sync Tag'}
                  </button>
                </div>
                {syncError && <span className="text-[0.7rem] text-red-500">{syncError}</span>}
              </div>

              {/* Edit form */}
              <div className="bg-white/[.03] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3" style={{ backdropFilter: 'blur(16px)' }}>
                <h4 className="text-[0.9rem] border-b border-white/[.06] pb-1" style={{ color: 'var(--cr-gold)' }}>EDIT PROFILE INFO</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.72rem] text-zinc-400 block mb-0.5">USERNAME</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full" style={{ padding: '.4rem', fontSize: '.8rem' }} />
                  </div>
                  <div>
                    <label className="text-[0.72rem] text-zinc-400 block mb-0.5">CLAN NAME</label>
                    <input type="text" value={editClan} onChange={e => setEditClan(e.target.value)} className="w-full" style={{ padding: '.4rem', fontSize: '.8rem' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['TROPHIES', 'number', editTrophies, setEditTrophies],
                    ['KING LEVEL', 'number', editLevel, setEditLevel],
                    ['WIN RATE %', 'text', editWinRate, setEditWinRate],
                  ].map(([lbl, type, val, setter]) => (
                    <div key={lbl}>
                      <label className="text-[0.72rem] text-zinc-400 block mb-0.5">{lbl}</label>
                      <input type={type} value={val} onChange={e => setter(e.target.value)} className="w-full" style={{ padding: '.4rem', fontSize: '.8rem' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 justify-end border-t border-white/[.06] pt-4">
                <button onClick={() => { setIsLoggedIn(false); localStorage.setItem('cr_logged_in', 'false'); setShowProfileModal(false); }}
                        className="mr-auto bg-red-600 text-white border-0 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer hover:bg-red-500 transition-all">
                  Log Out
                </button>
                <button onClick={saveProfile}
                        className="bg-white text-zinc-950 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                  Save Profile
                </button>
                <button onClick={() => setShowProfileModal(false)}
                        className="bg-zinc-800 text-zinc-50 border border-zinc-700 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">
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
