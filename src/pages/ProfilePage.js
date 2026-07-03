import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera, Edit2, Save, Shield, MapPin,
  Award, Star, CheckCircle2,
  Briefcase, X, Check, Upload, User, Clock, ShieldCheck, Sparkles,
  Trash2, AlertTriangle, KeyRound
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';


const LAW_TYPES = [
  'Constitutional Law','Criminal Law','Civil Law','Family Law',
  'Corporate Law','Property Law','Tax Law','Labor Law',
  'Environmental Law','International Law','Immigration Law',
  'Intellectual Property','Banking Law','Contract Law',
];

function ExpertiseModal({ selected, onClose, onSave }) {
  const [current, setCurrent] = useState(selected || []);
  const toggle = (item) => setCurrent(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Update Specializations</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
          {LAW_TYPES.map(item => (
            <div
              key={item}
              onClick={() => toggle(item)}
              style={{
                padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: current.includes(item) ? 'rgba(59,130,246,0.1)' : 'var(--surface-2)',
                border: `1px solid ${current.includes(item) ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: 14, color: current.includes(item) ? 'var(--primary-light)' : 'var(--text-2)' }}>
                {item}
              </span>
              {current.includes(item) && <CheckCircle2 size={16} color="var(--primary-light)" />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(current)}>
            <Check size={16} /> Save ({current.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailabilityEditor({ lawyerId }) {
  const DAYS = [
    { label: 'Sun', value: 0, full: 'Sunday' },
    { label: 'Mon', value: 1, full: 'Monday' },
    { label: 'Tue', value: 2, full: 'Tuesday' },
    { label: 'Wed', value: 3, full: 'Wednesday' },
    { label: 'Thu', value: 4, full: 'Thursday' },
    { label: 'Fri', value: 5, full: 'Friday' },
    { label: 'Sat', value: 6, full: 'Saturday' },
  ];

  const { API, user } = useAuth();
  const targetId = lawyerId || user?._id;

  const [loadingSlots, setLoadingSlots] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState([]);

  // Form State
  const [selectedDays, setSelectedDays] = useState([]);
  const [isFullDay, setIsFullDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const fetchSlots = useCallback(async () => {
    if (!targetId) return;
    try {
      const res = await axios.get(`${API}/lawyers/${targetId}/availability`);
      if (res.data?.data?.slots) {
        setSlots(res.data.data.slots);
      } else if (Array.isArray(res.data)) {
        setSlots(res.data);
      }
    } catch (err) {
      console.warn('Fetch availability error:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, [API, targetId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const toggleDay = (val) => {
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (selectedDays.length === 0) {
      return toast.error('Please select at least one day.');
    }

    setSaving(true);
    try {
      const payload = {
        type: 'recurring_day',
        isFullDay,
        dayOfWeek: selectedDays,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      if (!isFullDay) {
        payload.startTime = startTime;
        payload.endTime = endTime;
      }

      const res = await axios.post(`${API}/lawyers/availability`, payload);
      if (res.status === 200 || res.status === 201) {
        toast.success('Availability schedule updated!');
        setSelectedDays([]);
        fetchSlots();
      } else {
        toast.error(res.data?.message || 'Failed to save availability.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API}/lawyers/availability/${slotId}`);
      toast.success('Slot removed');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to remove slot');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Configure Availability Card */}
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Repeat On Days */}
        <div>
          <label className="form-label" style={{ fontWeight: 800, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, display: 'block', color: 'var(--text-muted)' }}>
            REPEAT ON DAYS
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DAYS.map(d => {
              const active = selectedDays.includes(d.value);
              return (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    border: active ? '1px solid #3B82F6' : '1px solid var(--border)',
                    background: active ? 'var(--grad-primary)' : 'var(--surface)',
                    color: active ? '#fff' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 0 16px rgba(59,130,246,0.35)' : 'none'
                  }}
                  title={d.full}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 24 Hours Toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)'
        }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'block' }}>
              Available 24 Hours
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Mark selected days as open all day and night
            </span>
          </div>
          <div
            onClick={() => setIsFullDay(f => !f)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: isFullDay ? 'var(--emerald)' : 'var(--surface-3)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 10, background: '#fff',
              position: 'absolute', top: 2,
              left: isFullDay ? 22 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
            }} />
          </div>
        </div>

        {/* Time Frame Selection */}
        {!isFullDay && (
          <div>
            <label className="form-label" style={{ fontWeight: 800, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, display: 'block', color: 'var(--text-muted)' }}>
              WORKING TIME WINDOW
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>Start Time</span>
                <input
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{ width: '100%', fontSize: 14, fontWeight: 600, padding: '10px 14px' }}
                />
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 18 }}>to</span>
              <div style={{ flex: 1, minWidth: 140 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4, display: 'block' }}>End Time</span>
                <input
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={{ width: '100%', fontSize: 14, fontWeight: 600, padding: '10px 14px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || selectedDays.length === 0}
          style={{ width: '100%', justifyContent: 'center', height: 46, fontSize: 14, fontWeight: 800 }}
        >
          {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={16} /> Save Availability Schedule</>}
        </button>
      </div>

      {/* Current Active Schedule List */}
      <div>
        <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="#60A5FA" /> Current Active Schedule ({slots.length})
        </h4>

        {loadingSlots ? (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading schedule…</p>
        ) : slots.length === 0 ? (
          <div style={{
            background: 'var(--surface-2)', border: '1px dashed var(--border)',
            borderRadius: 14, padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13
          }}>
            No active availability slots set yet. Select days above and save to enable client bookings!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.map(s => {
              const dayObj = DAYS.find(d => d.value === s.dayOfWeek) || DAYS.find(d => Array.isArray(s.dayOfWeek) && s.dayOfWeek.includes(d.value));
              const dayLabel = s.type === 'recurring_day'
                ? (Array.isArray(s.dayOfWeek)
                    ? s.dayOfWeek.map(dw => DAYS.find(d => d.value === dw)?.full).filter(Boolean).join(', ')
                    : (dayObj ? dayObj.full : `Day ${s.dayOfWeek}`))
                : new Date(s.startTimeUtc).toLocaleDateString();

              const timeLabel = s.isFullDay
                ? 'Available 24 Hours'
                : `${s.startTime || '09:00'} - ${s.endTime || '17:00'}`;

              return (
                <div
                  key={s._id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: 16
                  }}
                >
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', display: 'block' }}>
                      {dayLabel}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                      {timeLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(s._id)}
                    style={{
                      background: 'rgba(244,63,94,0.1)',
                      border: '1px solid rgba(244,63,94,0.2)',
                      borderRadius: 10,
                      width: 36, height: 36,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#F43F5E', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="Remove slot"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { refreshProfile, API, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [expertiseModal, setExpertiseModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeSection, setActiveSection] = useState('profile'); // profile | availability | kyc
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);

  const fetchReviews = useCallback(async (lawyerId) => {
    try {
      const res = await axios.get(`${API}/lawyers/${lawyerId}/reviews`);
      if (res.data.success) {
        setReviews(res.data.data.reviews || []);
      }
    } catch (err) {
      console.warn("Reviews fetch error", err);
    }
  }, [API]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/lawyers/get`);
      const data = res.data.data.lawyer;
      setProfile(data);
      setForm({
        name: data.name || '',
        username: data.username || '',
        phone: data.phone || '',
        city: data.city || '',
        bio: data.bio || '',
        experienceYears: data.experienceYears || '',
        consultationFee: data.consultationFee || '',
        practiceAreas: data.practiceAreas || [],
        description: data.description || '',
        officeAddress: data.officeAddress || '',
      });
      if (data._id) {
        fetchReviews(data._id);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [API, fetchReviews]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/lawyers/update`, form);
      toast.success('Profile updated!');
      setEditMode(false);
      fetchProfile();
      refreshProfile();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profilePhoto', file);
    try {
      await axios.put(`${API}/lawyers/update`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile photo updated!');
      fetchProfile();
      refreshProfile();
    } catch {
      toast.error('Photo upload failed');
    }
  };

  const handleExpertiseSave = async (newExp) => {
    try {
      await axios.put(`${API}/lawyers/update`, { practiceAreas: newExp });
      toast.success('Expertise updated!');
      setExpertiseModal(false);
      fetchProfile();
    } catch {
      toast.error('Update failed');
    }
  };

  const kycCfg = {
    approved:      { color: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Verified' },
    pending:       { color: '#93C5FD', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)', label: 'Under Review' },
    rejected:      { color: '#FB7185', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)', label: 'Rejected' },
    not_submitted: { color: '#FCD34D', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Not Submitted' },
  };
  const kyc = kycCfg[profile?.kycStatus || 'not_submitted'];

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'LW';

  if (loading) return (
    <div style={{ padding: 32 }}>
      {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 16 }} />)}
    </div>
  );

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 900, margin: '0 auto' }}>
      {/* Profile hero card */}
      <div className="glass-card animate-slide-up" style={{ padding: '28px 28px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {/* Gradient banner */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'rgba(59, 130, 246, 0.15)'
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', marginTop: 20 }}>
            <div className="avatar-placeholder" style={{ width: 80, height: 80, fontSize: 26, borderRadius: 20, border: '3px solid var(--bg-2)', overflow: 'hidden', position: 'relative' }}>
              {profile?.profilePhotoUrl
                ? <img src={profile.profilePhotoUrl.startsWith('http') ? profile.profilePhotoUrl : `${API}/${profile.profilePhotoUrl}`} alt="" style={{ width: 80, height: 80, borderRadius: 18, objectFit: 'cover' }} />
                : initials
              }
              <label style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer'
              }}
              className="photo-overlay"
              >
                <Camera size={20} color="#fff" />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
            </div>
            {profile?.verifiedBadge && (
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                background: 'var(--emerald)', borderRadius: '50%',
                border: '2px solid var(--bg-2)', zIndex: 10,
                width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircle2 size={12} color="#fff" fill="#fff" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                {profile?.name || 'Attorney'}
              </h2>
              {profile?.verifiedBadge && <Shield size={18} color="#10B981" fill="#10B981" />}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>@{profile?.username || 'user'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {profile?.city && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {profile.city}
                </span>
              )}
              <span style={{
                padding: '3px 10px', borderRadius: 'var(--r-full)',
                fontSize: 12, fontWeight: 600,
                background: kyc.bg, color: kyc.color, border: `1px solid ${kyc.border}`
              }}>
                <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                {kyc.label}
              </span>
            </div>
          </div>

          <button
            className={`btn ${editMode ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'}`}
            onClick={() => setEditMode(e => !e)}
          >
            {editMode ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
          {[
            { label: 'Experience', value: profile?.experienceYears ? `${profile.experienceYears} yrs` : '—', icon: Briefcase },
            { label: 'Consultation Fee', value: profile?.consultationFee ? `PKR ${profile.consultationFee}` : '—', icon: Award },
            { label: 'Specializations', value: profile?.practiceAreas?.length || 0, icon: Star },
            { label: 'Rating', value: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '5.0', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ flex: '1 1 120px', minWidth: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HIGH PRIORITY FOCUS PROFILE TABS ── */}
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '8px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            {
              key: 'profile',
              label: 'Profile Info',
              sub: 'Basic Details & Bio',
              icon: User,
              grad: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              activeGlow: '0 0 24px rgba(59,130,246,0.45)',
              borderActive: 'rgba(59,130,246,0.5)'
            },
            {
              key: 'availability',
              label: 'Availability Schedule',
              sub: 'Required for Client Bookings',
              badge: 'IMPORTANT',
              badgeColor: '#34D399',
              badgeBg: 'rgba(16,185,129,0.15)',
              icon: Clock,
              grad: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
              activeGlow: '0 0 24px rgba(16,185,129,0.45)',
              borderActive: 'rgba(16,185,129,0.5)'
            },
            {
              key: 'kyc',
              label: 'KYC & Bar Documents',
              sub: 'Verified Advocate Badge',
              badge: profile?.kycStatus === 'approved' ? 'VERIFIED' : 'ACTION REQUIRED',
              badgeColor: profile?.kycStatus === 'approved' ? '#60A5FA' : '#F59E0B',
              badgeBg: profile?.kycStatus === 'approved' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
              icon: ShieldCheck,
              grad: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
              activeGlow: '0 0 24px rgba(245,158,11,0.45)',
              borderActive: 'rgba(245,158,11,0.5)'
            },
          ].map(s => {
            const isActive = activeSection === s.key;
            const Icon = s.icon;
            return (
              <motion.button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: '1 1 200px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderRadius: 14,
                  border: isActive ? `1px solid ${s.borderActive}` : '1px solid var(--border)',
                  background: isActive ? s.grad : 'var(--surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  boxShadow: isActive ? s.activeGlow : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} color={isActive ? '#fff' : 'var(--text-muted)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? '#fff' : 'var(--text)' }}>
                      {s.label}
                    </span>
                    {s.badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 900, padding: '2px 7px', borderRadius: 99,
                        background: isActive ? 'rgba(255,255,255,0.25)' : s.badgeBg,
                        color: isActive ? '#fff' : s.badgeColor,
                        textTransform: 'uppercase', letterSpacing: 0.5
                      }}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)', fontWeight: 500, display: 'block', marginTop: 2 }}>
                    {s.sub}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Informative Advocate Notice Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)',
          fontSize: 12.5, color: 'var(--text-muted)'
        }}>
          <Sparkles size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#60A5FA' }}>Advocate Practice Tip:</strong> Keep your <strong>Availability Schedule</strong> updated so clients can book appointments with you directly from the mobile app.
          </span>
        </div>
      </div>

      {/* Profile Info */}
      {activeSection === 'profile' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'name',            label: 'Full Name',           type: 'text' },
              { key: 'username',        label: 'Username (@)',        type: 'text', readOnly: true },
              { key: 'phone',           label: 'Phone Number',        type: 'tel' },
              { key: 'city',            label: 'City',                type: 'text' },
              { key: 'experienceYears', label: 'Years of Experience', type: 'number' },
              { key: 'consultationFee', label: 'Consultation Fee (PKR)', type: 'number' },
              { key: 'officeAddress',   label: 'Office Location',     type: 'text' },
            ].map(({ key, label, type, readOnly }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                {editMode ? (
                  <input
                    type={type}
                    className="input"
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={label}
                    disabled={readOnly}
                    style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text)', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    {profile?.[key] || <span style={{ color: 'var(--text-dim)' }}>Not set</span>}
                  </p>
                )}
              </div>
            ))}

            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Biography</label>
              {editMode ? (
                <textarea
                  className="input"
                  rows={3}
                  value={form.bio || ''}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell clients about yourself..."
                />
              ) : (
                <p style={{ fontSize: 14, color: profile?.bio ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.7 }}>
                  {profile?.bio || 'No biography added yet.'}
                </p>
              )}
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Professional Background</label>
              {editMode ? (
                <textarea
                  className="input"
                  rows={4}
                  value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Details about your professional background, past cases, education..."
                />
              ) : (
                <p style={{ fontSize: 14, color: profile?.description ? 'var(--text)' : 'var(--text-dim)', lineHeight: 1.7 }}>
                  {profile?.description || 'No background details added yet.'}
                </p>
              )}
            </div>
          </div>

          {/* Expertise */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Specializations</label>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpertiseModal(true)}>
                <Edit2 size={12} /> Edit
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(profile?.practiceAreas || []).length === 0 ? (
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>No specializations added</span>
              ) : (
                (profile?.practiceAreas || []).map(e => (
                  <span key={e} className="badge badge-blue">{e}</span>
                ))
              )}
            </div>
          </div>

          {editMode && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          )}

          {/* Client Reviews Section */}
          <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: 'var(--text)' }}>CLIENT REVIEWS</h3>
            {reviews.length === 0 ? (
              <div style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '24px 16px', textAlign: 'center', color: 'var(--text-dim)'
              }}>
                No reviews received yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((rev) => (
                  <div key={rev._id} style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{rev.clientName}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={13} fill={star <= rev.rating ? "#F59E0B" : "none"} color="#F59E0B" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability */}
      {activeSection === 'availability' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Set Your Schedule</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
            Configure when clients can book consultations with you
          </p>
          <AvailabilityEditor lawyerId={profile?._id} />
        </div>
      )}

      {/* KYC */}
      {activeSection === 'kyc' && (
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Identity Verification (KYC)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            Upload your credentials to get verified and unlock full access
          </p>

          {/* Status banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 'var(--r-md)',
            background: kyc.bg, border: `1px solid ${kyc.border}`,
            marginBottom: 20
          }}>
            <Shield size={20} color={kyc.color} />
            <div>
              <p style={{ fontWeight: 700, color: kyc.color }}>{kyc.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {profile?.kycStatus === 'approved' && 'Your identity has been verified successfully.'}
                {profile?.kycStatus === 'pending' && 'Documents are being reviewed. Usually 24-48 hours.'}
                {profile?.kycStatus === 'rejected' && 'Please re-upload valid documents.'}
                {(!profile?.kycStatus || profile?.kycStatus === 'not_submitted') && 'Upload CNIC and bar council certificate to get started.'}
              </p>
            </div>
          </div>

          {/* Upload area - only if not approved */}
          {profile?.kycStatus !== 'approved' && (
            <KYCUpload API={API} onDone={() => { fetchProfile(); refreshProfile(); }} />
          )}
        </div>
      )}

      {/* ── DANGER ZONE: DELETE ACCOUNT ── */}
      <div style={{
        marginTop: 40,
        background: 'rgba(244,63,94,0.04)',
        border: '1px solid rgba(244,63,94,0.2)',
        borderRadius: 20,
        padding: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#F43F5E', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> Danger Zone: Delete Advocate Account
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
            Permanently delete your profile, case files, hearing records, and availability schedules. Once deleted, this data cannot be recovered.
          </p>
        </div>
        <motion.button
          className="btn"
          onClick={() => setDeleteModal(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: 'rgba(244,63,94,0.15)',
            color: '#F43F5E',
            border: '1px solid rgba(244,63,94,0.3)',
            fontWeight: 800,
            fontSize: 13,
            padding: '10px 18px',
            borderRadius: 12
          }}
        >
          <Trash2 size={16} /> Delete Account
        </motion.button>
      </div>

      {expertiseModal && (
        <ExpertiseModal
          selected={profile?.practiceAreas}
          onClose={() => setExpertiseModal(false)}
          onSave={handleExpertiseSave}
        />
      )}

      {deleteModal && (
        <DeleteAccountModal
          onClose={() => setDeleteModal(false)}
          API={API}
          logout={logout}
          navigate={navigate}
        />
      )}
    </div>
  );
}

function DeleteAccountModal({ onClose, API, logout, navigate }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password) {
      return setError('Please enter your password to confirm account deletion.');
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/lawyers/delete`, { password });
      if (res.data.ok || res.data.success !== false) {
        toast.success('Your account has been permanently deleted.');
        localStorage.removeItem('lh_lawyer_token');
        logout();
        navigate('/login');
        window.location.reload();
      } else {
        setError(res.data.message || 'Deletion failed. Check your password.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid password. Account deletion failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460, border: '1px solid rgba(244,63,94,0.3)', padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F43F5E'
          }}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
          Delete Advocate Account?
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          This action is <strong>permanent and irreversible</strong>. All your case files, hearing logs, consultation records, availability schedules, and client messages will be permanently erased.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
            color: '#F87171', fontSize: 13, marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleDelete}>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
              Enter Password to Confirm
            </label>
            <div className="input-wrap">
              <KeyRound size={16} className="icon-left" />
              <input
                type="password"
                className="input input-icon"
                placeholder="Account password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading || !password}
              style={{
                flex: 1, background: '#F43F5E', color: '#fff',
                fontWeight: 800, border: 'none', justifyContent: 'center'
              }}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Trash2 size={15} /> Delete Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KYCUpload({ API, onDone }) {
  const [cnic, setCnic] = useState(null);
  const [license, setLicense] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!cnic || !license) return toast.error('Please upload both documents');
    const fd = new FormData();
    fd.append('cnic', cnic);
    fd.append('barLicense', license);
    setUploading(true);
    try {
      await axios.post(`${API}/lawyers/kyc`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('KYC submitted for review!');
      onDone();
    } catch {
      toast.error('KYC submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        { label: 'CNIC / National ID', key: 'cnic', file: cnic, set: setCnic },
        { label: 'Bar Council Certificate / License', key: 'license', file: license, set: setLicense },
      ].map(({ label, key, file, set }) => (
        <div key={key}>
          <label className="form-label">{label}</label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', borderRadius: 'var(--r-md)',
            border: `2px dashed ${file ? 'var(--primary)' : 'var(--border)'}`,
            background: file ? 'rgba(59,130,246,0.05)' : 'var(--surface-2)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <Upload size={18} color={file ? 'var(--primary-light)' : 'var(--text-dim)'} />
            <span style={{ fontSize: 13, color: file ? 'var(--primary-light)' : 'var(--text-muted)' }}>
              {file ? file.name : `Click to upload ${label}`}
            </span>
            <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => set(e.target.files[0])} />
          </label>
        </div>
      ))}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={uploading || !cnic || !license}
        style={{ alignSelf: 'flex-start' }}
      >
        {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Submitting…</> : <><Upload size={15} /> Submit for Review</>}
      </button>
    </div>
  );
}
