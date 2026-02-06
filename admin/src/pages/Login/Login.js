import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
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

  // Tinanggal na natin ang slide state at interval logic dito

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(email, password);
      
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminData', JSON.stringify(response.admin));
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      console.log('Login successful:', response.message);
      
      navigate('/admin/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      
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
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-left">
          {/* Isang video na lang ang ititira natin dito na naka-point sa video2.mp4 */}
          <video
            className="slideshow-video active"
            src="/uploads/video2.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          
          {/* Image replacing the H1 text */}
<div className="slide-text-overlay">
  <img
    src="/logo.png"
    alt="Texionix"
    className="slide-title-image"
  />
  <p className="slide-subtitle"></p>
</div>


          {/* Tinanggal na rin ang slideshow-indicators dahil hindi na ito slide */}
        </div>

        <div className="login-right">
          <div className="login-form-container">
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
                  'Login'
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