import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
import { BsCheckCircleFill } from 'react-icons/bs';
import { AiFillThunderbolt } from 'react-icons/ai';
import './Login.css';
import BugCircleLogo from '../../assets/TexionixLogo.png';
import { authAPI } from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Call login API
      const response = await authAPI.login(email, password);
      
      // Store token and admin data
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminData', JSON.stringify(response.admin));
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Success message (optional)
      console.log('Login successful:', response.message);
      
      // Navigate to dashboard
      navigate('/admin/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error messages from backend
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background Shapes */}
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-card-wrapper">
        {/* Left Side - Branding Text Only */}
        <div className="login-left">
          <div className="brand-content">
            <div className="branding-text">
              <h1 className="system-title">Bug Reporting System</h1>
              <p className="system-tagline">Audit & Compliance Division</p>
            </div>

            <h3 className="welcome-text">Welcome Back, Admin!</h3>
            <p className="welcome-subtitle">
              Manage bug reports efficiently with real-time tracking and comprehensive analytics.
            </p>

            <div className="features-list">
              <div className="feature-item">
                <span className="check-icon">
                  <BsCheckCircleFill size={20} />
                </span>
                <span>Real-time bug tracking</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">
                  <BsCheckCircleFill size={20} />
                </span>
                <span>Email integration</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">
                  <BsCheckCircleFill size={20} />
                </span>
                <span>Team collaboration</span>
              </div>
              <div className="feature-item">
                <span className="check-icon">
                  <BsCheckCircleFill size={20} />
                </span>
                <span>Priority management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form with Circle Logo */}
        <div className="login-right">
          <div className="login-form-container">
            {/* Circle Bug Logo at Top */}
            <div className="logo-container">
              <img 
                src={BugCircleLogo} 
                alt="Bug Reporting Logo" 
                className="circle-bug-logo"
              />
            </div>

            <div className="login-form-header">
              <h2>Admin Login</h2>
              <p>Enter your credentials to access the dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="error-message">
                  <HiExclamationCircle size={18} />
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HiMail size={20} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@telexph.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <HiLockClosed size={20} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login to Dashboard
                    <AiFillThunderbolt size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>Need Help? <a href="#support">Contact Support</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;