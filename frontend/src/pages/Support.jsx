import React, { useState } from 'react';
import { Mail, Send, CheckCircle, ChevronDown, HelpCircle } from 'lucide-react';

const panel = "bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 relative overflow-hidden transition-all hover:border-zinc-600";

export default function Support({ playerTag, playerName }) {
  const [formData, setFormData] = useState({
    name: playerName || '', email: '', tag: playerTag || '',
    topic: 'Feedback', subject: '', message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'tag' ? value.toUpperCase() : value });
  };

  const triggerMailtoFallback = () => {
    const mailtoUrl = `mailto:support@royaleinsights.ai?subject=[${encodeURIComponent(formData.topic)}] ${encodeURIComponent(formData.subject)}&body=Name: ${encodeURIComponent(formData.name)}%0D%0APlayer Tag: ${encodeURIComponent(formData.tag)}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(formData.message)}`;
    window.location.href = mailtoUrl;
    setSuccess(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || !formData.subject) { setError('Please fill in all the required fields.'); return; }
    setSubmitting(true); setError('');
    fetch('http://localhost:5000/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(res => res.json())
      .then(data => { setSubmitting(false); if (data.success) setSuccess(true); else { setError(data.message || 'Unable to submit feedback.'); triggerMailtoFallback(); } })
      .catch(err => { console.error('Feedback submit failed:', err); setSubmitting(false); triggerMailtoFallback(); });
  };

  const faqs = [
    { q: "How does the AI deck generator work?", a: "Royale Insights AI analyzes your selected favorite cards, your unlocked Arena limits, and cross-references active global win-rate logs. It scores candidates based on synergy, counter-push value, and defensive role fulfillment (Air defense, splash, tank killers) to build an optimal 3.4 to 3.8 Elixir average deck." },
    { q: "Why can't I sync my Supercell Player Tag?", a: "Ensure you enter your tag exactly as it appears in-game (e.g., #VYR0RR). We clean spaces, replace letter O with number 0, and strip hash symbols automatically. If synchronization still fails, the public Supercell API servers may be undergoing maintenance." },
    { q: "Is Royale Insights AI affiliated with Supercell?", a: "No. Royale Insights AI is an unofficial fan website created in accordance with Supercell's Fan Content Policy. We build analytics tools for deck modeling but do not represent Supercell." },
    { q: "How do I report a gameplay strategy bug?", a: "Use the Support Form on the left! Select 'Bug Report' as the topic, describe the card interaction issue or matchup telemetry glitch, and our developers will look into the simulation parameters." },
  ];

  const labelCls = "text-[0.72rem] text-zinc-400 block mb-1 font-bold uppercase tracking-wide";
  const inputFullCls = "w-full";

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white mb-1"
            style={{ fontFamily: 'var(--font-clash)', textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 2px 3px 6px rgba(0,0,0,.85)' }}>
          Help &amp; Support
        </h1>
        <p className="text-zinc-400 text-sm">Submit system bugs, report arena telemetry issues, suggest deck recommendations, or contact our support clan directly.</p>
      </div>

      <div className="grid gap-10 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px,1fr))' }}>

        {/* Support form */}
        <div className={panel}>
          <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-6">
            <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>Submit Support Ticket</span>
            <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-sky-400 bg-sky-400/5 border-sky-400/20">ENVELOPE</span>
          </div>

          {success ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="bg-green-400/10 p-4 rounded-full"><CheckCircle size={48} className="text-green-400" /></div>
              <h3 className="text-[1.25rem] text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>TICKET DISPATCHED</h3>
              <p className="text-[0.85rem] text-zinc-400 leading-snug max-w-[300px]">Your ticket has been sent to our Royale support team. We will review your deck analytics feed and get back to you via email.</p>
              <button onClick={() => { setSuccess(false); setFormData({ name: playerName || '', email: '', tag: playerTag || '', topic: 'Feedback', subject: '', message: '' }); }}
                      className="mt-2 bg-zinc-800 text-zinc-50 border border-zinc-700 font-medium text-sm px-4 py-2 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>YOUR NAME *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className={inputFullCls} style={{ padding: '.5rem' }} /></div>
                <div><label className={labelCls}>EMAIL ADDRESS *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="you@domain.com" className={inputFullCls} style={{ padding: '.5rem' }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>PLAYER TAG (OPTIONAL)</label><input type="text" name="tag" value={formData.tag} onChange={handleInputChange} placeholder="#VYR0RR" className={`${inputFullCls} uppercase`} style={{ padding: '.5rem' }} /></div>
                <div>
                  <label className={labelCls}>TOPIC OF INTEREST</label>
                  <select name="topic" value={formData.topic} onChange={handleInputChange} className={inputFullCls} style={{ padding: '.5rem' }}>
                    <option value="Feedback">General Feedback</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Deck Strategy">Deck Strategy Query</option>
                    <option value="Account Support">Account Sync Support</option>
                  </select>
                </div>
              </div>
              <div><label className={labelCls}>SUBJECT *</label><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="e.g. Cannot load Battle Deck page" className={inputFullCls} style={{ padding: '.5rem' }} /></div>
              <div>
                <label className={labelCls}>MESSAGE / VIEWS *</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} required
                          placeholder="Tell us what you think or describe the issue in detail..."
                          className={`${inputFullCls} resize-y`} style={{ height: '110px', padding: '.6rem .75rem', fontSize: '.85rem' }} />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-[0.75rem] text-red-400">{error}</div>
              )}
              <button type="submit" disabled={submitting}
                      className="w-full bg-white text-zinc-950 font-medium text-sm py-3 rounded-lg cursor-pointer hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Sending Ticket...' : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Send size={14} fill="currentColor" /> Dispatch Support Mail
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* FAQ accordion */}
          <div className={panel}>
            <div className="flex justify-between items-center border-b border-zinc-800 -mx-5 -mt-5 px-5 py-3 mb-4">
              <span className="font-extrabold text-base text-white" style={{ fontFamily: 'var(--font-clash)', textShadow: '-1px -1px 0 #000, 1px 1px 0 #000' }}>FAQ Accordion Help Desk</span>
              <span className="text-[0.75rem] font-medium px-3 py-1 rounded-full border text-purple-400 bg-purple-400/5 border-purple-400/20">FAQ</span>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx}
                       onClick={() => toggleFaq(idx)}
                       className={`bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg px-4 py-3 cursor-pointer transition-all hover:border-zinc-600 ${isOpen ? 'border-l-[2.5px]' : 'border-l-[2.5px] border-l-zinc-800'}`}
                       style={{ borderLeftColor: isOpen ? 'var(--cr-gold)' : '' }}>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[0.85rem] font-bold text-white flex items-center gap-1.5">
                        <HelpCircle size={14} style={{ color: 'var(--cr-gold)' }} /> {faq.q}
                      </span>
                      <ChevronDown size={16} className="text-zinc-400 flex-shrink-0 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                    </div>
                    {isOpen && (
                      <p className="text-[0.78rem] text-blue-200 mt-2.5 leading-snug border-t border-white/[.04] pt-2">{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email widget */}
          <div className="bg-white/[.04] backdrop-blur-md border border-zinc-800 rounded-lg p-5 flex gap-4 items-center border-l-[3px]" style={{ borderLeftColor: 'var(--cr-blue)' }}>
            <div className="bg-blue-500/10 p-2 rounded-lg"><Mail size={24} style={{ color: 'var(--cr-blue)' }} /></div>
            <div>
              <span className="text-[0.68rem] text-zinc-400 block uppercase tracking-wide mb-0.5">Direct Support Clan Email</span>
              <a href="mailto:support@royaleinsights.ai" className="text-[0.85rem] font-bold text-white no-underline hover:text-zinc-300 transition-colors">
                support@royaleinsights.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
