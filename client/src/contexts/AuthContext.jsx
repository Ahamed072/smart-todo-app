import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const refreshIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(null);

  console.log('AuthProvider state:', { user: user ? 'logged in' : 'not logged in', loading });

  // Initialize session start time
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !sessionStartRef.current) {
      const storedSessionStart = localStorage.getItem('sessionStart');
      if (storedSessionStart) {
        sessionStartRef.current = parseInt(storedSessionStart);
      } else {
        sessionStartRef.current = Date.now();
        localStorage.setItem('sessionStart', sessionStartRef.current.toString());
      }
    }
  }, []);

  // Check if current session is valid (within 10 minutes)
  const isSessionValid = () => {
    if (!sessionStartRef.current) return false;
    const sessionDuration = Date.now() - sessionStartRef.current;
    const sessionTimeout = 10 * 60 * 1000; // 10 minutes
    return sessionDuration < sessionTimeout;
  };

  // Track user activity for session management
  useEffect(() => {
    const updateLastActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity);
      });
    };
  }, []);

  // Set up token refresh mechanism
  useEffect(() => {
    const setupTokenRefresh = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Refresh token every 9 minutes if user is active (tokens valid for 24h)
      refreshIntervalRef.current = setInterval(async () => {
        const token = localStorage.getItem('authToken');
        if (token && user) {
          // Check if 10-minute session is still valid
          if (!isSessionValid()) {
            console.log('10-minute session expired');
            logout();
            return;
          }

          const timeSinceLastActivity = Date.now() - lastActivityRef.current;
          const inactivityTimeout = 10 * 60 * 1000; // 10 minutes of inactivity
          
          // If user has been inactive for more than 10 minutes, logout silently
          if (timeSinceLastActivity > inactivityTimeout) {
            console.log('Session expired due to inactivity');
            logout();
            return;
          }

          // If user is active and session is valid, refresh token silently
          try {
            const response = await authAPI.refreshToken();
            localStorage.setItem('authToken', response.data.token);
            console.log('Token refreshed successfully');
          } catch (error) {
            console.error('Token refresh failed:', error);
            // Only logout if the error is due to invalid token, not network issues
            if (error.response?.status === 401 || error.response?.status === 403) {
              logout();
            }
          }
        }
      }, 9 * 60 * 1000); // 9 minutes
    };

    if (user) {
      setupTokenRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        const storedSessionStart = localStorage.getItem('sessionStart');
        
        if (token) {
          // Initialize session start if it exists
          if (storedSessionStart) {
            sessionStartRef.current = parseInt(storedSessionStart);
          }
          
          // Check if 10-minute session is still valid
          if (!isSessionValid()) {
            console.log('10-minute session expired on page load');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionStart');
            setUser(null);
            setLoading(false);
            return;
          }
          
          // First try to load user from localStorage
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              console.log('User loaded from localStorage');
            } catch (parseError) {
              console.error('Error parsing stored user:', parseError);
              localStorage.removeItem('user');
            }
          }
          
          // Then validate token with server (this can fail without logging out)
          try {
            const response = await authAPI.getProfile();
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            console.log('User profile refreshed from server');
          } catch (error) {
            console.error('Profile refresh failed, using stored user:', error);
            // Only logout on 401/403 errors, not on network errors
            if (error.response?.status === 401 || error.response?.status === 403) {
              console.log('Token invalid, logging out');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionStart');
              setUser(null);
            }
            // For network errors, keep the stored user session
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Only clear on authentication errors, not network errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('sessionStart');
          setUser(null);
        }
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
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      // Reset activity tracking and session start
      lastActivityRef.current = Date.now();
      sessionStartRef.current = Date.now();
      localStorage.setItem('sessionStart', sessionStartRef.current.toString());
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
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      // Reset activity tracking and session start
      lastActivityRef.current = Date.now();
      sessionStartRef.current = Date.now();
      localStorage.setItem('sessionStart', sessionStartRef.current.toString());
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Clear refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set logging out flag to prevent API interceptor redirects
    sessionStorage.setItem('loggingOut', 'true');
    // Set user to null first to stop any pending requests
    setUser(null);
    // Clear storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionStart');
    // Clear any auth redirect cooldown
    sessionStorage.removeItem('lastAuthRedirect');
    // Reset refs
    sessionStartRef.current = null;
    lastActivityRef.current = Date.now();
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