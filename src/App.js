import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import LoginPage          from './pages/LoginPage';
import SignupPage         from './pages/SignupPage';
import AboutPage          from './pages/AboutPage';
import ContactPage        from './pages/ContactPage';
import TermsPage          from './pages/TermsPage';
import PrivacyPage        from './pages/PrivacyPage';
import DashboardPage      from './pages/DashboardPage';
import AppointmentsPage   from './pages/AppointmentsPage';
import HearingsPage       from './pages/HearingsPage';
import ChatsPage          from './pages/ChatsPage';
import CaseFilesPage      from './pages/CaseFilesPage';
import AIChatPage         from './pages/AIChatPage';
import BooksPage          from './pages/BooksPage';
import ProfilePage        from './pages/ProfilePage';
import NotificationsPage  from './pages/NotificationsPage';
import LandingPage        from './pages/LandingPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Page title map
const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',     subtitle: "Today's overview" },
  '/appointments':  { title: 'Appointments',  subtitle: 'Manage client sessions' },
  '/hearings':      { title: 'Hearings',       subtitle: 'Court schedule' },
  '/chats':         { title: 'Messages',       subtitle: 'Client conversations' },
  '/case-files':    { title: 'Case Files',     subtitle: 'Documents & evidence' },
  '/ai-chat':       { title: 'AI Assistant',   subtitle: 'Legal research & advice' },
  '/books':         { title: 'Law Library',    subtitle: 'Legal references' },
  '/profile':       { title: 'Profile',        subtitle: 'Your account & settings' },
  '/notifications': { title: 'Notifications', subtitle: 'Updates & alerts' },
};

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = window.location.pathname;
  const { title, subtitle } = PAGE_TITLES[path] || {};

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse-glow 1.5s ease-in-out infinite'
        }}>
          <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 44, height: 44, objectFit: 'contain' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>Loading AI LawyerHub…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main
        className="main-content"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        <Topbar
          onMenuClick={() => setMobileOpen(o => !o)}
          pageTitle={title}
          pageSubtitle={subtitle}
        />
        <Outlet />
      </main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function LandingRoute() {
  const { loading } = useAuth();
  if (loading) return null;
  // Always render the landing page — logged-in users see the 'Go to Dashboard' CTA
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#F43F5E', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><SignupPage /></PublicRoute>
          } />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/appointments"  element={<AppointmentsPage />} />
            <Route path="/hearings"      element={<HearingsPage />} />
            <Route path="/chats"         element={<ChatsPage />} />
            <Route path="/case-files"    element={<CaseFilesPage />} />
            <Route path="/ai-chat"       element={<AIChatPage />} />
            <Route path="/books"         element={<BooksPage />} />
            <Route path="/profile"       element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Landing */}
          <Route path="/" element={<LandingRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
