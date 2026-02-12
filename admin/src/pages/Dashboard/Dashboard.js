import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bug, 
  AlertCircle, 
  Zap, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Mail,
  Plus,
  List,
  X,
  User,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';
import api from '../../services/api';
import './Dashboard.css';
import BugReportModal from '../../components/BugReportModal';
import useRealtimeNotifications from '../../hooks/useRealtimeNotifications';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBugsCount, setPendingBugsCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [adminData, setAdminData] = useState(null);

  // Load admin data
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

  // ============================================
  // REAL-TIME NOTIFICATION HANDLER
  // ============================================
  const handleRealtimeNotification = useCallback((data) => {
    console.log('🔔 REAL-TIME NOTIFICATION RECEIVED:', data);
    
    // Show notification toast
    showNotification(data.message || data.title, data.type);
    
    // Handle different notification types
    switch (data.type) {
      case 'new_bug_outlook':
        console.log('📧 New bug from Outlook!');
        // Refresh dashboard data
        fetchDashboardData();
        checkForNewBugs();
        break;
        
      case 'bug_status_change':
        console.log('🔄 Bug status changed');
        fetchDashboardData();
        break;
        
      case 'bug_assigned':
        console.log('👤 Bug assigned');
        fetchDashboardData();
        break;
        
      default:
        console.log('📬 Other notification:', data.type);
    }
  }, []);

  // ============================================
  // CONNECT TO REAL-TIME NOTIFICATIONS
  // ============================================
  const { isConnected, connectionStatus } = useRealtimeNotifications(handleRealtimeNotification);

  const playNotificationSound = () => {
    try {
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xvDglEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I0+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfccLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQcZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHAU1jdXzzn0vBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYELIHO8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMeS0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAF');
      beep.volume = 0.3;
      beep.play().catch(() => console.log('Sound blocked'));
    } catch (error) {
      console.log('Could not play notification sound');
    }
  };

  const showNotification = (message, type = 'bug') => {
    console.log('SHOWING NOTIFICATION:', message);
    setNotification({ message, type, id: Date.now() });
    playNotificationSound();
    
    setTimeout(() => {
      console.log('Hiding notification');
      setNotification(null);
    }, 8000);
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/bugs/stats');
      setStats(statsResponse.data);
      
      const bugsResponse = await api.get('/bugs?limit=8&sortBy=createdAt&sortOrder=desc');
      setRecentBugs(bugsResponse.data.bugs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForNewBugs = useCallback(async () => {
    try {
      const response = await api.get('/bugs/pending');
      const currentCount = response.data.length;
      setPendingBugsCount(currentCount);
    } catch (error) {
      console.error('Error checking for new bugs:', error);
    }
  }, []);

  useEffect(() => {
    console.log('Dashboard mounted - Initial load');
    fetchDashboardData();
    checkForNewBugs();
  }, [fetchDashboardData, checkForNewBugs]);

  const handleModalClose = () => {
    console.log('Modal closed');
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    console.log('Bug confirmed - Refreshing data');
    fetchDashboardData();
    checkForNewBugs();
  };

  const getSeverityClass = (severity) => {
    const classes = {
      'Critical': 'critical',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };
    return classes[severity] || '';
  };

  const getStatusClass = (status) => {
    const classes = {
      'Open': 'open',
      'In Progress': 'progress',
      'Resolved': 'resolved',
      'Closed': 'closed',
      'Reopened': 'reopened'
    };
    return classes[status] || '';
  };

  const getPriorityClass = (priority) => {
    const classes = {
      'Urgent': 'urgent',
      'High': 'high',
      'Normal': 'normal',
      'Low': 'low'
    };
    return classes[priority] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUserInitials = () => {
    if (!adminData || !adminData.name) return 'A';
    const names = adminData.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <div className="toast-icon">
            <Bug size={32} />
          </div>
          <div className="toast-content">
            <div className="toast-title">New Bug Report!</div>
            <div className="toast-message">{notification.message}</div>
          </div>
          <button className="toast-close" onClick={() => setNotification(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="connection-status">
        {isConnected ? (
          <div className="status-indicator connected" title="Real-time notifications active">
            <Wifi size={16} />
            <span>Live</span>
          </div>
        ) : (
          <div className="status-indicator disconnected" title={`Connection status: ${connectionStatus}`}>
            <WifiOff size={16} />
            <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
          </div>
        )}
      </div>

      {/* Dashboard Main Content */}
      <div className="dashboard-main">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <div className="stat-label">Total Bugs</div>
                <div className="stat-value">{stats?.total || 0}</div>
              </div>
              <div className="stat-icon">
                <Bug size={28} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <div className="stat-label">Critical</div>
                <div className="stat-value">{stats?.bySeverity?.critical || 0}</div>
              </div>
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #DC2626, #991B1B)'}}>
                <AlertCircle size={28} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <div className="stat-label">In Progress</div>
                <div className="stat-value">{stats?.byStatus?.inProgress || 0}</div>
              </div>
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #F59E0B, #D97706)'}}>
                <Zap size={28} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-info">
                <div className="stat-label">Resolved</div>
                <div className="stat-value">{stats?.byStatus?.resolved || 0}</div>
              </div>
              <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10B981, #059669)'}}>
                <CheckCircle size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">
                <BarChart3 size={24} />
              </span>
              Severity Distribution
            </h2>
          </div>
          <div className="severity-list">
            <div className="severity-item">
              <div className="severity-item-header">
                <div className="severity-name">
                  <span className="severity-dot critical"></span>
                  Critical
                </div>
                <div className="severity-count-badge">{stats?.bySeverity?.critical || 0}</div>
              </div>
              <div className="severity-progress">
                <div 
                  className="severity-progress-bar critical"
                  style={{ width: `${(stats?.bySeverity?.critical / stats?.total * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-item-header">
                <div className="severity-name">
                  <span className="severity-dot high"></span>
                  High
                </div>
                <div className="severity-count-badge">{stats?.bySeverity?.high || 0}</div>
              </div>
              <div className="severity-progress">
                <div 
                  className="severity-progress-bar high"
                  style={{ width: `${(stats?.bySeverity?.high / stats?.total * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-item-header">
                <div className="severity-name">
                  <span className="severity-dot medium"></span>
                  Medium
                </div>
                <div className="severity-count-badge">{stats?.bySeverity?.medium || 0}</div>
              </div>
              <div className="severity-progress">
                <div 
                  className="severity-progress-bar medium"
                  style={{ width: `${(stats?.bySeverity?.medium / stats?.total * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="severity-item">
              <div className="severity-item-header">
                <div className="severity-name">
                  <span className="severity-dot low"></span>
                  Low
                </div>
                <div className="severity-count-badge">{stats?.bySeverity?.low || 0}</div>
              </div>
              <div className="severity-progress">
                <div 
                  className="severity-progress-bar low"
                  style={{ width: `${(stats?.bySeverity?.low / stats?.total * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bugs */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-title-icon">
                <FileText size={24} />
              </span>
              Recent Bugs
            </h2>
            <Link to="/admin/bug-list">
              <button className="view-all-btn">View All</button>
            </Link>
          </div>
          <div className="bugs-list">
            {recentBugs.length > 0 ? (
              recentBugs.map(bug => (
                <Link to={`/admin/bug/${bug._id}`} key={bug._id} style={{textDecoration: 'none'}}>
                  <div className="bug-item">
                    <div className={`bug-priority-indicator ${getPriorityClass(bug.priority)}`}></div>
                    <div className="bug-info">
                      <div className="bug-title">{bug.title}</div>
                      <div className="bug-meta">
                        <span><User size={14} style={{display: 'inline', marginRight: '4px'}} />{bug.reportedBy?.name}</span>
                        <span>•</span>
                        <span>{formatDate(bug.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`bug-badge ${getSeverityClass(bug.severity)}`}>
                      {bug.severity}
                    </span>
                    <span className={`bug-status-badge ${getStatusClass(bug.status)}`}>
                      {bug.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#A0AEC0'}}>
                No recent bugs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-content">
            <div className="profile-avatar">
              {adminData?.profilePicture ? (
                <img src={adminData.profilePicture} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%'}} />
              ) : (
                getUserInitials()
              )}
            </div>
            <div className="profile-name">{adminData?.name || 'Admin'}</div>
            <div className="profile-role">{adminData?.role || 'Administrator'}</div>
            
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">{stats?.byStatus?.inProgress || 0}</div>
                <div className="profile-stat-label">Active</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">{stats?.byStatus?.resolved || 0}</div>
                <div className="profile-stat-label">Resolved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <div className="quick-actions-title">Quick Actions</div>
          <div className="quick-actions-list">
            <button 
              className="quick-action-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <span className="quick-action-icon"><Mail size={20} /></span>
              View Outlook Reports
              {pendingBugsCount > 0 && (
                <span className="quick-action-badge">{pendingBugsCount}</span>
              )}
            </button>
            
            <Link to="/admin/create-bug" style={{textDecoration: 'none'}}>
              <button className="quick-action-btn">
                <span className="quick-action-icon"><Plus size={20} /></span>
                Create New Bug
              </button>
            </Link>
            
            <Link to="/admin/bug-list" style={{textDecoration: 'none'}}>
              <button className="quick-action-btn">
                <span className="quick-action-icon"><List size={20} /></span>
                View All Bugs
              </button>
            </Link>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="activity-card">
          <div className="activity-title">Recent Activity</div>
          <div className="activity-list">
            {recentBugs.slice(0, 5).map((bug, idx) => (
              <div key={idx} className="activity-item">
                <div className={`activity-icon ${bug.status === 'Resolved' ? 'resolved' : 'bug'}`}>
                  {bug.status === 'Resolved' ? <CheckCircle size={16} /> : <Bug size={16} />}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{bug.reportedBy?.name}</strong> reported "{bug.title}"
                  </div>
                  <div className="activity-time">{formatDate(bug.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bug Report Modal */}
      <BugReportModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default Dashboard;