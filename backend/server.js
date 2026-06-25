require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const cardsRouter = require('./routes/cards');
const analyticsRouter = require('./routes/analytics');
const metaRouter = require('./routes/meta');
const coachRouter = require('./routes/coach');
const profileRouter = require('./routes/profile');
const newsRouter = require('./routes/news');
const feedbackRouter = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Register API Routes
app.use('/api/cards', cardsRouter);
app.use('/api/analyze', analyticsRouter);
app.use('/api/meta', metaRouter);
app.use('/api/coach', coachRouter);
app.use('/api/profile', profileRouter);
app.use('/api/news', newsRouter);
app.use('/api/feedback', feedbackRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Clash Royale Analytics Backend is running.' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Server] Clash Royale Data Engine listening on port ${PORT}`);
});
