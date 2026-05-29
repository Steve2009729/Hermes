import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        const result = await signup(email, password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error);
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <canvas id="matrix-bg" className="matrix-canvas"></canvas>

      <div className="auth-container">
        <div className="auth-header">
          <h1>⚡ HermesAudit</h1>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            Login
          </button>
          <button
            className={`tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login'
              ? "Don't have an account? Switch to Sign Up above."
              : 'Already have an account? Switch to Login above.'}
          </p>
        </div>
      </div>
    </div>
  );
}
