import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && !config.url.includes('/auth/register') && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or making auth calls
      const isAuthCall = error.config?.url?.includes('/auth/');
      const isOnLoginPage = window.location.pathname === '/login';
      const isLoggingOut = sessionStorage.getItem('loggingOut') === 'true';
      
      if (!isAuthCall && !isOnLoginPage && !isLoggingOut) {
        // Only show alert if there are repeated failures
        const lastRedirect = sessionStorage.getItem('lastAuthRedirect');
        const now = Date.now();
        
        if (!lastRedirect || (now - parseInt(lastRedirect)) > 5000) { // 5 second cooldown
          sessionStorage.setItem('lastAuthRedirect', now.toString());
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return data;
  },
  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  validateToken: () => api.get('/auth/validate'),
};

// Tasks API
export const tasksAPI = {
  getAllTasks: (filters = {}) => api.get('/tasks', { params: filters }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  createBulkTasks: (tasks) => api.post('/tasks/bulk', { tasks }),
  updateTask: (id, updates) => api.put(`/tasks/${id}`, updates),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  markComplete: (id) => api.post(`/tasks/${id}/complete`),
  getUpcoming: (hours = 24) => api.get('/tasks/upcoming', { params: { hours } }),
  getOverdue: () => api.get('/tasks/overdue'),
  getStats: () => api.get('/tasks/stats'),
  getCategories: () => api.get('/tasks/categories'),
};

// AI API
export const aiAPI = {
  extractTasks: (text, timezone = 'UTC') => 
    api.post('/ai/extract-tasks', { text, user_timezone: timezone }),
  enhanceTask: (title, context = '') => 
    api.post('/ai/enhance-task', { title, context }),
  generateDailySummary: (date) => 
    api.get('/ai/daily-summary', { params: { date } }),
  processVoiceInput: (transcript, timezone = 'UTC') => 
    api.post('/ai/voice-input', { transcript, user_timezone: timezone }),
  smartCategorize: (tasks) => 
    api.post('/ai/categorize', { tasks }),
  getInsights: () => api.get('/ai/insights'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (filters = {}) => api.get('/notifications', { params: filters }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  createTestNotification: (message, type = 'test') => 
    api.post('/notifications/test', { message, type }),
  getPendingReminders: () => api.get('/notifications/pending'),
  cleanupOld: (days = 30) => api.post('/notifications/cleanup', null, { params: { days } }),
};

// WebSocket connection
export class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}//${host}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to notifications
        this.send({
          type: 'subscribe',
          userId: 1 // For demo purposes
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data.type, data.data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  notifyListeners(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('WebSocket listener error:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Create singleton WebSocket instance
export const wsService = new WebSocketService();

export default api;
