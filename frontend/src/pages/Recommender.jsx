import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, Info } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";

export default function Recommender({ onImportDeck, onViewCardDetails, useCollectionMode, unlockedCards }) {
  const [cards, setCards] = useState([]);
  const [metaDecks, setMetaDecks] = useState([]);
  const [selectedFavs, setSelectedFavs] = useState([]);
  const [arena, setArena] = useState("12");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/cards`).then(res => res.json()),
      fetch(`${API_BASE}/meta/decks`).then(res => res.json())
    ])
      .then(([cardsData, decksData]) => { setCards(cardsData); setMetaDecks(decksData); setLoading(false); })
      .catch(err => { console.error("Error loading recommender databases:", err); setLoading(false); });
  }, []);

  const toggleFavCard = (key) => {
    if (selectedFavs.includes(key)) setSelectedFavs(selectedFavs.filter(k => k !== key));
    else if (selectedFavs.length < 3) setSelectedFavs([...selectedFavs, key]);
  };

  const handleRecommend = () => {
    const selectedArena = parseInt(arena);
    const availableCards = cards.filter(c => {
      const matchesArena = c.arena <= selectedArena;
      const matchesCollection = useCollectionMode ? unlockedCards.includes(c.key) : true;
      return matchesArena && matchesCollection;
    });
    const metaMatches = metaDecks.filter(deck => {
      const matchesFavs = selectedFavs.every(fav => deck.cards.includes(fav));
      const matchesArenaAndCollection = deck.cards.every(cKey => {
        const fullCard = cards.find(c => c.key === cKey);
        if (!fullCard) return false;
        return fullCard.arena <= selectedArena && (useCollectionMode ? unlockedCards.includes(cKey) : true);
      });
      return matchesFavs && matchesArenaAndCollection;
    });

    const recommendationResults = [];
    metaMatches.forEach(m => {
      recommendationResults.push({ type: 'Meta Match', name: m.name, cards: m.cards, winRate: m.winRate, popularity: m.popularity, averageElixir: m.averageElixir, archetype: m.archetype, difficulty: m.difficulty, reason: `Matches your locked card(s) and is an active meta deck with a ${m.winRate}% win rate.` });
    });

    if (recommendationResults.length < 3) {
      let customDeck = [...selectedFavs];
      const cardsDb = availableCards;
      const hasWinCond = customDeck.some(k => cardsDb.find(c => c.key === k)?.role === 'win-condition');
      if (!hasWinCond && customDeck.length < 8) {
        const winConditions = cardsDb.filter(c => c.role === 'win-condition' && !customDeck.includes(c.key));
        winConditions.sort((a, b) => b.winRate - a.winRate);
        if (winConditions[0]) customDeck.push(winConditions[0].key);
      }
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
      while (customDeck.length < 8) {
        const roles = getRoleCounts(customDeck);
        const candidates = cardsDb.filter(c => !customDeck.includes(c.key));
        if (candidates.length === 0) break;
        const scoredCandidates = candidates.map(c => {
          let score = 50;
          if (roles.airDef < 2 && c.targets === 'air-ground') score += 40;
          if (roles.smallSpell < 1 && c.role === 'spell-small') score += 35;
          if (roles.bigSpell < 1 && c.role === 'spell-big') score += 30;
          if (roles.tankKiller < 1 && c.role === 'tank-killer') score += 30;
          if (roles.cycle < 1 && c.role === 'cycle') score += 15;
          let synergiesCount = 0;
          customDeck.forEach(dk => {
            if (c.synergies && c.synergies.includes(dk)) synergiesCount++;
            const dkObj = cardsDb.find(card => card.key === dk);
            if (dkObj && dkObj.synergies && dkObj.synergies.includes(c.key)) synergiesCount++;
          });
          score += synergiesCount * 12;
          const tempDeck = [...customDeck, c.key];
          const tempAvg = tempDeck.reduce((sum, k) => sum + (cardsDb.find(card => card.key === k)?.elixir || 0), 0) / tempDeck.length;
          score += (1.5 - Math.abs(tempAvg - 3.4)) * 10;
          score += (c.winRate - 50) * 1.5;
          return { key: c.key, score };
        });
        scoredCandidates.sort((a, b) => b.score - a.score);
        if (scoredCandidates[0]) customDeck.push(scoredCandidates[0].key);
        else break;
      }
      if (customDeck.length === 8) {
        const customAvg = parseFloat((customDeck.reduce((sum, k) => sum + (cards.find(c => c.key === k)?.elixir || 0), 0) / 8).toFixed(2));
        const customWinRate = parseFloat((customDeck.reduce((sum, k) => sum + (cards.find(c => c.key === k)?.winRate || 50), 0) / 8).toFixed(1));
        recommendationResults.push({
          type: 'AI Custom Deck',
          name: `Custom ${cards.find(c => c.key === selectedFavs[0])?.name || 'Knight'} Synergy`,
          cards: customDeck, winRate: customWinRate, popularity: 1.5, averageElixir: customAvg,
          archetype: customAvg > 3.8 ? 'Control-Beatdown' : customAvg < 3.0 ? 'Cycle' : 'Balanced',
          difficulty: 'Medium',
          reason: 'Algorithmic custom build compiled to maximize direct synergies, maintain Elixir curve limits, and complete defensive requirements.'
        });
      }
    }
    setResults(recommendationResults);
  };

  useEffect(() => { if (!loading) handleRecommend(); }, [selectedFavs, arena, loading, useCollectionMode, unlockedCards]);

  if (loading) return <p className="text-zinc-400 text-center py-16">Synchronizing deck models...</p>;

  const availableArenaCards = cards.filter(c => c.arena <= parseInt(arena) && (useCollectionMode ? unlockedCards.includes(c.key) : true));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
              style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
            Clan Cards (Deck Finder)
          </h1>
          <p className="text-zinc-400 text-sm">Select up to 3 core cards you want to play, lock your current Arena unlock limit, and our engine will search meta profiles or algorithmically build a synergistic deck.</p>
        </div>
        {useCollectionMode && <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">COLLECTION LOCKED MODE</span>}
      </div>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))' }}>

        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* Constraints panel */}
          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Deck Constraints</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border border-zinc-800 bg-white/[.03] text-zinc-400">FILTERS</span>
            </div>

            {/* Arena selector */}
            <div className="mb-6">
              <label className="text-[0.85rem] text-zinc-400 block mb-2">CURRENT ARENA LEVEL</label>
              <select value={arena} onChange={(e) => setArena(e.target.value)} className="w-full" style={{ padding: '.75rem 1rem' }}>
                {[['0','Training Camp'],['1','Goblin Stadium'],['2','Bone Pit'],['3','Barbarian Bowl'],['4','P.E.K.K.A Playhouse'],['5','Spell Valley'],['6','Builder Workshop'],['7','Royal Arena'],['8','Frozen Peak'],['9','Jungle Arena'],['10','Hog Mountain'],['11','Electro Valley'],['12','Spooky Town & Legendary']].map(([val, label]) => (
                  <option key={val} value={val}>Arena {val} ({label})</option>
                ))}
              </select>
            </div>

            {/* Locked cards */}
            <div>
              <label className="text-[0.85rem] text-zinc-400 block mb-2">LOCKED CORE CARDS (MAX 3)</label>
              {selectedFavs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {selectedFavs.map(favKey => {
                    const card = cards.find(c => c.key === favKey);
                    return (
                      <div key={favKey} onClick={() => toggleFavCard(favKey)}
                           className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-pointer border ${
                             card?.rarity === 'legendary' ? 'anim-legendary' : card?.rarity === 'champion' ? 'anim-champion' : card?.isEvo ? 'anim-evo' : 'border-zinc-700'
                           }`}
                           style={{ aspectRatio: '5/7', background: 'linear-gradient(135deg,rgba(30,30,38,.95),rgba(15,15,20,.98))', borderColor: 'var(--cr-gold)' }}>
                        <span className="absolute top-1 left-1 bg-pink-500 text-white px-[5px] py-[2px] rounded text-[0.65rem] font-semibold z-10">{card?.elixir}</span>
                        <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(favKey); }}
                                className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center bg-white/10 border-0 text-white rounded cursor-pointer z-[15]">
                          <Info size={8} />
                        </button>
                        <img src={card?.image} alt={card?.name} className="w-[75%] object-contain mt-3" />
                        <span className="text-[0.65rem] text-zinc-400 text-center w-full py-0.5 truncate">{card?.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-zinc-700 rounded-lg text-zinc-400 text-center text-[0.85rem] mb-4">
                  No cards locked. Click cards below to set favorites.
                </div>
              )}
            </div>
          </div>

          {/* Card pool */}
          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Tap to Lock Card</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">POOL</span>
            </div>
            <div className="grid overflow-y-auto pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '.75rem', maxHeight: '320px' }}>
              {availableArenaCards.map(card => {
                const isSelected = selectedFavs.includes(card.key);
                return (
                  <div key={card.key} onClick={() => toggleFavCard(card.key)}
                       className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-pointer border transition-all hover:-translate-y-2 hover:scale-105 ${
                         card.rarity === 'legendary' ? 'anim-legendary' : card.rarity === 'champion' ? 'anim-champion' : card.isEvo ? 'anim-evo' : 'border-zinc-700'
                       } ${!isSelected && selectedFavs.length >= 3 ? 'opacity-40 pointer-events-none' : ''}`}
                       style={{ aspectRatio: '5/7', background: 'linear-gradient(135deg,rgba(30,30,38,.95),rgba(15,15,20,.98))',
                                borderColor: isSelected ? 'var(--cr-gold)' : '', boxShadow: isSelected ? '0 0 0 1px var(--cr-gold)' : '' }}>
                    <span className="absolute top-1 left-1 bg-pink-500 text-white px-[5px] py-[2px] rounded text-[0.65rem] font-semibold z-10">{card.elixir}</span>
                    <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }}
                            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center bg-white/10 border-0 text-white rounded cursor-pointer z-[15]">
                      <Info size={8} />
                    </button>
                    <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                    <span className="text-[0.65rem] text-zinc-400 text-center w-full py-0.5 truncate">{card.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className={panel}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Algorithmic Recommendations</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">DECKS</span>
          </div>

          {results.length > 0 ? (
            <div className="flex flex-col gap-6">
              {results.map((deck, idx) => (
                <div key={idx} className="bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 transition-all hover:border-zinc-600"
                     style={{ borderLeft: `3px solid ${deck.type === 'Meta Match' ? '#4ade80' : 'var(--cr-blue)'}` }}>
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                    <div>
                      <span className={`text-[0.65rem] font-medium px-1.5 py-0.5 rounded mr-2 ${deck.type === 'Meta Match' ? 'text-green-400 bg-green-400/15' : 'text-blue-400 bg-blue-400/15'}`}>{deck.type}</span>
                      <h3 className="inline text-[1.15rem] font-bold text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{deck.name}</h3>
                      <p className="text-[0.8rem] text-zinc-400 mt-1 leading-snug">{deck.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.75rem] text-zinc-400">EST. WIN-RATE</div>
                      <div className="text-[1.25rem] font-extrabold text-green-400" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{deck.winRate}%</div>
                    </div>
                  </div>

                  {/* Deck cards */}
                  <div className="flex gap-2 overflow-x-auto py-2 mb-4">
                    {deck.cards.map(cKey => {
                      const c = cards.find(card => card.key === cKey);
                      return (
                        <div key={cKey} onClick={() => onViewCardDetails(cKey)}
                             title={c ? `${c.name} (${c.elixir} Elixir) - Click for Info` : cKey}
                             className="w-[46px] h-[64px] rounded-md overflow-hidden border border-zinc-800 bg-zinc-950 flex-shrink-0 cursor-pointer hover:border-zinc-500 transition-all">
                          <img src={c?.image} alt={c?.name} className="w-full h-full object-contain" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3 text-[0.85rem]">
                    <div className="flex gap-4">
                      <span className="font-bold" style={{ color: 'var(--cr-elixir)' }}>Elixir: {deck.averageElixir}</span>
                      <span className="font-bold" style={{ color: 'var(--cr-gold)' }}>Archetype: {deck.archetype}</span>
                    </div>
                    <button onClick={() => onImportDeck(deck.cards)}
                            className="flex items-center gap-1.5 bg-white text-zinc-950 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                      <Play size={12} fill="currentColor" /> Load Deck
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400">
              <ShieldAlert size={32} className="mx-auto mb-4 opacity-50" />
              <p>No recommendations could be compiled for your active filters.</p>
              {useCollectionMode && <p className="text-[0.75rem] text-red-400 mt-2">Try opening more Chests in the Chest Shop to expand your card collection options.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
