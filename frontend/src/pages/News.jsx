import React, { useState } from 'react';
import { Calendar, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import {
  panel, glass, pageTitle, pageDesc, panelHeader, panelTitle,
  badge, btnPrimary, btnSecondary
} from '../utils/ui.js';

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
        if (data.length > 0) setActiveArticleId(data[0].id);
        setLoading(false);
      })
      .catch(err => { console.error("Error fetching news:", err); setLoading(false); });
  }, []);

  const handleLike = (id, e) => {
    e.stopPropagation();
    setArticles(articles.map(art =>
      art.id === id ? { ...art, likes: art.hasLiked ? art.likes - 1 : art.likes + 1, hasLiked: !art.hasLiked } : art
    ));
  };

  const handlePostComment = (articleId) => {
    const text = commentInputs[articleId];
    if (!text || !text.trim()) return;
    setArticles(articles.map(art =>
      art.id === articleId
        ? { ...art, comments: [...art.comments, { id: Date.now(), username: 'You (RoyalChallenger)', text: text.trim(), time: 'Just now' }] }
        : art
    ));
    setCommentInputs({ ...commentInputs, [articleId]: '' });
  };

  const activeArticle = articles.find(art => art.id === activeArticleId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className={pageTitle}>News</h1>
        <p className={pageDesc}>Community discussions, balance patches, and esports coverage from r/ClashRoyale.</p>
      </div>

      {loading ? (
        <div className="cr-loading">
          <div className="cr-spinner" />
          Loading news…
        </div>
      ) : (
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))' }}>

          <div className="flex flex-col gap-6">
            {articles.map(art => (
              <div key={art.id} onClick={() => setActiveArticleId(art.id)}
                   className={`${panel} cursor-pointer transition-all ${activeArticleId === art.id ? 'cr-card-selected -translate-y-0.5' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className={badge} style={{ color: art.categoryColor, borderColor: `${art.categoryColor}33`, background: `${art.categoryColor}0d` }}>
                    {art.category}
                  </span>
                  <span className="text-xs cr-text-dim flex items-center gap-1">
                    <Calendar size={12} /> {art.date}
                  </span>
                </div>

                <h3 className="text-base text-[var(--cr-text)] font-bold mb-2">{art.title}</h3>
                <p className="text-sm cr-text-muted leading-snug mb-4">{art.summary}</p>

                <div className="flex justify-between items-center border-t border-white/[.06] pt-3 text-sm">
                  <span className="cr-text-dim">By {art.author}</span>
                  <div className="flex gap-4">
                    <button onClick={(e) => handleLike(art.id, e)}
                            className="flex items-center gap-1 border-0 bg-transparent cursor-pointer transition-colors"
                            style={{ color: art.hasLiked ? 'var(--cr-red)' : 'var(--cr-text-dim)' }}>
                      <ThumbsUp size={14} fill={art.hasLiked ? 'var(--cr-red)' : 'none'} /> {art.likes}
                    </button>
                    <span className="cr-text-dim flex items-center gap-1">
                      <MessageSquare size={14} /> {art.comments.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`${panel} min-h-[400px]`}>
            {activeArticle ? (
              <div className="flex flex-col gap-5">
                <div className={panelHeader}>
                  <span className={panelTitle}>Discussion</span>
                  <span className={`${badge} cr-badge-blue`}>Live</span>
                </div>

                <div>
                  <span className={`${badge} cr-badge-gold`}>{activeArticle.category}</span>
                  <h2 className="text-xl text-[var(--cr-text)] font-bold my-1">{activeArticle.title}</h2>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs cr-text-dim">{activeArticle.date} · {activeArticle.author}</span>
                    {activeArticle.link && (
                      <a href={activeArticle.link} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} text-xs no-underline`}>
                        Reddit thread
                      </a>
                    )}
                  </div>
                </div>

                <div className={`${glass} p-4 text-sm leading-relaxed cr-text-muted`}>
                  {activeArticle.content}
                </div>

                <div>
                  <h4 className="text-sm font-semibold cr-text-gold mb-3 border-b border-white/[.06] pb-1">
                    Comments ({activeArticle.comments.length})
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 mb-4">
                    {activeArticle.comments.map(c => (
                      <div key={c.id} className={`${glass} px-3 py-2.5 border-l-[3px]`} style={{ borderLeftColor: 'var(--cr-blue)' }}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-sm text-[var(--cr-text)]">{c.username}</span>
                          <span className="text-xs cr-text-dim">{c.time}</span>
                        </div>
                        <p className="text-xs cr-text-muted leading-snug">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Write a comment…"
                           value={commentInputs[activeArticle.id] || ''}
                           onChange={(e) => setCommentInputs({ ...commentInputs, [activeArticle.id]: e.target.value })}
                           className="flex-1 text-sm"
                           onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(activeArticle.id); }} />
                    <button onClick={() => handlePostComment(activeArticle.id)} className={btnPrimary}>
                      <Send size={12} /> Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center cr-text-muted text-center">
                <MessageSquare size={36} className="mb-4 opacity-40" />
                <p>Select an article to read and join the discussion.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
