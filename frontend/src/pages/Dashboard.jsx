import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Scanner from '../components/Scanner';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [auditResults, setAuditResults] = useState(null);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="dashboard-page">
      <canvas id="matrix-bg" className="matrix-canvas"></canvas>
      
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-container">
          <Scanner onResults={setAuditResults} />
          {auditResults && (
            <div className="results-panel">
              <h2>Audit Results</h2>
              <div className="results-content">
                {/* Results will be displayed here */}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
