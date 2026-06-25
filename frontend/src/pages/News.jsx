import React, { useState } from 'react';
import { Award, Flame, Calendar, MessageSquare, ThumbsUp, Send, Heart } from 'lucide-react';

const INITIAL_NEWS_ARTICLES = [
  {
    id: 1,
    category: 'BALANCE CHANGES',
    categoryColor: '#ef4444',
    title: 'June 2026 Balance Updates: Void Spell Adjusted',
    date: 'June 21, 2026',
    author: 'Supercell Devs',
    summary: 'The Void Spell has dominated Mid and Top ladder since release. We are adjusting its single-target damage threshold, while slightly buffing the Evolved P.E.K.K.A\'s heal-back rate.',
    likes: 342,
    hasLiked: false,
    content: 'After reviewing telemetric data from the past season, we are rolling out target balance tweaks. Void Spell single-target DPS has been reduced by 12% to prevent cheap tower-sniping. Conversely, Evolved P.E.K.K.A\'s Soul Harvest healing rate has been increased to 12% max HP per kill to promote heavy frontline beatdown play.',
    comments: [
      { id: 101, username: 'HogRider_Pro_1', text: 'Thank god, Void was absolutely shredding my Musketeer in cycle defense!', time: '2 hours ago' },
      { id: 102, username: 'CRL_Champ_2026', text: 'Pekka buff is huge. Bridge spam with Battle Ram Evo is going to be S-tier next season.', time: '5 hours ago' },
      { id: 103, username: 'KnightRider99', text: 'Deflecting a Void with Monk is still the best feeling in the game though.', time: '1 day ago' }
    ]
  },
  {
    id: 2,
    category: 'SEASON REVEAL',
    categoryColor: '#eab308',
    title: 'Season 80: Goblin Invasion & Bush Outbreak',
    date: 'June 18, 2026',
    author: 'Arena Announcer',
    summary: 'Jump into the Goblin Jungle! Play with the newly released Suspicious Bush and Goblin Machine in special challenges. Earn exclusive tower skins and emotes.',
    likes: 512,
    hasLiked: false,
    content: 'Get ready for Season 80! This season introduces the Goblin Stadium redesign with swamp tiles and interactive water bridges. Trophies earned this season will grant doubled Goblin Gold. Try out the Suspicious Bush draft challenge starting this Friday to unlock the new card for free!',
    comments: [
      { id: 201, username: 'GoblinFanatic', text: 'Goblin Demolisher is so fun to play, the self-destruct is hilarious!', time: '3 hours ago' },
      { id: 202, username: 'CycleLord', text: 'Suspicious Bush is actually a solid cycle win condition. Hard to pull with Cannon.', time: '8 hours ago' }
    ]
  },
  {
    id: 3,
    category: 'ESPORTS',
    categoryColor: '#3b82f6',
    title: 'CRL Pro Season 2026 Championship Finals',
    date: 'June 15, 2026',
    author: 'CRL Team',
    summary: 'The top 16 CRL players gather in Helsinki to compete for the golden crown. Will cycle decks continue to dominate, or will beatdown take the crown?',
    likes: 218,
    hasLiked: false,
    content: 'The Clash Royale League (CRL) 2026 World Finals are here. With a prize pool of $1,000,000, players will fight in a double-elimination format. Watch live to earn free chests and exclusive badges.',
    comments: [
      { id: 301, username: 'Nova_Morten', text: 'Rooting for Mohamed Light! His Little Prince placements are unmatched.', time: '10 mins ago' },
      { id: 302, username: 'BeatdownBoss', text: 'Hope someone plays giant sparky in the finals. Need some big blast action!', time: '1 day ago' }
    ]
  }
];

export default function News() {
  const [articles, setArticles] = useState([]);
  const [activeArticleId, setActiveArticleId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        if (data.length > 0) {
          setActiveArticleId(data[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching news:", err);
        setLoading(false);
      });
  }, []);

  const handleLike = (id, e) => {
    e.stopPropagation();
    setArticles(articles.map(art => {
      if (art.id === id) {
        return {
          ...art,
          likes: art.hasLiked ? art.likes - 1 : art.likes + 1,
          hasLiked: !art.hasLiked
        };
      }
      return art;
    }));
  };

  const handlePostComment = (articleId) => {
    const text = commentInputs[articleId];
    if (!text || !text.trim()) return;

    setArticles(articles.map(art => {
      if (art.id === articleId) {
        return {
          ...art,
          comments: [
            ...art.comments,
            {
              id: Date.now(),
              username: 'You (RoyalChallenger)',
              text: text.trim(),
              time: 'Just now'
            }
          ]
        };
      }
      return art;
    }));

    setCommentInputs({
      ...commentInputs,
      [articleId]: ''
    });
  };

  const activeArticle = articles.find(art => art.id === activeArticleId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">News Royale (Live)</h1>
        <p className="page-subtitle">Catch the latest community discussions, official balance patches, and live esport coverage fetched directly from r/ClashRoyale.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem' }}>Gathering real-time Royale intel...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ARTICLES FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {articles.map(art => (
            <div 
              key={art.id} 
              onClick={() => setActiveArticleId(art.id)}
              className="cr-panel" 
              style={{ 
                cursor: 'pointer',
                borderColor: activeArticleId === art.id ? 'var(--cr-gold)' : '',
                boxShadow: activeArticleId === art.id ? '0 0 0 1px var(--cr-gold)' : '',
                transform: activeArticleId === art.id ? 'translateY(-2px)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span 
                  className="cr-league-badge" 
                  style={{ 
                    color: art.categoryColor,
                    borderColor: `${art.categoryColor}33`,
                    background: `${art.categoryColor}0d`,
                    fontSize: '0.65rem',
                    padding: '2px 6px'
                  }}
                >
                  {art.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} /> {art.date}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', color: 'white', textShadow: '1px 1px 0 #000', marginBottom: '0.5rem', fontFamily: 'var(--font-clash)' }}>
                {art.title}
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: '#b0c4de', lineHeight: '1.4', marginBottom: '1rem' }}>
                {art.summary}
              </p>

              {/* Feed Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>By: {art.author}</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={(e) => handleLike(art.id, e)}
                    style={{ background: 'transparent', border: 'none', color: art.hasLiked ? 'var(--cr-red)' : '#8fa0c0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <ThumbsUp size={14} fill={art.hasLiked ? 'var(--cr-red)' : 'none'} /> {art.likes}
                  </button>
                  <span style={{ color: '#8fa0c0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MessageSquare size={14} /> {art.comments.length} Comments
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: READ & COMMENT PANEL */}
        <div className="cr-panel" style={{ minHeight: '400px' }}>
          {activeArticle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
                <span className="cr-panel-title">Article Discussion</span>
                <span className="cr-league-badge cr-badge-ultimate">LIVE CHAT</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--cr-gold)', fontWeight: 'bold' }}>{activeArticle.category}</span>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-clash)', textShadow: '2px 2px 0 #000', margin: '0.25rem 0' }}>{activeArticle.title}</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Posted {activeArticle.date} by {activeArticle.author}</span>
                  {activeArticle.link && (
                    <a 
                      href={activeArticle.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', textDecoration: 'none' }}
                    >
                      Reddit Thread
                    </a>
                  )}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1' }}>
                {activeArticle.content}
              </div>

              {/* Comments Section */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--cr-gold)', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                  Player Debates ({activeArticle.comments.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', marginBottom: '1rem' }}>
                  {activeArticle.comments.map(c => (
                    <div key={c.id} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--cr-blue)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'white' }}>{c.username}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#b0c4de', lineHeight: '1.3' }}>{c.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Write a message to the arena..." 
                    value={commentInputs[activeArticle.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [activeArticle.id]: e.target.value })}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostComment(activeArticle.id);
                    }}
                  />
                  <button 
                    onClick={() => handlePostComment(activeArticle.id)}
                    className="btn" 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Send size={12} fill="white" /> Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              <MessageSquare size={36} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p>Select a News Royale post on the left to read official details and engage in pro-player deck debates!</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
