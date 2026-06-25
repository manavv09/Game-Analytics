const express = require('express');
const router = express.Router();

// Preset match logs (representing a time-series log of card plays)
const presets = {
  'overcommit-fail': {
    name: 'Bridge Spam Overcommitment (Loss)',
    description: 'Analysis of a match where the player overcommitted at the bridge early on, leading to a negative elixir trade and counter-push.',
    events: [
      { time: 10, player: 'Player', card: 'pekka', cost: 7 },
      { time: 12, player: 'Opponent', card: 'skeleton-army', cost: 3 },
      { time: 15, player: 'Player', card: 'zap', cost: 2 },
      { time: 18, player: 'Opponent', card: 'hog-rider', cost: 4 },
      { time: 24, player: 'Player', card: 'valkyrie', cost: 4 },
      { time: 35, player: 'Player', card: 'bandit', cost: 3 },
      { time: 35, player: 'Player', card: 'battle-ram', cost: 4 }, // spamming both at once!
      { time: 37, player: 'Opponent', card: 'inferno-tower', cost: 5 }, // hard counters both
      { time: 50, player: 'Opponent', card: 'giant', cost: 5 },
      { time: 55, player: 'Player', card: 'mini-pekka', cost: 4 },
      { time: 58, player: 'Opponent', card: 'wizard', cost: 5 },
      { time: 70, player: 'Player', card: 'electro-wizard', cost: 4 },
      { time: 90, player: 'Player', card: 'bandit', cost: 3 },
      { time: 105, player: 'Opponent', card: 'hog-rider', cost: 4 }
    ],
    outcome: 'Loss'
  },
  'double-elixir-leak': {
    name: 'Golem Beatdown Defense Fail (Loss)',
    description: 'Analysis of a heavy Golem match where the player leaked significant elixir in the back and failed to defend a dual-lane push.',
    events: [
      { time: 15, player: 'Player', card: 'golem', cost: 8 }, // Golem in single elixir!
      { time: 16, player: 'Opponent', card: 'hog-rider', cost: 4 }, // opposite lane hog!
      { time: 18, player: 'Opponent', card: 'goblin-barrel', cost: 3 }, // double pressure
      { time: 22, player: 'Player', card: 'bomber', cost: 2 },
      { time: 35, player: 'Opponent', card: 'knight', cost: 3 },
      { time: 60, player: 'Player', card: 'night-witch', cost: 4 },
      // player sits at 10 elixir from 70 to 85 seconds (leaking!)
      { time: 85, player: 'Player', card: 'baby-dragon', cost: 4 },
      { time: 90, player: 'Opponent', card: 'inferno-tower', cost: 5 },
      { time: 120, player: 'Player', card: 'golem', cost: 8 }, // Double Elixir starts
      { time: 125, player: 'Player', card: 'lumberjack', cost: 4 },
      { time: 128, player: 'Opponent', card: 'skeleton-army', cost: 3 },
      { time: 135, player: 'Player', card: 'tornado', cost: 3 }
    ],
    outcome: 'Loss'
  },
  'flawless-cycle': {
    name: 'Hog 2.6 Cycle Masterclass (Win)',
    description: 'Perfect micro-defense and fast cycling. High elixir efficiency, zero leakage, and positive trades.',
    events: [
      { time: 5, player: 'Player', card: 'ice-spirit', cost: 1 },
      { time: 8, player: 'Player', card: 'skeletons', cost: 1 },
      { time: 12, player: 'Player', card: 'hog-rider', cost: 4 },
      { time: 14, player: 'Opponent', card: 'mini-pekka', cost: 4 },
      { time: 20, player: 'Opponent', card: 'giant', cost: 5 },
      { time: 25, player: 'Player', card: 'cannon', cost: 3 }, // perfect pull
      { time: 28, player: 'Player', card: 'musketeer', cost: 4 }, // support
      { time: 30, player: 'Player', card: 'knight', cost: 3 }, // tanking support
      { time: 42, player: 'Player', card: 'hog-rider', cost: 4 }, // cycled back!
      { time: 44, player: 'Opponent', card: 'skeleton-army', cost: 3 },
      { time: 45, player: 'Player', card: 'the-log', cost: 2 }, // instant prediction log!
      { time: 65, player: 'Player', card: 'musketeer', cost: 4 },
      { time: 80, player: 'Player', card: 'fireball', cost: 4 }
    ],
    outcome: 'Win'
  }
};

// GET all presets
router.get('/presets', (req, res) => {
  const list = Object.keys(presets).map(key => ({
    key,
    name: presets[key].name,
    description: presets[key].description,
    outcome: presets[key].outcome
  }));
  res.json(list);
});

// POST analyze replay log
router.post('/analyze', (req, res) => {
  let events = [];
  
  if (req.body.presetKey && presets[req.body.presetKey]) {
    events = presets[req.body.presetKey].events;
  } else if (req.body.events && Array.isArray(req.body.events)) {
    events = req.body.events;
  } else {
    return res.status(400).json({ error: 'Please provide a valid presetKey or a custom events array.' });
  }

  // Sort events by time just in case
  events.sort((a, b) => a.time - b.time);

  // Simulation parameters
  const matchDuration = 180; // 3 minutes
  const singleElixirRate = 2.8; // seconds per 1 elixir
  const doubleElixirRate = 1.4; // seconds per 1 elixir (starts at 120s)
  
  let playerElixir = 5.0; // start match at 5 elixir
  let opponentElixir = 5.0;
  
  let playerTotalSpent = 0;
  let opponentTotalSpent = 0;
  
  let playerLeaked = 0;
  let opponentLeaked = 0;
  
  let playerLastTime = 0;
  let opponentLastTime = 0;

  const timeline = [];
  const mistakes = [];

  // Initialize timeline data structure
  for (let t = 0; t <= matchDuration; t += 5) {
    timeline.push({ time: t, playerElixir: 5, opponentElixir: 5, events: [] });
  }

  // Helper to get generation speed
  const getElixirRate = (t) => (t >= 120 ? doubleElixirRate : singleElixirRate);

  // Simulate second by second to get accurate telemetry
  for (let second = 0; second <= matchDuration; second++) {
    // 1. Generate elixir
    if (second > 0) {
      const pRate = getElixirRate(second);
      
      // Player increment
      if (playerElixir < 10) {
        playerElixir += 1 / pRate;
        if (playerElixir > 10) playerElixir = 10;
      } else {
        // Leaking!
        playerLeaked += 1 / pRate;
      }

      // Opponent increment
      if (opponentElixir < 10) {
        opponentElixir += 1 / pRate;
        if (opponentElixir > 10) opponentElixir = 10;
      } else {
        opponentLeaked += 1 / pRate;
      }
    }

    // 2. Process events at this second
    const activeEvents = events.filter(e => e.time === second);
    activeEvents.forEach(e => {
      if (e.player === 'Player') {
        const cost = e.cost || 0;
        playerTotalSpent += cost;
        
        // Check if player overspent (shouldn't happen in a valid log, but safeguard)
        if (playerElixir < cost) {
          mistakes.push({
            time: second,
            type: 'Illegal Play',
            desc: `Played ${e.card} with insufficient elixir. Telemetry adjusted.`
          });
          playerElixir = 0;
        } else {
          playerElixir -= cost;
        }

        // Check for specific play mistakes
        // Mistake: Playing Skeletons/Skeleton Army on Valkyrie
        if (e.card === 'skeleton-army' && events.some(oppE => oppE.player === 'Opponent' && oppE.card === 'valkyrie' && second - oppE.time < 5)) {
          mistakes.push({
            time: second,
            type: 'Negative Interaction',
            desc: `Deployed Skeleton Army directly onto a Valkyrie (Splash damage counters swarms).`
          });
        }

        // Mistake: Golem play in single elixir when opponent has fast threat
        if (e.card === 'golem' && second < 120 && events.some(oppE => oppE.player === 'Opponent' && oppE.card === 'hog-rider' && Math.abs(second - oppE.time) < 8)) {
          mistakes.push({
            time: second,
            type: 'Bad Macro Play',
            desc: `Dropped Golem (8 Elixir) in single elixir. Opponent punished with opposite lane Hog Rider.`
          });
        }

        // Mistake: Double bridge spam into hard counter
        const nearEvents = events.filter(pe => pe.player === 'Player' && pe.time === second);
        if (nearEvents.length >= 2 && nearEvents.some(ne => ne.card === 'bandit') && nearEvents.some(ne => ne.card === 'battle-ram')) {
          const infernoEvent = events.find(oe => oe.player === 'Opponent' && oe.card === 'inferno-tower' && Math.abs(oe.time - second) < 5);
          if (infernoEvent) {
            mistakes.push({
              time: second,
              type: 'Overcommitment',
              desc: `Spammed Bandit + Battle Ram at the bridge, which was immediately countered by Opponent's Inferno Tower.`
            });
          }
        }
      } else {
        const cost = e.cost || 0;
        opponentTotalSpent += cost;
        if (opponentElixir < cost) {
          opponentElixir = 0;
        } else {
          opponentElixir -= cost;
        }
      }
    });

    // 3. Write data to timeline array (every 5 seconds)
    if (second % 5 === 0) {
      const idx = second / 5;
      if (timeline[idx]) {
        timeline[idx].playerElixir = parseFloat(playerElixir.toFixed(1));
        timeline[idx].opponentElixir = parseFloat(opponentElixir.toFixed(1));
        
        // Add events text
        activeEvents.forEach(ae => {
          timeline[idx].events.push(`${ae.player} played ${ae.card} (-${ae.cost})`);
        });
      }
    }
  }

  // Check for leakage mistakes post-simulation
  // Find stretches where player was at 10 elixir for > 3 seconds
  let leakDuration = 0;
  events.forEach((ev, idx) => {
    // Look at spacing between player plays
    const nextPlayerEvent = events.slice(idx + 1).find(e => e.player === 'Player');
    if (ev.player === 'Player' && nextPlayerEvent) {
      const delta = nextPlayerEvent.time - ev.time;
      const rate = getElixirRate(ev.time);
      const elixirGained = delta / rate;
      const remainingSpace = 10 - ev.cost; // approximate spacing
      
      if (elixirGained > remainingSpace + 3) {
        mistakes.push({
          time: ev.time + Math.round((remainingSpace) * rate),
          type: 'Elixir Leakage',
          desc: `Stood at maximum (10) elixir for several seconds before playing another card, wasting resources.`
        });
      }
    }
  });

  // Unique and sort mistakes by time
  const uniqueMistakes = Array.from(new Map(mistakes.map(m => [m.time + m.type, m])).values())
    .sort((a, b) => a.time - b.time);

  // Compute final scores
  const playerSpentVal = parseFloat(playerTotalSpent.toFixed(1));
  const playerLeakedVal = parseFloat(playerLeaked.toFixed(1));
  const efficiency = parseFloat(((playerSpentVal / (playerSpentVal + playerLeakedVal)) * 100).toFixed(1)) || 100.0;

  let grade = 'A';
  if (efficiency < 98) grade = 'A-';
  if (efficiency < 95) grade = 'B+';
  if (efficiency < 90) grade = 'B';
  if (efficiency < 85) grade = 'C';
  if (efficiency < 75) grade = 'D';
  if (efficiency < 60) grade = 'F';

  // Core tips
  const tips = [];
  if (playerLeakedVal > 3.0) {
    tips.push('Avoid idling at 10 Elixir: Clash Royale is a game of resource accumulation. Leaking even 2 elixir is equivalent to giving your opponent a free Goblin card.');
  }
  if (uniqueMistakes.some(m => m.type === 'Overcommitment')) {
    tips.push('Do not spam multiple single-target threats (like Bandit + Battle Ram) together if the opponent has an active splash unit or defensive building available. Support them with spells first.');
  }
  if (uniqueMistakes.some(m => m.type === 'Bad Macro Play')) {
    tips.push('Deploying slow, expensive win-conditions (like Golem) in single elixir leaves you defenseless. Save Golem pushes for Double Elixir (after the 2-minute mark) or when you have a clear resource lead.');
  }
  if (tips.length === 0) {
    tips.push('Excellent resource management! Maintain your defensive pacing and focus on predictive spell placements to punish the opponent.');
    tips.push('Try using cheap cycle cards (like Skeletons and Ice Spirit) to pull enemy heavy-hitters into range of both of your princess towers.');
  }
  tips.push('Analyze your opponent\'s card rotation. If they play their counter (e.g. Inferno Tower), you have a 4-card window where they cannot defend your next push with it.');

  res.json({
    grade,
    efficiency,
    totalSpent: playerSpentVal,
    totalLeaked: playerLeakedVal,
    opponentSpent: parseFloat(opponentTotalSpent.toFixed(1)),
    opponentLeaked: parseFloat(opponentLeaked.toFixed(1)),
    mistakes: uniqueMistakes,
    timeline,
    tips
  });
});

module.exports = router;
