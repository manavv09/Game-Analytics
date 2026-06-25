import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle, AlertTriangle, HelpCircle, Activity, Award, RefreshCw, Zap, Crown, Sparkles, Swords, Shield } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Coach({ proMode, sharedDeck, cards }) {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("overcommit-fail");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Simulation States
  const [simRunning, setSimRunning] = useState(false);
  const [simOutcome, setSimOutcome] = useState(null);
  const [simUnits, setSimUnits] = useState([]);
  const [simPopups, setSimPopups] = useState([]);
  const [simLogs, setSimLogs] = useState([]);
  const [simTowers, setSimTowers] = useState({
    blueKing: 4000,
    blueLeft: 2500,
    blueRight: 2500,
    redKing: 4000,
    redLeft: 2500,
    redRight: 2500
  });

  const OPPONENT_DECKS = {
    golem: ["golem", "baby-dragon", "night-witch", "lumberjack", "tornado", "poison", "skeletons", "bomber"],
    pekka: ["pekka", "bandit", "battle-ram", "electro-wizard", "royal-ghost", "dark-prince", "poison", "zap"],
    hog: ["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"]
  };

  const [selectedOpponentPreset, setSelectedOpponentPreset] = useState("pekka");

  const getUnitStats = (cardKey) => {
    const defaultStats = { hp: 800, damage: 150, image: 'https://royaleapi.github.io/cr-api-assets/cards/knight.png' };
    const foundCard = cards?.find(c => c.key === cardKey);
    if (!foundCard) return defaultStats;
    return {
      name: foundCard.name,
      hp: foundCard.rarity === 'Champion' ? 1400 : foundCard.rarity === 'Legendary' ? 1100 : foundCard.rarity === 'Epic' ? 950 : 800,
      maxHp: foundCard.rarity === 'Champion' ? 1400 : foundCard.rarity === 'Legendary' ? 1100 : foundCard.rarity === 'Epic' ? 950 : 800,
      damage: foundCard.elixir * 65,
      image: foundCard.image || defaultStats.image
    };
  };

  const startSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimOutcome(null);
    setSimLogs(["[System] Initializing Battle Arena Grid...", "[System] Decks verified. Loading troops..."]);
    setSimPopups([]);
    setSimTowers({
      blueKing: 4000,
      blueLeft: 2500,
      blueRight: 2500,
      redKing: 4000,
      redLeft: 2500,
      redRight: 2500
    });

    const playerDeck = sharedDeck?.slice(0, 4) || ["hog-rider", "musketeer", "knight", "skeletons"];
    const opponentDeck = OPPONENT_DECKS[selectedOpponentPreset].slice(0, 4);

    const initialUnits = [];
    playerDeck.forEach((key, idx) => {
      const stats = getUnitStats(key);
      const lane = idx % 2 === 0 ? 'left' : 'right';
      initialUnits.push({
        id: `blue-${idx}-${Date.now()}`,
        side: 'blue',
        name: stats.name,
        x: lane === 'left' ? 22 : 78,
        y: 80 + idx * 3,
        hp: stats.hp,
        maxHp: stats.maxHp,
        damage: stats.damage,
        image: stats.image,
        lane: lane,
        status: 'walking'
      });
    });

    opponentDeck.forEach((key, idx) => {
      const stats = getUnitStats(key);
      const lane = idx % 2 === 0 ? 'left' : 'right';
      initialUnits.push({
        id: `red-${idx}-${Date.now()}`,
        side: 'red',
        name: stats.name,
        x: lane === 'left' ? 22 : 78,
        y: 20 - idx * 3,
        hp: stats.hp,
        maxHp: stats.maxHp,
        damage: stats.damage,
        image: stats.image,
        lane: lane,
        status: 'walking'
      });
    });

    setSimUnits(initialUnits);
    setSimLogs(prev => [...prev, "[Arena] Deployed units! Combat simulation running..."]);
  };

  useEffect(() => {
    if (!simRunning) return;
    let tickCount = 0;
    const maxTicks = 45;

    const interval = setInterval(() => {
      tickCount++;
      setSimUnits(prevUnits => {
        const blueLeft = prevUnits.some(u => u.side === 'blue');
        const redLeft = prevUnits.some(u => u.side === 'red');

        if (simTowers.redKing <= 0) {
          setSimOutcome('victory');
          setSimRunning(false);
          setSimLogs(logs => [...logs, "[Victory] Red King Tower destroyed! VICTORY!"]);
          clearInterval(interval);
          return [];
        }
        if (simTowers.blueKing <= 0) {
          setSimOutcome('defeat');
          setSimRunning(false);
          setSimLogs(logs => [...logs, "[Defeat] Blue King Tower destroyed! DEFEAT!"]);
          clearInterval(interval);
          return [];
        }

        if (tickCount >= maxTicks || (!blueLeft && !redLeft)) {
          if (simTowers.redLeft < simTowers.blueLeft) {
            setSimOutcome('victory');
            setSimLogs(logs => [...logs, "[Arena] Match ended. Blue holds health advantage. Victory!"]);
          } else {
            setSimOutcome('defeat');
            setSimLogs(logs => [...logs, "[Arena] Match ended. Red holds health advantage. Defeat!"]);
          }
          setSimRunning(false);
          clearInterval(interval);
          return [];
        }

        const nextUnits = prevUnits.map(unit => {
          if (unit.hp <= 0) return null;

          const enemies = prevUnits.filter(e => e.side !== unit.side && e.hp > 0);
          let target = null;
          let minDist = 999;
          enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
            if (dist < minDist) {
              minDist = dist;
              target = enemy;
            }
          });

          if (target && minDist < 8) {
            target.hp -= unit.damage;
            setSimPopups(pops => [
              ...pops,
              { id: Math.random().toString(), x: target.x, y: target.y, text: `-${unit.damage}`, type: 'normal' }
            ]);
            setSimLogs(logs => [
              ...logs,
              `[Combat] ${unit.name} strikes ${target.name} for ${unit.damage}!`
            ]);
            return { ...unit, status: 'attacking' };
          }

          let towerTarget = null;
          if (unit.side === 'blue') {
            const leftDist = Math.hypot(22 - unit.x, 20 - unit.y);
            const rightDist = Math.hypot(78 - unit.x, 20 - unit.y);
            const kingDist = Math.hypot(50 - unit.x, 10 - unit.y);
            if (kingDist < 10) towerTarget = 'redKing';
            else if (leftDist < 10) towerTarget = 'redLeft';
            else if (rightDist < 10) towerTarget = 'redRight';
          } else {
            const leftDist = Math.hypot(22 - unit.x, 80 - unit.y);
            const rightDist = Math.hypot(78 - unit.x, 80 - unit.y);
            const kingDist = Math.hypot(50 - unit.x, 90 - unit.y);
            if (kingDist < 10) towerTarget = 'blueKing';
            else if (leftDist < 10) towerTarget = 'blueLeft';
            else if (rightDist < 10) towerTarget = 'blueRight';
          }

          if (towerTarget && simTowers[towerTarget] > 0) {
            setSimTowers(towers => {
              const newTowers = { ...towers };
              newTowers[towerTarget] = Math.max(0, newTowers[towerTarget] - unit.damage);
              return newTowers;
            });
            setSimPopups(pops => [
              ...pops,
              {
                id: Math.random().toString(),
                x: unit.side === 'blue' ? (towerTarget === 'redLeft' ? 22 : towerTarget === 'redRight' ? 78 : 50) : (towerTarget === 'blueLeft' ? 22 : towerTarget === 'blueRight' ? 78 : 50),
                y: unit.side === 'blue' ? (towerTarget === 'redKing' ? 10 : 20) : (towerTarget === 'blueKing' ? 90 : 80),
                text: `-${unit.damage}`,
                type: 'normal'
              }
            ]);
            setSimLogs(logs => [...logs, `[Tower] ${unit.name} hits Opponent Tower for ${unit.damage}!`]);
            return { ...unit, status: 'attacking' };
          }

          let nextX = unit.x;
          let nextY = unit.y;
          if (unit.side === 'blue') {
            if (unit.y > 50) {
              nextY -= 4;
            } else {
              if (unit.lane === 'left') nextX = nextX + (22 - nextX) * 0.2;
              else nextX = nextX + (78 - nextX) * 0.2;
              nextY -= 4;
            }
          } else {
            if (unit.y < 50) {
              nextY += 4;
            } else {
              if (unit.lane === 'left') nextX = nextX + (22 - nextX) * 0.2;
              else nextX = nextX + (78 - nextX) * 0.2;
              nextY += 4;
            }
          }
          return { ...unit, x: nextX, y: nextY, status: 'walking' };
        }).filter(Boolean);

        return nextUnits;
      });

      setTimeout(() => {
        setSimPopups(pops => pops.slice(1));
      }, 500);
    }, 550);

    return () => clearInterval(interval);
  }, [simRunning, simTowers]);

  // Fetch presets on mount
  useEffect(() => {
    fetch(`${API_BASE}/coach/presets`)
      .then(res => res.json())
      .then(data => {
        setPresets(data);
        if (data.length > 0) {
          setSelectedPreset(data[0].key);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching presets:", err);
        setLoading(false);
      });
  }, []);

  // Run analysis when preset changes
  useEffect(() => {
    if (selectedPreset) {
      setAnalyzing(true);
      fetch(`${API_BASE}/coach/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetKey: selectedPreset })
      })
        .then(res => res.json())
        .then(data => {
          setResults(data);
          setAnalyzing(false);
        })
        .catch(err => {
          console.error("Error analyzing replay:", err);
          setAnalyzing(false);
        });
    }
  }, [selectedPreset]);

  // Format time (seconds to mm:ss)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Synchronizing coaching modules...</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">Training Camp (AI Coach)</h1>
        <p className="page-subtitle">Upload simulated match replay logs and get a frame-by-frame resource telemetry report, waste calculations, mistake tags, and personalized coaching drills.</p>
      </div>

      {/* PRO MODE BATTLE SIMULATOR (Only visible under Pro Mode) */}
      {proMode && (
        <div className="cr-panel" style={{ borderColor: 'var(--cr-gold)' }}>
          <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem' }}>
            <span className="cr-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🏟️ Interactive Arena Battle Simulator
            </span>
            <span className="cr-league-badge cr-badge-ultimate">PRO SIMULATOR</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Unleash your active battle deck against an AI preset opponent. Watch units deploy, cross the bridges, and engage in real-time tower combat.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'start', marginBottom: '1rem' }}>
            {/* Arena board */}
            <div>
              <div className="battle-arena">
                <div className="arena-grid"></div>
                <div className="arena-river"></div>
                <div className="arena-bridge left"></div>
                <div className="arena-bridge right"></div>

                {/* Towers */}
                {/* Red Towers (Opponent) */}
                {simTowers.redKing > 0 && <div className="arena-tower red king" style={{ opacity: simTowers.redKing / 4000 }}>👑 {simTowers.redKing}</div>}
                {simTowers.redLeft > 0 && <div className="arena-tower red princess-left" style={{ opacity: simTowers.redLeft / 2500 }}>🏹 {simTowers.redLeft}</div>}
                {simTowers.redRight > 0 && <div className="arena-tower red princess-right" style={{ opacity: simTowers.redRight / 2500 }}>🏹 {simTowers.redRight}</div>}

                {/* Blue Towers (Player) */}
                {simTowers.blueKing > 0 && <div className="arena-tower blue king" style={{ opacity: simTowers.blueKing / 4000 }}>👑 {simTowers.blueKing}</div>}
                {simTowers.blueLeft > 0 && <div className="arena-tower blue princess-left" style={{ opacity: simTowers.blueLeft / 2500 }}>🏹 {simTowers.blueLeft}</div>}
                {simTowers.blueRight > 0 && <div className="arena-tower blue princess-right" style={{ opacity: simTowers.blueRight / 2500 }}>🏹 {simTowers.blueRight}</div>}

                {/* Deployed Units */}
                {simUnits.map(unit => (
                  <div 
                    key={unit.id}
                    className={`arena-unit ${unit.side}`}
                    style={{ 
                      top: `${unit.y}%`, 
                      left: `${unit.x}%`,
                      backgroundImage: `url(${unit.image})`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={unit.name}
                  >
                    {/* Unit HP Bar */}
                    <div className="unit-hp-bar">
                      <div className="unit-hp-inner" style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}></div>
                    </div>
                  </div>
                ))}

                {/* Damage Popups */}
                {simPopups.map(pop => (
                  <div 
                    key={pop.id}
                    className={`damage-popup ${pop.type}`}
                    style={{ top: `${pop.y - 4}%`, left: `${pop.x}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {pop.text}
                  </div>
                ))}

                {/* Simulation Overlays */}
                {simOutcome && (
                  <div 
                    className="modal-overlay" 
                    style={{ position: 'absolute', background: 'rgba(0,0,0,0.75)', animation: 'popIn 0.3s ease-out' }}
                  >
                    <div className="glass-panel" style={{ textAlign: 'center', borderColor: 'var(--cr-gold)', padding: '2rem' }}>
                      <h2 style={{ 
                        fontSize: '2rem', 
                        color: simOutcome === 'victory' ? 'var(--cr-gold)' : 'var(--cr-red)',
                        marginBottom: '0.5rem'
                      }}>
                        {simOutcome === 'victory' ? '🏆 VICTORY 🏆' : '💀 DEFEAT 💀'}
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: 'white', marginBottom: '1rem' }}>
                        {simOutcome === 'victory' ? 'Opponent King Tower destroyed!' : 'Your King Tower has collapsed!'}
                      </p>
                      <button className="btn btn-secondary" onClick={() => setSimOutcome(null)}>Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Console & Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SELECT OPPONENT ARCHETYPE</span>
                <select 
                  value={selectedOpponentPreset} 
                  onChange={(e) => setSelectedOpponentPreset(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem' }}
                  disabled={simRunning}
                >
                  <option value="pekka">Pekka Bridge Spam (Aggressive)</option>
                  <option value="golem">Golem Beatdown (Heavy Tank)</option>
                  <option value="hog">Hog 2.6 Cycle (Fast Cycle)</option>
                </select>
              </div>

              {/* Simulation Logs Console */}
              <div className="battle-terminal">
                {simLogs.slice(-6).map((log, idx) => {
                  let lineClass = "";
                  if (log.startsWith("[Victory]")) lineClass = "gold";
                  else if (log.startsWith("[Defeat]")) lineClass = "red";
                  else if (log.startsWith("[Tower]")) lineClass = "blue";
                  
                  return (
                    <div key={idx} className={`battle-terminal-line ${lineClass}`}>
                      {log}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={startSimulation}
                  className="btn" 
                  disabled={simRunning}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {simRunning ? 'Battle Simulating...' : '⚔️ Start Battle Simulation'}
                </button>
                {simRunning && (
                  <button 
                    onClick={() => { setSimRunning(false); setSimUnits([]); setSimOutcome(null); }}
                    className="btn" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    End
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPLAY SELECTOR & STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Selector Pane */}
        <div className="cr-panel" style={{ minHeight: '250px' }}>
          <div className="cr-panel-header">
            <span className="cr-panel-title">Match Telemetry Log</span>
            <span className="cr-league-badge cr-badge-challenger">REPLAYS</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Select one of the pre-loaded match replay recordings below to analyze telemetry curves.
          </p>

          <select 
            value={selectedPreset} 
            onChange={(e) => setSelectedPreset(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}
          >
            {presets.map(p => (
              <option key={p.key} value={p.key}>{p.name} ({p.outcome})</option>
            ))}
          </select>

          {results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elixir Spent (Player)</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{results.totalSpent} Elixir</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elixir Leaked (Player)</span>
                <span style={{ fontWeight: 'bold', color: results.totalLeaked > 3 ? 'var(--cr-red)' : '#4ade80' }}>
                  {results.totalLeaked} Elixir
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Opponent Elixir Leaked</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{results.opponentLeaked} Elixir</span>
              </div>
            </div>
          )}
        </div>

        {/* Grade Card */}
        {results && (
          <div className="cr-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '290px' }}>
            <div className="cr-panel-header" style={{ width: '100%', margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
              <span className="cr-panel-title">Resource Efficiency</span>
              <span className="cr-league-badge cr-badge-master">GRADE</span>
            </div>
            
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <div 
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.02)',
                  border: '2px solid var(--cr-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div 
                  style={{ 
                    fontSize: '3rem', 
                    fontWeight: '700', 
                    color: 'white',
                    lineHeight: 1
                  }}
                >
                  {results.grade}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
              {results.efficiency}% Efficiency
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '240px', lineHeight: '1.3' }}>
              Percentage of generated elixir successfully deployed onto the field.
            </p>
          </div>
        )}

      </div>

      {/* TELEMETRY CHART */}
      {analyzing ? (
        <div className="cr-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem auto' }} />
          <p>Processing replay telemetry log...</p>
        </div>
      ) : results ? (
        <div className="cr-panel">
          <div className="cr-panel-header">
            <span className="cr-panel-title">Elixir Flow Telemetry Curve</span>
            <span className="cr-league-badge cr-badge-ultimate">FLOW</span>
          </div>

          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={results.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlayer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cr-elixir)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--cr-elixir)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickFormatter={formatTime} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  domain={[0, 10]} 
                  tickCount={6} 
                  label={{ value: 'Elixir Level', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 11 }, offset: 10 }}
                />
                <Tooltip 
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
                  formatter={(value, name, props) => {
                    const events = props.payload.events;
                    if (name === "Player Elixir") {
                      return [
                        <div>
                          <span style={{ fontWeight: 'bold', color: 'var(--cr-elixir)' }}>{value}</span>
                          {events && events.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px', fontSize: '0.75rem', color: '#9ca3af' }}>
                              {events.map((ev, i) => <div key={i}>{ev}</div>)}
                            </div>
                          )}
                        </div>,
                        name
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area 
                  type="monotone" 
                  dataKey="playerElixir" 
                  name="Player Elixir" 
                  stroke="var(--cr-elixir)" 
                  fillOpacity={1} 
                  fill="url(#colorPlayer)" 
                  strokeWidth={2.5} 
                />
                <Area 
                  type="monotone" 
                  dataKey="opponentElixir" 
                  name="Opponent Elixir" 
                  stroke="#00b0ff" 
                  fill="none" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* MISTAKES IDENTIFIED & COACHING RECOMMENDATIONS */}
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Mistakes Panel */}
          <div className="cr-panel">
            <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1.25rem -1.5rem' }}>
              <span className="cr-panel-title">Tactical Mistakes Detected</span>
              <span className="cr-league-badge cr-badge-challenger" style={{ color: 'var(--cr-red)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>ERRORS</span>
            </div>

            {results.mistakes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.mistakes.map((m, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: '1rem', 
                      background: 'rgba(239, 68, 68, 0.03)', 
                      borderLeft: '3px solid var(--cr-red)', 
                      borderRadius: 'var(--radius)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className="badge" style={{ fontSize: '0.7rem', padding: '1px 5px', background: 'rgba(225, 39, 62, 0.15)', color: 'var(--cr-red)', fontWeight: 'bold' }}>{m.type}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        Time: {formatTime(m.time)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{m.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(74, 222, 128, 0.05)', borderLeft: '4px solid #22c55e', padding: '1rem', borderRadius: '4px', color: '#a7f3d0' }}>
                <CheckCircle size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem' }}>No tactical mistakes detected! Exceptional gameplay pacing.</span>
              </div>
            )}
          </div>

          {/* Coach Tips Panel */}
          <div className="cr-panel">
            <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1.25rem -1.5rem' }}>
              <span className="cr-panel-title">Improvement Drills</span>
              <span className="cr-league-badge cr-badge-master">DRILLS</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.tips.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div 
                    style={{ 
                      background: 'var(--secondary)', 
                      color: 'var(--foreground)', 
                      border: '1px solid var(--border)',
                      borderRadius: '50%', 
                      width: '20px', 
                      height: '20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {idx + 1}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
