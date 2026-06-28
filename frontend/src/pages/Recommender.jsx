import React, { useState, useEffect } from 'react';
import { Play, ShieldAlert, Info } from 'lucide-react';
import {
  panel, pageTitle, pageDesc, pageHeader, panelHeader, panelTitle,
  badge, btnPrimary, btnSecondary, cardBase, cardGradient, label as crLabel
} from '../utils/ui.js';

const API_BASE = 'http://localhost:5000/api';

const cardRarityClass = (card) => {
  if (card?.rarity === 'legendary') return 'anim-legendary';
  if (card?.rarity === 'champion') return 'anim-champion';
  if (card?.isEvo) return 'anim-evo';
  return '';
};

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
      recommendationResults.push({ type: 'Meta Match', name: m.name, cards: m.cards, winRate: m.winRate, popularity: m.popularity, averageElixir: m.averageElixir, archetype: m.archetype, difficulty: m.difficulty, reason: `Matches your locked card(s) with a ${m.winRate}% meta win rate.` });
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
          reason: 'Custom build optimized for synergy, elixir curve, and defensive coverage.'
        });
      }
    }
    setResults(recommendationResults);
  };

  useEffect(() => { if (!loading) handleRecommend(); }, [selectedFavs, arena, loading, useCollectionMode, unlockedCards]);

  if (loading) {
    return (
      <div className="cr-loading">
        <div className="cr-spinner" />
        Loading deck data…
      </div>
    );
  }

  const availableArenaCards = cards.filter(c => c.arena <= parseInt(arena) && (useCollectionMode ? unlockedCards.includes(c.key) : true));

  return (
    <div className="flex flex-col gap-8">
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>Deck Finder</h1>
          <p className={pageDesc}>Pick up to 3 core cards and your arena level — we'll find meta matches or build a synergistic deck.</p>
        </div>
        {useCollectionMode && <span className={`${badge} cr-badge-orange`}>Collection mode</span>}
      </div>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))' }}>

        <div className="flex flex-col gap-8">
          <div className={panel}>
            <div className={panelHeader}>
              <span className={panelTitle}>Constraints</span>
              <span className={badge}>Filters</span>
            </div>

            <div className="mb-6">
              <label className={`${crLabel} block mb-2`}>Arena level</label>
              <select value={arena} onChange={(e) => setArena(e.target.value)} className="w-full">
                {[['0','Training Camp'],['1','Goblin Stadium'],['2','Bone Pit'],['3','Barbarian Bowl'],['4','P.E.K.K.A Playhouse'],['5','Spell Valley'],['6','Builder Workshop'],['7','Royal Arena'],['8','Frozen Peak'],['9','Jungle Arena'],['10','Hog Mountain'],['11','Electro Valley'],['12','Spooky Town & Legendary']].map(([val, arenaLabel]) => (
                  <option key={val} value={val}>Arena {val} ({arenaLabel})</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`${crLabel} block mb-2`}>Core cards (max 3)</label>
              {selectedFavs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {selectedFavs.map(favKey => {
                    const card = cards.find(c => c.key === favKey);
                    return (
                      <div key={favKey} onClick={() => toggleFavCard(favKey)}
                           className={`${cardBase} ${cardGradient} ${cardRarityClass(card)} cr-card-selected`}
                           style={{ aspectRatio: '5/7' }}>
                        <span className="cr-card-elixir">{card?.elixir}</span>
                        <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(favKey); }}
                                className="cr-card-action info">
                          <Info size={8} />
                        </button>
                        <img src={card?.image} alt={card?.name} className="w-[75%] object-contain mt-3" />
                        <span className="cr-card-name">{card?.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cr-card-slot-empty p-4 mb-4 text-center">
                  No cards locked. Tap cards below to set favorites.
                </div>
              )}
            </div>
          </div>

          <div className={panel}>
            <div className={panelHeader}>
              <span className={panelTitle}>Card pool</span>
              <span className={`${badge} cr-badge-orange`}>Tap to lock</span>
            </div>
            <div className="grid overflow-y-auto pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '.75rem', maxHeight: '320px' }}>
              {availableArenaCards.map(card => {
                const isSelected = selectedFavs.includes(card.key);
                return (
                  <div key={card.key} onClick={() => toggleFavCard(card.key)}
                       className={`${cardBase} ${cardGradient} ${cardRarityClass(card)} ${isSelected ? 'cr-card-selected' : ''} ${!isSelected && selectedFavs.length >= 3 ? 'opacity-40 pointer-events-none' : ''}`}
                       style={{ aspectRatio: '5/7' }}>
                    <span className="cr-card-elixir">{card.elixir}</span>
                    <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }}
                            className="cr-card-action info">
                      <Info size={8} />
                    </button>
                    <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                    <span className="cr-card-name">{card.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={panel}>
          <div className={panelHeader}>
            <span className={panelTitle}>Recommendations</span>
            <span className={`${badge} cr-badge-blue`}>Decks</span>
          </div>

          {results.length > 0 ? (
            <div className="flex flex-col gap-6">
              {results.map((deck, idx) => (
                <div key={idx} className={panel}
                     style={{ borderLeft: `3px solid ${deck.type === 'Meta Match' ? 'var(--cr-green)' : 'var(--cr-blue)'}` }}>
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-3">
                    <div>
                      <span className={`${badge} ${deck.type === 'Meta Match' ? 'cr-badge-green' : 'cr-badge-blue'} mr-2`}>{deck.type}</span>
                      <h3 className="inline text-base font-bold text-[var(--cr-text)]">{deck.name}</h3>
                      <p className="text-sm cr-text-muted mt-1 leading-snug">{deck.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="cr-stat-label">Win rate</div>
                      <div className="cr-stat-value cr-text-green">{deck.winRate}%</div>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto py-2 mb-4">
                    {deck.cards.map(cKey => {
                      const c = cards.find(card => card.key === cKey);
                      return (
                        <div key={cKey} onClick={() => onViewCardDetails(cKey)}
                             title={c ? `${c.name} (${c.elixir} elixir)` : cKey}
                             className="w-[46px] h-[64px] rounded-md overflow-hidden border border-[var(--cr-border)] bg-[var(--cr-bg)] flex-shrink-0 cursor-pointer hover:border-[var(--cr-border-hover)] transition-all">
                          <img src={c?.image} alt={c?.name} className="w-full h-full object-contain" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3 text-sm">
                    <div className="flex gap-4">
                      <span className="font-semibold cr-text-pink">Elixir: {deck.averageElixir}</span>
                      <span className="font-semibold cr-text-gold">Archetype: {deck.archetype}</span>
                    </div>
                    <button onClick={() => onImportDeck(deck.cards)} className={btnPrimary}>
                      <Play size={12} fill="currentColor" /> Load deck
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 cr-text-muted">
              <ShieldAlert size={32} className="mx-auto mb-4 opacity-50" />
              <p>No recommendations for your current filters.</p>
              {useCollectionMode && <p className="text-xs cr-text-red mt-2">Try unlocking more cards in the Chest Shop.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
