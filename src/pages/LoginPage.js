import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back, Counselor!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-orb" style={{
        width: 600, height: 600, top: -200, right: -100,
        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)'
      }} />
      <div className="auth-orb" style={{
        width: 400, height: 400, bottom: -100, left: -100,
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)'
      }} />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="auth-particle" style={{
          left: `${10 + i * 12}%`,
          animationDelay: `${i * 0.7}s`,
          width: i % 3 === 0 ? 4 : 2,
          height: i % 3 === 0 ? 4 : 2,
        }} />
      ))}

      <div className="auth-box" style={{ maxWidth: 460 }}>
        {/* Home button */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: 'rgba(148,163,184,0.8)',
              padding: '7px 14px', borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.14)'; e.currentTarget.style.color='#93C5FD'; e.currentTarget.style.borderColor='rgba(59,130,246,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.08)'; e.currentTarget.style.color='rgba(148,163,184,0.8)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.2)'; }}
          >
            <Home size={14} />
            Home
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 30px rgba(59,130,246,0.25)',
            animation: 'pulse-glow 2s infinite'
          }}>
            <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>AI LawyerHub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Sign in to manage your practice
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Email Address</label>
            <div className="input-wrap">
              <Mail size={16} className="icon-left" />
              <input
                type="email"
                className="input input-icon"
                placeholder="attorney@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <Lock size={16} className="icon-left" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input input-icon"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-dim)', display: 'flex'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary-light)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <>Sign In <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Security note */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 24, padding: '12px 14px',
          background: 'rgba(16,185,129,0.08)',
          borderRadius: 'var(--r-md)',
          border: '1px solid rgba(16,185,129,0.15)'
        }}>
          <Shield size={14} color="var(--emerald)" />
          <p style={{ fontSize: 12, color: 'var(--emerald)', margin: 0 }}>
            Encrypted & Secure — Your data is protected
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary-light)', fontWeight: 700, textDecoration: 'none' }}>
            Create Account
          </Link>
        </p>
      </div>

      <style>{`
        .auth-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(59,130,246,0.4);
          bottom: -10px;
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
