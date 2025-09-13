import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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

  console.log('AuthProvider state:', { user: user ? 'logged in' : 'not logged in', loading });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Get user profile from token or API
          const response = await authAPI.getProfile();
          setUser(response.user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Login attempt with:', credentials);
      const response = await authAPI.login(credentials);
      console.log('Login response:', response);
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Set logging out flag to prevent API interceptor redirects
    sessionStorage.setItem('loggingOut', 'true');
    // Set user to null first to stop any pending requests
    setUser(null);
    // Clear storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear any auth redirect cooldown
    sessionStorage.removeItem('lastAuthRedirect');
    // Navigate to login
    setTimeout(() => {
      sessionStorage.removeItem('loggingOut');
      window.location.href = '/login';
    }, 100);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};