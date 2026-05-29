import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page">
      {/* Matrix Background */}
      <canvas id="matrix-bg" className="matrix-canvas"></canvas>

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-logo">⚡ HermesAudit</div>
          <div className="navbar-links">
            <button 
              onClick={() => navigate('/auth')}
              className="nav-button"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="glitch" data-text="HERMES">HERMES</span>
          </h1>
          <p className="hero-subtitle">
            AI-Powered Smart Contract Security Auditing
          </p>
          <button 
            className="cta-button"
            onClick={() => navigate('/auth')}
          >
            Launch Audit
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why HermesAudit?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Real-time Analysis</h3>
            <p>Instant vulnerability detection powered by advanced AI</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Gas Optimization</h3>
            <p>Get recommendations for reducing gas consumption</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Code Quality</h3>
            <p>Comprehensive code quality scoring and insights</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 HermesAudit. Securing the blockchain.</p>
      </footer>
    </div>
  );
}
