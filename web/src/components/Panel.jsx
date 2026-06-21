// Panel.jsx - WITH REPORTS NAVIGATION AND LOGOUT MODAL
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/panel.css';

const Panel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    navigate('/login');
    setShowLogoutModal(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
    }
    
    return () => {
      document.body.classList.remove('panel-open');
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLogoutModal]);

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: 'M3 12h18M3 6h18M3 18h18' },
    { path: '/users', name: 'Users Management', icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 4-6 8-6s8 2 8 6' },
    { path: '/skin-analysis', name: 'Skin Analysis', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/face-analysis', name: 'Face Analysis', icon: 'M15 9a3 3 0 11-6 0 3 3 0 016 0zM4.5 20.5c0-4 4-6 7.5-6s7.5 2 7.5 6' },
    { path: '/reports', name: 'Reports', icon: 'M4 4v16h16V8l-4-4H4zm4 4h8M8 12h8M8 16h4' }
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-navbar">
        <div className="top-navbar-left">
          <button 
            className={`top-menu-btn ${isOpen ? 'active' : ''}`} 
            onClick={togglePanel}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          {/* Top Bar Logo - Hidden when sidebar is open */}
          <div className={`top-bar-logo ${isOpen ? 'hidden' : ''}`}>
            <img src="/logo2.png" alt="Mediskin Logo" className="top-logo-image" />
          </div>
          <div className="page-indicator">
            <span className="current-page">{currentPage}</span>
            <span className="page-separator">/</span>
            <span className="page-path">Analytics</span>
          </div>
        </div>
        
        <div className="top-navbar-right">
          <div className="header-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="user-profile" onClick={() => setShowLogoutModal(true)}>
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="user-name">Admin</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="dropdown-icon">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div className="logo-container">
            <img 
              src="/logo2.png" 
              alt="Company Logo" 
              className="panel-logo"
            />
          </div>
          <button 
            className="panel-close-btn" 
            onClick={closePanel}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="panel-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closePanel}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="nav-icon"
              >
                <path d={item.icon} />
              </svg>
              <span className="nav-text">{item.name}</span>
              {location.pathname === item.path && <span className="nav-indicator"></span>}
            </Link>
          ))}
        </nav>

        <div className="panel-footer">
          <div className="footer-line"></div>
          <div className="footer-info">
            <div className="footer-version">Version 2.0.0</div>
            <p className="footer-text">© 2024 Mediskin Analytics</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="panel-overlay" onClick={closePanel}></div>}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="modal-title">Sign Out</h3>
            <p className="modal-message">Are you sure you want to sign out of your account?</p>
            <div className="modal-buttons">
              <button 
                className="modal-btn modal-btn-cancel" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn modal-btn-confirm" 
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Panel;