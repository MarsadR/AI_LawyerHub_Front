import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Clock, Users, TrendingUp, ArrowRight, CheckCircle2,
  AlertCircle, FileText, MessageSquare, Gavel, Bot, Shield,
  ChevronRight, Star, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function StatCard({ icon: Icon, value, label, color, change, delay }) {
  const colors = {
    blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
    purple: { bg: 'rgba(139,92,246,0.12)',  color: '#A78BFA' },
    green:  { bg: 'rgba(16,185,129,0.12)',   color: '#34D399' },
    gold:   { bg: 'rgba(245,158,11,0.12)',   color: '#FCD34D' },
    rose:   { bg: 'rgba(244,63,94,0.12)',    color: '#FB7185' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="stat-card animate-slide-up glass-card card-3d" style={{ animationDelay: `${delay}s` }}>
      <div className="stat-icon" style={{ background: c.bg, color: c.color, borderRadius: 14 }}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-value" style={{ color: c.color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
            <TrendingUp size={12} />
            {Math.abs(change)} from last week
          </div>
        )}
      </div>
    </div>
  );
}

function KYCAlert({ status, navigate }) {
  if (status === 'approved') return null;
  const cfg = {
    not_submitted: {
      bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#FCD34D',
      title: 'Complete Identity Verification', desc: 'Submit your KYC documents to start receiving clients.'
    },
    pending: {
      bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: '#93C5FD',
      title: 'Verification In Progress', desc: 'Our team is reviewing your credentials. Usually takes 24–48 hrs.'
    },
    rejected: {
      bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.25)', color: '#FB7185',
      title: 'KYC Rejected', desc: 'Your documents were rejected. Please resubmit with valid credentials.'
    },
  };
  const c = cfg[status] || cfg.not_submitted;
  return (
    <div onClick={() => navigate('/profile')} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 'var(--r-lg)', padding: '14px 18px',
      marginBottom: 24, cursor: 'pointer',
      transition: 'transform 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <Shield size={20} color={c.color} />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: c.color, marginBottom: 2 }}>{c.title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.desc}</p>
      </div>
      <ChevronRight size={16} color={c.color} />
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, API } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [kycStatus, setKycStatus] = useState(user?.kycStatus || 'not_submitted');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [aptRes, profRes] = await Promise.all([
        axios.get(`${API}/appointments/get`),
        axios.get(`${API}/lawyers/get`)
      ]);
      setAppointments(aptRes.data.data.appointments || []);
      setKycStatus(profRes.data.data.lawyer?.kycStatus || 'not_submitted');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Stats
  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const completed = appointments.filter(a => a.status === 'completed');

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
  const todayAppts = confirmed.filter(a => {
    if (!a.startTimeUtc) return false;
    const t = new Date(a.startTimeUtc);
    return t >= todayStart && t <= todayEnd;
  });

  const upcomingAppts = confirmed.filter(a => {
    if (!a.startTimeUtc) return false;
    return new Date(a.startTimeUtc) > new Date();
  }).slice(0, 5);

  const stats = [
    { icon: Calendar, value: todayAppts.length, label: "Today's Sessions", color: 'blue',   delay: 0.1 },
    { icon: Users,    value: pending.length,     label: 'Pending Requests', color: 'gold',   delay: 0.2 },
    { icon: CheckCircle2, value: confirmed.length, label: 'Confirmed',    color: 'green',  delay: 0.3 },
    { icon: Activity, value: completed.length,   label: 'Completed',       color: 'purple', delay: 0.4 },
  ];

  const quickActions = [
    { icon: Calendar,     label: 'Appointments', to: '/appointments', color: 'blue',   desc: 'Manage bookings' },
    { icon: Gavel,        label: 'Hearings',      to: '/hearings',     color: 'purple', desc: 'Court schedule' },
    { icon: MessageSquare,label: 'Messages',      to: '/chats',        color: 'green',  desc: 'Client chats' },
    { icon: Bot,          label: 'AI Assistant',  to: '/ai-chat',      color: 'gold',   desc: 'Legal AI' },
    { icon: FileText,     label: 'Case Files',    to: '/case-files',   color: 'rose',   desc: 'Documents' },
    { icon: Shield,       label: 'KYC / Profile', to: '/profile',      color: 'blue',   desc: 'Verification' },
  ];

  const colorMap = {
    blue: '#60A5FA', purple: '#A78BFA', green: '#34D399', gold: '#FCD34D', rose: '#FB7185'
  };

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      {/* Greeting */}
      <div className="animate-fade-in" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            Welcome back,{' '}
            <span style={{
              background: 'var(--grad-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {user?.name?.split(' ')[0] || 'Attorney'}
            </span>
          </h1>
          {kycStatus === 'approved' && (
            <span title="Verified" style={{ color: 'var(--emerald)', display: 'flex' }}>
              <CheckCircle2 size={22} />
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <KYCAlert status={kycStatus} navigate={navigate} />

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-2)' }}>Quick Actions</h2>
        <div className="grid-3" style={{ gap: 12 }}>
          {quickActions.map((a, i) => (
            <div
              key={i}
              className="glass-card animate-slide-up"
              style={{
                padding: '18px 20px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 14,
                animationDelay: `${0.1 + i * 0.07}s`
              }}
              onClick={() => navigate(a.to)}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `rgba(${colorMap[a.color] === '#60A5FA' ? '59,130,246' :
                  colorMap[a.color] === '#A78BFA' ? '139,92,246' :
                  colorMap[a.color] === '#34D399' ? '16,185,129' :
                  colorMap[a.color] === '#FCD34D' ? '245,158,11' : '244,63,94'},0.12)`,
                color: colorMap[a.color],
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <a.icon size={18} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{a.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</p>
              </div>
              <ChevronRight size={16} color="var(--text-dim)" />
            </div>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)' }}>Today's Appointments</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/appointments')}
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
            ))}
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="glass-card empty-state" style={{ minHeight: 160 }}>
            <Calendar size={40} style={{ opacity: 0.3 }} />
            <h3>No appointments today</h3>
            <p>Enjoy your free schedule!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayAppts.map((apt, i) => (
              <div
                key={apt._id}
                className="glass-card animate-slide-up"
                style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'center',
                  gap: 16, animationDelay: `${i * 0.08}s`, cursor: 'pointer'
                }}
                onClick={() => navigate('/appointments')}
              >
                <div style={{
                  minWidth: 64, textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: 16
                }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-light)' }}>
                    {new Date(apt.startTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: 'var(--text)' }}>
                    {apt.clientName || 'Client'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Consultation</p>
                </div>
                <span className="badge badge-green">Confirmed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
