const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const cardsFilePath = path.join(__dirname, '../data/cards.json');

// Helper to read cards data
const getCards = () => {
  const data = fs.readFileSync(cardsFilePath, 'utf8');
  return JSON.parse(data);
};

// GET all cards (with optional filtering)
router.get('/', (req, res) => {
  try {
    let cards = getCards();
    const { role, type, rarity, search } = req.query;

    if (role) {
      cards = cards.filter(c => c.role.toLowerCase() === role.toLowerCase());
    }
    if (type) {
      cards = cards.filter(c => c.type.toLowerCase() === type.toLowerCase());
    }
    if (rarity) {
      cards = cards.filter(c => c.rarity.toLowerCase() === rarity.toLowerCase());
    }
    if (search) {
      const query = search.toLowerCase();
      cards = cards.filter(c => c.name.toLowerCase().includes(query) || c.key.toLowerCase().includes(query));
    }

    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve cards database.' });
  }
});

// GET card details by key
router.get('/:key', (req, res) => {
  try {
    const cards = getCards();
    const card = cards.find(c => c.key.toLowerCase() === req.params.key.toLowerCase());
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve card detail.' });
  }
});

module.exports = router;
