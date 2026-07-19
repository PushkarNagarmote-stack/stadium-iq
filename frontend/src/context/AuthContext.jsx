import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE, CSRF_HEADERS } from '../api';

const AuthContext = createContext(null);
const API = API_BASE;

export function AuthProvider({ children }) {
  const [isStaff, setIsStaff] = useState(false);
  const [username, setUsername] = useState(null);
  const [checking, setChecking] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/session`, { credentials: 'include' });
      const data = await res.json();
      setIsStaff(!!data.authenticated);
      setUsername(data.username || null);
    } catch {
      setIsStaff(false);
      setUsername(null);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (uname, password) => {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...CSRF_HEADERS },
      credentials: 'include',
      body: JSON.stringify({ username: uname, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setIsStaff(true);
    setUsername(data.username);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/api/logout`, {
        method: 'POST',
        headers: { ...CSRF_HEADERS },
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout — we clear local state regardless.
    }
    setIsStaff(false);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isStaff, username, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}