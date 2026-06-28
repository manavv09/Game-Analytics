import React, { useState, useEffect } from 'react';
import { Shield, Swords, Activity, Zap, Trash2, Search, ArrowRight, HelpCircle, CheckCircle, AlertTriangle, Share2, Info } from 'lucide-react';
import {
  panel, panelSm, glass, pageTitle, pageDesc, pageHeader, panelHeader, panelTitle,
  badge, btnPrimary, btnSecondary, btnGhost, cardBase, cardGradient, statBox, label as crLabel
} from '../utils/ui.js';

const API_BASE = 'http://localhost:5000/api';

const getLeagueLabel = (val) => {
  if (val >= 8) return 'Ultimate Champion';
  if (val >= 6) return 'Grand Champion';
  if (val >= 4) return 'Master League';
  if (val >= 2) return 'Challenger';
  return 'Training Camp';
};

const cardRarityClass = (card) => {
  if (card.rarity === 'legendary') return 'anim-legendary';
  if (card.rarity === 'champion') return 'anim-champion';
  if (card.isEvo) return 'anim-evo';
  return '';
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
  const handleCopyLink = () => { const shareLink = `${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`; navigator.clipboard.writeText(shareLink).then(() => { setCopyFeedback("Copied"); setTimeout(() => setCopyFeedback(""), 2000); }).catch(err => console.error("Could not copy deck link:", err)); };

  const filteredCards = cards.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && (roleFilter ? c.role === roleFilter : true) && (elixirFilter ? c.elixir === parseInt(elixirFilter) : true) && (rarityFilter ? c.rarity === rarityFilter : true) && (useCollectionMode ? unlockedCards.includes(c.key) : true));
  const cheapest4Cycle = [...deck].map(key => cards.find(c => c.key === key)?.elixir || 0).sort((a, b) => a - b).slice(0, 4).reduce((s, c) => s + c, 0);

  const StatBar = ({ label: statLabel, icon, value, color }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="flex items-center gap-1 text-sm cr-text-muted">{icon} {statLabel}</span>
        <span className={`${badge} cr-badge-blue`}>{getLeagueLabel(value)} ({value}/10)</span>
      </div>
      <div className="h-[10px] bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full stat-bar-inner" style={{ width: `${value * 10}%`, background: color, transition: 'width .4s ease' }} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>Deck Analyzer</h1>
          <p className={pageDesc}>Build an 8-card deck and get real-time archetype ratings, synergy scores, and upgrade suggestions.</p>
        </div>
        {useCollectionMode && <span className={`${badge} cr-badge-orange`}>Collection mode</span>}
      </div>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>

        <div className="flex flex-col gap-8">
          <div className={panel}>
            <div className={panelHeader}>
              <span className={panelTitle}>Your deck</span>
              <span className={`${badge} cr-badge-blue`}>{deck.length} / 8</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {Array.from({ length: 8 }).map((_, idx) => {
                const cardKey = deck[idx];
                const card = cards.find(c => c.key === cardKey);
                const isSelected = selectedCardKey === cardKey;
                if (!card) {
                  return (
                    <div key={`empty-${idx}`} className="cr-card-slot-empty">
                      <HelpCircle size={20} className="mb-1 opacity-50" /> Slot {idx + 1}
                    </div>
                  );
                }
                return (
                  <div key={card.key} onClick={() => setSelectedCardKey(card.key)}
                       className={`${cardBase} ${cardGradient} ${cardRarityClass(card)} ${isSelected ? 'cr-card-selected' : ''}`}
                       style={{ aspectRatio: '5/7' }}>
                    <span className="cr-card-elixir">{card.elixir}</span>
                    <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }} title="Card details"
                            className="cr-card-action info">
                      <Info size={10} />
                    </button>
                    {card.isEvo && <span className={`${badge} cr-badge-pink absolute bottom-[18px] right-1 z-10 text-[0.55rem] py-0 px-1`}>Evo</span>}
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.key); }}
                            className="cr-card-action remove" style={{ top: 'auto', bottom: 4 }}>
                      <Trash2 size={10} />
                    </button>
                    <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                    <span className="cr-card-name">{card.name}</span>
                  </div>
                );
              })}
            </div>
            {deck.length < 8 && <p className="text-sm cr-text-gold text-center mt-4">Add {8 - deck.length} more card{deck.length === 7 ? '' : 's'} to see analytics.</p>}
            {deck.length === 8 && (
              <div className="flex flex-col gap-2 mt-4 border-t border-white/[.08] pt-4">
                <span className={crLabel}>Share link</span>
                <div className="flex gap-2">
                  <input type="text" readOnly value={`${window.location.origin}${window.location.pathname}?deck=${deck.join(',')}`} className="flex-1 text-xs" />
                  <button onClick={handleCopyLink} className={`${btnSecondary} text-xs`}>
                    <Share2 size={12} /> {copyFeedback || "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {deck.length === 8 && selectedCardKey && (
            <div className={panel}>
              <div className={panelHeader}>
                <span className={panelTitle}>Replacements</span>
                <span className={badge}>Suggestions</span>
              </div>
              <p className="text-sm cr-text-muted mb-4">Swap candidates for <strong className="text-[var(--cr-text)]">{cards.find(c => c.key === selectedCardKey)?.name}</strong>:</p>
              {suggestLoading ? (
                <div className="cr-loading py-8">
                  <div className="cr-spinner" />
                  Finding replacements…
                </div>
              ) : suggestions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {suggestions.map(s => (
                    <div key={s.card.key} className={`${glass} p-3 flex items-center justify-between gap-3`}>
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`${cardBase} ${cardGradient} ${cardRarityClass(s.card)} flex-shrink-0`}
                             style={{ width: '48px', height: '67px' }}
                             onClick={() => onViewCardDetails(s.card.key)}>
                          <span className="cr-card-elixir">{s.card.elixir}</span>
                          <img src={s.card.image} alt={s.card.name} className="w-[75%] object-contain mt-2" />
                          <span className="cr-card-name">{s.card.name}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-sm text-[var(--cr-text)]">{s.card.name}</span>
                            <span className={`${badge} cr-badge-green`}>+{s.score}</span>
                          </div>
                          <p className="text-xs cr-text-muted leading-snug">{s.reason}</p>
                        </div>
                      </div>
                      <button onClick={() => handleSwapReplacement(s.card.key)} className={`${btnSecondary} text-xs whitespace-nowrap`}>
                        Swap <ArrowRight size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm cr-text-muted">No replacement candidates for this slot.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          {deck.length === 8 && analysis ? (
            <div className={panel}>
              <div className={panelHeader}>
                <span className={panelTitle}>Deck stats</span>
                <span className={`${badge} cr-badge-blue`}>Live</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { lbl: 'Avg elixir', val: analysis.averageElixir, valColor: 'var(--cr-elixir)', sub: analysis.averageElixir > 4.2 ? 'Heavy beatdown' : analysis.averageElixir < 2.8 ? 'Fast cycle' : 'Balanced', subColor: analysis.averageElixir > 4.2 ? 'var(--cr-red)' : analysis.averageElixir < 2.8 ? 'var(--cr-gold)' : 'var(--cr-green)' },
                  { lbl: 'Synergy', val: `${analysis.synergyScore}%`, valColor: 'var(--cr-gold)', sub: analysis.synergyScore >= 85 ? 'Highly synergistic' : analysis.synergyScore >= 60 ? 'Moderate' : 'Imbalanced', subColor: analysis.synergyScore >= 85 ? 'var(--cr-green)' : analysis.synergyScore >= 60 ? 'var(--cr-gold)' : 'var(--cr-red)' },
                ].map(({ lbl, val, valColor, sub, subColor }) => (
                  <div key={lbl} className={statBox}>
                    <div className="cr-stat-label">{lbl}</div>
                    <div className="cr-stat-value" style={{ color: valColor }}>{val}</div>
                    <div className="text-xs mt-0.5" style={{ color: subColor }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div className={`${glass} flex items-center gap-3 p-3 mb-6`}>
                <Zap size={16} className="cr-text-pink" fill="currentColor" />
                <span className="text-sm cr-text-muted">4-card cycle: <strong className="text-[var(--cr-text)]">{cheapest4Cycle} elixir</strong></span>
                <span className="ml-auto text-xs cr-text-dim">{cheapest4Cycle <= 6 ? 'Ultra cycle' : cheapest4Cycle <= 9 ? 'Fast cycle' : 'Standard'}</span>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <h3 className={crLabel}>Performance</h3>
                <StatBar label="Ground defense" icon={<Shield size={14} className="cr-text-blue" />} value={analysis.metrics.defense} color="var(--cr-blue)" />
                <StatBar label="Tower offense" icon={<Swords size={14} className="cr-text-red" />} value={analysis.metrics.offense} color="var(--cr-red)" />
                <StatBar label="Versatility" icon={<Activity size={14} className="cr-text-green" />} value={analysis.metrics.versatility} color="var(--cr-gold)" />
              </div>

              <div className="mb-6">
                <h3 className={`${crLabel} mb-3`}>Archetype checklist</h3>
                <div className="flex flex-col gap-2">
                  {[
                    ['Win condition', analysis.checklist.winCondition.met, true],
                    ['Tank killer', analysis.checklist.tankKiller.met, false],
                    ['Air defense (2+)', analysis.checklist.airDefense.met, true],
                    ['Small spell', analysis.checklist.smallSpell.met, false],
                    ['Heavy spell', analysis.checklist.bigSpell.met, false],
                  ].map(([itemLabel, met, critical]) => (
                    <div key={itemLabel} className={`${glass} flex items-center justify-between px-3 py-2`}>
                      <span className="text-sm cr-text-muted">{itemLabel}</span>
                      {met ? <CheckCircle size={16} className="cr-text-green" /> : <AlertTriangle size={16} style={{ color: critical ? 'var(--cr-red)' : 'var(--cr-gold)' }} />}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className={`${crLabel} mb-3`}>Evaluation</h3>
                <div className="flex flex-col gap-3">
                  {analysis.strengths.map((str, idx) => (
                    <div key={`str-${idx}`} className="flex gap-2 bg-green-400/5 border-l-[3px] border-green-500 p-3 rounded">
                      <CheckCircle size={16} className="cr-text-green flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm text-emerald-200">{str.title}</div>
                        <p className="text-xs text-emerald-100/80 leading-snug">{str.desc}</p>
                      </div>
                    </div>
                  ))}
                  {analysis.weaknesses.map((weak, idx) => (
                    <div key={`weak-${idx}`} className="flex gap-2 bg-red-400/5 border-l-[3px] border-red-500 p-3 rounded">
                      <AlertTriangle size={16} className="cr-text-red flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm text-red-200">{weak.title}</div>
                        <p className="text-xs text-red-100/80 leading-snug">{weak.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${panel} py-8 text-center cr-text-muted`}>
              <Activity size={32} className="mx-auto mb-4 opacity-50" />
              <p>Add 8 cards to your deck to see stats and recommendations.</p>
            </div>
          )}

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
              { key: 'hog', name: 'Hog 2.6 Cycle', archetype: 'Fast cycle', difficulty: 'Medium', strategy: 'Protect your cannon/building. Force them into defensive fireballs.' },
              { key: 'pekka', name: 'Pekka Bridge Spam', archetype: 'Bridge spam', difficulty: 'Hard', strategy: 'Avoid low-health deployments near the bridge. Tank their Bandit with Knight.' },
              { key: 'golem', name: 'Golem Beatdown', archetype: 'Heavy beatdown', difficulty: 'Medium', strategy: 'Punish opposite lane when Golem is deployed behind their King tower.' },
              { key: 'bait', name: 'Log Bait', archetype: 'Spell bait', difficulty: 'Easy', strategy: 'Save Log/small spell strictly for Goblin Barrel. Splash them down.' },
              { key: 'graveyard', name: 'Giant Graveyard', archetype: 'Control', difficulty: 'Hard', strategy: 'Clear Skeletons instantly. Do not let their Giant cross the bridge for free.' },
            ].map(m => ({ ...m, winRate: getMP(m.key, analysis.metrics.defense, analysis.metrics.offense, parseFloat(analysis.averageElixir), analysis.synergyScore) }));

            return (
              <div className={`${panel} cr-panel-gold`}>
                <div className={panelHeader}>
                  <span className={panelTitle}>Matchup predictor</span>
                  <span className={`${badge} cr-badge-blue`}>Pro</span>
                </div>
                <p className="text-sm cr-text-muted mb-5">Simulated win rates against top meta archetypes.</p>
                <div className="flex flex-col gap-4">
                  {matchups.map(m => {
                    const isFav = m.winRate >= 50;
                    return (
                      <div key={m.key} className={`${glass} p-4 flex flex-col gap-2`}
                           style={{ borderColor: isFav ? 'rgba(74,222,128,.2)' : 'rgba(239,68,68,.2)' }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm text-[var(--cr-text)] font-bold">{m.name}</h4>
                            <span className="text-xs cr-text-dim">{m.archetype} · {m.difficulty}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${isFav ? 'cr-text-green' : 'cr-text-red'}`}>{m.winRate}%</span>
                            <span className={`block text-xs ${isFav ? 'text-emerald-300/70' : 'text-red-300/70'}`}>{isFav ? 'Favorable' : 'Unfavorable'}</span>
                          </div>
                        </div>
                        <div className={`${panelSm} cr-glass text-xs cr-text-muted italic`}>
                          <strong>Tip:</strong> {m.strategy}
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

      <div className={panel}>
        <div className={panelHeader}>
          <span className={panelTitle}>Card gallery</span>
          <span className={`${badge} cr-badge-blue`}>All cards</span>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className={`${glass} flex items-center gap-2 px-4 py-2 flex-1 min-w-[200px]`}>
            <Search size={16} className="cr-text-dim" />
            <input type="text" placeholder="Search cards…" value={search} onChange={(e) => setSearch(e.target.value)}
                   className="bg-transparent border-none text-[var(--cr-text)] outline-none w-full text-sm" />
          </div>
          {[
            { val: roleFilter, set: setRoleFilter, opts: [['', 'All roles'], ['win-condition', 'Win condition'], ['tank-killer', 'Tank killer'], ['air-defense', 'Air defense'], ['tank', 'Tanks'], ['support', 'Support'], ['cycle', 'Cycle'], ['spell-small', 'Small spells'], ['spell-big', 'Big spells'], ['building-defensive', 'Buildings']] },
            { val: rarityFilter, set: setRarityFilter, opts: [['', 'All rarities'], ['Common', 'Common'], ['Rare', 'Rare'], ['Epic', 'Epic'], ['Legendary', 'Legendary'], ['Champion', 'Champion']] },
            { val: elixirFilter, set: setElixirFilter, opts: [['', 'All elixir'], ...['1','2','3','4','5','6','7','8'].map(n => [n, `${n} elixir`])] },
          ].map(({ val, set, opts }, i) => (
            <select key={i} value={val} onChange={(e) => set(e.target.value)} className="text-sm">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {loading ? (
          <div className="cr-loading">
            <div className="cr-spinner" />
            Loading cards…
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))' }}>
            {filteredCards.map(card => {
              const inDeck = deck.includes(card.key);
              return (
                <div key={card.key} onClick={() => inDeck ? handleRemoveCard(card.key) : handleAddCard(card.key)}
                     className={`${cardBase} ${cardGradient} ${cardRarityClass(card)} ${inDeck ? 'cr-card-in-deck cr-card-selected' : ''}`}
                     style={{ aspectRatio: '5/7' }}>
                  <span className="cr-card-elixir">{card.elixir}</span>
                  <button onClick={(e) => { e.stopPropagation(); onViewCardDetails(card.key); }}
                          className="cr-card-action info">
                    <Info size={10} />
                  </button>
                  <img src={card.image} alt={card.name} className="w-[75%] object-contain mt-3" />
                  <span className="cr-card-name">{card.name}</span>
                  {card.isEvo && <span className={`${badge} cr-badge-pink absolute bottom-[18px] right-1 z-10 text-[0.5rem] py-0 px-1`}>Evo</span>}
                  {inDeck && (
                    <div className="absolute bottom-[22px] left-1 w-3.5 h-3.5 rounded flex items-center justify-center z-[15] bg-[var(--cr-gold)]">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm cr-text-muted text-center py-8">No cards match your filters.</p>
        )}
      </div>

      <div className={`${panel} flex flex-wrap items-center gap-4`}>
        <span className="text-sm cr-text-muted font-medium">Presets:</span>
        {[
          { label: 'Hog 2.6', cards: ["hog-rider","musketeer","knight","skeletons","ice-spirit","cannon","fireball","the-log"] },
          { label: 'Golem', cards: ["golem","baby-dragon","night-witch","lumberjack","tornado","poison","skeletons","bomber"] },
          { label: 'Pekka BS', cards: ["pekka","bandit","battle-ram","electro-wizard","royal-ghost","dark-prince","poison","zap"] },
          { label: 'Log Bait', cards: ["goblin-barrel","knight","valkyrie","inferno-tower","the-log","archers","skeletons","fireball"] },
        ].map(({ label: presetLabel, cards: presetCards }) => (
          <button key={presetLabel} onClick={() => handleLoadPreset(presetCards)}
                  disabled={useCollectionMode && !presetCards.every(k => unlockedCards.includes(k))}
                  className={btnSecondary}>
            {presetLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
