const fs = require('fs');
const path = require('path');

// Mock request and response for Express routes
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

console.log('[Test] Running Clash Royale Backend Logic Test Suite...');

try {
  // Test 1: Verify data loaded correctly
  const cardsDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cards.json'), 'utf8'));
  const metaDecks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/meta_decks.json'), 'utf8'));
  console.log(`- Loaded ${cardsDb.length} cards and ${metaDecks.length} meta decks successfully.`);

  if (cardsDb.length === 0 || metaDecks.length === 0) {
    throw new Error('Database is empty!');
  }

  // Test 2: Test Deck Analytics Logic
  const analyticsRoute = require('../routes/analytics');
  
  // Set up a mock request for Hog 2.6 Cycle (Hog, Musketeer, Knight, Skeletons, Ice Spirit, Cannon, Fireball, Log)
  const req = {
    body: {
      deck: ["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"]
    }
  };
  const res = mockRes();
  
  // Directly trigger route handler via a mock wrapper or simulate express behavior
  // Let's call the helper function directly or mock routing.
  // Instead of mock routing, let's trigger it by requiring the router and invoking it.
  // The easiest way is to mock express router handlers. Let's find the handler for POST '/':
  const postHandler = analyticsRoute.stack.find(s => s.route && s.route.path === '/' && s.route.methods.post);
  if (!postHandler) {
    throw new Error('POST / analyze handler not found in router.');
  }

  postHandler.route.stack[0].handle(req, res);
  const data = res.body;

  console.log('\n[Analysis Output Test]');
  console.log(`- Average Elixir: ${data.averageElixir} (Expected: 2.75)`);
  console.log(`- Synergy Score: ${data.synergyScore}/100`);
  console.log(`- Metric - Defense: ${data.metrics.defense}/10`);
  console.log(`- Metric - Offense: ${data.metrics.offense}/10`);
  console.log(`- Strengths Count: ${data.strengths.length}`);
  console.log(`- Weaknesses Count: ${data.weaknesses.length}`);

  if (data.averageElixir !== 2.75) {
    throw new Error(`Average elixir mismatch: got ${data.averageElixir}`);
  }
  if (data.synergyScore < 60) {
    throw new Error(`Hog 2.6 cycle should have high synergy: got ${data.synergyScore}`);
  }
  console.log('✔ Test 2 (Deck Analytics) passed.');

  // Test 3: Test Card Replacement Recommendations
  const suggestHandler = analyticsRoute.stack.find(s => s.route && s.route.path === '/suggest' && s.route.methods.post);
  if (!suggestHandler) {
    throw new Error('POST /suggest handler not found in router.');
  }

  const reqSuggest = {
    body: {
      deck: ["hog-rider", "musketeer", "knight", "skeletons", "ice-spirit", "cannon", "fireball", "the-log"],
      cardToReplace: "knight"
    }
  };
  const resSuggest = mockRes();
  suggestHandler.route.stack[0].handle(reqSuggest, resSuggest);
  const suggestions = resSuggest.body;

  console.log('\n[Replacement Suggestions Test]');
  console.log(`Replacing 'knight' in Hog 2.6 Cycle:`);
  suggestions.forEach((s, i) => {
    console.log(`  ${i+1}. Suggested: ${s.card.name} (Score: ${s.score})`);
    console.log(`     Reason: ${s.reason}`);
  });

  if (suggestions.length === 0) {
    throw new Error('No suggestions returned for knight replacement.');
  }
  console.log('✔ Test 3 (Card Replacements) passed.');

  // Test 4: Test AI Coach Replay Parser
  const coachRoute = require('../routes/coach');
  const coachHandler = coachRoute.stack.find(s => s.route && s.route.path === '/analyze' && s.route.methods.post);
  if (!coachHandler) {
    throw new Error('POST /coach/analyze handler not found in router.');
  }

  const reqCoach = {
    body: {
      presetKey: 'overcommit-fail'
    }
  };
  const resCoach = mockRes();
  coachHandler.route.stack[0].handle(reqCoach, resCoach);
  const coachData = resCoach.body;

  console.log('\n[AI Coach Output Test]');
  console.log(`- Grade: ${coachData.grade}`);
  console.log(`- Elixir Efficiency: ${coachData.efficiency}%`);
  console.log(`- Total Leaked: ${coachData.totalLeaked} Elixir`);
  console.log(`- Mistakes Found: ${coachData.mistakes.length}`);
  
  coachData.mistakes.forEach(m => {
    console.log(`  * [${m.time}s] ${m.type}: ${m.desc}`);
  });

  if (coachData.mistakes.length === 0) {
    throw new Error('AI Coach failed to identify mistakes in overcommit preset.');
  }
  console.log('✔ Test 4 (AI Coach Replay Parser) passed.');

  console.log('\nAll Backend Logic Tests Passed Successfully! 🎉');
} catch (error) {
  console.error('\n❌ Test Suite Failed:');
  console.error(error);
  process.exit(1);
}
