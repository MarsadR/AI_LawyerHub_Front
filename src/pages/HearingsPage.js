import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel, Plus, Edit2, Trash2, Calendar, Clock, User,
  X, Check, Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today',    label: 'Today'    },
  { key: 'past',     label: 'Past'     },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  const dt = new Date(d);
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

function HearingModal({ hearing, onClose, onSave, loading }) {
  const [form, setForm] = useState(hearing || {
    title: '', clientName: '', oppositionName: '',
    oppositionLawyerName: '', judgeName: '', notes: '',
    date: '', time: ''
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return toast.error('Title and date are required');
    onSave(form);
  };

  const fields = [
    { key: 'title',               label: 'Case Title *',          icon: Gavel,    required: true },
    { key: 'clientName',          label: 'Client Name',           icon: User  },
    { key: 'oppositionName',      label: 'Opposition Party',      icon: User  },
    { key: 'oppositionLawyerName',label: 'Opposition Lawyer',     icon: User  },
    { key: 'judgeName',           label: 'Presiding Judge',       icon: User  },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2 className="modal-title">{hearing?._id ? 'Edit Hearing' : 'Add Hearing'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {fields.map(({ key, label, icon: Icon, required }) => (
              <div key={key} style={{ gridColumn: key === 'title' ? '1/-1' : undefined }}>
                <label className="form-label">{label}</label>
                <div className="input-wrap">
                  <Icon size={15} className="icon-left" />
                  <input
                    className="input input-icon"
                    value={form[key] || ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder={label}
                    required={required}
                  />
                </div>
              </div>
            ))}

            <div>
              <label className="form-label">Hearing Date *</label>
              <div className="input-wrap">
                <Calendar size={15} className="icon-left" />
                <input
                  type="date"
                  className="input input-icon"
                  value={form.date || ''}
                  onChange={e => update('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Time</label>
              <div className="input-wrap">
                <Clock size={15} className="icon-left" />
                <input
                  type="time"
                  className="input input-icon"
                  value={form.time || ''}
                  onChange={e => update('time', e.target.value)}
                />
              </div>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Additional notes about this hearing…"
                value={form.notes || ''}
                onChange={e => update('notes', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (
                <><Check size={16} /> {hearing?._id ? 'Update Hearing' : 'Add Hearing'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function HearingDetailModal({ hearing, onClose, onEdit }) {
  if (!hearing) return null;

  const fields = [
    { label: 'Case Title', value: hearing.title, icon: Gavel, color: '#A78BFA' },
    { label: 'Client Name', value: hearing.clientName, icon: User, color: '#34D399' },
    { label: 'Opposition Party', value: hearing.oppositionName, icon: User, color: '#F87171' },
    { label: 'Opposition Lawyer', value: hearing.oppositionLawyerName, icon: User, color: '#60A5FA' },
    { label: 'Presiding Judge', value: hearing.judgeName, icon: User, color: '#FBBF24' },
    { label: 'Hearing Date', value: hearing.date ? formatDate(hearing.date) : null, icon: Calendar, color: '#EC4899' },
    { label: 'Time', value: hearing.time, icon: Clock, color: '#10B981' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 28 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 20 }}>
          <h2 className="modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Hearing Details</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(({ label, value, icon: Icon, color }) => {
            if (!value) return null;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  padding: 8, borderRadius: 10, background: `${color}15`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  border: `1px solid ${color}25`, color
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginTop: 2, display: 'block' }}>{value}</span>
                </div>
              </div>
            );
          })}

          {hearing.notes && (
            <div style={{ marginTop: 8, padding: 16, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Notes</span>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{hearing.notes}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onEdit(hearing); onClose(); }}>
            <Edit2 size={15} /> Edit Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HearingsPage() {
  const { API } = useAuth();
  const [hearings, setHearings] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // null | {} | {_id, ...}
  const [detailModal, setDetailModal] = useState(null); // null | {_id, ...}
  const [search, setSearch] = useState('');

  const fetchHearings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/hearings`);
      setHearings(res.data.data?.hearings || res.data.data || []);
    } catch {
      toast.error('Failed to load hearings');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchHearings(); }, [fetchHearings]);

  const now = new Date();

  const filterHearings = (tab) => {
    return hearings.filter(h => {
      const matchSearch = !search || (h.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.clientName || '').toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (!h.date) return tab === 'upcoming';
      const d = new Date(h.date);
      const isToday = d.toDateString() === now.toDateString();
      if (tab === 'today')    return isToday;
      if (tab === 'upcoming') return d >= now && !isToday;
      if (tab === 'past')     return d < now && !isToday;
      return true;
    });
  };

  const displayed = filterHearings(tab);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (form._id) {
        await axios.patch(`${API}/hearings/${form._id}`, form);
        toast.success('Hearing updated');
      } else {
        await axios.post(`${API}/hearings`, form);
        toast.success('Hearing added');
      }
      fetchHearings();
      setModal(null);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hearing?')) return;
    try {
      await axios.delete(`${API}/hearings/${id}`);
      toast.success('Deleted');
      setHearings(p => p.filter(h => h._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const tabCounts = {
    upcoming: filterHearings('upcoming').length,
    today:    filterHearings('today').length,
    past:     filterHearings('past').length,
  };

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Hearings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Track your court schedule</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Add Hearing
        </button>
      </div>

      {/* Search */}
      <div className="input-wrap" style={{ marginBottom: 16, maxWidth: 400 }}>
        <Search size={16} className="icon-left" />
        <input className="input input-icon" placeholder="Search hearings…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, maxWidth: 360 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} {tabCounts[t.key] > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>({tabCounts[t.key]})</span>}
          </button>
        ))}
      </div>

      {/* Hearing cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card empty-state" style={{ minHeight: 200 }}>
          <Gavel size={44} />
          <h3>No {tab} hearings</h3>
          <p>Add a hearing to keep your schedule organized</p>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>
            <Plus size={14} /> Add First Hearing
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayed.map((h, i) => (
            <div
              key={h._id}
              className="glass-card animate-slide-up"
              style={{ padding: '18px 20px', animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
              onClick={() => setDetailModal(h)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Date badge */}
                <div style={{
                  minWidth: 54, textAlign: 'center',
                  background: 'rgba(139,92,246,0.12)',
                  borderRadius: 12, padding: '8px 10px',
                  border: '1px solid rgba(139,92,246,0.2)'
                }}>
                  {h.date ? (
                    <>
                      <p style={{ fontSize: 20, fontWeight: 800, color: '#A78BFA', lineHeight: 1 }}>
                        {new Date(h.date).getDate()}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {MONTHS[new Date(h.date).getMonth()]}
                      </p>
                    </>
                  ) : <Gavel size={18} color="#A78BFA" />}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }} className="truncate">
                    {h.title}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {h.clientName && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} /> {h.clientName}
                      </span>
                    )}
                    {h.judgeName && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Gavel size={12} /> {h.judgeName}
                      </span>
                    )}
                    {h.time && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {h.time}
                      </span>
                    )}
                  </div>
                  {h.notes && (
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }} className="truncate">{h.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" onClick={() => setModal(h)} data-tooltip="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(h._id)} data-tooltip="Delete"
                    style={{ '--btn-hover-bg': 'rgba(244,63,94,0.15)', '--btn-hover-color': 'var(--rose)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <HearingModal
          hearing={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}
      {detailModal !== null && (
        <HearingDetailModal
          hearing={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={(h) => setModal(h)}
        />
      )}
    </div>
  );
}
