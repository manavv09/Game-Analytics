import React, { useState, useEffect } from 'react';
import { Shield, Swords, Activity, Zap, Trash2, Search, ArrowRight, HelpCircle, CheckCircle, AlertTriangle, Share2, Info } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";
const glassPanel = "bg-white/[.02] border border-zinc-800 rounded-lg";

const getLeagueLabel = (val) => {
  if (val >= 8) return 'Ultimate Champion';
  if (val >= 6) return 'Grand Champion';
  if (val >= 4) return 'Master League';
  if (val >= 2) return 'Challenger';
  return 'Training Camp';
};

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

  useEffect(() => { fetch(`${API_BASE}/cards`).then(res => res.json()).then(data => { setCards(data); setLoading(false); }).catch(err => { console.error("Error fetching cards:", err); setLoading(false); }); }, []);

  useEffect(() => {
    if (deck.length === 8) {
      fetch(`${API_BASE}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deck }) }).then(res => res.json()).then(data => setAnalysis(data)).catch(err => console.error("Error analyzing deck:", err));
    }
  }, [deck]);

  useEffect(() => {
    if (deck.length === 8 && selectedCardKey && deck.includes(selectedCardKey)) {
      setSuggestLoading(true);
      fetch(`${API_BASE}/analyze/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deck, cardToReplace: selectedCardKey }) }).then(res => res.json()).then(data => { setSuggestions(data); setSuggestLoading(false); }).catch(err => { console.error("Error fetching replacements:", err); setSuggestLoading(false); });
    } else { setSuggestions([]); }
  }, [deck, selectedCardKey]);

  const handleRemoveCard = (key) => { const nd = deck.filter(c => c !== key); setDeck(nd); if (selectedCardKey === key) setSelectedCardKey(nd[0] || ""); };
  const handleAddCard = (key) => { if (deck.includes(key)) return; if (deck.length >= 8) { if (selectedCardKey) { setDeck(deck.map(c => c === selectedCardKey ? key : c)); setSelectedCardKey(key); } } else { setDeck([...deck, key]); if (!selectedCardKey) setSelectedCardKey(key); } };
  const handleSwapReplacement = (newCardKey) => { if (!selectedCardKey) return; setDeck(deck.map(c => c === selectedCardKey ? newCardKey : c)); setSelectedCardKey(newCardKey); };
  const handleLoadPreset = (presetCards) => { setDeck(presetCards); setSelectedCardKey(presetCards[0]); };
  const handleCopyLink = () => { const shareLink = `${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`; navigator.clipboard.writeText(shareLink).then(() => { setCopyFeedback("Link copied!"); setTimeout(() => setCopyFeedback(""), 2000); }).catch(err => console.error("Could not copy deck link:", err)); };

  const filteredCards = cards.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && (roleFilter ? c.role === roleFilter : true) && (elixirFilter ? c.elixir === parseInt(elixirFilter) : true) && (rarityFilter ? c.rarity === rarityFilter : true) && (useCollectionMode ? unlockedCards.includes(c.key) : true));
  const cheapest4Cycle = [...deck].map(key => cards.find(c => c.key === key)?.elixir || 0).sort((a, b) => a - b).slice(0, 4).reduce((s, c) => s + c, 0);

  const StatBar = ({ label, icon, value, color }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="flex items-center gap-1 text-[0.85rem] text-zinc-300">{icon} {label}</span>
        <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-white/[.04] text-zinc-400 border border-zinc-800">{getLeagueLabel(value)} ({value}/10)</span>
      </div>
      <div className="h-[10px] bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full stat-bar-inner" style={{ width: `${value * 10}%`, background: color, transition: 'width .4s ease' }} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
              style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
            Battle Deck Analyzer
          </h1>
          <p className="text-zinc-400 text-sm">Build your custom 8-card battle deck and receive real-time archetype ratings, synergy evaluations, and upgrade recommendations.</p>
        </div>
        {useCollectionMode && <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">COLLECTION LOCKED MODE</span>}
      </div>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>

        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* Active deck builder */}
          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Active Battle Deck</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">{deck.length} / 8 Cards</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {Array.from({ length: 8 }).map((_, idx) => {
                const cardKey = deck[idx];
                const card = cards.find(c => c.key === cardKey);
                const isSelected = selectedCardKey === cardKey;
                if (!card) {
                  return (
                    <div key={`empty-${idx}`} className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 text-[0.8rem] cursor-default" style={{ aspectRatio: '5/7' }}>
                      <HelpCircle size={20} className="mb-1" /> Slot {idx + 1}
                    </div>
                  );
                }
                return (
                  <div key={card.key} onClick={() => setSelectedCardKey(card.key)}
                       className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-pointer border transition-all hover:-translate-y-2 hover:scale-105 ${
                         card.rarity === 'legendary' ? 'anim-legendary' : card.rarity === 'champion' ? 'anim-champion' : card.isEvo ? 'anim-evo' : 'border-zinc-700'
                       }`}
                       style={{ aspectRatio: '5/7', background: 'linear-gradient(135deg,rgba(30,30,38,.95),rgba(15,15,20,.98))', borderColor: isSelected ? 'var(--cr-gold)' : '', boxShadow: isSelected ? '0 0 0 1px var(--cr-gold)' : '' }}>
                    <span className="absolute top-1 left-1 bg-pink-500 text-white px-[5px] py-[2px] rounded text-[0.65rem] font-semibold z-10">{card.elixir}</span>
                    <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }} title="View detailed statistics"
                            className="absolute top-1 left-1 w-4 h-4 flex items-center justify-center bg-white/10 border-0 text-white rounded cursor-pointer z-[12]">
                      <Info size={10} />
                    </button>
                    {card.isEvo && <span className="absolute bottom-[18px] right-1 bg-pink-500 text-white text-[0.55rem] font-bold px-0.5 py-px rounded z-10">EVO</span>}
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.key); }}
                            className="absolute top-1 right-1 w-[18px] h-[18px] flex items-center justify-center bg-red-500/90 border-0 text-white rounded-full cursor-pointer z-[12]">
                      <Trash2 size={10} />
                    </button>
                    <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                    <span className="text-[0.65rem] text-zinc-400 text-center w-full py-0.5 truncate">{card.name}</span>
                  </div>
                );
              })}
            </div>
            {deck.length < 8 && <p className="text-yellow-400 text-[0.85rem] text-center mt-4">Add {8 - deck.length} more card(s) from the grid below to compile analytics.</p>}
            {deck.length === 8 && (
              <div className="flex flex-col gap-2 mt-4 border-t border-white/[.08] pt-4">
                <span className="text-[0.8rem] text-zinc-400">DECK SHARE LINK</span>
                <div className="flex gap-2">
                  <input type="text" readOnly value={`${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`} className="flex-1" style={{ padding: '.35rem .6rem', fontSize: '.78rem' }} />
                  <button onClick={handleCopyLink} className="flex items-center gap-1 bg-zinc-800 text-zinc-50 border border-zinc-700 text-[0.75rem] font-medium px-3 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">
                    <Share2 size={12} /> {copyFeedback || "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Replacement suggestions */}
          {deck.length === 8 && selectedCardKey && (
            <div className={panel}>
              <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
                <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Smart Replacements</span>
                <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border border-zinc-800 bg-white/[.03] text-zinc-400">IDEAS</span>
              </div>
              <p className="text-[0.8rem] text-zinc-400 mb-4">Top candidates to replace <strong className="text-white">{cards.find(c => c.key === selectedCardKey)?.name}</strong>:</p>
              {suggestLoading ? (
                <p className="text-zinc-400 text-[0.9rem]">Analyzing statistical replacement models...</p>
              ) : suggestions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {suggestions.map(s => (
                    <div key={s.card.key} className={`${glassPanel} p-3 flex items-center justify-between gap-3`}>
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-pointer border flex-shrink-0 ${s.card.rarity === 'legendary' ? 'anim-legendary' : s.card.rarity === 'champion' ? 'anim-champion' : 'border-zinc-700'}`}
                             style={{ width: '48px', height: '67px', background: 'linear-gradient(135deg,rgba(30,30,38,.95),rgba(15,15,20,.98))' }}
                             onClick={() => onViewCardDetails(s.card.key)}>
                          <span className="absolute top-px left-px bg-pink-500 text-white px-[4px] py-px rounded text-[0.55rem] font-semibold z-10">{s.card.elixir}</span>
                          <img src={s.card.image} alt={s.card.name} className="w-[75%] object-contain mt-2" />
                          <span className="text-[0.5rem] text-zinc-400 text-center w-full py-0.5 truncate px-0.5">{s.card.name}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-[0.85rem] text-white">{s.card.name}</span>
                            <span className="text-[0.6rem] font-bold px-1 py-px rounded bg-green-400/15 text-green-400">+{s.score}</span>
                          </div>
                          <p className="text-[0.75rem] text-zinc-400 leading-snug">{s.reason}</p>
                        </div>
                      </div>
                      <button onClick={() => handleSwapReplacement(s.card.key)}
                              className="flex items-center gap-1 bg-zinc-800 text-zinc-50 border border-zinc-700 text-[0.75rem] font-medium px-2 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all whitespace-nowrap">
                        Swap In <ArrowRight size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 text-[0.9rem]">No replacement candidates resolved for this slot.</p>
              )}
            </div>
          )}
        </div>

        {/* Right column: analytics */}
        <div className="flex flex-col gap-8">
          {deck.length === 8 && analysis ? (
            <div className={panel}>
              <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
                <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Real-time Deck Intelligence</span>
                <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">TELEMETRY</span>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { lbl: 'AVERAGE ELIXIR', val: analysis.averageElixir, valColor: 'var(--cr-elixir)', sub: analysis.averageElixir > 4.2 ? 'Heavy Beatdown' : analysis.averageElixir < 2.8 ? 'Fast Cycle' : 'Balanced Deck', subColor: analysis.averageElixir > 4.2 ? 'var(--cr-red)' : analysis.averageElixir < 2.8 ? 'var(--cr-gold)' : '#4ade80' },
                  { lbl: 'DECK SYNERGY', val: `${analysis.synergyScore}%`, valColor: 'var(--cr-gold)', sub: analysis.synergyScore >= 85 ? 'Highly Synergistic' : analysis.synergyScore >= 60 ? 'Moderate Synergy' : 'Imbalanced Deck', subColor: analysis.synergyScore >= 85 ? '#4ade80' : analysis.synergyScore >= 60 ? 'var(--cr-gold)' : 'var(--cr-red)' },
                ].map(({ lbl, val, valColor, sub, subColor }) => (
                  <div key={lbl} className={`${glassPanel} p-3 text-center`}>
                    <div className="text-[0.75rem] text-zinc-400 mb-1">{lbl}</div>
                    <div className="text-[1.8rem] font-extrabold" style={{ color: valColor, fontFamily: 'var(--font-clash)' }}>{val}</div>
                    <div className="text-[0.7rem]" style={{ color: subColor }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Cycle cost */}
              <div className="flex items-center gap-3 p-3 border border-zinc-800 bg-white/[.02] rounded-lg mb-6">
                <Zap size={16} className="text-pink-400" fill="currentColor" />
                <span className="text-[0.85rem] text-zinc-300">Cheapest 4-Card Cycle: <strong className="text-white">{cheapest4Cycle} Elixir</strong></span>
                <span className="ml-auto text-[0.72rem] text-zinc-400">{cheapest4Cycle <= 6 ? 'Ultra Cycle' : cheapest4Cycle <= 9 ? 'Fast cycle' : 'Standard pacing'}</span>
              </div>

              {/* Metrics */}
              <div className="flex flex-col gap-4 mb-6">
                <h3 className="text-[0.95rem] text-zinc-400 tracking-wide">PERFORMANCE METRICS</h3>
                <StatBar label="Ground Defense" icon={<Shield size={14} className="text-sky-400" />} value={analysis.metrics.defense} color="var(--cr-blue)" />
                <StatBar label="Tower Offense" icon={<Swords size={14} className="text-red-400" />} value={analysis.metrics.offense} color="var(--cr-red)" />
                <StatBar label="Versatility" icon={<Activity size={14} className="text-green-400" />} value={analysis.metrics.versatility} color="var(--cr-gold)" />
              </div>

              {/* Checklist */}
              <div className="mb-6">
                <h3 className="text-[0.95rem] text-zinc-400 tracking-wide mb-3">ARCHETYPE REQUIREMENT CHECKLIST</h3>
                <div className="flex flex-col gap-2">
                  {[
                    ['Win Condition (Tower Taker)', analysis.checklist.winCondition.met, true],
                    ['Tank Killer (Heavy Defense)', analysis.checklist.tankKiller.met, false],
                    ['Air Defense (At least 2)', analysis.checklist.airDefense.met, true],
                    ['Small Damage Spell (Log/Zap)', analysis.checklist.smallSpell.met, false],
                    ['Heavy Damage Spell (Fireball/Poison)', analysis.checklist.bigSpell.met, false],
                  ].map(([label, met, critical]) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 bg-white/[.02] border border-zinc-800 rounded-lg">
                      <span className="text-[0.85rem] text-zinc-300">{label}</span>
                      {met ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} style={{ color: critical ? 'var(--cr-red)' : 'var(--cr-gold)' }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & weaknesses */}
              <div>
                <h3 className="text-[0.95rem] text-zinc-400 tracking-wide mb-3">TACTICAL EVALUATION</h3>
                <div className="flex flex-col gap-3">
                  {analysis.strengths.map((str, idx) => (
                    <div key={`str-${idx}`} className="flex gap-2 bg-green-400/5 border-l-[3px] border-green-500 p-3 rounded">
                      <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[0.82rem] text-emerald-200">{str.title}</div>
                        <p className="text-[0.72rem] text-emerald-100 leading-snug">{str.desc}</p>
                      </div>
                    </div>
                  ))}
                  {analysis.weaknesses.map((weak, idx) => (
                    <div key={`weak-${idx}`} className="flex gap-2 bg-red-400/5 border-l-[3px] border-red-500 p-3 rounded">
                      <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[0.82rem] text-red-200">{weak.title}</div>
                        <p className="text-[0.72rem] text-red-100 leading-snug">{weak.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${panel} py-8 text-center text-zinc-400`}>
              <Activity size={32} className="mx-auto mb-4 opacity-50" />
              <p>Add 8 cards to your active deck on the left to review stats and recommendations.</p>
            </div>
          )}

          {/* Pro: Matchup Predictor */}
          {proMode && deck.length === 8 && analysis && (() => {
            const getMP = (k, def, off, avgEl, syn) => {
              let b = 50 + (syn - 70) * 0.15;
              if (k === 'hog') { b += (def - 5) * 4; b += (3.5 - avgEl) * 3; }
              else if (k === 'pekka') { b += (def - 6) * 5; }
              else if (k === 'golem') { b += (def - 5) * 3; b += (off - 5) * 2; if (avgEl < 3.0) b -= 4; }
              else if (k === 'bait') { b += (def - 5) * 3; if (avgEl < 3.2) b += 5; }
              else if (k === 'graveyard') { b += (off - 5) * 4; }
              return Math.round(Math.max(32, Math.min(68, b)));
            };
            const matchups = [
              { key: 'hog', name: 'Hog 2.6 Cycle', archetype: 'Fast Cycle', difficulty: 'Medium', strategy: 'Protect your cannon/building. Force them into defensive fireballs.' },
              { key: 'pekka', name: 'Pekka Bridge Spam', archetype: 'Bridge Spam', difficulty: 'Hard', strategy: 'Avoid low-health deployments near the bridge. Tank their Bandit with Knight.' },
              { key: 'golem', name: 'Golem Beatdown', archetype: 'Heavy Beatdown', difficulty: 'Medium', strategy: 'Punish opposite lane when Golem is deployed behind their King tower.' },
              { key: 'bait', name: 'Log Bait', archetype: 'Spell Bait', difficulty: 'Easy', strategy: 'Save Log/small spell strictly for Goblin Barrel. Splash them down.' },
              { key: 'graveyard', name: 'Giant Graveyard', archetype: 'Control', difficulty: 'Hard', strategy: 'Clear Skeletons instantly. Do not let their Giant cross the bridge for free.' },
            ].map(m => ({ ...m, winRate: getMP(m.key, analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore) }));

            return (
              <div className={`${panel} mt-0`} style={{ borderColor: 'var(--cr-gold)' }}>
                <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
                  <span className="font-extrabold text-base text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>
                    ⚔️ AI Battle Matchup Predictor Matrix
                  </span>
                  <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">PRO ENG.</span>
                </div>
                <p className="text-[0.8rem] text-zinc-400 mb-5">Simulating deck combat models against top meta archetypes. Win rates predict matchup viability.</p>
                <div className="flex flex-col gap-4">
                  {matchups.map(m => {
                    const isFav = m.winRate >= 50;
                    return (
                      <div key={m.key} className={`${glassPanel} p-4 flex flex-col gap-2`}
                           style={{ borderColor: isFav ? 'rgba(74,222,128,.2)' : 'rgba(239,68,68,.2)' }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-[0.95rem] text-white font-bold" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{m.name}</h4>
                            <span className="text-[0.72rem] text-zinc-400">{m.archetype} • Diff: <strong>{m.difficulty}</strong></span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[1.25rem] font-bold ${isFav ? 'text-green-400' : 'text-red-400'}`} style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{m.winRate}% Win</span>
                            <span className={`block text-[0.62rem] ${isFav ? 'text-emerald-200' : 'text-red-200'}`}>{isFav ? '★ Favorable Matchup' : '▲ Deficit Matchup'}</span>
                          </div>
                        </div>
                        <div className="px-2 py-1.5 bg-white/[.02] rounded text-[0.72rem] text-slate-300 italic">
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

      {/* Card catalog */}
      <div className={panel}>
        <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
          <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Royal Card Gallery</span>
          <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">INDEX</span>
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 bg-black/15 border-2 border-zinc-700 rounded-lg px-4 py-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-zinc-400" />
            <input type="text" placeholder="Search cards..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '.9rem' }} />
          </div>
          {[
            { val: roleFilter, set: setRoleFilter, opts: [['', 'All Roles'], ['win-condition', 'Win Condition'], ['tank-killer', 'Tank Killer'], ['air-defense', 'Air Defense'], ['tank', 'Tanks'], ['support', 'Splash & Support'], ['cycle', 'Cycle & Spirits'], ['spell-small', 'Small Spells'], ['spell-big', 'Big Spells'], ['building-defensive', 'Defensive Buildings']] },
            { val: rarityFilter, set: setRarityFilter, opts: [['', 'All Rarities'], ['Common', 'Common'], ['Rare', 'Rare'], ['Epic', 'Epic'], ['Legendary', 'Legendary'], ['Champion', 'Champion']] },
            { val: elixirFilter, set: setElixirFilter, opts: [['', 'All Elixir Costs'], ...['1','2','3','4','5','6','7','8'].map(n => [n, `${n} Elixir`])] },
          ].map(({ val, set, opts }, i) => (
            <select key={i} value={val} onChange={(e) => set(e.target.value)} style={{ padding: '.5rem 1rem', fontSize: '.9rem' }}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {loading ? (
          <p className="text-zinc-400 text-center py-8">Loading card assets database...</p>
        ) : filteredCards.length > 0 ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))' }}>
            {filteredCards.map(card => {
              const inDeck = deck.includes(card.key);
              return (
                <div key={card.key} onClick={() => inDeck ? handleRemoveCard(card.key) : handleAddCard(card.key)}
                     className={`relative flex flex-col items-center justify-between p-1 rounded-xl overflow-hidden cr-card-sheen cursor-pointer border transition-all hover:-translate-y-2 hover:scale-105 ${
                       card.rarity === 'legendary' ? 'anim-legendary' : card.rarity === 'champion' ? 'anim-champion' : card.isEvo ? 'anim-evo' : 'border-zinc-700'
                     } ${inDeck ? 'opacity-40' : ''}`}
                     style={{ aspectRatio: '5/7', background: 'linear-gradient(135deg,rgba(30,30,38,.95),rgba(15,15,20,.98))', borderColor: inDeck ? 'var(--cr-gold)' : '', boxShadow: inDeck ? '0 0 12px rgba(251,192,45,.4)' : '' }}>
                  <span className="absolute top-1 left-1 bg-pink-500 text-white px-[5px] py-[2px] rounded text-[0.65rem] font-semibold z-10">{card.elixir}</span>
                  <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }}
                          className="absolute top-0.5 right-0.5 w-[18px] h-[18px] flex items-center justify-center bg-blue-500/95 border-0 text-white rounded-full cursor-pointer z-[15]">
                    <Info size={10} />
                  </button>
                  <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                  <span className="text-[0.65rem] text-zinc-400 text-center w-full py-0.5 truncate">{card.name}</span>
                  {card.isEvo && (
                    <span className="absolute bottom-[18px] right-1 text-white text-[0.5rem] font-bold px-0.5 py-px rounded z-10 border border-white/50"
                          style={{ background: 'linear-gradient(180deg,#d946ef,#701a75)', textShadow: '.5px .5px 0 black', fontFamily: 'var(--font-clash)' }}>EVO</span>
                  )}
                  {inDeck && (
                    <div className="absolute bottom-[22px] left-1 w-3.5 h-3.5 rounded flex items-center justify-center z-[15]" style={{ background: 'var(--cr-gold)' }}>
                      <CheckCircle size={10} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-400 text-center py-8">No cards matched your filter query.</p>
        )}
      </div>

      {/* Quick presets */}
      <div className={`${panel} flex flex-wrap items-center gap-4`}>
        <span className="text-[0.9rem] text-zinc-400 font-medium">Quick Presets:</span>
        {[
          { label: 'Hog 2.6 Cycle', cards: ["hog-rider","musketeer","knight","skeletons","ice-spirit","cannon","fireball","the-log"] },
          { label: 'Golem Beatdown', cards: ["golem","baby-dragon","night-witch","lumberjack","tornado","poison","skeletons","bomber"] },
          { label: 'Pekka Bridge Spam', cards: ["pekka","bandit","battle-ram","electro-wizard","royal-ghost","dark-prince","poison","zap"] },
          { label: 'Log Bait', cards: ["goblin-barrel","knight","valkyrie","inferno-tower","the-log","archers","skeletons","fireball"] },
        ].map(({ label, cards: presetCards }) => (
          <button key={label} onClick={() => handleLoadPreset(presetCards)}
                  disabled={useCollectionMode && !presetCards.every(k => unlockedCards.includes(k))}
                  className="bg-zinc-800 text-zinc-50 border border-zinc-700 text-[0.8rem] font-medium px-3 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
