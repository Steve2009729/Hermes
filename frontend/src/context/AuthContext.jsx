import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('hermes_token');
    if (savedToken) {
      setToken(savedToken);
      // Verify token with backend
      verifyTokenWithBackend(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifyTokenWithBackend(authToken) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('hermes_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('hermes_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function signup(email, password) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('hermes_token', data.token);
        setToken(data.token);
        setUser({ email });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function login(email, password) {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('hermes_token', data.token);
        setToken(data.token);
        setUser({ email });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  function logout() {
    localStorage.removeItem('hermes_token');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
