import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Check, X, ChevronDown, ChevronUp,
  User, MessageSquare, AlertCircle, RefreshCw, Trash2,
  Filter, Search, Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FILTERS = [
  { key: 'pending',   label: 'Pending' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'today',     label: 'Today' },
  { key: 'past',      label: 'Past' },
  { key: 'completed', label: 'Completed' },
];

function StatusBadge({ status }) {
  const map = {
    pending:   'badge-gold',
    confirmed: 'badge-green',
    completed: 'badge-blue',
    cancelled: 'badge-red',
    rejected:  'badge-red',
    change_requested: 'badge-purple',
  };
  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function AppointmentRow({ apt, onAccept, onDecline, onDelete, loading }) {
  const [expanded, setExpanded] = useState(false);
  const isActing = loading === apt._id;
  const start = apt.startTimeUtc ? new Date(apt.startTimeUtc) : null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
      {/* Main row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', cursor: 'pointer'
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Time */}
        <div style={{
          minWidth: 70, textAlign: 'center',
          borderRight: '1px solid var(--border)', paddingRight: 14
        }}>
          {start ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1.2 }}>
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {start.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</p>
          )}
        </div>

        {/* Client info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }} className="truncate">
            {apt.clientName || 'Client'}
          </p>
          {apt.notes && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }} className="truncate">{apt.notes}</p>
          )}
        </div>

        {/* Status + expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StatusBadge status={apt.status} />
          {expanded ? <ChevronUp size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--text-dim)" />}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 20px',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap'
        }}>
          {apt.notes && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', flex: '1 1 100%', marginBottom: 8 }}>
              <strong style={{ color: 'var(--text-2)' }}>Note: </strong>{apt.notes}
            </p>
          )}
          {apt.status === 'pending' && (
            <>
              <button
                className="btn btn-success btn-sm"
                disabled={isActing}
                onClick={() => onAccept(apt._id)}
              >
                {isActing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Check size={14} /> Accept</>}
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={isActing}
                onClick={() => onDecline(apt._id)}
              >
                <X size={14} /> Decline
              </button>
            </>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onDelete(apt._id)}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  const { API } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/appointments/get`);
      setAppointments(res.data.data.appointments || []);
    } catch (e) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const now = new Date();

  // Helper: get the effective end time of an appointment
  const getEnd = (a) => a.endTimeUtc ? new Date(a.endTimeUtc) : (a.startTimeUtc ? new Date(new Date(a.startTimeUtc).getTime() + 60 * 60 * 1000) : null);
  const getStart = (a) => a.startTimeUtc ? new Date(a.startTimeUtc) : null;

  // Is today (calendar day) and appointment has not fully ended yet
  const isToday = (a) => {
    const start = getStart(a);
    const end = getEnd(a);
    if (!start) return false;
    const sameDay = start.toDateString() === now.toDateString();
    return sameDay && (!end || end > now);
  };

  // Appointment is in the past (end time has passed) — any status including pending
  const isPast = (a) => {
    const end = getEnd(a);
    return end ? end < now : false;
  };

  // Upcoming: starts in the future (not today, not past, not cancelled/rejected)
  const isUpcoming = (a) => {
    const start = getStart(a);
    if (!start) return false;
    const notCancelled = !['cancelled', 'rejected'].includes(a.status);
    return start > now && start.toDateString() !== now.toDateString() && notCancelled;
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !search || (a.clientName || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'all')       return true;
    if (filter === 'pending')   return a.status === 'pending' && !isPast(a);
    if (filter === 'today')     return isToday(a);
    if (filter === 'past')      return isPast(a);
    if (filter === 'upcoming')  return isUpcoming(a);
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  const handleAccept = async (id) => {
    setActingOn(id);
    try {
      await axios.post(`${API}/appointments/${id}/accept`);
      toast.success('Appointment confirmed!');
      fetchAppointments();
    } catch {
      toast.error('Action failed');
    } finally {
      setActingOn(null);
    }
  };

  const handleDecline = async (id) => {
    setActingOn(id);
    try {
      await axios.post(`${API}/appointments/${id}/decline`);
      toast.success('Appointment declined');
      fetchAppointments();
    } catch {
      toast.error('Action failed');
    } finally {
      setActingOn(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await axios.delete(`${API}/appointments/${id}`);
      toast.success('Deleted');
      setAppointments(p => p.filter(a => a._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const [clearing, setClearing] = useState(false);
  const handleClearHistory = async () => {
    if (!window.confirm('Clear all past appointments? This cannot be undone.')) return;
    setClearing(true);
    const pastIds = appointments.filter(a => isPast(a)).map(a => a._id);
    let failed = 0;
    for (const id of pastIds) {
      try {
        await axios.delete(`${API}/appointments/${id}`);
      } catch {
        failed++;
      }
    }
    if (failed === 0) toast.success(`Cleared ${pastIds.length} past appointment${pastIds.length !== 1 ? 's' : ''}`);
    else toast.error(`${failed} deletion(s) failed`);
    setClearing(false);
    fetchAppointments();
  };

  // Count per tab
  const counts = {
    all:       appointments.length,
    pending:   appointments.filter(a => a.status === 'pending' && !isPast(a)).length,
    upcoming:  appointments.filter(a => isUpcoming(a)).length,
    today:     appointments.filter(a => isToday(a)).length,
    past:      appointments.filter(a => isPast(a)).length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <div style={{ padding: '28px 32px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Appointments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
            Manage your client sessions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {filter === 'past' && counts.past > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClearHistory}
              disabled={clearing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {clearing
                ? <span className="spinner" style={{ width: 13, height: 13 }} />
                : <Trash2 size={13} />}
              Clear History
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={fetchAppointments}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="input-wrap" style={{ marginBottom: 16, maxWidth: 400 }}>
        <Search size={16} className="icon-left" />
        <input
          className="input input-icon"
          placeholder="Search by client name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span style={{
                background: filter === f.key ? 'rgba(255,255,255,0.25)' : 'var(--surface-3)',
                borderRadius: 'var(--r-full)',
                padding: '1px 7px', fontSize: 11, fontWeight: 700
              }}>{counts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state" style={{ minHeight: 200 }}>
          <Calendar size={44} />
          <h3>No appointments found</h3>
          <p>Try changing the filter or wait for new requests</p>
        </div>
      ) : (
        filtered.map(apt => (
          <AppointmentRow
            key={apt._id}
            apt={apt}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onDelete={handleDelete}
            loading={actingOn}
          />
        ))
      )}
    </div>
  );
}
