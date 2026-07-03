import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lh_lawyer_token'));
  const [loading, setLoading] = useState(true);

  // Inject token to all axios requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchProfile = useCallback(async (jwt) => {
    try {
      const res = await axios.get(`${API}/lawyers/get`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setUser(res.data.data.lawyer);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchProfile(token);
    else setLoading(false);
  }, [token, fetchProfile]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/lawyers/login`, { email, password });
    const { token: jwt, lawyer } = res.data.data;
    localStorage.setItem('lh_lawyer_token', jwt);
    setToken(jwt);
    setUser(lawyer);
    return lawyer;
  };

  const logout = () => {
    localStorage.removeItem('lh_lawyer_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = () => token && fetchProfile(token);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile, API }}>
      {children}
    </AuthContext.Provider>
  );
}
