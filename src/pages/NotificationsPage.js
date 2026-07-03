import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, ExternalLink, Calendar, MessageSquare, Shield, Info } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const NOTIF_ICONS = {
  appointment: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', icon: Calendar, label: 'Appointment' },
  message:     { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', icon: MessageSquare, label: 'Message' },
  kyc:         { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', icon: Shield, label: 'Verification' },
  system:      { bg: 'rgba(139,92,246,0.1)',  color: '#8B5CF6', icon: Info, label: 'System Alert' },
};

export default function NotificationsPage() {
  const { API } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/lawyers/notifications`);
      setNotifications(res.data.notifications || res.data.data?.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/lawyers/notifications/mark-read`);
      setNotifications(n => n.map(notif => ({ ...notif, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark read');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications permanently?")) return;
    try {
      await axios.delete(`${API}/lawyers/notifications`);
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`${API}/lawyers/notifications/${id}`);
      setNotifications(n => n.filter(notif => notif._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 900, margin: '0 auto' }}>
      
      {/* Header Panel */}
      <div className="glass-card animate-slide-up" style={{
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 4,
          background: '#3B82F6'
        }} />

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
            Notifications Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
              : 'All notifications caught up'
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchNotifications} title="Refresh Notifications" style={{ gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          
          {notifications.length > 0 && (
            <>
              {unreadCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ gap: 6 }}>
                  <CheckCheck size={14} color="var(--emerald)" /> Mark all read
                </button>
              )}
              <button 
                className="btn btn-danger btn-sm" 
                onClick={clearAllNotifications} 
                style={{ gap: 6, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        marginBottom: 20,
        paddingBottom: 4
      }}>
        {[
          { key: 'all', label: 'All Notifications' },
          { key: 'appointment', label: 'Appointments' },
          { key: 'message', label: 'Messages' },
          { key: 'system', label: 'System' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              borderRadius: 20,
              flexShrink: 0
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton animate-pulse" style={{ height: 90, borderRadius: 16 }} />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in" style={{
          minHeight: 280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 40
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(59,130,246,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16
          }}>
            <Bell size={28} color="#3B82F6" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 300, margin: 0 }}>
            There are no notifications in the "{filter}" category right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNotifications.map((notif, i) => {
            const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
            const IconComponent = cfg.icon;
            
            return (
              <div
                key={notif._id || i}
                className="glass-card animate-slide-up"
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  gap: 16,
                  opacity: notif.isRead ? 0.75 : 1,
                  borderLeft: notif.isRead ? '4px solid transparent' : `4px solid ${cfg.color}`,
                  animationDelay: `${i * 0.03}s`,
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  background: notif.isRead ? 'var(--surface-card-read)' : 'var(--surface-card)',
                  boxShadow: notif.isRead ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.03)'
                }}
              >
                {/* Type Indicator Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={18} />
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: cfg.color
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 4, color: 'var(--text-dim)' }}>●</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {notif.createdAt ? timeAgo(notif.createdAt) : ''}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: 15,
                    fontWeight: notif.isRead ? 600 : 800,
                    color: 'var(--text)',
                    lineHeight: 1.4,
                    margin: 0
                  }}>
                    {notif.title || notif.message}
                  </h3>

                  {notif.body && (
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      margin: '2px 0 0 0'
                    }}>
                      {notif.body}
                    </p>
                  )}

                  {/* Actions / Admin URL links */}
                  {notif.data && (notif.data.url || notif.data.link) && (
                    <a
                      href={notif.data.url || notif.data.link}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{
                        alignSelf: 'flex-start',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                        height: 32,
                        padding: '0 14px',
                        fontSize: 12,
                        borderRadius: 6
                      }}
                    >
                      <span>View Action Link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Clear/Read Actions */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  alignSelf: 'center',
                  flexShrink: 0
                }}>
                  {!notif.isRead && (
                    <button
                      className="btn-icon"
                      style={{ width: 30, height: 30, borderRadius: 8 }}
                      onClick={async () => {
                        setNotifications(n => n.map(nf => nf._id === notif._id ? { ...nf, isRead: true } : nf));
                        await axios.put(`${API}/lawyers/notifications/mark-read`);
                      }}
                      title="Mark read"
                    >
                      <Check size={14} color="var(--emerald)" />
                    </button>
                  )}
                  <button
                    className="btn-icon"
                    style={{ width: 30, height: 30, borderRadius: 8 }}
                    onClick={() => deleteNotif(notif._id)}
                    title="Delete Notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
