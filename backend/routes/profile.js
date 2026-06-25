const express = require('express');
const router = express.Router();
const cardsDatabase = require('../data/cards.json');

// Helper to map Supercell expLevel to King Tower Level (introduced Oct 2022)
const getKingTowerLevel = (expLevel) => {
  if (expLevel >= 51) return 15;
  if (expLevel >= 42) return 14;
  if (expLevel >= 38) return 13;
  if (expLevel >= 34) return 12;
  if (expLevel >= 30) return 11;
  if (expLevel >= 26) return 10;
  if (expLevel >= 22) return 9;
  if (expLevel >= 19) return 8;
  if (expLevel >= 16) return 7;
  if (expLevel >= 13) return 6;
  if (expLevel >= 10) return 5;
  if (expLevel >= 7) return 4;
  if (expLevel >= 5) return 3;
  if (expLevel >= 3) return 2;
  return 1;
};

// Helper to map official Supercell API card names to local database keys, with evolution support
const getCardKey = (apiName, isEvo = false) => {
  if (isEvo) {
    const evoKey = apiName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-evo';
    const foundEvo = cardsDatabase.find(c => c.key === evoKey || c.name.toLowerCase() === ('evolved ' + apiName.toLowerCase()));
    if (foundEvo) return foundEvo.key;
  }
  const normalized = apiName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const found = cardsDatabase.find(c => c.name.toLowerCase() === apiName.toLowerCase() || c.key === normalized);
  return found ? found.key : normalized;
};

// GET /api/profile/:tag
router.get('/:tag', async (req, res) => {
  let playerTag = req.params.tag.toUpperCase().replace(/O/g, '0');
  // Ensure tag starts with '#'
  if (!playerTag.startsWith('#')) {
    playerTag = '#' + playerTag;
  }

  const apiKey = process.env.CLASH_ROYALE_API_KEY;

  if (apiKey) {
    try {
      // Escape '#' symbol for URL path (encode to %23)
      const cleanTag = playerTag.replace('#', '%23');
      console.log(`[Backend Profile Fetch] Querying Supercell API for tag "${playerTag}" (URL: https://api.clashroyale.com/v1/players/${cleanTag})`);
      const apiResponse = await fetch(`https://api.clashroyale.com/v1/players/${cleanTag}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const activeDeck = data.currentDeck ? data.currentDeck.map(card => {
          const isEvo = card.evolutionLevel && card.evolutionLevel > 0;
          return getCardKey(card.name, isEvo);
        }) : [];

        return res.json({
          success: true,
          source: 'Supercell Developer API Connection',
          tag: playerTag,
          name: data.name || 'Challenger',
          kingLevel: getKingTowerLevel(data.expLevel || 14),
          trophies: data.trophies || 5000,
          clanName: data.clan ? data.clan.name : 'No Clan',
          winRate: data.wins && data.losses ? Math.round((data.wins / (data.wins + data.losses)) * 1000) / 10 : 54.2,
          wins: data.wins || 1200,
          activeDeck: activeDeck
        });
      } else {
        // Return clear error to frontend instead of silently falling back
        const errorBody = await apiResponse.json().catch(() => ({}));
        const httpStatus = apiResponse.status;
        let errorMsg = '';
        if (httpStatus === 404) {
          errorMsg = `Player tag "${playerTag}" nahi mila. Sahi tag enter karo (e.g., #ABC123).`;
        } else if (httpStatus === 403) {
          errorMsg = `API access denied (403). Aapka IP whitelist nahi hai - developer.clashroyale.com pe IP update karo.`;
        } else if (httpStatus === 401) {
          errorMsg = `API Key invalid ya expire ho gayi hai (401). developer.clashroyale.com se nayi key generate karo.`;
        } else {
          errorMsg = `Supercell API error: HTTP ${httpStatus} - ${errorBody.reason || 'Unknown error'}`;
        }
        console.warn(`[Supercell API Error] Status: ${httpStatus}, Tag: ${playerTag}, Msg: ${errorMsg}`);
        return res.json({ success: false, error: errorMsg, httpStatus });
      }
    } catch (error) {
      console.error("[Supercell API Request Failed]:", error.message);
      return res.json({ success: false, error: `Network error - backend server se API connect nahi ho saka: ${error.message}` });
    }
  }

  // No API key configured — use offline demo simulator with clear warning
  // NOTE: This deck is NOT the user's real deck. It's a demo/simulated deck.
  const mockNames = ["ElectroKing", "GiantMaster", "GoblinSlayer", "RoyalPekka", "GraveyardShift", "ArcherQueenFan"];
  const charSum = playerTag.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const mockName = mockNames[charSum % mockNames.length];
  
  const mockTrophies = 4500 + (charSum % 4500);
  const mockWins = 800 + (charSum % 3500);
  const mockLevel = 12 + (charSum % 3);

  const mockDecks = [
    ["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"],
    ["pekka", "bandit", "battle-ram", "electro-wizard", "royal-ghost", "dark-prince", "poison", "zap"],
    ["golem", "baby-dragon", "night-witch", "lumberjack", "tornado", "poison", "skeletons", "bomber"],
    ["goblin-barrel", "knight", "valkyrie", "inferno-tower", "the-log", "archers", "skeletons", "fireball"]
  ];
  const mockActiveDeck = mockDecks[charSum % mockDecks.length];

  const mockClanNames = ["Alpha Royale", "Nova Esports", "Elite Goblins", "Clash Masters"];
  const mockClan = mockClanNames[charSum % mockClanNames.length];

  return res.json({
    success: true,
    source: 'Simulated API Engine (Offline Mode)',
    tag: playerTag,
    name: mockName,
    kingLevel: mockLevel,
    trophies: mockTrophies,
    clanName: mockClan,
    winRate: 50.0 + (charSum % 160) / 10, // 50% - 66%
    wins: mockWins,
    activeDeck: mockActiveDeck
  });
});

module.exports = router;
