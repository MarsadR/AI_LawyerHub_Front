import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, Send, Building2, ArrowRight, MessageSquare, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ContactPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return toast.error('Please fill in all required fields');
    }

    setLoading(true);

    // Format WhatsApp message
    const formattedText =
      `*New Inquiry via LawyerHub Portal*\n\n` +
      `👤 *Name:* ${form.name.trim()}\n` +
      `✉️ *Email:* ${form.email.trim()}\n` +
      `📌 *Subject:* ${form.subject.trim() || 'General Inquiry'}\n\n` +
      `📝 *Message:*\n${form.message.trim()}\n\n` +
      `_Sent via LawyerHub contact form (QubitKode)_`;

    const whatsappUrl = `https://wa.me/923304677732?text=${encodeURIComponent(formattedText)}`;

    setTimeout(() => {
      setLoading(false);
      toast.success('Opening WhatsApp to send your message to QubitKode…');
      window.open(whatsappUrl, '_blank');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 400);
  };

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <nav style={{
        height: 72, borderBottom: '1px solid var(--border)',
        background: 'rgba(7, 11, 20, 0.85)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100, padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>AI LawyerHub</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14, fontWeight: 600 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About Us</Link>
          <Link to="/contact" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 700 }}>Contact</Link>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              Dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Sign In <ArrowRight size={14} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '60px 24px 80px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#60A5FA', fontSize: 13, fontWeight: 700, marginBottom: 16
          }}>
            <Building2 size={14} /> Official Support & Ownership by QubitKode
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>
            Get in Touch with Us
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 580, margin: '0 auto' }}>
            Have questions, support requests, or partnership inquiries? Submit the form below to connect directly with the QubitKode team on WhatsApp.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
          {/* Left Column: Contact Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Ownership Card */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden'
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--primary-light)', marginBottom: 6 }}>
                Parent Organization
              </p>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>QubitKode</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                LawyerHub is fully owned, operated, and maintained by <strong>QubitKode</strong>.
              </p>
            </div>

            {/* Direct WhatsApp Card */}
            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 20, padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Phone size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#34D399' }}>WhatsApp Support</h4>
                <a
                  href="https://wa.me/923304677732" target="_blank" rel="noreferrer"
                  style={{ color: '#fff', fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  +92 330 4677732 <ExternalLink size={14} color="#34D399" />
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Instant response via WhatsApp messenger</p>
              </div>
            </div>

            {/* Email Card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 20, padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Mail size={22} color="#60A5FA" />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Email Contact</h4>
                <a href="mailto:contact@qubitkode.com" style={{ color: 'var(--primary-light)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  contact@qubitkode.com
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>Official corporate email</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form -> WhatsApp */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 24, padding: 36, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#34D399" />
              </div>
              <div>
                <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Send Message via WhatsApp</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Form pre-fills and opens WhatsApp directly</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="form-label">Your Name *</label>
                <input
                  className="input"
                  placeholder="Advocate Ali Raza"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="ali@lawfirm.pk"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label">Subject</label>
                <input
                  className="input"
                  placeholder="Law Firm Partnership / Support Request"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>

              <div>
                <label className="form-label">Message *</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Type your inquiry here..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%', justifyContent: 'center', marginTop: 8,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                }}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Preparing WhatsApp...' : <><Send size={16} /> Send via WhatsApp</>}
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 'auto', padding: '32px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
          AI LawyerHub is a software product owned & operated by <strong>QubitKode</strong>.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
          Contact: contact@qubitkode.com | +92 330 4677732 | © {new Date().getFullYear()} QubitKode. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
