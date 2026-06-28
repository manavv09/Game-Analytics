import React, { useState } from 'react';
import { Mail, Send, CheckCircle, ChevronDown, HelpCircle } from 'lucide-react';
import {
  panel, glass, pageTitle, pageDesc, panelHeader, panelTitle,
  badge, btnPrimary, btnSecondary, label as crLabel
} from '../utils/ui.js';

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
    if (!formData.name || !formData.email || !formData.message || !formData.subject) { setError('Please fill in all required fields.'); return; }
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
    { q: "How do I report a gameplay strategy bug?", a: "Use the support form! Select 'Bug Report' as the topic, describe the card interaction issue or matchup telemetry glitch, and our developers will look into the simulation parameters." },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className={pageTitle}>Help & Support</h1>
        <p className={pageDesc}>Report bugs, suggest features, or reach our support team directly.</p>
      </div>

      <div className="grid gap-10 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px,1fr))' }}>

        <div className={panel}>
          <div className={panelHeader}>
            <span className={panelTitle}>Contact us</span>
            <span className={`${badge} cr-badge-blue`}>Form</span>
          </div>

          {success ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="bg-green-400/10 p-4 rounded-full"><CheckCircle size={48} className="cr-text-green" /></div>
              <h3 className="text-lg text-[var(--cr-text)] font-bold">Message sent</h3>
              <p className="text-sm cr-text-muted leading-snug max-w-[300px]">Your ticket has been sent to our support team. We'll get back to you via email.</p>
              <button onClick={() => { setSuccess(false); setFormData({ name: playerName || '', email: '', tag: playerTag || '', topic: 'Feedback', subject: '', message: '' }); }}
                      className={`${btnSecondary} mt-2`}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`${crLabel} block mb-1`}>Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full" /></div>
                <div><label className={`${crLabel} block mb-1`}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="you@domain.com" className="w-full" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={`${crLabel} block mb-1`}>Player tag</label><input type="text" name="tag" value={formData.tag} onChange={handleInputChange} placeholder="#VYR0RR" className="w-full uppercase" /></div>
                <div>
                  <label className={`${crLabel} block mb-1`}>Topic</label>
                  <select name="topic" value={formData.topic} onChange={handleInputChange} className="w-full">
                    <option value="Feedback">General feedback</option>
                    <option value="Bug Report">Bug report</option>
                    <option value="Deck Strategy">Deck strategy</option>
                    <option value="Account Support">Account sync</option>
                  </select>
                </div>
              </div>
              <div><label className={`${crLabel} block mb-1`}>Subject *</label><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Brief summary" className="w-full" /></div>
              <div>
                <label className={`${crLabel} block mb-1`}>Message *</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} required
                          placeholder="Describe your issue or feedback…"
                          className="w-full resize-y h-[110px] text-sm" />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs cr-text-red">{error}</div>
              )}
              <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
                {submitting ? 'Sending…' : (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Send size={14} /> Send message
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className={panel}>
            <div className={panelHeader}>
              <span className={panelTitle}>FAQ</span>
              <span className={`${badge} cr-badge-purple`}>Help</span>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx}
                       onClick={() => toggleFaq(idx)}
                       className={`${glass} px-4 py-3 cursor-pointer transition-all hover:border-[var(--cr-border-hover)] border-l-[2.5px]`}
                       style={{ borderLeftColor: isOpen ? 'var(--cr-gold)' : 'transparent' }}>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-semibold text-[var(--cr-text)] flex items-center gap-1.5">
                        <HelpCircle size={14} className="cr-text-gold" /> {faq.q}
                      </span>
                      <ChevronDown size={16} className="cr-text-dim flex-shrink-0 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                    </div>
                    {isOpen && (
                      <p className="text-xs cr-text-muted mt-2.5 leading-snug border-t border-white/[.04] pt-2">{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${panel} flex gap-4 items-center border-l-[3px]`} style={{ borderLeftColor: 'var(--cr-blue)' }}>
            <div className="bg-blue-500/10 p-2 rounded-lg"><Mail size={24} className="cr-text-blue" /></div>
            <div>
              <span className={`${crLabel} block mb-0.5`}>Direct email</span>
              <a href="mailto:support@royaleinsights.ai" className="text-sm font-bold text-[var(--cr-text)] no-underline hover:text-[var(--cr-text-muted)] transition-colors">
                support@royaleinsights.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
