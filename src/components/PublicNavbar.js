import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Terms', path: '/terms' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="public-nav"
      >
        {/* Logo */}
        <div className="public-nav-logo" onClick={() => navigate('/')}>
          <div className="public-nav-logo-icon">
            <img src="/lawyerhublogo.png" alt="AI LawyerHub" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <span className="public-nav-logo-text">AI LawyerHub</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="public-nav-links-desktop">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`public-nav-link ${isActive ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            );
          })}
          {user ? (
            <motion.button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Dashboard <ArrowRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign In <ArrowRight size={14} />
            </motion.button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="public-nav-hamburger"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.nav>

      {/* Mobile Slide-Down Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="public-nav-mobile-menu"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`public-nav-mobile-link ${isActive ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div style={{ marginTop: 8 }}>
              {user ? (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  Dashboard <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign In <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
