const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const cardsFilePath = path.join(__dirname, '../data/cards.json');

const getCards = () => {
  return JSON.parse(fs.readFileSync(cardsFilePath, 'utf8'));
};

// Main deck analyzer logic
const performAnalysis = (deckKeys) => {
  const cardsDb = getCards();
  
  // Resolve deck keys to card objects
  const deck = deckKeys
    .map(key => cardsDb.find(c => c.key.toLowerCase() === key.toLowerCase()))
    .filter(Boolean);

  if (deck.length === 0) {
    return { error: 'Invalid or empty deck.' };
  }

  // 1. Average Elixir
  const totalElixir = deck.reduce((sum, c) => sum + c.elixir, 0);
  const averageElixir = parseFloat((totalElixir / deck.length).toFixed(2));

  // 2. Card Types Breakdown
  const troopCount = deck.filter(c => c.type === 'Troop').length;
  const spellCount = deck.filter(c => c.type === 'Spell').length;
  const buildingCount = deck.filter(c => c.type === 'Building').length;

  // 3. Archetype Checklist / Role Counts
  const winConditions = deck.filter(c => c.role === 'win-condition');
  const tankKillers = deck.filter(c => c.role === 'tank-killer');
  const airDefense = deck.filter(c => c.targets === 'air-ground');
  const smallSpells = deck.filter(c => c.role === 'spell-small');
  const bigSpells = deck.filter(c => c.role === 'spell-big');
  const splashers = deck.filter(c => ['support', 'tank'].includes(c.role) && ['wizard', 'valkyrie', 'baby-dragon', 'bomber', 'mega-knight', 'giant-skeleton', 'dark-prince', 'executioner', 'bowler', 'ice-wizard'].includes(c.key));

  const checklist = {
    winCondition: { met: winConditions.length > 0, count: winConditions.length },
    tankKiller: { met: tankKillers.length > 0 || deck.some(c => c.key === 'inferno-tower'), count: tankKillers.length },
    airDefense: { met: airDefense.length >= 2, count: airDefense.length }, // recommend at least 2 air defense
    smallSpell: { met: smallSpells.length > 0, count: smallSpells.length },
    bigSpell: { met: bigSpells.length > 0, count: bigSpells.length }
  };

  // 4. Synergy Calculation
  // Find overlaps between each card's synergy list and other cards in the deck
  let synergyPairs = 0;
  const synergyDetails = [];
  
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      const cardA = deck[i];
      const cardB = deck[j];
      
      const aSynergizesWithB = cardA.synergies && cardA.synergies.includes(cardB.key);
      const bSynergizesWithA = cardB.synergies && cardB.synergies.includes(cardA.key);
      
      if (aSynergizesWithB || bSynergizesWithA) {
        synergyPairs++;
        synergyDetails.push(`${cardA.name} + ${cardB.name}`);
      }
    }
  }

  // Compute a synergy score (out of 100)
  let baseSynergy = 50 + (synergyPairs * 8);
  if (winConditions.length === 0) baseSynergy -= 15;
  if (airDefense.length < 2) baseSynergy -= 10;
  if (smallSpells.length === 0 && bigSpells.length === 0) baseSynergy -= 10;
  if (averageElixir > 4.5 || averageElixir < 2.6) baseSynergy -= 10;
  
  const synergyScore = Math.max(10, Math.min(100, baseSynergy));

  // 5. Strength Meters (0-10)
  // Defense Score
  let defenseScore = 2; // base
  if (buildingCount > 0) defenseScore += 2;
  if (tankKillers.length > 0) defenseScore += 2;
  if (airDefense.length >= 2) defenseScore += 2;
  if (smallSpells.length > 0) defenseScore += 1;
  if (splashers.length > 0) defenseScore += 1;
  defenseScore = Math.min(10, defenseScore);

  // Offense Score
  let offenseScore = 2; // base
  if (winConditions.length > 0) offenseScore += 3;
  if (winConditions.length > 1) offenseScore += 1; // dual threat
  if (deck.some(c => ['hog-rider', 'bandit', 'battle-ram', 'prince', 'goblin-barrel'].includes(c.key))) offenseScore += 2; // bridge pressure
  if (bigSpells.length > 0) offenseScore += 2;
  offenseScore = Math.min(10, offenseScore);

  // Versatility Score
  const uniqueRoles = new Set(deck.map(c => c.role));
  let versatilityScore = Math.round((uniqueRoles.size / 7) * 10); // scale roles out of 7 major types
  versatilityScore = Math.max(1, Math.min(10, versatilityScore));

  // Synergy Rating
  const synergyRating = Math.round(synergyScore / 10);

  // 6. Strengths and Weaknesses textual descriptions
  const strengths = [];
  const weaknesses = [];

  if (checklist.winCondition.met) {
    strengths.push({
      title: 'Active Win Condition',
      desc: `Your deck features ${winConditions.map(c => c.name).join(', ')} to reliably damage enemy towers.`
    });
  } else {
    weaknesses.push({
      title: 'No Win Condition',
      desc: 'Your deck lacks a primary win-condition card. You will struggle to break through strong defenses.'
    });
  }

  if (checklist.airDefense.met) {
    strengths.push({
      title: 'Solid Air Defense',
      desc: `You have ${airDefense.length} cards capable of targeting air units, protecting you from Balloon/Lava Hound pushes.`
    });
  } else {
    weaknesses.push({
      title: 'Weak Air Defense',
      desc: 'You have fewer than 2 air defense units. A heavy air push will easily overwhelm your defense.'
    });
  }

  if (splashers.length >= 2) {
    strengths.push({
      title: 'High Splash Damage',
      desc: 'Excellent capability to clear out enemy swarms (Skeleton Army, Minion Horde, Goblins) with multiple splashers.'
    });
  } else if (splashers.length === 0 && !checklist.smallSpell.met) {
    weaknesses.push({
      title: 'Vulnerable to Swarms',
      desc: 'You have no splash-damage units and no cheap spells. Swarm cards will easily overwhelm you.'
    });
  }

  if (tankKillers.length > 0) {
    strengths.push({
      title: 'Strong Tank Killer',
      desc: 'You possess high single-target DPS cards to quickly neutralize tanks like Giant, Golem, or Mega Knight.'
    });
  } else {
    weaknesses.push({
      title: 'No Heavy Tank Killer',
      desc: 'You lack a high DPS ground unit. You will struggle against high-HP giants and golems.'
    });
  }

  if (checklist.smallSpell.met && checklist.bigSpell.met) {
    strengths.push({
      title: 'Double Spell Support',
      desc: 'Having both small and big spells provides great tactical control, letting you clear swarms and damage buildings.'
    });
  } else {
    if (!checklist.smallSpell.met) {
      weaknesses.push({
        title: 'No Small Spell',
        desc: 'Without a cheap spell (Log/Zap), you cannot react quickly to low-HP threat cards like Goblin Barrel.'
      });
    }
    if (!checklist.bigSpell.met) {
      weaknesses.push({
        title: 'No Heavy Spell',
        desc: 'Lacking a big spell (Fireball/Poison) makes it hard to destroy back-line support troops or finish off damaged towers.'
      });
    }
  }

  if (averageElixir < 3.0) {
    strengths.push({
      title: 'Fast Cycle Speed',
      desc: 'Your average elixir is low, allowing you to cycle back to your key cards and out-pace your opponent.'
    });
  } else if (averageElixir > 4.2) {
    weaknesses.push({
      title: 'Heavy Elixir Curve',
      desc: 'Your average elixir is very high. You will be vulnerable to fast counter-pushes if you overcommit.'
    });
  }

  return {
    averageElixir,
    breakdown: {
      troops: troopCount,
      spells: spellCount,
      buildings: buildingCount
    },
    checklist,
    metrics: {
      defense: defenseScore,
      offense: offenseScore,
      versatility: versatilityScore,
      synergy: synergyRating
    },
    synergyScore,
    synergyPairs,
    synergyDetails,
    strengths,
    weaknesses
  };
};

// Route: Analyze a full deck
router.post('/', (req, res) => {
  const { deck } = req.body;
  if (!deck || !Array.isArray(deck) || deck.length !== 8) {
    return res.status(400).json({ error: 'Please provide a valid deck containing exactly 8 cards.' });
  }

  const analysis = performAnalysis(deck);
  res.json(analysis);
});

// Route: Suggest replacements for a specific card in a deck
router.post('/suggest', (req, res) => {
  const { deck, cardToReplace } = req.body;
  if (!deck || !Array.isArray(deck) || deck.length !== 8) {
    return res.status(400).json({ error: 'Please provide a valid deck containing exactly 8 cards.' });
  }
  if (!cardToReplace) {
    return res.status(400).json({ error: 'Please specify which card to replace.' });
  }

  try {
    const cardsDb = getCards();
    const currentAnalysis = performAnalysis(deck);

    // Verify cardToReplace is actually in the deck
    const replaceIndex = deck.findIndex(k => k.toLowerCase() === cardToReplace.toLowerCase());
    if (replaceIndex === -1) {
      return res.status(400).json({ error: `Card '${cardToReplace}' is not in the provided deck.` });
    }

    const replacedCardObj = cardsDb.find(c => c.key === cardToReplace);
    if (!replacedCardObj) {
      return res.status(400).json({ error: 'Replaced card not found in database.' });
    }

    const remainingDeck = deck.filter((_, idx) => idx !== replaceIndex);
    const candidates = [];

    // Score all cards not currently in the deck
    cardsDb.forEach(candidate => {
      // Don't suggest cards already in the deck
      if (deck.includes(candidate.key)) return;

      const testDeck = [...remainingDeck, candidate.key];
      const testAnalysis = performAnalysis(testDeck);

      // Scoring model
      let score = 0;

      // 1. Synergy Change
      const synergyDiff = testAnalysis.synergyScore - currentAnalysis.synergyScore;
      score += synergyDiff * 1.5;

      // 2. Role Preservation / Role Improvement
      // If we replaced a critical role, does the candidate fill it?
      const wasWinCondition = replacedCardObj.role === 'win-condition';
      const wasAirDefense = replacedCardObj.targets === 'air-ground';
      const wasSpell = replacedCardObj.type === 'Spell';
      
      const newWinConditions = testDeck.map(k => cardsDb.find(c => c.key === k)).filter(c => c && c.role === 'win-condition');
      const newAirDefense = testDeck.map(k => cardsDb.find(c => c.key === k)).filter(c => c && c.targets === 'air-ground');
      
      if (wasWinCondition && candidate.role === 'win-condition') score += 40;
      if (wasAirDefense && candidate.targets === 'air-ground') score += 25;
      if (wasSpell && candidate.type === 'Spell') score += 25;

      // If current deck lacks win condition, and candidate IS a win condition:
      if (currentAnalysis.checklist.winCondition.count === 0 && candidate.role === 'win-condition') score += 50;
      // If current deck lacks air defense, and candidate IS air defense:
      if (currentAnalysis.checklist.airDefense.count < 2 && candidate.targets === 'air-ground') score += 35;
      // If current deck lacks small spell, and candidate is small spell:
      if (currentAnalysis.checklist.smallSpell.count === 0 && candidate.role === 'spell-small') score += 35;

      // 3. Elixir Sweet Spot Penalty
      // Reward candidates that push average elixir towards a healthy 3.2 - 3.8 range
      const diffFromTarget = Math.abs(testAnalysis.averageElixir - 3.4);
      score += (1.5 - diffFromTarget) * 10;

      // 4. Base Stats
      score += (candidate.winRate - 50) * 2;
      score += candidate.popularity * 0.2;

      // Create reasoning message
      let reason = '';
      if (candidate.role === replacedCardObj.role) {
        reason = `Matches the '${candidate.role}' role. `;
      }
      
      // Check direct synergies
      const newSynergiesWithOtherCards = candidate.synergies.filter(k => remainingDeck.includes(k));
      if (newSynergiesWithOtherCards.length > 0) {
        reason += `Synergizes well with ${newSynergiesWithOtherCards.map(k => cardsDb.find(c => c.key === k)?.name).join(', ')}. `;
      }

      if (candidate.elixir < replacedCardObj.elixir) {
        reason += `Lowers average elixir by ${(replacedCardObj.elixir - candidate.elixir) / 8} to speed up your cycles.`;
      } else if (candidate.elixir > replacedCardObj.elixir) {
        reason += `Adds more bulk/power to your deck (+${(candidate.elixir - replacedCardObj.elixir) / 8} avg elixir).`;
      } else {
        reason += `Keeps average elixir the same while offering different utility.`;
      }

      candidates.push({
        card: candidate,
        score: Math.round(score),
        projectedSynergy: testAnalysis.synergyScore,
        projectedElixir: testAnalysis.averageElixir,
        reason
      });
    });

    // Sort by score descending and take top 3
    candidates.sort((a, b) => b.score - a.score);
    res.json(candidates.slice(0, 3));

  } catch (error) {
    res.status(500).json({ error: 'Server error during card replacement analysis.' });
  }
});

module.exports = router;
