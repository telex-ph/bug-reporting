import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load admin data from localStorage
  useEffect(() => {
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      try {
        setAdminData(JSON.parse(storedAdminData));
      } catch (error) {
        console.error('Error parsing admin data:', error);
      }
    }
  }, []);

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
    localStorage.removeItem('rememberMe');
    
    // Redirect to login
    navigate('/admin/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!adminData || !adminData.name) return 'A';
    const names = adminData.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
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
            <div className="user-avatar">
              {adminData?.profilePicture ? (
                <img 
                  src={adminData.profilePicture} 
                  alt={adminData.name} 
                  className="avatar-img"
                />
              ) : (
                getUserInitials()
              )}
            </div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">
                  {adminData?.name || 'Admin'}
                </div>
                <div className="user-role">
                  {adminData?.role || 'User'}
                </div>
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