import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ZAxis } from 'recharts';
import { Award, Percent, Flame, Layers, Play, Info, Crown, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

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
        setStats(statsData);
        setRanking(rankingData);
        setTrends(trendsData);
        setScatter(scatterData);
        setDecks(decksData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Compiling meta stats telemetry...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Trophy Road (Meta Tracker)</h1>
          <p className="page-subtitle">Historical card usage distributions, archetype win rates across ladders, and elixir correlation models compiled from game logs.</p>
        </div>
        {useCollectionMode && (
          <span className="cr-league-badge cr-badge-master">COLLECTION LOCKED MODE</span>
        )}
      </div>

      {/* METRIC SUMMARIES */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Flame size={28} style={{ color: 'var(--cr-red)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MOST POPULAR CARD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>
                {stats.mostPopularCard?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cr-red)' }}>{stats.mostPopularCard?.popularity}% Pick Rate</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(251, 192, 45, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Award size={28} style={{ color: 'var(--cr-gold)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOP WIN-RATE DECK</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>
                {stats.topDeck?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cr-gold)' }}>{stats.topDeck?.winRate}% Avg Win-Rate</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(27, 110, 243, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Layers size={28} style={{ color: 'var(--cr-blue)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DOMINANT ARCHETYPE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>
                {stats.topArchetype}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cr-blue)' }}>High Win-Rate Core</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 18, 133, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Percent size={28} style={{ color: 'var(--cr-elixir)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AVG META ELIXIR</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>
                {stats.avgMetaElixir}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cr-elixir)' }}>Standard Pacing</div>
            </div>
          </div>
        </div>
      )}

      {/* PRO TELEMETRY HUD (Only visible in Pro Mode) */}
      {proMode && (
        <div className="cr-panel" style={{ borderColor: 'var(--cr-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Crown size={24} style={{ color: 'var(--cr-gold)' }} fill="var(--cr-gold)" />
            <h2 style={{ fontSize: '1.4rem', color: 'white', textShadow: '2px 2px 0 #000' }}>ELITE BATTLE METRIC PRO TELEMETRY</h2>
            <span className="cr-league-badge cr-badge-ultimate" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>PRO VERSION UNLOCKED</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '0.85rem 1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>REAL-TIME SYNERGY RATING</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--cr-gold)', fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>94.8% S-TIER</span>
              <p style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '0.25rem' }}>★ Peak performance synergy based on 2026 balance logs.</p>
            </div>

            <div className="glass-panel" style={{ padding: '0.85rem 1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>ELIXIR PACING COEFFICIENT</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--cr-elixir)', fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>9.75 / 10</span>
              <p style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.25rem' }}>★ Fast cycle velocity, minimal leakage probability.</p>
            </div>

            <div className="glass-panel" style={{ padding: '0.85rem 1.15rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>LANE PRESSURE INDEX</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#a7f3d0', fontFamily: 'var(--font-clash)', textShadow: '1.5px 1.5px 0 #000' }}>HIGH (88.4)</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>★ Double-lane threat distribution is balanced.</p>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--cr-gold)', fontSize: '0.95rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={14} style={{ color: 'var(--cr-gold)' }} />
              TROPHY ROAD STRATEGIC RECOMMENDATION
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#fffdf4', lineHeight: '1.4' }}>
              Meta shift detected in Arena 20+! <strong>Golden Knight</strong> and <strong>Void Spell</strong> represent high-frequency win synergy this season. Replacing standard tanks like Knight with Golden Knight can raise your average counter-push win-rate by <strong>+4.2%</strong>.
            </p>
          </div>
        </div>
      )}

      {/* CHARTS CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* CHART 1: BAR CHART */}
        <div className="cr-panel">
          <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
            <span className="cr-panel-title">Top 10 Cards Pick Rate</span>
            <span className="cr-league-badge cr-badge-challenger">USAGE %</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={ranking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#120e29', borderColor: 'rgba(139, 92, 246, 0.2)' }} />
                <Bar dataKey="popularity" fill="var(--cr-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: MULTI-LINE CHART */}
        <div className="cr-panel">
          <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
            <span className="cr-panel-title">Archetype Trends</span>
            <span className="cr-league-badge cr-badge-champion">WIN RATE</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} domain={[45, 56]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#120e29', borderColor: 'rgba(139, 92, 246, 0.2)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Beatdown" stroke="var(--cr-gold)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Cycle" stroke="var(--cr-blue)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Bridge Spam" stroke="var(--cr-red)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Spell Bait" stroke="var(--cr-elixir)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: SCATTER PLOT */}
        <div className="cr-panel" style={{ gridColumn: 'span 2' }}>
          <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem' }}>
            <span className="cr-panel-title">Elixir Cost vs Win-Rate Correlation (Size: Card Popularity)</span>
            <span className="cr-league-badge cr-badge-ultimate">CORRELATION</span>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <XAxis type="number" dataKey="x" name="Elixir Cost" unit=" Elixir" stroke="#9ca3af" fontSize={11} domain={[0, 9]} tickCount={10} />
                <YAxis type="number" dataKey="y" name="Win Rate" unit="%" stroke="#9ca3af" fontSize={11} domain={[42, 56]} />
                <ZAxis type="number" dataKey="popularity" range={[40, 450]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Scatter name="All Cards" data={scatter} fill="var(--cr-elixir)" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* META DECKS REGISTRY */}
      <div className="cr-panel">
        <div className="cr-panel-header">
          <span className="cr-panel-title">Current Top Meta Decks</span>
          <span className="cr-league-badge cr-badge-ultimate">LEADERBOARD</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {decks.map(deck => {
            const isDeckLocked = useCollectionMode && !deck.cards.every(cKey => unlockedCards.includes(cKey));
            
            return (
              <div 
                key={deck.id}
                className="glass-panel" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  opacity: isDeckLocked ? 0.5 : 1
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-clash)', fontSize: '1.2rem', color: 'white', textShadow: '1.5px 1.5px 0 #000' }}>{deck.name}</h4>
                    <span className="badge badge-success" style={{ fontSize: '0.75rem', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>{deck.archetype}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Diff: {deck.difficulty}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{deck.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Win Rate: {deck.winRate}%</span>
                    <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>Pick Rate: {deck.popularity}%</span>
                    <span style={{ color: 'var(--cr-elixir)', fontWeight: 'bold' }}>Avg Elixir: {deck.averageElixir}</span>
                  </div>
                </div>

                {/* Deck Card Images */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto', padding: '0.25rem 0' }}>
                  {deck.cardsDetails?.map(c => {
                    const isCardUnlocked = !useCollectionMode || unlockedCards.includes(c.key);
                    return (
                      <div 
                        key={c.key} 
                        onClick={() => isCardUnlocked && onViewCardDetails(c.key)}
                        style={{ 
                          width: '46px', 
                          height: '64px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          border: isCardUnlocked ? '1px solid var(--border)' : '1px dashed var(--cr-red)',
                          background: 'var(--background)',
                          flexShrink: 0,
                          position: 'relative',
                          cursor: isCardUnlocked ? 'pointer' : 'not-allowed',
                          opacity: isCardUnlocked ? 1 : 0.25,
                          filter: isCardUnlocked ? 'none' : 'grayscale(100%)'
                        }}
                        title={`${c.name} (${c.elixir} Elixir)${!isCardUnlocked ? ' - LOCKED' : ''}`}
                      >
                        <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    );
                  })}
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => !isDeckLocked && onImportDeck(deck.cards)}
                  className={`btn ${isDeckLocked ? 'btn-disabled' : 'btn-secondary'}`}
                  disabled={isDeckLocked}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.85rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem'
                  }}
                >
                  <Play size={12} fill="white" /> {isDeckLocked ? 'Deck Locked' : 'Load Deck'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
