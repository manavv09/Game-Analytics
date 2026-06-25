import React, { useState } from 'react';
import { Calendar, MessageSquare, ThumbsUp, Send } from 'lucide-react';

const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";

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
      {/* Header */}
      <div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
            style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
          News Royale (Live)
        </h1>
        <p className="text-zinc-400 text-sm">Catch the latest community discussions, official balance patches, and live esport coverage fetched directly from r/ClashRoyale.</p>
      </div>

      {loading ? (
        <p className="text-zinc-400 text-center py-16">Gathering real-time Royale intel...</p>
      ) : (
        <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))' }}>

          {/* Left: article feed */}
          <div className="flex flex-col gap-6">
            {articles.map(art => (
              <div key={art.id} onClick={() => setActiveArticleId(art.id)}
                   className={`${panel} cursor-pointer transition-all ${activeArticleId === art.id ? '-translate-y-0.5' : ''}`}
                   style={{ borderColor: activeArticleId === art.id ? 'var(--cr-gold)' : '', boxShadow: activeArticleId === art.id ? '0 0 0 1px var(--cr-gold)' : '' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded border"
                        style={{ color: art.categoryColor, borderColor: `${art.categoryColor}33`, background: `${art.categoryColor}0d` }}>
                    {art.category}
                  </span>
                  <span className="text-[0.75rem] text-zinc-400 flex items-center gap-1">
                    <Calendar size={12} /> {art.date}
                  </span>
                </div>

                <h3 className="text-[1.15rem] text-white mb-2" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>{art.title}</h3>
                <p className="text-[0.85rem] text-blue-200 leading-snug mb-4">{art.summary}</p>

                <div className="flex justify-between items-center border-t border-white/[.06] pt-3 text-[0.8rem]">
                  <span className="text-zinc-400">By: {art.author}</span>
                  <div className="flex gap-4">
                    <button onClick={(e) => handleLike(art.id, e)}
                            className="flex items-center gap-1 border-0 bg-transparent cursor-pointer transition-colors"
                            style={{ color: art.hasLiked ? 'var(--cr-red)' : '#8fa0c0' }}>
                      <ThumbsUp size={14} fill={art.hasLiked ? 'var(--cr-red)' : 'none'} /> {art.likes}
                    </button>
                    <span className="text-[#8fa0c0] flex items-center gap-1">
                      <MessageSquare size={14} /> {art.comments.length} Comments
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: discussion panel */}
          <div className={`${panel} min-h-[400px]`}>
            {activeArticle ? (
              <div className="flex flex-col gap-5">
                {/* Panel header */}
                <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-2">
                  <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Article Discussion</span>
                  <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">LIVE CHAT</span>
                </div>

                {/* Article */}
                <div>
                  <span className="text-[0.75rem] font-bold" style={{ color: 'var(--cr-gold)' }}>{activeArticle.category}</span>
                  <h2 className="text-[1.4rem] text-white my-1" style={{ fontFamily: 'var(--font-clash)', textShadow: '2px 2px 0 #000' }}>{activeArticle.title}</h2>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[0.75rem] text-zinc-400">Posted {activeArticle.date} by {activeArticle.author}</span>
                    {activeArticle.link && (
                      <a href={activeArticle.link} target="_blank" rel="noopener noreferrer"
                         className="no-underline text-[0.7rem] bg-zinc-800 text-zinc-50 border border-zinc-700 px-3 py-1 rounded-lg hover:bg-zinc-700 transition-all">
                        Reddit Thread
                      </a>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white/[.02] border border-zinc-800 rounded-lg p-4 text-[0.9rem] leading-relaxed text-slate-300">
                  {activeArticle.content}
                </div>

                {/* Comments */}
                <div>
                  <h4 className="text-base mb-3 border-b border-white/[.06] pb-1" style={{ color: 'var(--cr-gold)' }}>
                    Player Debates ({activeArticle.comments.length})
                  </h4>
                  <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 mb-4">
                    {activeArticle.comments.map(c => (
                      <div key={c.id} className="px-3 py-2.5 bg-white/[.02] border border-zinc-800 rounded-lg border-l-[3px]" style={{ borderLeftColor: 'var(--cr-blue)' }}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-[0.8rem] text-white">{c.username}</span>
                          <span className="text-[0.65rem] text-zinc-400">{c.time}</span>
                        </div>
                        <p className="text-[0.78rem] text-blue-200 leading-snug">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  {/* Comment input */}
                  <div className="flex gap-2">
                    <input type="text" placeholder="Write a message to the arena..."
                           value={commentInputs[activeArticle.id] || ''}
                           onChange={(e) => setCommentInputs({ ...commentInputs, [activeArticle.id]: e.target.value })}
                           className="flex-1" style={{ padding: '.5rem .75rem', fontSize: '.85rem' }}
                           onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(activeArticle.id); }} />
                    <button onClick={() => handlePostComment(activeArticle.id)}
                            className="flex items-center gap-1 bg-white text-zinc-950 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-white/90 transition-all">
                      <Send size={12} fill="currentColor" /> Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-zinc-400 text-center">
                <MessageSquare size={36} className="mb-4 opacity-40" />
                <p>Select a News Royale post on the left to read official details and engage in pro-player deck debates!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
