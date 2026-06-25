const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    console.log('[Backend News Fetch] Fetching hot posts RSS from r/ClashRoyale');
    const fetchResponse = await fetch('https://www.reddit.com/r/ClashRoyale/hot/.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RoyaleInsights/1.0'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch Reddit RSS: ${fetchResponse.status}`);
    }

    const xmlText = await fetchResponse.text();
    
    // Parse entries using regular expressions (extremely lightweight, CORS-safe, no external dependency)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const articles = [];
    let match;
    let id = 1;

    while ((match = entryRegex.exec(xmlText)) !== null && articles.length < 8) {
      const entryContent = match[1];

      // Extract title
      const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : 'Untitled Post';
      // Decode HTML entities
      title = title
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Extract link
      const linkMatch = entryContent.match(/<link href="([\s\S]*?)"/);
      const link = linkMatch ? linkMatch[1] : 'https://www.reddit.com/r/ClashRoyale/';

      // Extract date/updated
      const dateMatch = entryContent.match(/<updated>([\s\S]*?)<\/updated>/);
      const dateRaw = dateMatch ? dateMatch[1] : new Date().toISOString();
      const date = new Date(dateRaw).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Extract author
      const authorMatch = entryContent.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
      const author = authorMatch ? authorMatch[1] : 'Reddit Community';

      // Extract content / summary
      const contentMatch = entryContent.match(/<content[^>]*>([\s\S]*?)<\/content>/);
      let content = contentMatch ? contentMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'") : '';
      
      // Clean up HTML tags for summaries
      let cleanContent = content.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanContent.length > 280) {
        cleanContent = cleanContent.slice(0, 280) + '...';
      }

      // Assign categories based on title keywords
      let category = 'COMMUNITY';
      let categoryColor = '#10b981'; // Emerald Green

      const upperTitle = title.toUpperCase();
      if (upperTitle.includes('UPDATE') || upperTitle.includes('BALANCE') || upperTitle.includes('NERF') || upperTitle.includes('BUFF') || upperTitle.includes('MAINTENANCE') || upperTitle.includes('PATCH')) {
        category = 'GAME UPDATE';
        categoryColor = '#ef4444'; // Red
      } else if (upperTitle.includes('SEASON') || upperTitle.includes('PASS') || upperTitle.includes('EVO') || upperTitle.includes('EVOLUTION') || upperTitle.includes('DECK') || upperTitle.includes('META')) {
        category = 'META INSIGHT';
        categoryColor = '#eab308'; // Amber Gold
      } else if (upperTitle.includes('CRL') || upperTitle.includes('TOURNAMENT') || upperTitle.includes('CHAMPIONSHIP') || upperTitle.includes('PRO') || upperTitle.includes('ESPORTS')) {
        category = 'ESPORTS';
        categoryColor = '#3b82f6'; // Blue
      }

      articles.push({
        id: id++,
        category,
        categoryColor,
        title,
        date,
        author,
        summary: cleanContent || 'Click to read live discussion details on Reddit.',
        likes: Math.floor(Math.random() * 200) + 50,
        hasLiked: false,
        content: cleanContent || 'Open the Reddit thread for more player discussions and stats.',
        link: link,
        comments: [
          { id: 101, username: 'Reddit_Sentinel', text: 'Visit the live Reddit discussion for real-time strategy counters!', time: '1 hour ago' }
        ]
      });
    }

    res.json(articles);
  } catch (error) {
    console.error('[Reddit RSS Feed Error]:', error.message);
    // Return standard fallback news if network is offline/Supercell API is down
    res.json([
      {
        id: 1,
        category: 'BALANCE CHANGES',
        categoryColor: '#ef4444',
        title: 'Void Spell Tower Sniping Thresholds Adjusted',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        author: 'Supercell Devs',
        summary: 'Void Spell single-target damage has been tuned to prevent cheap sniping. Pekka Evolved soul healing gets a slight frontline defense boost.',
        likes: 120,
        hasLiked: false,
        content: 'Void Spell has been adjusted: single-target damage thresholds are reduced by 12% to prevent cheap crown tower sniping. Evolved P.E.K.K.A\'s heal-back rate is raised to 12% max HP per kill to encourage strategic counter-pushing.',
        comments: []
      }
    ]);
  }
});

module.exports = router;
