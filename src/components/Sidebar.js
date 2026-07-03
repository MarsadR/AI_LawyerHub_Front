import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, MessageSquare, FolderOpen,
  BookOpen, User, LogOut, ChevronLeft, ChevronRight,
  Bot, Shield, Gavel
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar,         label: 'Appointments' },
  { to: '/hearings',     icon: Gavel,            label: 'Hearings' },
  { to: '/chats',        icon: MessageSquare,    label: 'Messages' },
  { to: '/case-files',   icon: FolderOpen,       label: 'Case Files' },
  { to: '/ai-chat',      icon: Bot,              label: 'AI Assistant' },
  { to: '/books',        icon: BookOpen,         label: 'Law Library' },
  { to: '/profile',      icon: User,             label: 'Profile' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout, API } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LW';

  const avatarUrl = user?.profilePhotoUrl;
  const fullAvatarUrl = avatarUrl 
    ? (avatarUrl.startsWith('http') ? avatarUrl : `${API}/${avatarUrl}`) 
    : null;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {/* Logo area */}
        <div className="sidebar-logo">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
            onClick={() => navigate('/')}
            title="Go to Home Page"
          >
            <div className="sidebar-logo-icon">
              <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            </div>
            {!collapsed && (
              <div className="sidebar-logo-text">
                <span className="sidebar-logo-brand">AI LawyerHub</span>
                <span className="sidebar-logo-tagline">Portal</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            data-tooltip={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              data-tooltip={collapsed ? label : undefined}
            >
              <span className="sidebar-item-icon">
                <Icon size={18} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar-item-label">{label}</span>}
              {!collapsed && location.pathname.startsWith(to) && (
                <span className="sidebar-item-active-dot" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {/* KYC badge */}
          {!collapsed && user?.kycStatus && user.kycStatus !== 'approved' && (
            <div className={`sidebar-kyc-badge ${user.kycStatus}`}>
              <Shield size={14} />
              <span>
                {user.kycStatus === 'pending' ? 'KYC Pending' :
                 user.kycStatus === 'rejected' ? 'KYC Rejected' : 'Submit KYC'}
              </span>
            </div>
          )}

          {/* User info */}
          <div className="sidebar-user">
            <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
              {fullAvatarUrl
                ? <img src={fullAvatarUrl} alt="" className="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <p className="sidebar-user-name truncate">{user?.name || 'Attorney'}</p>
                <p className="sidebar-user-role">Lawyer</p>
              </div>
            )}
            <button className="sidebar-logout-btn" onClick={handleLogout} data-tooltip="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
