import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import WebSocketClient from '../utils/websocket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsClient, setWsClient] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !wsClient) {
      const ws = new WebSocketClient(user.id);
      ws.connect();
      setWsClient(ws);

      // Listen for real-time updates
      ws.on('transaction_created', (data) => {
        // Emit custom event for components to listen
        window.dispatchEvent(new CustomEvent('transaction_created', { detail: data }));
      });

      ws.on('transaction_updated', (data) => {
        window.dispatchEvent(new CustomEvent('transaction_updated', { detail: data }));
      });

      ws.on('transaction_deleted', (data) => {
        window.dispatchEvent(new CustomEvent('transaction_deleted', { detail: data }));
      });

      ws.on('transfer_created', (data) => {
        window.dispatchEvent(new CustomEvent('transfer_created', { detail: data }));
      });

      return () => {
        ws.disconnect();
      };
    } else if (!user && wsClient) {
      wsClient.disconnect();
      setWsClient(null);
    }
  }, [user, wsClient]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return { token, user };
  };

  const register = async (email, password, name) => {
    const response = await axios.post('/api/auth/register', { email, password, name });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return { token, user };
  };

  const logout = () => {
    if (wsClient) {
      wsClient.disconnect();
      setWsClient(null);
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, wsClient }}>
      {children}
    </AuthContext.Provider>
  );
};
