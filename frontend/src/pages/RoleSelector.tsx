import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// No UserRole import needed

export const RoleSelector: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setIsLoading(true);
      setError('');
      await login(Number(userId));
      navigate('/'); 
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend server. Please ensure Spring Boot is running on port 8086.');
      } else if (err.response?.status === 404) {
        setError(`User ID ${userId} not found in database.`);
      } else if (err.response?.status === 500) {
        setError('Backend server error. Please check server logs.');
      } else {
        setError(err.response?.data?.message || `Login failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Enter Kredia System</h2>
        <p className="login-subtitle">For local development, enter a User ID to assume their role.</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="userId">User ID</label>
            <input 
              id="userId"
              type="number" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 1"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <strong>Login Error:</strong><br/>
              {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={isLoading || !userId}>
            {isLoading ? 'Connecting...' : 'Login'}
          </button>
        </form>
        
        <div className="login-hints">
          <h4>Hint - Default Users:</h4>
          <ul>
            <li><strong>ID 1:</strong> Admin</li>
            <li><strong>ID 2:</strong> Agent</li>
            <li><strong>ID 3:</strong> Client</li>
          </ul>
          <p className="text-muted text-xs mt-4">
            Make sure backend is running on port 8086
          </p>
        </div>
      </div>
    </div>
  );
};
