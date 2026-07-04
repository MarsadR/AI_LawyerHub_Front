import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import './LandingPage.css';

/* ── Inline SVG icon set ─────────────────────────────────── */
const Icon = {
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Gavel: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5l7 7-14 14-7-7 14-14z"/><path d="M3.5 21.5l3-3"/><path d="M12.5 5.5l6 6"/>
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Bot: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/>
      <path d="M8 15h.01M16 15h.01M8 18h8"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Arrow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
};

/* ── 3D tilt card ──────────────────────────────────────── */
function TiltCard({ children, className, style, intensity = 12 }) {
  const ref = useRef(null);
  const rotX = useMotionValue(0), rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 180, damping: 28 });
  const sY = useSpring(rotY, { stiffness: 180, damping: 28 });

  const onMove = (e) => {
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    rotY.set(((e.clientX - left) / width - 0.5) * intensity);
    rotX.set(-((e.clientY - top) / height - 0.5) * intensity);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  return (
    <motion.div ref={ref} className={className} style={{ ...style, rotateX: sX, rotateY: sY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
}

/* ── Particle field ────────────────────────────────────── */
function Particles() {
  const pts = Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: Math.random() * 2.5 + 0.8, dur: Math.random() * 14 + 8, delay: Math.random() * 10,
  }));
  return (
    <div className="lp-particles">
      {pts.map(p => (
        <motion.div key={p.id} className="lp-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s }}
          animate={{ opacity: [0, 0.6, 0], y: [-10, -70], x: [0, (Math.random() - 0.5) * 40] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ── Hero 3D Visual ──────────────────────────────────────── */
function HeroVisual() {
  const orbitFeatures = [
    { icon: Icon.Calendar, label: 'Appointments', angle: 0 },
    { icon: Icon.Chat, label: 'Secure Chat', angle: 60 },
    { icon: Icon.Folder, label: 'Case Files', angle: 120 },
    { icon: Icon.Gavel, label: 'Hearings', angle: 180 },
    { icon: Icon.Book, label: 'Law Library', angle: 240 },
    { icon: Icon.Bot, label: 'AI Assistant', angle: 300 },
  ];

  return (
    <div className="lp-visual-wrap">
      {/* Outer glow ring */}
      <motion.div className="lp-vis-ring lp-vis-ring-3"
        animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="lp-vis-ring lp-vis-ring-2"
        animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="lp-vis-ring lp-vis-ring-1"
        animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} />

      {/* Central icon */}
      <motion.div className="lp-vis-center"
        animate={{ boxShadow: ['0 0 40px rgba(59,130,246,0.4)', '0 0 80px rgba(59,130,246,0.8)', '0 0 40px rgba(59,130,246,0.4)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div className="lp-vis-center-icon"
          animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 68, height: 68, objectFit: 'contain' }} />
        </motion.div>
      </motion.div>

      {/* Orbiting feature nodes */}
      {orbitFeatures.map((f, i) => {
        const rad = (f.angle * Math.PI) / 180;
        const r = 160;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        return (
          <motion.div
            key={i}
            className="lp-vis-node"
            style={{ left: `calc(50% + ${x}px - 28px)`, top: `calc(50% + ${y}px - 28px)` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.2 }}
          >
            <f.icon />
            <span className="lp-vis-node-label">{f.label}</span>
          </motion.div>
        );
      })}

      {/* Stat pills */}
      <motion.div className="lp-vis-pill lp-vis-pill-1"
        animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
        <div className="lp-pill-dot" />
        <div><div className="lp-pill-val">5,000+</div><div className="lp-pill-lbl">Advocates</div></div>
      </motion.div>

      <motion.div className="lp-vis-pill lp-vis-pill-2"
        animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
        <div className="lp-pill-icon"><Icon.Shield /></div>
        <div><div className="lp-pill-val">256-bit</div><div className="lp-pill-lbl">Encrypted</div></div>
      </motion.div>

      <motion.div className="lp-vis-pill lp-vis-pill-3"
        animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="lp-pill-dot lp-pill-dot-green" />
        <div><div className="lp-pill-val">99.9%</div><div className="lp-pill-lbl">Uptime</div></div>
      </motion.div>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────── */
const FEATURES = [
  { Icon: Icon.Bot,      tag: 'AI-Powered',         title: 'Legal Research AI',        desc: 'Trained on Pakistan\'s Constitution, PPC, CrPC and decades of case law. Research, draft and analyse in seconds, not hours.' },
  { Icon: Icon.Calendar, tag: 'Zero Conflicts',      title: 'Smart Scheduling',          desc: 'Intelligent appointment management with real-time conflict detection, automated reminders and client notifications.' },
  { Icon: Icon.Shield,   tag: 'Bank-Grade Security', title: 'Encrypted Communications', desc: 'End-to-end encrypted messaging with file sharing and real-time presence — every conversation stays private.' },
  { Icon: Icon.Folder,   tag: 'Cloud Synced',        title: 'Case File Vault',           desc: 'A hierarchical, encrypted repository for every document, brief and evidence file — with instant smart search.' },
  { Icon: Icon.Gavel,    tag: 'Never Miss a Date',   title: 'Hearings Tracker',          desc: 'Track all court appearances, set multi-level reminders and log hearing outcomes — all in one timeline view.' },
  { Icon: Icon.Book,     tag: '50,000+ References',  title: 'Digital Law Library',       desc: "Browse Pakistan's complete legislative history — statutes, ordinances and legal references — searchable instantly." },
];

const TESTIMONIALS = [
  { name: 'Barrister Ayesha Khan',   role: 'Senior Advocate, Lahore High Court',  text: 'LawyerHub transformed my practice. The AI assistant saves me 3 hours every day. An absolute game-changer for Pakistani legal professionals.', initials: 'AK' },
  { name: 'Advocate Zubair Ahmed',   role: 'Corporate Law Specialist, Islamabad', text: 'Seamlessly integrated case files and client messaging. My clients love the platform and I\'ve taken on 40% more cases since joining.', initials: 'ZA' },
  { name: 'Syeda Fatima Malik',      role: 'Family Law Attorney, Karachi',        text: 'The hearing tracker alone is worth everything. No more sticky notes and missed dates — LawyerHub keeps me professional and sharp.', initials: 'FM' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 48, filter: 'blur(10px)' },
  visible: (i = 0) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.85, ease: [0.16,1,0.3,1], delay: i * 0.12 } }),
};

/* ── GLB Scene model ──────────────────────────────────────── */
function GLBModel() {
  const { scene } = useGLTF('/organic_dot_grid.glb');
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.06;
    ref.current.rotation.x = Math.sin(t * 0.04) * 0.08;
    ref.current.position.y = Math.sin(t * 0.35) * 0.12;
  });

  // Tint all mesh materials to match the blue palette
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          mat.color?.setHex(0x3b82f6);
          mat.emissive?.setHex(0x1d4ed8);
          if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.55;
          mat.transparent = true;
          mat.opacity = 0.72;
        });
      }
    });
  }, [scene]);

  return <primitive ref={ref} object={scene} scale={3.2} position={[0, 0, 0]} />;
}

/* ── Full-page Three.js GLB background ──────────────────── */
function GLBBackground() {
  return (
    <div className="lp-glb-bg">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} color="#60a5fa" />
        <pointLight position={[-6, -4, -4]} intensity={0.5} color="#3b82f6" />
        <Suspense fallback={null}>
          <GLBModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, -60]);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="lp-root">

      {/* Fixed Full-Page 3D GLB Background */}
      <GLBBackground />

      {/* ── NAV ─────────────────────────────── */}
      <motion.nav className={`lp-nav ${navScrolled ? 'lp-nav-scrolled' : ''}`}
        initial={{ y: -72, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16,1,0.3,1], delay: 0.3 }}>
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate('/')}>
            <div className="lp-logo-icon">
              <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
            <span className="lp-logo-text">AI LawyerHub</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
          </div>
          <div className="lp-nav-cta">
            {user ? (
              <motion.button className="lp-btn-primary" onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                Go to Dashboard <span className="lp-btn-arrow"><Icon.Arrow /></span>
              </motion.button>
            ) : (
              <>
                <motion.button className="lp-btn-ghost" onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Sign In</motion.button>
                <motion.button className="lp-btn-primary" onClick={() => navigate('/signup')}
                  whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(59,130,246,0.65)' }} whileTap={{ scale: 0.97 }}>
                  Get Started Free
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="lp-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <Icon.Close /> : <Icon.Menu />}
          </button>
        </div>

        {/* Mobile Slide-Down Menu Overlay */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed', top: 70, left: 0, right: 0,
              background: 'rgba(3,5,12,0.96)', backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(59,130,246,0.2)',
              padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16,
              zIndex: 999, boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>How It Works</a>
            <a href="/about" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/about'); }} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>About Us</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/contact'); }} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>Contact</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/terms'); }} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>Terms & Conditions</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/privacy'); }} style={{ color: '#F1F5F9', fontSize: 16, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              {user ? (
                <button className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button className="lp-btn-ghost" style={{ flex: 1, padding: '12px 0' }} onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>Sign In</button>
                  <button className="lp-btn-primary" style={{ flex: 1, padding: '12px 0', justifyContent: 'center' }} onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}>Get Started</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="lp-hero">
        <Particles />
        <div className="lp-grid-bg" />
        <motion.div className="lp-hero-glow"
          animate={{ scale: [1,1.12,1], opacity: [0.45,0.75,0.45] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />



        {/* Left: copy */}
        <motion.div className="lp-hero-copy" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div className="lp-badge"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16,1,0.3,1] }}>
            <motion.span className="lp-badge-dot"
              animate={{ scale: [1,1.6,1], opacity: [1,0.4,1] }} transition={{ duration: 2, repeat: Infinity }} />
            Pakistan's #1 Legal Practice Platform
          </motion.div>

          <h1 className="lp-hero-title">
            {['The Future of', 'Legal Practice', 'Is Here'].map((line, li) => (
              <span key={li} className="lp-title-line">
                <motion.span
                  initial={{ y: '105%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.85 + li * 0.18, ease: [0.16,1,0.3,1] }}
                  style={{ display: 'block' }}
                >
                  {li === 1 ? <span className="lp-blue">{line}</span> : line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p className="lp-hero-sub"
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 1.45, ease: [0.16,1,0.3,1] }}>
            AI-driven legal research · Smart appointment scheduling · Encrypted client communications · Court hearing management — all in one platform built for Pakistani advocates.
          </motion.p>

          <motion.div className="lp-hero-actions"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.65, ease: [0.16,1,0.3,1] }}>
            <motion.button className="lp-cta-primary"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 64px rgba(59,130,246,0.75)' }} whileTap={{ scale: 0.96 }}>
              <span>{user ? 'Go to Dashboard' : 'Start Free — No Card Required'}</span>
              <motion.span className="lp-cta-arrow" animate={{ x: [0,4,0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <Icon.Arrow />
              </motion.span>
            </motion.button>
            {!user && (
              <motion.button className="lp-cta-ghost"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Explore Features
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Right: abstract 3D visual */}
        <motion.div className="lp-hero-visual" style={{ opacity: heroOpacity }}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.5, ease: [0.16,1,0.3,1] }}>
          <HeroVisual />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="lp-scroll-hint"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }}>
          <motion.div className="lp-scroll-mouse" animate={{ y: [0,7,0] }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="lp-scroll-wheel" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <motion.div className="lp-sec-hd" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
            <div className="lp-tag">Complete Toolkit</div>
            <h2 className="lp-sec-title">Everything Your Practice<br /><span className="lp-blue">Needs in One Place</span></h2>
            <p className="lp-sec-sub">Built exclusively for Pakistani advocates — every tool to run a world-class legal practice, seamlessly integrated.</p>
          </motion.div>

          <div className="lp-feat-grid">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" custom={i % 3} viewport={{ once: true, margin: '-50px' }}>
                <TiltCard className="lp-feat-card">
                  <div className="lp-feat-icon-wrap">
                    <f.Icon />
                  </div>
                  <div className="lp-feat-tag">{f.tag}</div>
                  <h3 className="lp-feat-title">{f.title}</h3>
                  <p className="lp-feat-desc">{f.desc}</p>
                  <div className="lp-feat-link">
                    Learn more <span className="lp-feat-link-arrow"><Icon.Arrow /></span>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────── */}
      <section className="lp-section lp-section-dark" id="how-it-works">
        <div className="lp-section-inner">
          <motion.div className="lp-sec-hd" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="lp-tag">Simple Onboarding</div>
            <h2 className="lp-sec-title">Up and Running<br /><span className="lp-blue">in Three Steps</span></h2>
          </motion.div>

          <div className="lp-steps">
            {[
              { n: '01', Icon: Icon.Scale,    title: 'Create Your Profile',    desc: 'Register as an advocate and complete verification with your Bar Council certificate and CNIC to unlock your premium dashboard.' },
              { n: '02', Icon: Icon.Calendar, title: 'Configure Your Practice', desc: 'Set your specializations, define appointment availability and build a trusted client-facing profile.' },
              { n: '03', Icon: Icon.Gavel,    title: 'Grow Your Caseload',     desc: 'Accept consultations, leverage AI research, collaborate in the lawyer network and scale your practice effortlessly.' },
            ].map((s, i) => (
              <motion.div key={i} className="lp-step" variants={fadeUp} initial="hidden" whileInView="visible" custom={i} viewport={{ once: true, margin: '-40px' }}>
                <div className="lp-step-num">{s.n}</div>
                <div className="lp-step-icon-wrap"><s.Icon /></div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SHOWCASE ─────────────────────── */}
      <section className="lp-section" id="testimonials">
        <div className="lp-section-inner lp-ai-row">
          <motion.div className="lp-ai-copy"
            initial={{ opacity: 0, x: -60, filter: 'blur(10px)' }} whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }} transition={{ duration: 1, ease: [0.16,1,0.3,1] }}>
            <div className="lp-tag">AI-Powered</div>
            <h2 className="lp-sec-title" style={{ textAlign: 'left' }}>Your Personal<br /><span className="lp-blue">Legal Counsel AI</span></h2>
            <p className="lp-ai-desc">Trained on Pakistan's Constitution, PPC, CrPC, civil law statutes and decades of Supreme Court judgments. Ask anything — draft, analyse, research — get expert-level guidance in seconds.</p>
            <ul className="lp-ai-list">
              {['Draft petitions, contracts & legal notices','Analyse case strengths and weaknesses','Research applicable statutes and ordinances','Summarize Supreme Court judgments','Suggest litigation and negotiation strategies'].map((item, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                  <span className="lp-check-icon"><Icon.Check /></span> {item}
                </motion.li>
              ))}
            </ul>
            <motion.button className="lp-cta-primary" style={{ marginTop: 8 }} onClick={() => navigate(user ? '/ai-chat' : '/login')}
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(59,130,246,0.6)' }} whileTap={{ scale: 0.96 }}>
              <span>Try AI Assistant</span>
              <span className="lp-cta-arrow"><Icon.Arrow /></span>
            </motion.button>
          </motion.div>

          <motion.div className="lp-ai-demo"
            initial={{ opacity: 0, x: 60, filter: 'blur(10px)' }} whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }} transition={{ duration: 1, ease: [0.16,1,0.3,1] }}>
            <TiltCard className="lp-ai-window" intensity={7}>
              <div className="lp-ai-header">
                <div className="lp-ai-av"><Icon.Bot /></div>
                <div>
                  <div className="lp-ai-name">LegalAI Assistant</div>
                  <div className="lp-ai-online">
                    <motion.span className="lp-online-dot" animate={{ scale: [1,1.5,1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                    Online · Pakistani Law Expert
                  </div>
                </div>
              </div>
              <div className="lp-ai-body">
                {[
                  { role: 'user', text: 'What is the limitation period for a civil suit in Pakistan?' },
                  { role: 'ai', text: 'Under the Limitation Act, 1908, civil suits must generally be filed within 6 years from when the cause of action arises (Article 120). Property disputes carry a 12-year limit, and tort claims 3 years.' },
                  { role: 'user', text: 'Draft a limitation objection for my case.' },
                ].map((m, i) => (
                  <motion.div key={i} className={`lp-bubble ${m.role === 'user' ? 'lp-bubble-user' : 'lp-bubble-ai'}`}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.22, duration: 0.6 }}>
                    {m.text}
                  </motion.div>
                ))}
                <motion.div className="lp-typing"
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.85 }}>
                  <motion.span animate={{ y: [0,-5,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0 }} />
                  <motion.span animate={{ y: [0,-5,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0.15 }} />
                  <motion.span animate={{ y: [0,-5,0] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0.3 }} />
                </motion.div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-section-inner">
          <motion.div className="lp-sec-hd" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="lp-tag">Trusted by Advocates</div>
            <h2 className="lp-sec-title">Voices from the<br /><span className="lp-blue">Legal Community</span></h2>
          </motion.div>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" custom={i} viewport={{ once: true }}>
                <TiltCard className="lp-testi-card" intensity={7}>
                  <div className="lp-testi-stars">
                    {Array(5).fill(0).map((_, si) => <span key={si} className="lp-star"><Icon.Star /></span>)}
                  </div>
                  <p className="lp-testi-text">"{t.text}"</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-av">{t.initials}</div>
                    <div>
                      <div className="lp-testi-name">{t.name}</div>
                      <div className="lp-testi-role">{t.role}</div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────── */}
      <section className="lp-cta-sec">
        <motion.div className="lp-cta-glow"
          animate={{ scale: [1,1.18,1], opacity: [0.5,0.9,0.5] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="lp-cta-inner" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="lp-tag lp-tag-blue">Free Registration Open</div>
          <h2 className="lp-cta-title">Ready to Elevate<br /><span className="lp-blue">Your Legal Practice?</span></h2>
          <p className="lp-cta-sub">Join thousands of Pakistani advocates who trust LawyerHub to manage their entire practice.</p>
          <motion.button className="lp-cta-primary lp-cta-xl" onClick={() => navigate(user ? '/dashboard' : '/login')}
            whileHover={{ scale: 1.06, boxShadow: '0 0 90px rgba(59,130,246,0.8)' }} whileTap={{ scale: 0.95 }}>
            <span>{user ? 'Go to Dashboard' : 'Create Your Free Account'}</span>
            <span className="lp-cta-arrow"><Icon.Arrow /></span>
          </motion.button>
          <div className="lp-cta-trust-row">
            {['No credit card required','Free to register','Cancel anytime','Instant access'].map((t, i) => (
              <motion.span key={i} className="lp-cta-trust-item"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                <span className="lp-cta-check"><Icon.Check /></span>{t}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── DESIGNER ANIMATED FOOTER ─────────────────────────── */}
      <footer className="lp-footer" style={{ position: 'relative', overflow: 'hidden', background: '#020407', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Subtle top ambient glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)'
        }} />

        <div className="lp-footer-inner" style={{ position: 'relative', zIndex: 2 }}>
          {/* Brand & QubitKode ownership column */}
          <motion.div className="lp-footer-brand" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="lp-logo" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
              <div className="lp-logo-icon">
                <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              </div>
              <span className="lp-logo-text">AI LawyerHub</span>
            </div>
            <p className="lp-footer-tagline" style={{ marginBottom: 16, color: 'rgba(203,213,225,0.6)', lineHeight: 1.6, fontSize: 13.5 }}>
              Pakistan's premier legal practice management platform.
              AI LawyerHub is proudly engineered, owned, and operated by <strong>QubitKode</strong>.
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6,
              fontSize: 13, color: 'rgba(203,213,225,0.8)'
            }}>
              <a href="mailto:contact@qubitkode.com" style={{ color: '#60A5FA', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                ✉ contact@qubitkode.com
              </a>
              <a href="https://wa.me/923304677732" target="_blank" rel="noreferrer" style={{ color: '#34D399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📞 +92 330 4677732
              </a>
            </div>
          </motion.div>

          {/* Nav Links columns */}
          <div className="lp-footer-links">
            <motion.div className="lp-footer-col" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h4>Company</h4>
              <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About Us</a>
              <a href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact Us</a>
              <a href="mailto:contact@qubitkode.com">QubitKode HQ</a>
            </motion.div>

            <motion.div className="lp-footer-col" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <h4>Legal & Policy</h4>
              <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms & Conditions</a>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Data Governance</a>
            </motion.div>

            <motion.div className="lp-footer-col" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <h4>Platform</h4>
              <a href="#features">AI Legal Research</a>
              <a href="#features">Smart Scheduling</a>
              <a href="#features">Court Hearing Tracker</a>
              <a href="#features">Law Library</a>
            </motion.div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="lp-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span>© {new Date().getFullYear()} AI LawyerHub · All Rights Reserved</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            Powered by <strong style={{ color: '#60A5FA' }}>QubitKode</strong> · Built for Advocates of Pakistan
          </span>
        </div>
      </footer>
    </div>
  );
}
