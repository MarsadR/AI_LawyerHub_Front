import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Mail, Phone, Building2,
  CheckCircle2, Zap, Cpu, Lock, Globe, Sparkles,
  Target, Eye, HeartHandshake, ShieldCheck, BookOpen
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

/* ── Animation Variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.12 }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  visible: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

/* ── Floating Particle Background ── */
function AmbientParticles() {
  const pts = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: Math.random() * 3 + 1,
    dur: Math.random() * 12 + 8,
    delay: Math.random() * 6
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {pts.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            borderRadius: '50%',
            background: 'rgba(96, 165, 250, 0.45)',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
          }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [-20, -100],
            x: [0, (Math.random() - 0.5) * 50]
          }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.2]);

  return (
    <div ref={containerRef} style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      
      {/* ── Navbar ── */}
      <PublicNavbar />

      {/* ── CINEMATIC HERO SECTION ── */}
      <section style={{
        position: 'relative', minHeight: '85vh', padding: '100px 24px 80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', background: 'radial-gradient(circle at 50% 30%, rgba(59,130,246,0.18) 0%, transparent 65%)'
      }}>
        <AmbientParticles />

        {/* Ambient Glow Orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          top: -200, right: -150, pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          bottom: -100, left: -150, pointerEvents: 'none'
        }} />

        <motion.div style={{ style: { y: heroY, opacity: heroOpacity }, maxWidth: 900, zIndex: 2 }}>
          {/* QubitKode Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 20px', borderRadius: 99,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 24px rgba(59,130,246,0.25)',
              marginBottom: 28
            }}
          >
            <Building2 size={16} color="#60A5FA" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Owned & Powered by QubitKode
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(36px, 5vw, 62px)', fontWeight: 900,
              letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 24
            }}
          >
            Pioneering the Next Era of <br />
            <span style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #34D399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Pakistani Legal Technology
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              fontSize: 18, color: 'var(--text-muted)', maxWidth: 740,
              margin: '0 auto 44px', lineHeight: 1.7
            }}
          >
            LawyerHub is a flagship corporate enterprise solution developed by <strong>QubitKode</strong>.
            We combine high-assurance security, neural AI intelligence, and seamless practice management built exclusively for Advocates of High Courts & Supreme Court of Pakistan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/contact')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.6)' }}
              whileTap={{ scale: 0.95 }}
            >
              Get in Touch with QubitKode <ArrowRight size={18} />
            </motion.button>
            <motion.button
              className="btn btn-ghost btn-lg"
              onClick={() => document.getElementById('ownership')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Company Vision
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── PLAYFUL HIGHLIGHT & LAUNCH METRICS ── */}
      <section style={{ padding: '60px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', position: 'relative' }}>
        <div style={{ maxWidth: 1150, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                color: '#34D399', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12
              }}
            >
              <Sparkles size={13} /> Official Platform Highlights
            </motion.div>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
              Engineered for Precision & Legal Scale
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              {
                val: 'v1.0 Live',
                lbl: 'Initial Release & Early Access',
                tag: '100% Free Access',
                icon: Sparkles,
                grad: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                bgGlow: 'rgba(16, 185, 129, 0.15)',
                borderCol: 'rgba(16, 185, 129, 0.3)'
              },
              {
                val: '50,000+',
                lbl: 'Pakistani Statutes & Citations',
                tag: 'Instant AI Search',
                icon: BookOpen,
                grad: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                bgGlow: 'rgba(139, 92, 246, 0.15)',
                borderCol: 'rgba(139, 92, 246, 0.3)'
              },
              {
                val: '99.9%',
                lbl: 'Cloud Uptime & Availability',
                tag: 'QubitKode Cloud',
                icon: Zap,
                grad: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                bgGlow: 'rgba(59, 130, 246, 0.15)',
                borderCol: 'rgba(59, 130, 246, 0.3)'
              },
              {
                val: '256-Bit',
                lbl: 'Bank-Grade Data Encryption',
                tag: 'Zero-Trust Storage',
                icon: ShieldCheck,
                grad: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                bgGlow: 'rgba(245, 158, 11, 0.15)',
                borderCol: 'rgba(245, 158, 11, 0.3)'
              }
            ].map((st, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={i}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.025, boxShadow: `0 20px 40px ${st.bgGlow}` }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${st.borderCol}`,
                  borderRadius: 24,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Subtle Ambient Radial Background Glow */}
                <div style={{
                  position: 'absolute', top: -50, right: -50, width: 140, height: 140,
                  borderRadius: '50%', background: st.bgGlow, filter: 'blur(30px)', pointerEvents: 'none'
                }} />

                {/* Tag Pill */}
                <div style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--text-2)',
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  padding: '4px 10px', borderRadius: 99, marginBottom: 20
                }}>
                  {st.tag}
                </div>

                {/* Icon Stage */}
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: 54, height: 54, borderRadius: 18,
                    background: st.bgGlow, border: `1px solid ${st.borderCol}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16
                  }}
                >
                  <st.icon size={26} color="#fff" />
                </motion.div>

                {/* Number / Value with Gradient */}
                <div style={{
                  fontSize: 34, fontWeight: 900, letterSpacing: '-1px',
                  background: st.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 8
                }}>
                  {st.val}
                </div>

                {/* Label */}
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.4 }}>
                  {st.lbl}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUBITKODE CORPORATE OWNERSHIP HIGHLIGHT ── */}
      <section id="ownership" style={{ padding: '100px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(26, 34, 52, 0.95))',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 32, padding: '54px 44px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: -100, right: -100, width: 350, height: 350,
              background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 44, alignItems: 'center' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 99,
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16
                }}>
                  <ShieldCheck size={14} /> Official Parent Company
                </div>

                <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5, marginBottom: 16, lineHeight: 1.2 }}>
                  Built, Maintained & Owned by <span style={{ color: 'var(--primary-light)' }}>QubitKode</span>
                </h2>

                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                  <strong>QubitKode</strong> is an elite software engineering organization dedicated to architecting mission-critical platforms, high-throughput cloud infrastructure, and AI models.
                  LawyerHub stands as QubitKode’s core specialized vertical for the legal industry.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
                  {[
                    'Full ownership and technical architecture by QubitKode',
                    'Direct customer & technical support team',
                    'Regular security audits & automated daily backups',
                    'Custom enterprise solutions for legal offices & bar associations'
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-2)' }}>
                      <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  <a
                    href="mailto:contact@qubitkode.com"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', borderRadius: 14,
                      background: 'var(--surface-3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: 14, fontWeight: 600, textDecoration: 'none'
                    }}
                  >
                    <Mail size={16} color="#60A5FA" /> contact@qubitkode.com
                  </a>
                  <a
                    href="https://wa.me/923304677732" target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '12px 20px', borderRadius: 14,
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                      color: '#34D399', fontSize: 14, fontWeight: 600, textDecoration: 'none'
                    }}
                  >
                    <Phone size={16} color="#34D399" /> +92 330 4677732
                  </a>
                </div>
              </div>

              {/* Company Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { title: 'AI Engineering', desc: 'Custom LLMs trained on Pakistani Case Law', icon: Cpu, col: '#8B5CF6' },
                  { title: 'Zero Trust Security', desc: 'End-to-end encrypted databases', icon: Lock, col: '#10B981' },
                  { title: 'High Availability', desc: 'Cloud multi-region redundancy', icon: Globe, col: '#3B82F6' },
                  { title: 'Advocate First', desc: 'Designed with active High Court attorneys', icon: Sparkles, col: '#F59E0B' }
                ].map((b, i) => (
                  <div key={i} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: 22, display: 'flex', flexDirection: 'column', gap: 10
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: `${b.col}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <b.icon size={20} color={b.col} />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{b.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── OUR MISSION & VISION ── */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5 }}>Mission & Vision</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>Driving digital transformation across Pakistan's legal judicial system.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {/* Mission */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 24, padding: 36, position: 'relative'
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <Target size={26} color="#60A5FA" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Our Mission</h3>
              <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                To equip every advocate and law firm in Pakistan with intelligent cloud technology that eliminates manual case tracking, accelerates legal research, and safeguards client confidentiality.
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 24, padding: 36, position: 'relative'
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <Eye size={26} color="#A78BFA" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Our Vision</h3>
              <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                To become the unified digital backbone for Pakistan’s legal ecosystem — connecting advocates, litigants, and legal literature through seamless AI-assisted tools.
              </p>
            </motion.div>

            {/* Core Values */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 24, padding: 36, position: 'relative'
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20
              }}>
                <HeartHandshake size={26} color="#34D399" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Core Values</h3>
              <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                Integrity, privacy, technological excellence, and continuous compliance with the Bar Council guidelines.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -0.5, marginBottom: 16 }}>
            Join Pakistan's Fastest Growing Legal Platform
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
            Empower your practice with LawyerHub by QubitKode today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Register Free Account <ArrowRight size={18} />
            </motion.button>
            <motion.button className="btn btn-ghost btn-lg" onClick={() => navigate('/contact')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              Contact QubitKode Team
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '36px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 16 }}>AI LawyerHub</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>by QubitKode</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            AI LawyerHub is a software product owned and operated by <strong>QubitKode</strong>.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
            Official Contact: contact@qubitkode.com | +92 330 4677732 | © {new Date().getFullYear()} QubitKode. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
