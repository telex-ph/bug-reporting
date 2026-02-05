import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Dashboard.css';
import BugReportModal from '../../components/BugReportModal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsResponse = await api.get('/bugs/stats');
      setStats(statsResponse.data);

      // Fetch recent bugs
      const bugsResponse = await api.get('/bugs?limit=5&sortBy=createdAt&sortOrder=desc');
      setRecentBugs(bugsResponse.data.bugs);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    // Refresh dashboard data after confirming a bug
    fetchDashboardData();
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
      {/* Header with Bug Report Button */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
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
            gap: '8px'
          }}
        >
          📧 View Bug Reports from Outlook
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
    </div>
  );
};

export default Dashboard;