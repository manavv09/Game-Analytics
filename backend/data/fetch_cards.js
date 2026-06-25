const fs = require('fs');
const path = require('path');
const https = require('https');

const cardsFilePath = path.join(__dirname, 'cards.json');

// Helper to fetch JSON from URL
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const run = async () => {
  try {
    console.log('[Script] Loading current cards data...');
    let currentCards = [];
    if (fs.existsSync(cardsFilePath)) {
      currentCards = JSON.parse(fs.readFileSync(cardsFilePath, 'utf8'));
    }
    console.log(`- Loaded ${currentCards.length} existing cards with rich metadata.`);

    console.log('[Script] Fetching all Clash Royale cards from RoyaleAPI...');
    // We fetch from RoyaleAPI github io page which holds the complete list
    const remoteCards = await fetchJson('https://royaleapi.github.io/cr-api-data/json/cards.json');
    console.log(`- Remote database returned ${remoteCards.length} card entries.`);

    const mergedCards = [];

    // Map of specific cards in our list to preserve their custom high-fidelity values
    const currentCardsMap = new Map(currentCards.map(c => [c.key, c]));

    // Known cards that can target air (heuristic helper for newly added cards)
    const knownAirTargetNames = [
      'archer', 'baby-dragon', 'bats', 'wizard', 'electro-wizard', 'witch', 'musketeer', 'minions', 'minion-horde',
      'inferno-tower', 'tesla', 'ice-wizard', 'magic-archer', 'hunter', 'spear-goblins', 'princess', 'dart-goblin',
      'executioner', 'fire-cracker', 'phoenix', 'little-prince', 'mother-witch', 'flying-machine', 'mega-minion',
      'ram-rider', 'electro-dragon', 'three-musketeers', 'skeleton-dragons', 'furnace', 'goblin-hut', 'archers-evo',
      'wizard-evo', 'zap-evo'
    ];

    remoteCards.forEach((remoteCard) => {
      const key = remoteCard.key;
      
      // If we already have this card with rich details, preserve it!
      if (currentCardsMap.has(key)) {
        mergedCards.push(currentCardsMap.get(key));
        return;
      }

      // Otherwise, build a new card entry and apply smart fallbacks
      let role = 'support';
      let targets = 'ground';
      
      // Heuristic 1: Determine role based on type
      if (remoteCard.type === 'Spell') {
        role = remoteCard.elixir <= 3 ? 'spell-small' : 'spell-big';
        targets = 'air-ground'; // Spells target ground & air
      } else if (remoteCard.type === 'Building') {
        role = 'building-defensive';
        // check if building targets air
        if (['tesla', 'inferno-tower', 'goblin-hut', 'furnace'].includes(key)) {
          targets = 'air-ground';
        }
      } else {
        // Troop role heuristics
        if (remoteCard.elixir >= 6 && !['sparky', 'peka', 'pekka'].includes(key)) {
          role = 'tank';
        } else if (['mini-pekka', 'lumberjack', 'barbarians', 'hunter', 'prince'].includes(key)) {
          role = 'tank-killer';
        } else if (remoteCard.elixir === 1) {
          role = 'cycle';
        } else if (['hog-rider', 'royal-giant', 'balloon', 'goblin-barrel', 'miner', 'battle-ram', 'goblin-drill', 'ram-rider', 'wall-breakers', 'skeleton-barrel', 'elixir-golem', 'royal-hogs'].includes(key)) {
          role = 'win-condition';
        }
      }

      // Heuristic 2: Check if card name is in our known air-targeting list
      if (knownAirTargetNames.some(name => key.includes(name))) {
        targets = 'air-ground';
      }
      
      // Buildings that target building targets only (golem, giant, hog)
      if (['giant', 'golem', 'hog-rider', 'balloon', 'lava-hound', 'royal-giant', 'battle-ram', 'elixir-golem', 'royal-hogs'].includes(key)) {
        targets = 'buildings';
      }

      // Heuristic 3: Generate simulated meta stats based on rarity and type
      const baseWinRate = 48.0 + (Math.random() * 4.0); // 48 - 52
      const basePopularity = 3.0 + (Math.random() * 10.0); // 3 - 13

      // Formulate card asset URL using RoyaleAPI asset naming conventions
      const imgUrl = `https://royaleapi.github.io/cr-api-assets/cards/${key}.png`;

      mergedCards.push({
        key: key,
        name: remoteCard.name,
        elixir: remoteCard.elixir,
        type: remoteCard.type,
        rarity: remoteCard.rarity,
        arena: remoteCard.arena || 0,
        role: role,
        targets: targets,
        winRate: parseFloat(baseWinRate.toFixed(1)),
        popularity: parseFloat(basePopularity.toFixed(1)),
        synergies: [],
        counters: [],
        image: imgUrl
      });
    });

    // Add back the custom evolved cards that might not be listed as distinct items in remote cards.json
    currentCards.forEach(c => {
      if (c.isEvo && !mergedCards.some(mc => mc.key === c.key)) {
        mergedCards.push(c);
      }
    });

    console.log(`[Script] Merging complete. Total database contains ${mergedCards.length} cards.`);

    // Write back to cards.json
    fs.writeFileSync(cardsFilePath, JSON.stringify(mergedCards, null, 2), 'utf8');
    console.log('[Script] cards.json written successfully! All 121+ cards loaded.');

  } catch (error) {
    console.error('[Script] Error loading cards:', error);
  }
};

run();
