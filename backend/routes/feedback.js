const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const FEEDBACK_FILE = path.join(__dirname, '../data/feedback.json');

// Ensure data folder exists
const ensureDataFolder = () => {
  const dir = path.dirname(FEEDBACK_FILE);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
};

router.post('/', (req, res) => {
  const { name, email, tag, topic, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }

  const newFeedback = {
    id: Date.now(),
    name,
    email,
    tag: tag || 'N/A',
    topic,
    subject,
    message,
    timestamp: new Date().toISOString()
  };

  try {
    ensureDataFolder();
    let feedbacks = [];

    if (fs.existsSync(FEEDBACK_FILE)) {
      const fileData = fs.readFileSync(FEEDBACK_FILE, 'utf8');
      feedbacks = JSON.parse(fileData || '[]');
    }

    feedbacks.push(newFeedback);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf8');

    console.log(`[Backend Support Log] Logged ticket "${subject}" from player "${name}"`);
    return res.json({ success: true, message: 'Ticket received and logged.' });
  } catch (error) {
    console.error('[Backend Support Save Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server database error. Please use mailto backup.' });
  }
});

module.exports = router;
