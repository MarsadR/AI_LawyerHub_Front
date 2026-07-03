import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale, Mail, ArrowRight, ArrowLeft, Shield,
  Eye, EyeOff, Upload, Check, X, User,
  MapPin, Briefcase, Lock, Camera,
  Award, FileText, ChevronDown, Search, Loader2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Country, State, City } from 'country-state-city';

const API = 'http://localhost:4000';

const LAW_EXPERTISES = [
  "Family Law","Criminal Laws","Civil Laws","Corporate Laws",
  "Intellectual Property Law","Tax Law","Immigration Law",
  "Property & Real Estate Law","Insurance Law","Alternate Dispute Resolution",
  "Banking Laws","Consumer Protection Laws","Cyber Laws","Environmental Law",
  "International Law (Public & Private)","Islamic Banking","Islamic Jurisprudence",
  "Judgment Writing","Labour Laws","Law of Deeds and Conveyancing","Law of Trusts",
  "Media and Mass Communication Laws","Muhammadan Law","Negotiable Instruments Act",
  "The Law of Evidence","Arbitration and Conciliation Act","Business and Commercial Laws",
  "Constitutional Law","Company Laws","Constitutions of Various Countries",
  "Contract Act","Electronic Crimes","Forensic Science","Interpretation of Statutes",
  "Islamic Interpretation","Islamic Laws","Jurisprudence","Land Laws",
  "Law Of Limitation","Law of Writs","Money Laundering Laws","Muslim Personal Laws",
  "Specific Performance Act","Aviation Law","Health & Medical Law","Education Law"
];

const STEP_LABELS = [
  'Email','Verify','Profile','KYC','Security','Photo'
];

// ── Country selector modal ──────────────────────────────────────────────────
function CountryModal({ visible, onClose, onSelect, title }) {
  const [q, setQ] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    if (visible) {
      setCountries(Country.getAllCountries());
      setQ('');
    }
  }, [visible]);

  if (!visible) return null;
  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.phonecode?.includes(q)
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520,
          height: '75vh', display: 'flex', flexDirection: 'column',
          padding: '20px 24px 0', boxShadow: '0 -20px 60px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Select {title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="input-wrap" style={{ marginBottom: 12 }}>
          <Search size={15} className="icon-left" />
          <input className="input input-icon" value={q} onChange={e => setQ(e.target.value)}
            placeholder={`Search ${title}…`} style={{ fontSize: 14 }} autoFocus />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((c, i) => (
            <button key={i} onClick={() => { onSelect(c); onClose(); }}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 4px', textAlign: 'left', color: 'var(--text)',
                fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
              <span>{c.flag}</span>
              <span style={{ flex: 1 }}>{c.name}</span>
              {c.phonecode && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>+{c.phonecode}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── State / City selector modal ─────────────────────────────────────────────
function ListModal({ visible, onClose, onSelect, title, items }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (visible) setQ(''); }, [visible]);
  if (!visible) return null;
  const filtered = (items || []).filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520,
          height: '65vh', display: 'flex', flexDirection: 'column',
          padding: '20px 24px 0', boxShadow: '0 -20px 60px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18 }}>Select {title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="input-wrap" style={{ marginBottom: 12 }}>
          <Search size={15} className="icon-left" />
          <input className="input input-icon" value={q} onChange={e => setQ(e.target.value)}
            placeholder={`Search ${title}…`} style={{ fontSize: 14 }} autoFocus />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20, fontSize: 13 }}>No results</p>
            : filtered.map((c, i) => (
              <button key={i} onClick={() => { onSelect(c); onClose(); }}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '12px 4px', textAlign: 'left', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
                  borderBottom: '1px solid var(--border)'
                }}>
                {c.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── Password strength bars ──────────────────────────────────────────────────
function StrengthBars({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[@$!%*?&]/.test(password)
  ];
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
  const filled = checks.filter(Boolean).length;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {checks.map((ok, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < filled ? colors[Math.min(filled - 1, 3)] : 'var(--border)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
        {['', 'Weak', 'Fair', 'Good', 'Strong'][filled]} password
        {filled < 4 && ' — need uppercase, number & special char'}
      </p>
    </div>
  );
}

// ── KYC notice modal shown on page load ────────────────────────────────────
function KYCNoticeModal({ visible, onClose }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 28, padding: 36, maxWidth: 400, width: '100%',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        animation: 'slide-up 0.4s ease-out'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.2), transparent 70%)'
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
          border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', position: 'relative'
        }}>
          <Award size={36} color="#3B82F6" />
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 12 }}>Lawyer Verification</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          To join our professional network, please ensure you have your{' '}
          <strong style={{ color: 'var(--text)' }}>ID / Passport</strong> and{' '}
          <strong style={{ color: 'var(--text)' }}>Bar Certificate</strong> ready for verification.
        </p>
        <button
          onClick={onClose}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          I'm Ready <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Reusable field wrapper ──────────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && <label className="form-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</label>}
      {children}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kycVisible, setKycVisible] = useState(true);

  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+1');
  const [country, setCountry] = useState(null);
  const [stateVal, setStateVal] = useState(null);
  const [city, setCity] = useState(null);
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [expertises, setExpertises] = useState([]);
  const [idPassport, setIdPassport] = useState(null);   // { file, preview }
  const [barCert, setBarCert] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null); // { file, preview }

  // Location modal states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [countryModal, setCountryModal] = useState(false);
  const [phoneModal, setPhoneModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [cityModal, setCityModal] = useState(false);

  // Load states when country changes
  useEffect(() => {
    if (!country) { setStates([]); setCities([]); setStateVal(null); setCity(null); return; }
    setStates(State.getStatesOfCountry(country.isoCode));
    setStateVal(null); setCity(null);
  }, [country]);

  useEffect(() => {
    if (!stateVal || !country) { setCities([]); setCity(null); return; }
    setCities(City.getCitiesOfState(country.isoCode, stateVal.isoCode));
    setCity(null);
  }, [stateVal, country]);

  const fileToPreview = (file) => ({ file, preview: URL.createObjectURL(file) });

  const pickFile = (setter) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      if (e.target.files[0]) setter(fileToPreview(e.target.files[0]));
    };
    input.click();
  };

  const nextStep = () => { setError(''); setStep(s => s + 1); };
  const prevStep = () => { if (step === 1) navigate('/login'); else setStep(s => s - 1); };

  // ── Step 1: Email → Send OTP ──────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/lawyers/send-otp`, { email: email.trim().toLowerCase() });
      if (res.data.success !== false) { toast.success('OTP sent to your email!'); nextStep(); }
      else setError(res.data.message || 'Failed to send OTP.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Network error. Check your connection.');
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/lawyers/verify-otp`, { email: email.trim().toLowerCase(), otp });
      if (res.data.success !== false) { toast.success('Email verified!'); nextStep(); }
      else setError(res.data.message || 'Invalid code.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed.');
    } finally { setLoading(false); }
  };

  // ── Step 3: Personal info validation ────────────────────────────────────
  const handleStep3Next = () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!country) { setError('Please select your country.'); return; }
    if (!bio.trim()) { setError('Please add a short bio.'); return; }
    nextStep();
  };

  // ── Step 4: KYC validation ───────────────────────────────────────────────
  const handleStep4Next = () => {
    if (!idPassport) { setError('Please upload your ID / Passport.'); return; }
    if (!barCert) { setError('Please upload your Bar Certificate.'); return; }
    nextStep();
  };

  // ── Step 5: Password validation ──────────────────────────────────────────
  const handleStep5Next = () => {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    if (!strong) { setError('Password must have uppercase, number & special character, min 8 chars.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    nextStep();
  };

  // ── Step 6: Final submit ─────────────────────────────────────────────────
  const handleFinalSignup = async () => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('email', email.trim().toLowerCase());
      fd.append('password', password);
      fd.append('name', name.trim());
      fd.append('username', username.trim().toLowerCase());
      fd.append('phone', `${phoneCode} ${phone.trim()}`);
      fd.append('country', country?.name || '');
      fd.append('city', city?.name || stateVal?.name || '');
      fd.append('bio', bio);
      fd.append('description', description);
      fd.append('experienceYears', experienceYears || '0');
      fd.append('officeAddress', officeAddress);
      expertises.forEach(e => fd.append('practiceAreas[]', e));
      if (profilePhoto) fd.append('profilePhoto', profilePhoto.file);
      if (idPassport) fd.append('idPassport', idPassport.file);
      if (barCert) fd.append('barCertificate', barCert.file);

      const res = await axios.post(`${API}/lawyers/create`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const { token } = res.data.data;
        localStorage.setItem('lh_lawyer_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        toast.success('Welcome to LawyerHub! 🎉');
        navigate('/dashboard');
        window.location.reload();
      } else {
        setError(res.data.message || 'Signup failed.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Step renders ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="signup-step">
      <div className="signup-step-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
        <Mail size={26} color="#3B82F6" />
      </div>
      <h2 className="signup-step-title">Email <span style={{ color: 'var(--primary-light)' }}>Verification</span></h2>
      <p className="signup-step-sub">We need to verify your identity before you join our professional network.</p>
      <Field label="Email Address">
        <div className="input-wrap">
          <Mail size={15} className="icon-left" />
          <input type="email" className="input input-icon" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="attorney@example.com"
            onKeyDown={e => e.key === 'Enter' && handleSendOTP()} />
        </div>
      </Field>
      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={handleSendOTP} disabled={loading}>
        {loading ? <Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <><span>Send Verification Code</span><ArrowRight size={18} /></>}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="signup-step">
      <div className="signup-step-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
        <Mail size={26} color="#10B981" />
      </div>
      <h2 className="signup-step-title">Check Your <span style={{ color: 'var(--primary-light)' }}>Inbox</span></h2>
      <p className="signup-step-sub">Enter the 6-digit code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong></p>
      <Field label="One-Time Code">
        <input
          className="input"
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000" maxLength={6}
          style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 16, width: '100%' }}
          onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} />
      </Field>
      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={handleVerifyOTP} disabled={loading}>
        {loading ? <Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <><span>Verify Email</span><ArrowRight size={18} /></>}
      </button>
      <button onClick={handleSendOTP} style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 13, cursor: 'pointer', marginTop: 12, width: '100%' }}>
        Resend code
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="signup-step signup-step-scroll">
      <h2 className="signup-step-title">Personal <span style={{ color: 'var(--primary-light)' }}>Profile</span></h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Full Name" style={{ marginBottom: 0 }}>
          <div className="input-wrap">
            <User size={15} className="icon-left" />
            <input className="input input-icon" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
        </Field>
        <Field label="Username" style={{ marginBottom: 0 }}>
          <div className="input-wrap">
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>@</span>
            <input className="input input-icon" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder="johndoe" />
          </div>
        </Field>
      </div>

      <Field label="Phone Number" style={{ marginTop: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', overflow: 'hidden', height: 46,
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <button type="button" onClick={() => setPhoneModal(true)}
            style={{
              background: 'rgba(255,255,255,0.04)', border: 'none',
              borderRight: '1px solid var(--border)',
              height: '100%', padding: '0 14px', cursor: 'pointer',
              color: 'var(--text)', display: 'flex', alignItems: 'center',
              gap: 6, fontSize: 13, fontWeight: 700, flexShrink: 0
            }}>
            {phoneCode} <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="234 567 890"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 14, padding: '0 14px', height: '100%',
              fontFamily: 'inherit'
            }} />
        </div>
      </Field>

      <Field label="Country">
        <button type="button" className="input" onClick={() => setCountryModal(true)}
          style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <span style={{ color: country ? 'var(--text)' : 'var(--text-muted)' }}>
            {country ? `${country.flag} ${country.name}` : 'Select Country'}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Province / State" style={{ marginBottom: 0 }}>
          <button type="button" className="input" onClick={() => country && setStateModal(true)}
            disabled={!country}
            style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: country ? 'pointer' : 'default', opacity: country ? 1 : 0.5 }}>
            <span style={{ color: stateVal ? 'var(--text)' : 'var(--text-muted)', fontSize: 13 }}>{stateVal?.name || 'Select'}</span>
            <ChevronDown size={13} />
          </button>
        </Field>
        <Field label="City" style={{ marginBottom: 0 }}>
          <button type="button" className="input" onClick={() => stateVal && setCityModal(true)}
            disabled={!stateVal}
            style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: stateVal ? 'pointer' : 'default', opacity: stateVal ? 1 : 0.5 }}>
            <span style={{ color: city ? 'var(--text)' : 'var(--text-muted)', fontSize: 13 }}>{city?.name || 'Select'}</span>
            <ChevronDown size={13} />
          </button>
        </Field>
      </div>

      <Field label="Short Bio" style={{ marginTop: 14 }}>
        <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)}
          placeholder="Tell clients about yourself…" style={{ resize: 'none', lineHeight: 1.5 }} />
      </Field>

      <Field label="Full Description (Optional)">
        <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Your practice history, education, achievements…" style={{ resize: 'none', lineHeight: 1.5 }} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Experience (Years)" style={{ marginBottom: 0 }}>
          <div className="input-wrap">
            <Briefcase size={15} className="icon-left" />
            <input className="input input-icon no-spinners" type="number" min="0" max="60"
              value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="5" />
          </div>
        </Field>
        <Field label="Office Address" style={{ marginBottom: 0 }}>
          <div className="input-wrap">
            <MapPin size={15} className="icon-left" />
            <input className="input input-icon" value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Suite 500, Legal Plaza" />
          </div>
        </Field>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
        onClick={handleStep3Next}>
        Next: KYC Documents <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className="signup-step signup-step-scroll">
      <div className="signup-step-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
        <FileText size={26} color="#8B5CF6" />
      </div>
      <h2 className="signup-step-title">Professional <span style={{ color: 'var(--primary-light)' }}>KYC</span></h2>
      <p className="signup-step-sub">Upload your verification documents to get verified on our platform.</p>

      <p className="form-label" style={{ marginBottom: 10 }}>Verification Documents</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'ID / Passport', icon: <User size={28} />, state: idPassport, setter: setIdPassport },
          { label: 'Bar Certificate', icon: <Award size={28} />, state: barCert, setter: setBarCert }
        ].map(({ label, icon, state, setter }) => (
          <button key={label} type="button" onClick={() => pickFile(setter)}
            style={{
              border: `2px dashed ${state ? '#3B82F6' : 'var(--border)'}`,
              borderRadius: 16, padding: 20, cursor: 'pointer', background: state ? 'rgba(59,130,246,0.06)' : 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'all 0.2s', position: 'relative', overflow: 'hidden', minHeight: 120
            }}>
            {state ? (
              <>
                <img src={state.preview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} color="#fff" />
                </div>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
                <Upload size={14} style={{ color: 'var(--text-dim)' }} />
              </>
            )}
          </button>
        ))}
      </div>

      <p className="form-label" style={{ marginBottom: 12 }}>Areas of Expertise</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {LAW_EXPERTISES.map(exp => {
          const active = expertises.includes(exp);
          return (
            <button key={exp} type="button"
              onClick={() => setExpertises(s => active ? s.filter(x => x !== exp) : [...s, exp])}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                border: `1px solid ${active ? '#3B82F6' : 'var(--border)'}`,
                background: active ? '#3B82F6' : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
              {exp}
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
        onClick={handleStep4Next}>
        Next: Security <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep5 = () => (
    <div className="signup-step">
      <div className="signup-step-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
        <Shield size={26} color="#10B981" />
      </div>
      <h2 className="signup-step-title">Security <span style={{ color: 'var(--primary-light)' }}>Shield</span></h2>
      <p className="signup-step-sub">Set a strong password to protect your account.</p>

      <Field label="Password">
        <div className="input-wrap">
          <Lock size={15} className="icon-left" />
          <input type={showPw ? 'text' : 'password'} className="input input-icon"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mixed case, numbers & special"
            style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <StrengthBars password={password} />
      </Field>

      <Field label="Confirm Password">
        <div className="input-wrap">
          <Lock size={15} className="icon-left" />
          <input type={showCpw ? 'text' : 'password'} className="input input-icon"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowCpw(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirmPassword && (
          <p style={{ fontSize: 11, marginTop: 4, color: password === confirmPassword ? '#10B981' : '#EF4444' }}>
            {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </Field>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
        onClick={handleStep5Next}>
        Next: Profile Photo <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderStep6 = () => (
    <div className="signup-step" style={{ alignItems: 'center', textAlign: 'center' }}>
      <div className="signup-step-icon" style={{ background: 'rgba(245,158,11,0.12)', margin: '0 auto' }}>
        <Camera size={26} color="#F59E0B" />
      </div>
      <h2 className="signup-step-title" style={{ textAlign: 'center' }}>Final <span style={{ color: 'var(--primary-light)' }}>Touch</span></h2>
      <p className="signup-step-sub" style={{ textAlign: 'center' }}>Your profile photo is how clients will recognise you. <em>(Optional)</em></p>

      <button type="button" onClick={() => pickFile(setProfilePhoto)}
        style={{
          width: 160, height: 160, borderRadius: '50%',
          border: '3px dashed var(--border)', cursor: 'pointer',
          background: 'var(--surface-2)', overflow: 'hidden',
          position: 'relative', margin: '20px auto 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8
        }}>
        {profilePhoto ? (
          <img src={profilePhoto.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--grad-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{name.charAt(0).toUpperCase() || 'L'}</span>
            </div>
            <Camera size={16} style={{ color: 'var(--text-muted)' }} />
          </>
        )}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 32, height: 32, borderRadius: '50%',
          background: '#3B82F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid var(--bg)'
        }}>
          <Camera size={14} color="#fff" />
        </div>
      </button>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 340, justifyContent: 'center' }}
        onClick={handleFinalSignup} disabled={loading}>
        {loading
          ? <><Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Creating Account…</>
          : <><Check size={18} /> Complete Signup</>}
      </button>
      {!profilePhoto && (
        <button onClick={handleFinalSignup} disabled={loading}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginTop: 12 }}>
          Skip for now
        </button>
      )}
    </div>
  );

  return (
    <div className="auth-page" style={{ minHeight: '100vh', alignItems: 'flex-start', padding: '24px 16px' }}>
      {/* Background orbs */}
      <div className="auth-orb" style={{ width: 500, height: 500, top: -150, right: -100, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
      <div className="auth-orb" style={{ width: 350, height: 350, bottom: -80, left: -80, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

      <KYCNoticeModal visible={kycVisible} onClose={() => setKycVisible(false)} />

      {/* Country / Phone / State / City modals */}
      <CountryModal visible={countryModal} onClose={() => setCountryModal(false)} title="Country"
        onSelect={c => { setCountry(c); setPhoneCode(`+${c.phonecode}`); }} />
      <CountryModal visible={phoneModal} onClose={() => setPhoneModal(false)} title="Phone Code"
        onSelect={c => setPhoneCode(`+${c.phonecode}`)} />
      <ListModal visible={stateModal} onClose={() => setStateModal(false)} title="Province / State"
        items={states} onSelect={setStateVal} />
      <ListModal visible={cityModal} onClose={() => setCityModal(false)} title="City"
        items={cities} onSelect={setCity} />

      <div className="auth-box" style={{ maxWidth: 580, width: '100%', margin: '0 auto', padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={prevStep}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>

          {/* Step progress bars */}
          <div style={{ flex: 1, display: 'flex', gap: 5 }}>
            {STEP_LABELS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step > i ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.4s'
              }} />
            ))}
          </div>

          <div style={{ flexShrink: 0 }}>
            <Scale size={22} color="var(--primary-light)" />
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
          Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
        </p>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <X size={14} color="#EF4444" />
            <p style={{ color: '#EF4444', fontSize: 13, margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}

        {step === 1 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
          </p>
        )}
      </div>

      <style>{`
        .signup-step { display: flex; flex-direction: column; }
        .signup-step-scroll { max-height: 65vh; overflow-y: auto; padding-right: 4px; }
        .signup-step-icon {
          width: 64px; height: 64px; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .signup-step-title { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
        .signup-step-sub { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
        .signup-step-scroll::-webkit-scrollbar { width: 4px; }
        .signup-step-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        /* Hide number spin buttons */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
