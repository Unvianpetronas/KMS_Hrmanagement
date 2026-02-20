import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kms_user');
    return saved ? JSON.parse(saved) : null;
  });

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
