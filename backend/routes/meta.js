const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const cardsFilePath = path.join(__dirname, '../data/cards.json');
const metaDecksFilePath = path.join(__dirname, '../data/meta_decks.json');

const getCards = () => JSON.parse(fs.readFileSync(cardsFilePath, 'utf8'));
const getMetaDecks = () => JSON.parse(fs.readFileSync(metaDecksFilePath, 'utf8'));

// GET meta dashboard general statistics
router.get('/stats', (req, res) => {
  try {
    const cards = getCards();
    const decks = getMetaDecks();

    // 1. Most Used Card (highest popularity)
    const sortedByPopularity = [...cards].sort((a, b) => b.popularity - a.popularity);
    const mostPopularCard = sortedByPopularity[0];

    // 2. Highest Win-rate Deck
    const sortedDecks = [...decks].sort((a, b) => b.winRate - a.winRate);
    const topDeck = sortedDecks[0];

    // 3. Average Elixir in Meta
    const avgMetaElixir = parseFloat((decks.reduce((sum, d) => sum + d.averageElixir, 0) / decks.length).toFixed(2));

    // 4. Distribution of archetypes
    const archetypes = {};
    decks.forEach(d => {
      archetypes[d.archetype] = (archetypes[d.archetype] || 0) + 1;
    });
    const topArchetype = Object.entries(archetypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Beatdown';

    res.json({
      mostPopularCard,
      topDeck,
      avgMetaElixir,
      topArchetype,
      totalCards: cards.length,
      totalDecks: decks.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute dashboard stats.' });
  }
});

// GET cards ranked by usage
router.get('/cards-ranking', (req, res) => {
  try {
    const cards = getCards();
    // Return top 10 most popular cards
    const ranked = [...cards]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10)
      .map(c => ({
        name: c.name,
        popularity: c.popularity,
        winRate: c.winRate,
        elixir: c.elixir,
        key: c.key,
        image: c.image
      }));
    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards ranking.' });
  }
});

// GET meta decks
router.get('/decks', (req, res) => {
  try {
    const decks = getMetaDecks();
    const cardsDb = getCards();
    
    // Enrich cards inside the decks with details (image, name)
    const enrichedDecks = decks.map(d => {
      const enrichedCards = d.cards.map(cKey => {
        const fullCard = cardsDb.find(c => c.key === cKey);
        return {
          key: cKey,
          name: fullCard ? fullCard.name : cKey,
          image: fullCard ? fullCard.image : '',
          elixir: fullCard ? fullCard.elixir : 0
        };
      });
      return { ...d, cardsDetails: enrichedCards };
    });

    res.json(enrichedDecks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meta decks.' });
  }
});

// GET trends data (Win rates across different skill brackets)
router.get('/trends', (req, res) => {
  // Simulating statistical trend lines for 4 top archetypes across leagues
  const trendsData = [
    { name: 'Mid Ladder (4k-6k)', 'Beatdown': 48.5, 'Cycle': 49.2, 'Bridge Spam': 50.1, 'Spell Bait': 51.5 },
    { name: 'Top Ladder (Top 10k)', 'Beatdown': 50.8, 'Cycle': 52.4, 'Bridge Spam': 51.9, 'Spell Bait': 50.2 },
    { name: 'Grand Challenges', 'Beatdown': 52.1, 'Cycle': 53.6, 'Bridge Spam': 52.5, 'Spell Bait': 49.8 },
    { name: 'CRL Pro Play', 'Beatdown': 51.2, 'Cycle': 54.1, 'Bridge Spam': 53.0, 'Spell Bait': 48.5 }
  ];
  res.json(trendsData);
});

// GET scatter plot data: Elixir vs Win Rate correlation
router.get('/scatter-data', (req, res) => {
  try {
    const cards = getCards();
    const scatter = cards.map(c => ({
      name: c.name,
      x: c.elixir, // Elixir Cost
      y: c.winRate, // Win Rate
      popularity: c.popularity, // Size factor
      role: c.role
    }));
    res.json(scatter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compile scatter data.' });
  }
});

module.exports = router;
