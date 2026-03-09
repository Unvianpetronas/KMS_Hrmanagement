import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

function loadUserFromStorage() {
  try {
    const saved = localStorage.getItem('kms_user');
    const token = localStorage.getItem('kms_token');
    if (!saved || !token) return null;

    // Check token expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('kms_token');
      localStorage.removeItem('kms_user');
      return null;
    }

    return JSON.parse(saved);
  } catch {
    localStorage.removeItem('kms_token');
    localStorage.removeItem('kms_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUserFromStorage());

  // Listen for auth:logout events dispatched by api.js on 401
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authAPI.login(username, password);
    localStorage.setItem('kms_token', data.token);
    localStorage.setItem('kms_user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    authAPI.logout();
    localStorage.removeItem('kms_token');
    localStorage.removeItem('kms_user');
    setUser(null);
  }, []);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
