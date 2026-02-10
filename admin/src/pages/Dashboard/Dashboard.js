import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';
import BugReportModal from '../../components/BugReportModal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBugsCount, setPendingBugsCount] = useState(0);
  
  // USE REF INSTEAD OF STATE for lastCheckedCount to avoid useCallback recreation
  const lastCheckedCountRef = useRef(0);
  
  // Simple notification state
  const [notification, setNotification] = useState(null);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const beep = new Audio('data:audio/wav;base64,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');
      beep.volume = 0.3;
      beep.play().catch(() => console.log('🔇 Sound blocked by browser'));
    } catch (error) {
      console.log('🔇 Could not play notification sound');
    }
  };

  // Show notification
  const showNotification = (message, type = 'bug') => {
    console.log('🎉 SHOWING NOTIFICATION:', message);
    setNotification({ message, type, id: Date.now() });
    playNotificationSound();
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      console.log('⏱️ Hiding notification');
      setNotification(null);
    }, 8000);
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/bugs/stats');
      setStats(statsResponse.data);

      const bugsResponse = await api.get('/bugs?limit=5&sortBy=createdAt&sortOrder=desc');
      setRecentBugs(bugsResponse.data.bugs);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, []);

  // Check for new pending bugs - FIXED VERSION with useRef
  const checkForNewBugs = useCallback(async () => {
    try {
      console.log('🔍 Fetching pending bugs...');
      const response = await api.get('/bugs/pending');
      const currentCount = response.data.length;
      const lastCount = lastCheckedCountRef.current;
      
      console.log('📊 Bug Count Check:');
      console.log('   - Current count:', currentCount);
      console.log('   - Last count:', lastCount);
      console.log('   - Difference:', currentCount - lastCount);
      
      // Check if count increased
      if (lastCount > 0 && currentCount > lastCount) {
        const newBugsCount = currentCount - lastCount;
        console.log('🚨 NEW BUGS DETECTED!', newBugsCount, 'new bugs');
        console.log('🔔 Triggering notification...');
        
        showNotification(
          `🐛 ${newBugsCount} new bug ${newBugsCount === 1 ? 'report' : 'reports'} received from Outlook!`
        );
        
        // Refresh dashboard stats
        fetchDashboardData();
      } else if (lastCount === 0) {
        console.log('📝 First check - setting baseline to', currentCount);
      } else {
        console.log('✅ No new bugs (count stayed at', currentCount, ')');
      }
      
      // Update ref and state
      lastCheckedCountRef.current = currentCount;
      setPendingBugsCount(currentCount);
      
    } catch (error) {
      console.error('❌ Error checking for new bugs:', error);
    }
  }, [fetchDashboardData]); // Only depends on fetchDashboardData, not lastCheckedCount!

  // Initial load
  useEffect(() => {
    console.log('🚀 Dashboard mounted - Initial load');
    fetchDashboardData();
    checkForNewBugs();
  }, [fetchDashboardData, checkForNewBugs]);

  // Polling for new bugs every 30 seconds
  useEffect(() => {
    console.log('⏰ Setting up polling interval (30 seconds)');
    
    const interval = setInterval(() => {
      console.log('⏰ AUTO-CHECK triggered (30s interval)');
      checkForNewBugs();
    }, 30000); // 30 seconds

    return () => {
      console.log('🛑 Clearing polling interval');
      clearInterval(interval);
    };
  }, [checkForNewBugs]);

  const handleModalClose = () => {
    console.log('🔒 Modal closed');
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    console.log('✅ Bug confirmed - Refreshing data');
    fetchDashboardData();
    checkForNewBugs();
  };

  const getSeverityClass = (severity) => {
    const classes = {
      'Critical': 'severity-critical',
      'High': 'severity-high',
      'Medium': 'severity-medium',
      'Low': 'severity-low'
    };
    return classes[severity] || '';
  };

  const getStatusClass = (status) => {
    const classes = {
      'Open': 'status-open',
      'In Progress': 'status-progress',
      'Resolved': 'status-resolved',
      'Closed': 'status-closed',
      'Reopened': 'status-reopened'
    };
    return classes[status] || '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Simple Toast Notification */}
      {notification && (
        <div 
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '320px',
            maxWidth: '450px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #FFF 0%, #FEE2E2 100%)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderLeft: '4px solid #A10000',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          <div style={{ fontSize: '24px' }}>🐛</div>
          <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#1F2937' }}>
            {notification.message}
          </div>
          <button
            onClick={() => {
              console.log('❌ User closed notification');
              setNotification(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header with Bug Report Button */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button 
          onClick={() => {
            console.log('📧 Opening bug reports modal');
            setIsModalOpen(true);
          }} 
          className="btn-primary"
          style={{
            padding: '10px 20px',
            backgroundColor: '#A10000',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
          }}
        >
          📧 View Bug Reports from Outlook
          {pendingBugsCount > 0 && (
            <span 
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                animation: 'pulse 2s infinite'
              }}
            >
              {pendingBugsCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🐛</div>
          <div className="stat-content">
            <h3>Total Bugs</h3>
            <p className="stat-number">{stats?.total || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>🔴</div>
          <div className="stat-content">
            <h3>Open</h3>
            <p className="stat-number">{stats?.byStatus?.open || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⚡</div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <p className="stat-number">{stats?.byStatus?.inProgress || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>✅</div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p className="stat-number">{stats?.byStatus?.resolved || 0}</p>
          </div>
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="section-card">
        <h2 className="section-title">Severity Distribution</h2>
        <div className="severity-bars">
          <div className="severity-bar">
            <div className="severity-label">
              <span>Critical</span>
              <span className="severity-count">{stats?.bySeverity?.critical || 0}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill severity-critical-fill" 
                style={{ width: `${(stats?.bySeverity?.critical / stats?.total * 100) || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="severity-bar">
            <div className="severity-label">
              <span>High</span>
              <span className="severity-count">{stats?.bySeverity?.high || 0}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill severity-high-fill" 
                style={{ width: `${(stats?.bySeverity?.high / stats?.total * 100) || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="severity-bar">
            <div className="severity-label">
              <span>Medium</span>
              <span className="severity-count">{stats?.bySeverity?.medium || 0}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill severity-medium-fill" 
                style={{ width: `${(stats?.bySeverity?.medium / stats?.total * 100) || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="severity-bar">
            <div className="severity-label">
              <span>Low</span>
              <span className="severity-count">{stats?.bySeverity?.low || 0}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill severity-low-fill" 
                style={{ width: `${(stats?.bySeverity?.low / stats?.total * 100) || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bugs */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Recent Bugs</h2>
          <Link to="/bug-list" className="view-all-link">View All →</Link>
        </div>
        
        {recentBugs.length === 0 ? (
          <p className="no-data">No bugs reported yet</p>
        ) : (
          <div className="bugs-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBugs.map((bug) => (
                  <tr key={bug._id}>
                    <td>
                      <Link to={`/bug-details/${bug._id}`} className="bug-title-link">
                        {bug.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityClass(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(bug.status)}`}>
                        {bug.status}
                      </span>
                    </td>
                    <td>{bug.reportedBy?.name || 'Unknown'}</td>
                    <td>{new Date(bug.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bug Report Modal */}
      <BugReportModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />

      {/* Add animation keyframes to the document */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #E5E7EB;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1F2937;
          margin: 0;
        }

        .btn-primary:hover {
          background-color: #8B0000 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(161, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;