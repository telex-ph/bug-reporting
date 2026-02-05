import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: '📊',
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/admin/bug-list',
      icon: '🐛',
      label: 'Bug Reports',
      badge: null
    },
    {
      path: '/admin/create-bug',
      icon: '➕',
      label: 'Create Bug',
      badge: null
    },
    {
      path: '/admin/settings',
      icon: '⚙️',
      label: 'Settings',
      badge: null
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    // Redirect to login
    navigate('/admin/login');
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🐛</span>
            {sidebarOpen && <span className="logo-text">Bug Tracker</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">K</div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">Kawander</div>
                <div className="user-role">Developer</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            {sidebarOpen ? '🚪 Logout' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="main-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <div className="header-title">
            <h2>Bug Reporting System</h2>
            <p className="header-subtitle">TelexPH - WanderWave Project</p>
          </div>

          <div className="header-actions">
            <button className="header-btn notification-btn">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <button className="header-btn sync-btn">
              🔄 Sync Emails
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;