import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ZAxis } from 'recharts';
import { Award, Percent, Flame, Layers, Play, Info, Crown, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Reusable panel classes
const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";
const panelSm = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg relative overflow-hidden transition-all hover:border-zinc-600";
const badge = "font-medium text-xs capitalize px-3 py-1 rounded-full border border-zinc-800 bg-white/[.03] text-zinc-50";

export default function Dashboard({ onImportDeck, onViewCardDetails, useCollectionMode, unlockedCards, proMode }) {
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [trends, setTrends] = useState([]);
  const [scatter, setScatter] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/meta/stats`).then(res => res.json()),
      fetch(`${API_BASE}/meta/cards-ranking`).then(res => res.json()),
      fetch(`${API_BASE}/meta/trends`).then(res => res.json()),
      fetch(`${API_BASE}/meta/scatter-data`).then(res => res.json()),
      fetch(`${API_BASE}/meta/decks`).then(res => res.json())
    ])
      .then(([statsData, rankingData, trendsData, scatterData, decksData]) => {
        setStats(statsData); setRanking(rankingData); setTrends(trendsData); setScatter(scatterData); setDecks(decksData);
        setLoading(false);
      })
      .catch(err => { console.error("Error fetching dashboard data:", err); setLoading(false); });
  }, []);

  if (loading) {
    return <p className="text-zinc-400 text-center py-16">Compiling meta stats telemetry...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
              style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
            Trophy Road (Meta Tracker)
          </h1>
          <p className="text-zinc-400 text-sm">Historical card usage distributions, archetype win rates across ladders, and elixir correlation models compiled from game logs.</p>
        </div>
        {useCollectionMode && (
          <span className="font-medium text-xs capitalize px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">
            COLLECTION LOCKED MODE
          </span>
        )}
      </div>

      {/* Metric cards */}
      {stats && (
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
          {[
            { bg: 'rgba(239,68,68,.1)', icon: <Flame size={28} style={{ color: 'var(--cr-red)' }} />, label: 'MOST POPULAR CARD', value: stats.mostPopularCard?.name, sub: `${stats.mostPopularCard?.popularity}% Pick Rate`, subColor: 'var(--cr-red)' },
            { bg: 'rgba(234,179,8,.1)', icon: <Award size={28} style={{ color: 'var(--cr-gold)' }} />, label: 'TOP WIN-RATE DECK', value: stats.topDeck?.name, sub: `${stats.topDeck?.winRate}% Avg Win-Rate`, subColor: 'var(--cr-gold)' },
            { bg: 'rgba(59,130,246,.1)', icon: <Layers size={28} style={{ color: 'var(--cr-blue)' }} />, label: 'DOMINANT ARCHETYPE', value: stats.topArchetype, sub: 'High Win-Rate Core', subColor: 'var(--cr-blue)' },
            { bg: 'rgba(236,72,153,.1)', icon: <Percent size={28} style={{ color: 'var(--cr-elixir)' }} />, label: 'AVG META ELIXIR', value: stats.avgMetaElixir, sub: 'Standard Pacing', subColor: 'var(--cr-elixir)' },
          ].map(({ bg, icon, label, value, sub, subColor }) => (
            <div key={label} className={`${panel} flex items-center gap-4`}>
              <div className="p-3 rounded-xl" style={{ background: bg }}>{icon}</div>
              <div>
                <div className="text-[0.8rem] text-zinc-400">{label}</div>
                <div className="text-[1.2rem] font-bold text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{value}</div>
                <div className="text-[0.75rem]" style={{ color: subColor }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro Telemetry HUD */}
      {proMode && (
        <div className={`${panel}`} style={{ borderColor: 'var(--cr-gold)' }}>
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
            <Crown size={24} style={{ color: 'var(--cr-gold)' }} fill="var(--cr-gold)" />
            <h2 className="text-[1.4rem] text-white" style={{ textShadow: '2px 2px 0 #000' }}>ELITE BATTLE METRIC PRO TELEMETRY</h2>
            <span className="ml-auto text-[0.7rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">PRO VERSION UNLOCKED</span>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
            {[
              { label: 'REAL-TIME SYNERGY RATING', val: '94.8% S-TIER', valColor: 'var(--cr-gold)', note: '★ Peak performance synergy based on 2026 balance logs.', noteColor: '#a7f3d0' },
              { label: 'ELIXIR PACING COEFFICIENT', val: '9.75 / 10', valColor: 'var(--cr-elixir)', note: '★ Fast cycle velocity, minimal leakage probability.', noteColor: '#93c5fd' },
              { label: 'LANE PRESSURE INDEX', val: 'HIGH (88.4)', valColor: '#a7f3d0', note: '★ Double-lane threat distribution is balanced.', noteColor: '#a1a1aa' },
            ].map(({ label, val, valColor, note, noteColor }) => (
              <div key={label} className={`${panelSm} p-[0.85rem_1.15rem]`}>
                <span className="text-[0.72rem] text-zinc-400 block">{label}</span>
                <span className="text-[1.6rem] font-bold" style={{ color: valColor, fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>{val}</span>
                <p className="text-[0.72rem] mt-1" style={{ color: noteColor }}>{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-white/[.02] border border-zinc-800 rounded-lg">
            <h4 className="text-[0.95rem] mb-1 flex items-center gap-1" style={{ color: 'var(--cr-gold)' }}>
              <Sparkles size={14} style={{ color: 'var(--cr-gold)' }} />
              TROPHY ROAD STRATEGIC RECOMMENDATION
            </h4>
            <p className="text-[0.8rem] leading-relaxed" style={{ color: '#fffdf4' }}>
              Meta shift detected in Arena 20+! <strong>Golden Knight</strong> and <strong>Void Spell</strong> represent high-frequency win synergy this season. Replacing standard tanks like Knight with Golden Knight can raise your average counter-push win-rate by <strong>+4.2%</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px,1fr))' }}>
        {/* Bar chart */}
        <div className={panel}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Top 10 Cards Pick Rate</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border border-zinc-800 bg-white/[.03] text-zinc-400">USAGE %</span>
          </div>
          <div style={{ width: '100%', height: '300px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#120e29', borderColor: 'rgba(139,92,246,.2)' }} />
                <Bar dataKey="popularity" fill="var(--cr-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line chart */}
        <div className={panel}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Archetype Trends</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-purple-400 bg-purple-400/5 border-purple-400/20">WIN RATE</span>
          </div>
          <div style={{ width: '100%', height: '300px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} domain={[45, 56]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#120e29', borderColor: 'rgba(139,92,246,.2)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Beatdown" stroke="var(--cr-gold)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Cycle" stroke="var(--cr-blue)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Bridge Spam" stroke="var(--cr-red)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Spell Bait" stroke="var(--cr-elixir)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter chart - spans full width */}
        <div className={panel} style={{ gridColumn: '1 / -1' }}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-6">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Elixir Cost vs Win-Rate Correlation (Size: Card Popularity)</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">CORRELATION</span>
          </div>
          <div style={{ width: '100%', height: '320px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <XAxis type="number" dataKey="x" name="Elixir Cost" unit=" Elixir" stroke="#9ca3af" fontSize={11} domain={[0, 9]} tickCount={10} />
                <YAxis type="number" dataKey="y" name="Win Rate" unit="%" stroke="#9ca3af" fontSize={11} domain={[42, 56]} />
                <ZAxis type="number" dataKey="popularity" range={[40, 450]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="All Cards" data={scatter} fill="var(--cr-elixir)" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Meta Decks */}
      <div className={panel}>
        <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
          <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Current Top Meta Decks</span>
          <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">LEADERBOARD</span>
        </div>
        <div className="flex flex-col gap-6">
          {decks.map(deck => {
            const isDeckLocked = useCollectionMode && !deck.cards.every(cKey => unlockedCards.includes(cKey));
            return (
              <div key={deck.id}
                   className={`bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-6 transition-all hover:border-zinc-600 ${isDeckLocked ? 'opacity-50' : ''}`}>
                {/* Deck info */}
                <div className="flex flex-col gap-2 flex-[1_1_300px]">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[1.2rem] text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>{deck.name}</h4>
                    <span className="text-[0.75rem] px-2 py-0.5 rounded" style={{ background: 'rgba(74,222,128,.15)', color: '#4ade80' }}>{deck.archetype}</span>
                    <span className="text-[0.75rem] px-2 py-0.5 rounded" style={{ background: 'rgba(59,130,246,.15)', color: '#60a5fa' }}>Diff: {deck.difficulty}</span>
                  </div>
                  <p className="text-[0.85rem] text-zinc-400 leading-snug">{deck.description}</p>
                  <div className="flex gap-4 mt-1 text-[0.8rem]">
                    <span className="font-bold text-green-400">Win Rate: {deck.winRate}%</span>
                    <span className="font-bold text-blue-400">Pick Rate: {deck.popularity}%</span>
                    <span className="font-bold" style={{ color: 'var(--cr-elixir)' }}>Avg Elixir: {deck.averageElixir}</span>
                  </div>
                </div>

                {/* Card images */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {deck.cardsDetails?.map(c => {
                    const isCardUnlocked = !useCollectionMode || unlockedCards.includes(c.key);
                    return (
                      <div key={c.key}
                           onClick={() => isCardUnlocked && onViewCardDetails(c.key)}
                           title={`${c.name} (${c.elixir} Elixir)${!isCardUnlocked ? ' - LOCKED' : ''}`}
                           className={`w-[46px] h-[64px] rounded-md overflow-hidden border bg-zinc-950 flex-shrink-0 relative transition-all ${
                             isCardUnlocked ? 'border-zinc-800 cursor-pointer hover:border-zinc-500' : 'border-dashed border-red-600 cursor-not-allowed opacity-25 grayscale'
                           }`}>
                        <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                    );
                  })}
                </div>

                {/* Action button */}
                <button onClick={() => !isDeckLocked && onImportDeck(deck.cards)} disabled={isDeckLocked}
                        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                          isDeckLocked
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                            : 'bg-zinc-800 text-zinc-50 border border-zinc-700 cursor-pointer hover:bg-zinc-700'
                        }`}>
                  <Play size={12} fill="currentColor" /> {isDeckLocked ? 'Deck Locked' : 'Load Deck'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
