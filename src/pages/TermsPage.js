import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TermsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          <Link to="/terms" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 700 }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
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

      {/* ── Page Content ── */}
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto', padding: '60px 24px 80px', flex: 1 }}>
        <div style={{ marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#60A5FA', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12
          }}>
            <FileText size={13} /> Legal Agreement
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8 }}>Terms and Conditions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Last Updated: July 4, 2026 · Official Terms of Service for <strong>LawyerHub</strong> (Owned by <strong>QubitKode</strong>)
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, lineHeight: 1.8, fontSize: 15, color: 'var(--text-2)' }}>
          
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or using the <strong>LawyerHub</strong> platform (web portal or mobile application), you enter into a binding legal agreement with <strong>QubitKode</strong> ("Company", "we", "us", or "our"). These Terms and Conditions govern your access to and use of all software, artificial intelligence legal assistants, case management vaults, hearing trackers, and related communication services offered under LawyerHub.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>2. Professional Eligibility & KYC Verification</h2>
            <p>
              LawyerHub is a specialized legal technology platform intended exclusively for licensed Advocates, Attorneys, and Legal Consultants admitted to practice before District Courts, High Courts, or the Supreme Court of Pakistan.
            </p>
            <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
              <li><strong>Verification Credentials:</strong> Upon signup, advocates must provide accurate information, including full legal name, CNIC/Passport, and official Bar Certificate or Bar Council license card.</li>
              <li><strong>Account Security:</strong> You are responsible for maintaining the strict confidentiality of your account credentials. Any activity conducted through your account will be deemed your sole responsibility.</li>
              <li><strong>Fraudulent Registrations:</strong> QubitKode reserves the right to suspend or terminate accounts that fail verification or provide false identity information.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>3. Artificial Intelligence & Legal Research Disclaimer</h2>
            <p>
              LawyerHub incorporates AI-assisted research features trained on legal statutes, ordinances, and case law references of Pakistan.
            </p>
            <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
              <li><strong>Informational Nature:</strong> Outputs generated by the AI Legal Assistant are for legal research support and drafting assistance only. They do not constitute formal legal opinion or replace professional human judgment.</li>
              <li><strong>Verification Obligation:</strong> Advocates must independently verify legal citations, precedent numbers, and statutory amendments prior to filing in any judicial forum.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>4. Client Confidentiality & Attorney Privilege</h2>
            <p>
              QubitKode acknowledges the sanctity of the attorney-client privilege and client confidentiality protected under Article 9 of the Qanun-e-Shahadat Order, 1984.
            </p>
            <p>
              All client files, consultation logs, uploaded evidence, and private chat records are encrypted in transit and at rest using bank-grade 256-bit encryption algorithms. QubitKode does not sell, mine, or expose private client data to third parties.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>5. Intellectual Property Rights</h2>
            <p>
              All proprietary algorithms, user interfaces, branding, software architecture, and legal database structures associated with LawyerHub remain the exclusive intellectual property of <strong>QubitKode</strong>. You may not reverse engineer, decompile, copy, or redistribute any portion of the platform without explicit written authorization.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted under applicable law, QubitKode and its officers, directors, software engineers, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from missed court hearing dates, technical downtime, user input errors, or loss of third-party network access.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>7. Corporate Contact Information</h2>
            <p>For questions or formal inquiries regarding these Terms and Conditions, please contact our legal & compliance team:</p>
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 20, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <div><strong>Corporate Entity:</strong> QubitKode</div>
              <div><strong>Email:</strong> contact@qubitkode.com</div>
              <div><strong>Phone / WhatsApp:</strong> +92 330 4677732</div>
            </div>
          </section>

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
