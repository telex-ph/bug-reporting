import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🐛 Bug Reporter</h2>
          <p className="sidebar-subtitle">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/bugs" className={`nav-item ${isActive('/bugs')}`}>
            <span className="nav-icon">🐛</span>
            <span>All Bugs</span>
          </Link>

          <Link to="/bugs/create" className={`nav-item ${isActive('/bugs/create')}`}>
            <span className="nav-icon">➕</span>
            <span>Create Bug</span>
          </Link>

          <Link to="/admins" className={`nav-item ${isActive('/admins')}`}>
            <span className="nav-icon">👥</span>
            <span>Admins</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {admin?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-details">
              <p className="admin-name">{admin?.name}</p>
              <p className="admin-role">{admin?.role}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">
              {location.pathname === '/' && 'Dashboard'}
              {location.pathname === '/bugs' && 'All Bugs'}
              {location.pathname === '/bugs/create' && 'Create New Bug'}
              {location.pathname === '/admins' && 'Admin Management'}
              {location.pathname.startsWith('/bugs/') && 
               location.pathname !== '/bugs/create' && 'Bug Details'}
            </h1>
          </div>
          <div className="header-right">
            <span className="welcome-text">Welcome, {admin?.name}</span>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;