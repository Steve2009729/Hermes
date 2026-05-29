import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          ⚡ HermesAudit
        </div>
        <div className="navbar-links">
          {isAuthenticated && user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="nav-button">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/auth')} className="nav-button">
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
