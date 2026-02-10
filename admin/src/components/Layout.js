import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bug, 
  Plus, 
  Settings, 
  Menu, 
  X,
  Search,
  Bell,
  RefreshCw,
  LogOut,
  User
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/admin/bug-list',
      icon: Bug,
      label: 'Bug Reports',
      badge: null
    },
    {
      path: '/admin/create-bug',
      icon: Plus,
      label: 'Create Bug',
      badge: null
    },
    {
      path: '/admin/settings',
      icon: Settings,
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to bug list with search query
      navigate(`/admin/bug-list?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="layout-container">
      {/* Mobile Toggle Button */}
      <button 
        className="sidebar-toggle-mobile"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">
              <Bug size={24} />
            </span>
            {sidebarOpen && <span className="logo-text">Bug Tracker</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <IconComponent size={20} />
                </span>
                {sidebarOpen && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
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
                  {adminData?.role || 'Administrator'}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Header / Navbar */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="header-title">
              <h2>Bug Reporting System</h2>
              <p className="header-subtitle">TelexPH - WanderWave Project</p>
            </div>
          </div>

          <div className="header-right">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="header-search">
              <span className="search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search bugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="header-actions">
              {/* Notifications */}
              <button className="header-btn notification-btn" title="Notifications">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>

              {/* Sync Button */}
              <button className="header-btn sync-btn" title="Sync from Outlook">
                <RefreshCw size={18} />
                <span>Sync Emails</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;