import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PrivacyPage() {
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
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 700 }}>Privacy</Link>
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
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#34D399', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12
          }}>
            <Shield size={13} /> Privacy & Data Governance
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Last Updated: July 4, 2026 · Official Data Protection Standard for <strong>LawyerHub</strong> (Owned by <strong>QubitKode</strong>)
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, lineHeight: 1.8, fontSize: 15, color: 'var(--text-2)' }}>
          
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>1. Commitment to Legal Privacy</h2>
            <p>
              At <strong>LawyerHub</strong>, owned and operated by <strong>QubitKode</strong> ("Company", "we", "us"), we prioritize the privacy and security of legal professionals and their clients. We understand that legal information involves sensitive judicial records, confidential client communications, and attorney work product. This Privacy Policy outlines our transparent standards for data collection, storage, encryption, and protection.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>2. Information We Collect</h2>
            <p>To provide secure software services, LawyerHub collects the following categories of data:</p>
            <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
              <li><strong>Account Identification Data:</strong> Full name, professional email address, phone number, physical office location, and CNIC/Passport details required for identity verification.</li>
              <li><strong>Verification Credentials:</strong> Scanned Bar Certificate and Bar Council License documents provided during signup to confirm advocate eligibility.</li>
              <li><strong>Practice Management Data:</strong> Appointment schedules, hearing logs, case notes, uploaded document evidence, and consultation chat records.</li>
              <li><strong>Technical Metadata:</strong> IP address, device fingerprints, app access timestamps, and performance metrics utilized solely for security diagnostics and fraud prevention.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>3. Encryption & Data Security Architecture</h2>
            <p>
              QubitKode employs defense-in-depth zero-trust security standards to protect all LawyerHub data:
            </p>
            <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
              <li><strong>Data in Transit:</strong> Encrypted using TLS 1.3 cryptographic protocols with modern cipher suites.</li>
              <li><strong>Data at Rest:</strong> Encrypted using AES 256-bit enterprise storage encryption keys managed inside isolated cloud modules.</li>
              <li><strong>Access Controls:</strong> Multi-tenant isolation ensuring that legal files and communications are accessible solely by the authorized advocate.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>4. No Sale or Mining of Confidential Legal Data</h2>
            <p>
              <strong>We do not sell, rent, or monetize your personal or client data under any circumstances.</strong> Furthermore, private case files, confidential client communications, and attorney notes are strictly excluded from AI model training or public indexing.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>5. Data Retention & Account Deletion</h2>
            <p>
              Advocates retain full ownership and control over their practice data. You may export or request complete deletion of your account and associated document vaults at any time by contacting our privacy compliance desk. Upon account deletion, all data is permanently purged from our primary databases and backup servers within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>6. Contact Privacy Desk</h2>
            <p>If you have any questions or data privacy inquiries, please contact QubitKode’s Data Officer:</p>
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 20, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <div><strong>Company:</strong> QubitKode</div>
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
