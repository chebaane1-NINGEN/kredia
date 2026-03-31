import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { login, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Display auth context errors
  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    if (!userId) {
      setError('Please enter a User ID');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login(Number(userId));
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (id: number) => {
    setUserId(String(id));
  };

  return (
    <div className="login-page">
      {/* Background with gradient */}
      <div className="login-background">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
      </div>

      {/* Logo */}
      <div className="login-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="logo-text">Kredia</span>
      </div>

      {/* Login Card */}
      <div className="login-card-container">
        <div className="login-card">
          {/* Card Icon */}
          <div className="card-icon">
            <ArrowRight size={24} />
          </div>

          <h1 className="login-title">Sign in to Kredia</h1>
          <p className="login-subtitle">
            Access your dashboard and manage your account
          </p>

          <form onSubmit={handleLogin} className="login-form">
            {/* User ID Input */}
            <div className="input-group">
              <div className="input-icon">
                <Mail size={18} />
              </div>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID (e.g., 1, 2, 3...)"
                disabled={isLoading}
                min="1"
              />
            </div>

            {/* Password Input (for UI completeness) */}
            <div className="input-group">
              <div className="input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="forgot-password">
              <button type="button" className="text-link">
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !userId}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Signing in...
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>Quick login for testing</span>
          </div>

          {/* Quick Login Buttons */}
          <div className="quick-login">
            <button
              type="button"
              className="quick-btn admin"
              onClick={() => quickLogin(1)}
              disabled={isLoading}
            >
              Admin
            </button>
            <button
              type="button"
              className="quick-btn agent"
              onClick={() => quickLogin(2)}
              disabled={isLoading}
            >
              Agent
            </button>
            <button
              type="button"
              className="quick-btn client"
              onClick={() => quickLogin(4)}
              disabled={isLoading}
            >
              Client
            </button>
          </div>

          {/* Backend Status */}
          <p className="backend-status">
            Backend: <span className="status-online">Online</span> on port 8086
          </p>
        </div>
      </div>
    </div>
  );
};
