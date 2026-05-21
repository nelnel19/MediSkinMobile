import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/panel.css';

const Panel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const closePanel = () => {
    setIsOpen(false);
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

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: 'M3 12h18M3 6h18M3 18h18' },
    { path: '/users', name: 'Users', icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 4-6 8-6s8 2 8 6' },
    { path: '/skin-analysis', name: 'Skin Analysis', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/face-analysis', name: 'Face Analysis', icon: 'M15 9a3 3 0 11-6 0 3 3 0 016 0zM4.5 20.5c0-4 4-6 7.5-6s7.5 2 7.5 6' }
  ];

  return (
    <>
      <button 
        className={`panel-toggle ${isOpen ? 'hidden' : ''}`} 
        onClick={togglePanel}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="nav-icon"
              >
                <path d={item.icon} />
              </svg>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="panel-footer">
          <div className="footer-line"></div>
          <p className="footer-text">© 2024 Analytics Suite</p>
        </div>
      </div>
    </>
  );
};

export default Panel;