import React from 'react';
import { Bell, Menu, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

export default function Topbar({ onMenuClick, pageTitle, pageSubtitle }) {
  const { user, API } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'LW';

  const avatarUrl = user?.profilePhotoUrl;
  const fullAvatarUrl = avatarUrl 
    ? (avatarUrl.startsWith('http') ? avatarUrl : `${API}/${avatarUrl}`) 
    : null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        {pageTitle && (
          <div className="topbar-title-wrap">
            <h1 className="topbar-title">{pageTitle}</h1>
            {pageSubtitle && <p className="topbar-subtitle">{pageSubtitle}</p>}
          </div>
        )}
      </div>

      <div className="topbar-right">
        <button
          className="topbar-icon-btn topbar-home-btn"
          onClick={() => navigate('/')}
          data-tooltip="Home Page"
        >
          <Home size={18} />
        </button>

        <button className="topbar-icon-btn" onClick={() => navigate('/notifications')} data-tooltip="Notifications">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        <div className="topbar-avatar" onClick={() => navigate('/profile')}>
          {fullAvatarUrl
            ? <img src={fullAvatarUrl} alt="avatar" className="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            : (
              <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
                {initials}
              </div>
            )
          }
        </div>
      </div>
    </header>
  );
}
