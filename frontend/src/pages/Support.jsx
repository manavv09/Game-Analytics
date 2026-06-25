import React, { useState } from 'react';
import { Mail, Send, CheckCircle, Info, ChevronDown, HelpCircle, ShieldAlert, Award } from 'lucide-react';

export default function Support({ playerTag, playerName }) {
  const [formData, setFormData] = useState({
    name: playerName || '',
    email: '',
    tag: playerTag || '',
    topic: 'Feedback',
    subject: '',
    message: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'tag' ? value.toUpperCase() : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || !formData.subject) {
      setError('Please fill in all the required fields.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    // Call backend endpoint or fallback to local mail client
    fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setSuccess(true);
        } else {
          setError(data.message || 'Unable to submit feedback. Attempting to trigger mailto fallback...');
          triggerMailtoFallback();
        }
      })
      .catch(err => {
        console.error('Feedback submit failed:', err);
        setSubmitting(false);
        // Fallback to mailto link if backend server is unreachable
        triggerMailtoFallback();
      });
  };

  const triggerMailtoFallback = () => {
    const mailtoUrl = `mailto:support@royaleinsights.ai?subject=[${encodeURIComponent(formData.topic)}] ${encodeURIComponent(formData.subject)}&body=Name: ${encodeURIComponent(formData.name)}%0D%0APlayer Tag: ${encodeURIComponent(formData.tag)}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(formData.message)}`;
    window.location.href = mailtoUrl;
    setSuccess(true); // Treat as success since mail client was triggered
  };

  const faqs = [
    {
      q: "How does the AI deck generator work?",
      a: "Royale Insights AI analyzes your selected favorite cards, your unlocked Arena limits, and cross-references active global win-rate logs. It scores candidates based on synergy, counter-push value, and defensive role fulfillment (Air defense, splash, tank killers) to build an optimal 3.4 to 3.8 Elixir average deck."
    },
    {
      q: "Why can't I sync my Supercell Player Tag?",
      a: "Ensure you enter your tag exactly as it appears in-game (e.g., #VYR0RR). We clean spaces, replace letter O with number 0, and strip hash symbols automatically. If synchronization still fails, the public Supercell API servers may be undergoing maintenance."
    },
    {
      q: "Is Royale Insights AI affiliated with Supercell?",
      a: "No. Royale Insights AI is an unofficial fan website created in accordance with Supercell's Fan Content Policy. We build analytics tools for deck modeling but do not represent Supercell."
    },
    {
      q: "How do I report a gameplay strategy bug?",
      a: "Use the Support Form on the left! Select 'Bug Report' as the topic, describe the card interaction issue or matchup telemetry glitch, and our developers will look into the simulation parameters."
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
      <div className="page-header">
        <h1 className="page-title">Help & Support</h1>
        <p className="page-subtitle">Submit system bugs, report arena telemetry issues, suggest deck recommendations, or contact our support clan directly.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: SUPPORT REQUEST FORM */}
        <div className="cr-panel" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1.5rem -1.5rem' }}>
            <span className="cr-panel-title">Submit Support Ticket</span>
            <span className="cr-league-badge cr-badge-ultimate">ENVELOPE</span>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <CheckCircle size={48} style={{ color: '#4ade80' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'white', fontFamily: 'var(--font-clash)', textShadow: '1px 1px 0 #000' }}>TICKET DISPATCHED</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.45', maxWidth: '300px' }}>
                Your ticket has been sent to our Royale support team. We will review your deck analytics feed and get back to you via email.
              </p>
              <button 
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    name: playerName || '',
                    email: '',
                    tag: playerTag || '',
                    topic: 'Feedback',
                    subject: '',
                    message: ''
                  });
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>YOUR NAME *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    style={{ width: '100%', padding: '0.5rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>EMAIL ADDRESS *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="you@domain.com"
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      background: '#09090b', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius)', 
                      color: 'white',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>PLAYER TAG (OPTIONAL)</label>
                  <input 
                    type="text" 
                    name="tag" 
                    value={formData.tag} 
                    onChange={handleInputChange} 
                    placeholder="#VYR0RR"
                    style={{ width: '100%', padding: '0.5rem', textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TOPIC OF INTEREST</label>
                  <select 
                    name="topic" 
                    value={formData.topic} 
                    onChange={handleInputChange} 
                    style={{ width: '100%', padding: '0.5rem' }}
                  >
                    <option value="Feedback">General Feedback</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Deck Strategy">Deck Strategy Query</option>
                    <option value="Account Support">Account Sync Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>SUBJECT *</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="e.g. Cannot load Battle Deck page"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>MESSAGE / VIEWS *</label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Tell us what you think or describe the issue in detail..."
                  style={{ 
                    width: '100%', 
                    height: '110px', 
                    padding: '0.6rem 0.75rem', 
                    background: '#09090b', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius)', 
                    color: 'white', 
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius)', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--cr-red)' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn" 
                disabled={submitting}
                style={{ width: '100%', padding: '0.65rem !important', marginTop: '0.25rem' }}
              >
                {submitting ? (
                  <span>Sending Ticket...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                    <Send size={14} fill="white" /> Dispatch Support Mail
                  </span>
                )}
              </button>

            </form>
          )}
        </div>

        {/* RIGHT COLUMN: FAQ ACCORDION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="cr-panel" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="cr-panel-header" style={{ margin: '-1.5rem -1.5rem 1rem -1.5rem' }}>
              <span className="cr-panel-title">FAQ Accordion Help Desk</span>
              <span className="cr-league-badge cr-badge-champion">FAQ</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx}
                    className="glass-panel"
                    style={{ 
                      padding: '0.85rem 1rem !important', 
                      cursor: 'pointer',
                      borderLeft: isOpen ? '2.5px solid var(--cr-gold)' : '2.5px solid var(--border)'
                    }}
                    onClick={() => toggleFaq(idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={14} style={{ color: 'var(--cr-gold)' }} /> {faq.q}
                      </span>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          color: 'var(--text-muted)', 
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease'
                        }} 
                      />
                    </div>

                    {isOpen && (
                      <p style={{ fontSize: '0.78rem', color: '#b0c4de', marginTop: '0.6rem', lineHeight: '1.4', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats / Info Widget */}
          <div className="glass-panel" style={{ borderLeft: '3px solid var(--cr-blue)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Mail size={24} style={{ color: 'var(--cr-blue)' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Direct Support Clan Email</span>
              <a href="mailto:support@royaleinsights.ai" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
                support@royaleinsights.ai
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
