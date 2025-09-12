import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { notificationsAPI, wsService } from '../services/api';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

// Notification actions
const NOTIFICATION_ACTIONS = {
  LOADING_START: 'LOADING_START',
  LOADING_END: 'LOADING_END',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  connected: false,
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.LOADING_START:
      return { ...state, loading: true, error: null };
    
    case NOTIFICATION_ACTIONS.LOADING_END:
      return { ...state, loading: false };
    
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload, loading: false };
    
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.is_read ? 0 : 1),
      };
    
    case NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        ),
      };
    
    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
      const deletedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: state.unreadCount - (deletedNotification && !deletedNotification.is_read ? 1 : 0),
      };
    
    case NOTIFICATION_ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    case NOTIFICATION_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case NOTIFICATION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Provider component
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // WebSocket handlers
  useEffect(() => {
    // Handle real-time notifications
    const handleNotification = (notificationData) => {
      // Add to state
      dispatch({ type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION, payload: notificationData });
      
      // Show toast notification
      const toastOptions = {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      };

      switch (notificationData.type) {
        case 'reminder':
          toast.info(notificationData.message, toastOptions);
          break;
        case 'success':
          toast.success(notificationData.message, toastOptions);
          break;
        case 'warning':
          toast.warning(notificationData.message, toastOptions);
          break;
        case 'error':
          toast.error(notificationData.message, toastOptions);
          break;
        default:
          toast.info(notificationData.message, toastOptions);
      }
    };

    // Subscribe to WebSocket notifications
    wsService.addListener('notification', handleNotification);

    // Connect WebSocket
    wsService.connect();

    // Cleanup
    return () => {
      wsService.removeListener('notification', handleNotification);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async (filters = {}) => {
    try {
      dispatch({ type: NOTIFICATION_ACTIONS.LOADING_START });
      const response = await notificationsAPI.getNotifications(filters);
      dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: response.data.notifications });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch notifications';
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: message });
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: response.data.unread_count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const response = await notificationsAPI.markAsRead(id);
      dispatch({ type: NOTIFICATION_ACTIONS.UPDATE_NOTIFICATION, payload: response.data.notification });
      
      // Update unread count
      dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: Math.max(0, state.unreadCount - 1) });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to mark notification as read';
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      // Update all notifications to read status
      const updatedNotifications = state.notifications.map(notification => ({
        ...notification,
        is_read: true,
      }));
      dispatch({ type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS, payload: updatedNotifications });
      dispatch({ type: NOTIFICATION_ACTIONS.SET_UNREAD_COUNT, payload: 0 });
      
      toast.success(`${response.data.updated_count} notifications marked as read`);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to mark all notifications as read';
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      dispatch({ type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION, payload: id });
      toast.success('Notification deleted');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete notification';
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
    }
  };

  // Create test notification
  const createTestNotification = async (message, type = 'test') => {
    try {
      const response = await notificationsAPI.createTestNotification(message, type);
      // Don't add to state here as it will come through WebSocket
      toast.success('Test notification sent!');
      return response.data.notification;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create test notification';
      dispatch({ type: NOTIFICATION_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!');
      } else if (permission === 'denied') {
        toast.warning('Browser notifications disabled');
      }
      return permission;
    }
    return 'unsupported';
  };

  // Show browser notification
  const showBrowserNotification = (title, body, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ERROR });
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, []);

  const value = {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
    requestNotificationPermission,
    showBrowserNotification,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notification context
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
