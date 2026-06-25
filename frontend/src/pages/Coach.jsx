import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle, RefreshCw, Crown, Sparkles } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";

export default function Coach({ proMode, sharedDeck, cards }) {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState("overcommit-fail");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [simRunning, setSimRunning] = useState(false);
  const [simOutcome, setSimOutcome] = useState(null);
  const [simUnits, setSimUnits] = useState([]);
  const [simPopups, setSimPopups] = useState([]);
  const [simLogs, setSimLogs] = useState([]);
  const [simTowers, setSimTowers] = useState({ blueKing: 4000, blueLeft: 2500, blueRight: 2500, redKing: 4000, redLeft: 2500, redRight: 2500 });

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
    setSimRunning(true); setSimOutcome(null);
    setSimLogs(["[System] Initializing Battle Arena Grid...", "[System] Decks verified. Loading troops..."]);
    setSimPopups([]);
    setSimTowers({ blueKing: 4000, blueLeft: 2500, blueRight: 2500, redKing: 4000, redLeft: 2500, redRight: 2500 });
    const playerDeck = sharedDeck?.slice(0, 4) || ["hog-rider", "musketeer", "knight", "skeletons"];
    const opponentDeck = OPPONENT_DECKS[selectedOpponentPreset].slice(0, 4);
    const initialUnits = [];
    playerDeck.forEach((key, idx) => {
      const stats = getUnitStats(key);
      const lane = idx % 2 === 0 ? 'left' : 'right';
      initialUnits.push({ id: `blue-${idx}-${Date.now()}`, side: 'blue', name: stats.name, x: lane === 'left' ? 22 : 78, y: 80 + idx * 3, hp: stats.hp, maxHp: stats.maxHp, damage: stats.damage, image: stats.image, lane, status: 'walking' });
    });
    opponentDeck.forEach((key, idx) => {
      const stats = getUnitStats(key);
      const lane = idx % 2 === 0 ? 'left' : 'right';
      initialUnits.push({ id: `red-${idx}-${Date.now()}`, side: 'red', name: stats.name, x: lane === 'left' ? 22 : 78, y: 20 - idx * 3, hp: stats.hp, maxHp: stats.maxHp, damage: stats.damage, image: stats.image, lane, status: 'walking' });
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
        if (simTowers.redKing <= 0) { setSimOutcome('victory'); setSimRunning(false); setSimLogs(logs => [...logs, "[Victory] Red King Tower destroyed! VICTORY!"]); clearInterval(interval); return []; }
        if (simTowers.blueKing <= 0) { setSimOutcome('defeat'); setSimRunning(false); setSimLogs(logs => [...logs, "[Defeat] Blue King Tower destroyed! DEFEAT!"]); clearInterval(interval); return []; }
        if (tickCount >= maxTicks || (!blueLeft && !redLeft)) {
          if (simTowers.redLeft < simTowers.blueLeft) { setSimOutcome('victory'); setSimLogs(logs => [...logs, "[Arena] Match ended. Blue holds health advantage. Victory!"]); }
          else { setSimOutcome('defeat'); setSimLogs(logs => [...logs, "[Arena] Match ended. Red holds health advantage. Defeat!"]); }
          setSimRunning(false); clearInterval(interval); return [];
        }
        const nextUnits = prevUnits.map(unit => {
          if (unit.hp <= 0) return null;
          const enemies = prevUnits.filter(e => e.side !== unit.side && e.hp > 0);
          let target = null, minDist = 999;
          enemies.forEach(enemy => { const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y); if (dist < minDist) { minDist = dist; target = enemy; } });
          if (target && minDist < 8) { target.hp -= unit.damage; setSimPopups(pops => [...pops, { id: Math.random().toString(), x: target.x, y: target.y, text: `-${unit.damage}`, type: 'normal' }]); setSimLogs(logs => [...logs, `[Combat] ${unit.name} strikes ${target.name} for ${unit.damage}!`]); return { ...unit, status: 'attacking' }; }
          let towerTarget = null;
          if (unit.side === 'blue') { const ld = Math.hypot(22 - unit.x, 20 - unit.y), rd = Math.hypot(78 - unit.x, 20 - unit.y), kd = Math.hypot(50 - unit.x, 10 - unit.y); if (kd < 10) towerTarget = 'redKing'; else if (ld < 10) towerTarget = 'redLeft'; else if (rd < 10) towerTarget = 'redRight'; }
          else { const ld = Math.hypot(22 - unit.x, 80 - unit.y), rd = Math.hypot(78 - unit.x, 80 - unit.y), kd = Math.hypot(50 - unit.x, 90 - unit.y); if (kd < 10) towerTarget = 'blueKing'; else if (ld < 10) towerTarget = 'blueLeft'; else if (rd < 10) towerTarget = 'blueRight'; }
          if (towerTarget && simTowers[towerTarget] > 0) { setSimTowers(towers => { const n = { ...towers }; n[towerTarget] = Math.max(0, n[towerTarget] - unit.damage); return n; }); setSimPopups(pops => [...pops, { id: Math.random().toString(), x: unit.side === 'blue' ? (towerTarget === 'redLeft' ? 22 : towerTarget === 'redRight' ? 78 : 50) : (towerTarget === 'blueLeft' ? 22 : towerTarget === 'blueRight' ? 78 : 50), y: unit.side === 'blue' ? (towerTarget === 'redKing' ? 10 : 20) : (towerTarget === 'blueKing' ? 90 : 80), text: `-${unit.damage}`, type: 'normal' }]); setSimLogs(logs => [...logs, `[Tower] ${unit.name} hits Opponent Tower for ${unit.damage}!`]); return { ...unit, status: 'attacking' }; }
          let nextX = unit.x, nextY = unit.y;
          if (unit.side === 'blue') { if (unit.y > 50) { nextY -= 4; } else { nextX = nextX + ((unit.lane === 'left' ? 22 : 78) - nextX) * 0.2; nextY -= 4; } }
          else { if (unit.y < 50) { nextY += 4; } else { nextX = nextX + ((unit.lane === 'left' ? 22 : 78) - nextX) * 0.2; nextY += 4; } }
          return { ...unit, x: nextX, y: nextY, status: 'walking' };
        }).filter(Boolean);
        return nextUnits;
      });
      setTimeout(() => setSimPopups(pops => pops.slice(1)), 500);
    }, 550);
    return () => clearInterval(interval);
  }, [simRunning, simTowers]);

  useEffect(() => {
    fetch(`${API_BASE}/coach/presets`).then(res => res.json()).then(data => { setPresets(data); if (data.length > 0) setSelectedPreset(data[0].key); setLoading(false); }).catch(err => { console.error("Error fetching presets:", err); setLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedPreset) {
      setAnalyzing(true);
      fetch(`${API_BASE}/coach/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presetKey: selectedPreset }) })
        .then(res => res.json()).then(data => { setResults(data); setAnalyzing(false); }).catch(err => { console.error("Error analyzing replay:", err); setAnalyzing(false); });
    }
  }, [selectedPreset]);

  const formatTime = (secs) => { const m = Math.floor(secs / 60), s = secs % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; };

  if (loading) return <p className="text-zinc-400 text-center py-16">Synchronizing coaching modules...</p>;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
            style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
          Training Camp (AI Coach)
        </h1>
        <p className="text-zinc-400 text-sm">Upload simulated match replay logs and get a frame-by-frame resource telemetry report, waste calculations, mistake tags, and personalized coaching drills.</p>
      </div>

      {/* Pro Mode Battle Simulator */}
      {proMode && (
        <div className={panel} style={{ borderColor: 'var(--cr-gold)' }}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-6">
            <span className="font-extrabold text-base text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>
              🏟️ Interactive Arena Battle Simulator
            </span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">PRO SIMULATOR</span>
          </div>

          <p className="text-[0.85rem] text-zinc-400 mb-5">Unleash your active battle deck against an AI preset opponent. Watch units deploy, cross the bridges, and engage in real-time tower combat.</p>

          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Arena board */}
            <div className="relative w-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800" style={{ aspectRatio: '3/4' }}>
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
              {/* River */}
              <div className="absolute left-0 right-0 bg-[#0c0f1d] border-t border-b border-dashed border-zinc-800" style={{ top: '46%', height: '8%' }} />
              {/* Bridges */}
              <div className="absolute w-[10%] bg-zinc-800 border border-zinc-700 rounded-sm" style={{ left: '17%', top: '44%', height: '12%' }} />
              <div className="absolute w-[10%] bg-zinc-800 border border-zinc-700 rounded-sm" style={{ left: '73%', top: '44%', height: '12%' }} />

              {/* Towers */}
              {simTowers.redKing > 0 && <div className="absolute text-[0.6rem] text-red-200 bg-red-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ top: '5%', left: '50%', transform: 'translateX(-50%)', opacity: simTowers.redKing / 4000 }}>👑 {simTowers.redKing}</div>}
              {simTowers.redLeft > 0 && <div className="absolute text-[0.6rem] text-red-200 bg-red-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ top: '12%', left: '15%', opacity: simTowers.redLeft / 2500 }}>🏹 {simTowers.redLeft}</div>}
              {simTowers.redRight > 0 && <div className="absolute text-[0.6rem] text-red-200 bg-red-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ top: '12%', right: '15%', opacity: simTowers.redRight / 2500 }}>🏹 {simTowers.redRight}</div>}
              {simTowers.blueKing > 0 && <div className="absolute text-[0.6rem] text-blue-200 bg-blue-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)', opacity: simTowers.blueKing / 4000 }}>👑 {simTowers.blueKing}</div>}
              {simTowers.blueLeft > 0 && <div className="absolute text-[0.6rem] text-blue-200 bg-blue-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ bottom: '12%', left: '15%', opacity: simTowers.blueLeft / 2500 }}>🏹 {simTowers.blueLeft}</div>}
              {simTowers.blueRight > 0 && <div className="absolute text-[0.6rem] text-blue-200 bg-blue-900 border border-zinc-700 rounded px-1 py-0.5 text-center" style={{ bottom: '12%', right: '15%', opacity: simTowers.blueRight / 2500 }}>🏹 {simTowers.blueRight}</div>}

              {/* Units */}
              {simUnits.map(unit => (
                <div key={unit.id} title={unit.name}
                     className={`absolute w-8 h-8 rounded-full bg-cover bg-center border-[1.5px] shadow-md ${unit.side === 'blue' ? 'border-blue-400 shadow-blue-400/40' : 'border-red-400 shadow-red-400/40'}`}
                     style={{ top: `${unit.y}%`, left: `${unit.x}%`, transform: 'translate(-50%,-50%)', backgroundImage: `url(${unit.image})` }}>
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${unit.side === 'blue' ? 'bg-blue-400' : 'bg-red-400'}`} style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} />
                  </div>
                </div>
              ))}

              {/* Damage popups */}
              {simPopups.map(pop => (
                <div key={pop.id} className="absolute text-[0.7rem] font-bold text-red-400 pointer-events-none" style={{ top: `${pop.y - 4}%`, left: `${pop.x}%`, transform: 'translate(-50%,-50%)' }}>{pop.text}</div>
              ))}

              {/* Outcome overlay */}
              {simOutcome && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center anim-pop-in">
                  <div className="text-center border rounded-lg p-8 bg-white/[.04] backdrop-blur-md" style={{ borderColor: 'var(--cr-gold)' }}>
                    <h2 className="text-[2rem] mb-2" style={{ color: simOutcome === 'victory' ? 'var(--cr-gold)' : 'var(--cr-red)' }}>
                      {simOutcome === 'victory' ? '🏆 VICTORY 🏆' : '💀 DEFEAT 💀'}
                    </h2>
                    <p className="text-[0.9rem] text-white mb-4">{simOutcome === 'victory' ? 'Opponent King Tower destroyed!' : 'Your King Tower has collapsed!'}</p>
                    <button onClick={() => setSimOutcome(null)} className="bg-zinc-800 text-zinc-50 border border-zinc-700 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">Dismiss</button>
                  </div>
                </div>
              )}
            </div>

            {/* Console */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/[.04] border border-zinc-800 rounded-lg p-4">
                <span className="text-[0.8rem] text-zinc-400">SELECT OPPONENT ARCHETYPE</span>
                <select value={selectedOpponentPreset} onChange={(e) => setSelectedOpponentPreset(e.target.value)} disabled={simRunning} className="w-full mt-1" style={{ padding: '.5rem', fontSize: '.85rem' }}>
                  <option value="pekka">Pekka Bridge Spam (Aggressive)</option>
                  <option value="golem">Golem Beatdown (Heavy Tank)</option>
                  <option value="hog">Hog 2.6 Cycle (Fast Cycle)</option>
                </select>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-[0.72rem] text-zinc-400 min-h-[100px] max-h-[150px] overflow-y-auto">
                {simLogs.slice(-6).map((log, idx) => (
                  <div key={idx} className={log.startsWith('[Victory]') ? 'text-yellow-400' : log.startsWith('[Defeat]') ? 'text-red-400' : log.startsWith('[Tower]') ? 'text-blue-400' : ''}>{log}</div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={startSimulation} disabled={simRunning} className="flex-1 justify-center bg-white text-zinc-950 font-medium text-sm py-2 rounded-lg cursor-pointer hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {simRunning ? 'Battle Simulating...' : '⚔️ Start Battle Simulation'}
                </button>
                {simRunning && (
                  <button onClick={() => { setSimRunning(false); setSimUnits([]); setSimOutcome(null); }} className="bg-zinc-800 text-zinc-50 border border-zinc-700 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">
                    End
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replay selector + grade */}
      <div className="grid gap-6 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className={`${panel} min-h-[250px]`}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Match Telemetry Log</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border border-zinc-800 bg-white/[.03] text-zinc-400">REPLAYS</span>
          </div>
          <p className="text-[0.85rem] text-zinc-400 mb-5">Select one of the pre-loaded match replay recordings below to analyze telemetry curves.</p>
          <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)} className="w-full mb-6" style={{ padding: '.75rem 1rem' }}>
            {presets.map(p => <option key={p.key} value={p.key}>{p.name} ({p.outcome})</option>)}
          </select>
          {results && (
            <div className="flex flex-col gap-3 text-[0.85rem]">
              {[
                ['Elixir Spent (Player)', `${results.totalSpent} Elixir`, 'text-white'],
                ['Elixir Leaked (Player)', `${results.totalLeaked} Elixir`, results.totalLeaked > 3 ? 'text-red-400' : 'text-green-400'],
                ['Opponent Elixir Leaked', `${results.opponentLeaked} Elixir`, 'text-white'],
              ].map(([lbl, val, cls]) => (
                <div key={lbl} className="flex justify-between px-2 py-2 bg-white/[.02] border border-zinc-800 rounded-lg">
                  <span className="text-zinc-400">{lbl}</span>
                  <span className={`font-bold ${cls}`}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {results && (
          <div className={`${panel} flex flex-col items-center justify-center text-center min-h-[290px]`}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 px-5 py-3 mb-4 w-full" style={{ marginTop: '-1.25rem' }}>
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Resource Efficiency</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">GRADE</span>
            </div>
            <div className="w-[90px] h-[90px] rounded-full bg-white/[.02] border-2 flex items-center justify-center mb-2" style={{ borderColor: 'var(--cr-gold)' }}>
              <span className="text-[3rem] font-bold text-white leading-none">{results.grade}</span>
            </div>
            <div className="text-[1.25rem] font-bold text-white">{results.efficiency}% Efficiency</div>
            <p className="text-[0.8rem] text-zinc-400 mt-1 max-w-[240px] leading-snug">Percentage of generated elixir successfully deployed onto the field.</p>
          </div>
        )}
      </div>

      {/* Telemetry chart */}
      {analyzing ? (
        <div className={`${panel} py-16 text-center text-zinc-400`}>
          <RefreshCw className="mx-auto mb-4 animate-spin" />
          <p>Processing replay telemetry log...</p>
        </div>
      ) : results ? (
        <div className={panel}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Elixir Flow Telemetry Curve</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">FLOW</span>
          </div>
          <div style={{ width: '100%', height: '350px', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={results.timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlayer" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cr-elixir)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--cr-elixir)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} tickFormatter={formatTime} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 10]} tickCount={6} label={{ value: 'Elixir Level', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 11 }, offset: 10 }} />
                <Tooltip labelFormatter={(label) => `Time: ${formatTime(label)}`} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="playerElixir" name="Player Elixir" stroke="var(--cr-elixir)" fillOpacity={1} fill="url(#colorPlayer)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="opponentElixir" name="Opponent Elixir" stroke="#00b0ff" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* Mistakes + drills */}
      {results && (
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-5">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Tactical Mistakes Detected</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-red-400 bg-red-400/5 border-red-400/20">ERRORS</span>
            </div>
            {results.mistakes.length > 0 ? (
              <div className="flex flex-col gap-4">
                {results.mistakes.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-lg border-l-[3px] border-red-500" style={{ background: 'rgba(239,68,68,.03)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[0.7rem] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{m.type}</span>
                      <span className="text-[0.75rem] text-zinc-400 font-bold">Time: {formatTime(m.time)}</span>
                    </div>
                    <p className="text-[0.8rem] text-zinc-300 leading-snug">{m.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-400/5 border-l-4 border-green-500 p-4 rounded text-emerald-200">
                <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                <span className="text-[0.85rem]">No tactical mistakes detected! Exceptional gameplay pacing.</span>
              </div>
            )}
          </div>

          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-5">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Improvement Drills</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-orange-400 bg-orange-500/5 border-orange-500/20">DRILLS</span>
            </div>
            <div className="flex flex-col gap-4">
              {results.tips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[0.75rem] font-bold text-white">{idx + 1}</div>
                  <p className="text-[0.85rem] text-zinc-400 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
