import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BugReportModal.css';

const BugReportModal = ({ isOpen, onClose, onConfirm }) => {
  const [pendingReports, setPendingReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [priority, setPriority] = useState('Normal');
  const [severity, setSeverity] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPendingReports();
    }
  }, [isOpen]);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIXED: Use 'adminToken' instead of 'token'
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Fetching pending reports, token exists:', !!token);
      
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }
      
      const response = await axios.get('http://localhost:5000/api/bugs/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Pending bugs fetched:', response.data);
      setPendingReports(response.data);
    } catch (error) {
      console.error('❌ Error fetching pending reports:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        alert('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        const errorMsg = 'Failed to fetch pending reports: ' + (error.response?.data?.message || error.message);
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      // ✅ FIXED: Use 'adminToken' instead of 'token'
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Starting sync, token exists:', !!token);
      
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }
      
      const response = await axios.post('http://localhost:5000/api/bugs/sync', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Sync result:', response.data);
      
      const { summary, errors } = response.data;
      
      let message = `Sync complete!\n\n`;
      message += `📧 Total emails found: ${summary.totalEmails}\n`;
      message += `✅ New bugs created: ${summary.newBugs}\n`;
      message += `⏭️ Already imported: ${summary.existingBugs}\n`;
      message += `❌ Errors: ${summary.errors}`;
      
      if (errors && errors.length > 0) {
        message += `\n\nError details:\n`;
        errors.forEach(err => {
          message += `- ${err.subject}: ${err.error}\n`;
        });
      }
      
      alert(message);
      
      await fetchPendingReports();
    } catch (error) {
      console.error('❌ Sync error:', error);
      
      let errorMsg = 'Failed to sync: ';
      
      if (error.response?.status === 401) {
        errorMsg += 'Authentication failed. Please login again.';
        alert(errorMsg);
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else if (error.response?.status === 500) {
        errorMsg += error.response.data.error || error.response.data.message || 'Server error';
      } else {
        errorMsg += error.response?.data?.error || error.response?.data?.message || error.message;
      }
      
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirm = async (status) => {
    if (!selectedReport) return;
    
    try {
      // ✅ FIXED: Use 'adminToken' instead of 'token'
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }
      
      await axios.patch(`http://localhost:5000/api/bugs/${selectedReport._id}/confirm`, {
        status: status === 'confirmed' ? 'In Progress' : 'Closed',
        priority,
        severity,
        notes,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert(`Bug ${status === 'confirmed' ? 'confirmed' : 'rejected'} successfully!`);
      
      onConfirm?.();
      setSelectedReport(null);
      setNotes('');
      setPriority('Normal');
      setSeverity('Medium');
      setPendingReports(prev => prev.filter(r => r._id !== selectedReport._id));
      
      if (pendingReports.length === 1) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Confirm error:', error);
      const errorMsg = 'Failed to confirm report: ' + (error.response?.data?.message || error.message);
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bug-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pending Bug Reports from Outlook</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}
          
          <button 
            onClick={handleSync} 
            disabled={syncing || loading} 
            className="sync-btn"
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync from Outlook'}
          </button>
          
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : pendingReports.length === 0 ? (
            <p className="no-reports">No pending bug reports. Click sync to fetch from Outlook.</p>
          ) : (
            <div className="reports-container">
              <div className="reports-list">
                <h3>Open Bugs ({pendingReports.length})</h3>
                {pendingReports.map(report => (
                  <div
                    key={report._id}
                    className={`report-item ${selectedReport?._id === report._id ? 'selected' : ''}`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="report-header">
                      <span className={`severity-badge ${report.severity.toLowerCase()}`}>
                        {report.severity}
                      </span>
                      <span className={`priority-badge ${report.priority.toLowerCase()}`}>
                        {report.priority}
                      </span>
                    </div>
                    <h4>{report.title}</h4>
                    <p className="report-meta">
                      From: {report.reportedBy?.name || report.reportedBy?.email}
                    </p>
                    <p className="report-date">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              
              {selectedReport && (
                <div className="report-details">
                  <div className="detail-header">
                    <h3>{selectedReport.title}</h3>
                    <div className="badges">
                      <span className={`severity-badge ${selectedReport.severity.toLowerCase()}`}>
                        {selectedReport.severity}
                      </span>
                      <span className={`priority-badge ${selectedReport.priority.toLowerCase()}`}>
                        {selectedReport.priority}
                      </span>
                      <span className="status-badge">{selectedReport.status}</span>
                    </div>
                  </div>
                  
                  <div className="report-info">
                    <p><strong>Reported By:</strong> {selectedReport.reportedBy?.name}</p>
                    <p><strong>Email:</strong> {selectedReport.reportedBy?.email}</p>
                    <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    {selectedReport.category && (
                      <p><strong>Category:</strong> {selectedReport.category}</p>
                    )}
                  </div>
                  
                  <div className="description">
                    <strong>Description:</strong>
                    <p>{selectedReport.description}</p>
                  </div>
                  
                  {selectedReport.stepsToReproduce && (
                    <div className="section">
                      <strong>Steps to Reproduce:</strong>
                      <p>{selectedReport.stepsToReproduce}</p>
                    </div>
                  )}
                  
                  {selectedReport.expectedBehavior && (
                    <div className="section">
                      <strong>Expected Behavior:</strong>
                      <p>{selectedReport.expectedBehavior}</p>
                    </div>
                  )}
                  
                  {selectedReport.actualBehavior && (
                    <div className="section">
                      <strong>Actual Behavior:</strong>
                      <p>{selectedReport.actualBehavior}</p>
                    </div>
                  )}
                  
                  <div className="confirmation-form">
                    <h4>Confirm & Update</h4>
                    
                    <label>
                      Severity:
                      <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </label>
                    
                    <label>
                      Priority:
                      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </label>
                    
                    <label>
                      Notes:
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add confirmation notes or comments..."
                        rows="3"
                      />
                    </label>
                    
                    <div className="action-buttons">
                      <button
                        onClick={() => handleConfirm('confirmed')}
                        className="confirm-btn"
                      >
                        ✓ Confirm & Start Working
                      </button>
                      <button
                        onClick={() => handleConfirm('rejected')}
                        className="reject-btn"
                      >
                        ✗ Close as Invalid
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugReportModal;