import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ZAxis } from 'recharts';
import { Award, Percent, Flame, Layers, Play, Crown, Sparkles } from 'lucide-react';
import { panel, panelSm, pageTitle, pageDesc, pageHeader, panelHeader, panelTitle, badge, btnSecondary, btnPrimary } from '../utils/ui';

const API_BASE = 'http://localhost:5000/api';
const chartTooltip = { backgroundColor: '#0f1524', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f0f2f8' };

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
    return (
      <div className="cr-loading">
        <div className="cr-spinner" />
        Loading meta data…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className={pageHeader}>
        <div>
          <h1 className={pageTitle}>Meta Tracker</h1>
          <p className={pageDesc}>Card usage, archetype win rates, and elixir trends from current ladder data.</p>
        </div>
        {useCollectionMode && <span className={`${badge} cr-badge-orange`}>Collection Mode</span>}
      </div>

      {stats && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {[
            { bg: 'rgba(255,71,87,0.1)', icon: <Flame size={24} className="cr-text-red" />, label: 'Most Popular', value: stats.mostPopularCard?.name, sub: `${stats.mostPopularCard?.popularity}% pick rate`, subCls: 'cr-text-red' },
            { bg: 'rgba(245,200,66,0.1)', icon: <Award size={24} className="cr-text-gold" />, label: 'Top Deck', value: stats.topDeck?.name, sub: `${stats.topDeck?.winRate}% win rate`, subCls: 'cr-text-gold' },
            { bg: 'rgba(59,158,255,0.1)', icon: <Layers size={24} className="cr-text-blue" />, label: 'Top Archetype', value: stats.topArchetype, sub: 'High win-rate core', subCls: 'cr-text-blue' },
            { bg: 'rgba(232,67,147,0.1)', icon: <Percent size={24} className="cr-text-pink" />, label: 'Avg Elixir', value: stats.avgMetaElixir, sub: 'Meta pacing', subCls: 'cr-text-pink' },
          ].map(({ bg, icon, label, value, sub, subCls }) => (
            <div key={label} className="cr-metric-card">
              <div className="cr-metric-icon" style={{ background: bg }}>{icon}</div>
              <div>
                <div className="cr-stat-label">{label}</div>
                <div className="font-bold text-[var(--cr-text)] text-lg">{value}</div>
                <div className={`text-xs mt-0.5 ${subCls}`}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {proMode && (
        <div className={`${panel} cr-panel-gold`}>
          <div className={`${panelHeader} mb-4`}>
            <div className="flex items-center gap-2">
              <Crown size={18} className="cr-text-gold" fill="var(--cr-gold)" />
              <span className={panelTitle}>Pro Telemetry</span>
            </div>
            <span className={`${badge} cr-badge-blue`}>Pro</span>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { label: 'Synergy Rating', val: '94.8%', cls: 'cr-text-gold', note: 'Peak synergy from balance logs' },
              { label: 'Elixir Pacing', val: '9.75/10', cls: 'cr-text-pink', note: 'Fast cycle, minimal leakage' },
              { label: 'Lane Pressure', val: '88.4', cls: 'cr-text-green', note: 'Balanced double-lane threat' },
            ].map(({ label, val, cls, note }) => (
              <div key={label} className={`${panelSm} cr-glass`}>
                <div className="cr-stat-label">{label}</div>
                <div className={`cr-stat-value ${cls}`}>{val}</div>
                <p className="text-xs cr-text-muted mt-1">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 cr-glass p-4">
            <h4 className="text-sm font-semibold cr-text-gold flex items-center gap-1.5 mb-1">
              <Sparkles size={14} /> Strategy Tip
            </h4>
            <p className="text-sm cr-text-muted leading-relaxed">
              Meta shift in Arena 20+: <strong className="text-[var(--cr-text)]">Golden Knight</strong> and <strong className="text-[var(--cr-text)]">Void Spell</strong> show high win synergy. Swapping standard tanks can raise counter-push win rate by <strong className="cr-text-gold">+4.2%</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div className={panel}>
          <div className={panelHeader}>
            <span className={panelTitle}>Top 10 Pick Rate</span>
            <span className={`${badge} cr-badge-blue`}>Usage</span>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5c6578" fontSize={11} tickLine={false} />
                <YAxis stroke="#5c6578" fontSize={11} unit="%" />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="popularity" fill="var(--cr-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={panel}>
          <div className={panelHeader}>
            <span className={panelTitle}>Archetype Trends</span>
            <span className={`${badge} cr-badge-purple`}>Win Rate</span>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5c6578" fontSize={11} tickLine={false} />
                <YAxis stroke="#5c6578" fontSize={11} domain={[45, 56]} unit="%" />
                <Tooltip contentStyle={chartTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Beatdown" stroke="var(--cr-gold)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Cycle" stroke="var(--cr-blue)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Bridge Spam" stroke="var(--cr-red)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Spell Bait" stroke="var(--cr-elixir)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={panel} style={{ gridColumn: '1 / -1' }}>
          <div className={panelHeader}>
            <span className={panelTitle}>Elixir vs Win Rate</span>
            <span className={`${badge} cr-badge-blue`}>Correlation</span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <XAxis type="number" dataKey="x" name="Elixir" unit=" elixir" stroke="#5c6578" fontSize={11} domain={[0, 9]} tickCount={10} />
                <YAxis type="number" dataKey="y" name="Win Rate" unit="%" stroke="#5c6578" fontSize={11} domain={[42, 56]} />
                <ZAxis type="number" dataKey="popularity" range={[40, 450]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={chartTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="All Cards" data={scatter} fill="var(--cr-elixir)" opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={panel}>
        <div className={panelHeader}>
          <span className={panelTitle}>Top Meta Decks</span>
          <span className={`${badge} cr-badge-gold`}>Leaderboard</span>
        </div>
        <div className="flex flex-col gap-4">
          {decks.map(deck => {
            const isDeckLocked = useCollectionMode && !deck.cards.every(cKey => unlockedCards.includes(cKey));
            return (
              <div key={deck.id} className={`cr-glass p-4 flex flex-wrap items-center justify-between gap-4 transition-all ${isDeckLocked ? 'opacity-50' : 'hover:border-[var(--cr-border-hover)]'}`}>
                <div className="flex flex-col gap-1.5 flex-[1_1_280px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[var(--cr-text)]">{deck.name}</h4>
                    <span className={`${badge} cr-badge-green`}>{deck.archetype}</span>
                    <span className={`${badge} cr-badge-blue`}>{deck.difficulty}</span>
                  </div>
                  <p className="text-sm cr-text-muted leading-snug">{deck.description}</p>
                  <div className="flex gap-3 text-xs font-semibold">
                    <span className="cr-text-green">{deck.winRate}% WR</span>
                    <span className="cr-text-blue">{deck.popularity}% pick</span>
                    <span className="cr-text-pink">{deck.averageElixir} avg elixir</span>
                  </div>
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {deck.cardsDetails?.map(c => {
                    const isCardUnlocked = !useCollectionMode || unlockedCards.includes(c.key);
                    return (
                      <div key={c.key} onClick={() => isCardUnlocked && onViewCardDetails(c.key)}
                           title={`${c.name} (${c.elixir})${!isCardUnlocked ? ' — locked' : ''}`}
                           className={`w-11 h-[58px] rounded-md overflow-hidden border bg-[var(--cr-bg)] flex-shrink-0 transition-all ${
                             isCardUnlocked ? 'border-[var(--cr-border)] cursor-pointer hover:border-[var(--cr-border-hover)]' : 'border-dashed border-[var(--cr-red)] opacity-30 grayscale cursor-not-allowed'
                           }`}>
                        <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => !isDeckLocked && onImportDeck(deck.cards)} disabled={isDeckLocked}
                        className={isDeckLocked ? `${btnSecondary} opacity-50` : btnPrimary}>
                  <Play size={12} fill="currentColor" /> {isDeckLocked ? 'Locked' : 'Load Deck'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
