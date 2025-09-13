import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import { toast } from 'react-toastify';

const TaskContext = createContext();

// Task actions
const TASK_ACTIONS = {
  LOADING_START: 'LOADING_START',
  LOADING_END: 'LOADING_END',
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  ADD_BULK_TASKS: 'ADD_BULK_TASKS',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SET_FILTERS: 'SET_FILTERS',
  SET_ACTIVE_FILTER: 'SET_ACTIVE_FILTER',
  SET_STATS: 'SET_STATS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Helper function to calculate stats from tasks
const calculateStatsFromTasks = (tasks) => {
  const stats = {
    total: tasks.length,
    completed: 0,
    pending: 0,
    in_progress: 0,
    high_priority: 0,
    overdue: 0,
  };

  const now = new Date();
  
  tasks.forEach(task => {
    switch (task.status?.toLowerCase()) {
      case 'completed':
        stats.completed++;
        break;
      case 'in progress':
      case 'in_progress':
        stats.in_progress++;
        break;
      default:
        stats.pending++;
    }

    if (task.priority?.toLowerCase() === 'high') {
      stats.high_priority++;
    }

    if (task.due_date && new Date(task.due_date) < now && task.status?.toLowerCase() !== 'completed') {
      stats.overdue++;
    }
  });

  return stats;
};

// Initial state
const initialState = {
  tasks: [],
  loading: false,
  error: null,
  activeFilter: 'all', // Add active filter to global state
  filters: {
    status: '',
    priority: '',
    category: '',
    search: '',
    startDate: '',
    endDate: '',
  },
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    in_progress: 0,
    high_priority: 0,
    overdue: 0,
  },
  categories: [],
};

// Reducer
function taskReducer(state, action) {
  switch (action.type) {
    case TASK_ACTIONS.LOADING_START:
      return { ...state, loading: true, error: null };
    
    case TASK_ACTIONS.LOADING_END:
      return { ...state, loading: false };
    
    case TASK_ACTIONS.SET_TASKS:
      return { 
        ...state, 
        tasks: action.payload, 
        stats: calculateStatsFromTasks(action.payload),
        loading: false, 
        error: null 
      };
    
    case TASK_ACTIONS.ADD_TASK:
      const newTasksAfterAdd = [action.payload, ...state.tasks];
      return {
        ...state,
        tasks: newTasksAfterAdd,
        stats: calculateStatsFromTasks(newTasksAfterAdd),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.ADD_BULK_TASKS:
      const newTasksAfterBulkAdd = [...action.payload, ...state.tasks];
      return {
        ...state,
        tasks: newTasksAfterBulkAdd,
        stats: calculateStatsFromTasks(newTasksAfterBulkAdd),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.UPDATE_TASK:
      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload.id ? action.payload : task
      );
      return {
        ...state,
        tasks: updatedTasks,
        stats: calculateStatsFromTasks(updatedTasks),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.DELETE_TASK:
      const remainingTasks = state.tasks.filter(task => task.id !== action.payload);
      return {
        ...state,
        tasks: remainingTasks,
        stats: calculateStatsFromTasks(remainingTasks),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case TASK_ACTIONS.SET_ACTIVE_FILTER:
      return { ...state, activeFilter: action.payload };
    
    case TASK_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    
    case TASK_ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    
    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case TASK_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Provider component
export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Auto-refresh tasks every 30 seconds when the tab is active
  useEffect(() => {
    let interval;
    
    const startAutoRefresh = () => {
      interval = setInterval(() => {
        if (!document.hidden) {
          fetchTasks(state.filters, false); // Silent refresh
        }
      }, 30000); // 30 seconds
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became active, refresh data
        fetchTasks(state.filters, false);
        startAutoRefresh();
      } else {
        // Tab became inactive, stop auto-refresh
        if (interval) {
          clearInterval(interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startAutoRefresh();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.filters]);

  // Fetch tasks
  const fetchTasks = async (filters = {}, showLoading = true) => {
    try {
      if (showLoading) {
        dispatch({ type: TASK_ACTIONS.LOADING_START });
      }
      const response = await tasksAPI.getAllTasks(filters);
      dispatch({ type: TASK_ACTIONS.SET_TASKS, payload: response.data.tasks });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch tasks';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      if (showLoading) {
        toast.error(message);
      }
    }
  };

  // Create task with optimistic update
  const createTask = async (taskData) => {
    // Optimistic update - add task immediately with temporary ID
    const tempTask = {
      ...taskData,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: taskData.status || 'Pending',
      isOptimistic: true
    };
    
    dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: tempTask });

    try {
      const response = await tasksAPI.createTask(taskData);
      // Replace optimistic task with real task
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: response.data.task });
      toast.success('Task created successfully!');
      
      // Refresh stats
      fetchStats();
      return response.data.task;
    } catch (error) {
      // Remove optimistic task on error
      dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: tempTask.id });
      const message = error.response?.data?.error || 'Failed to create task';
      toast.error(message);
      throw error;
    }
  };

  // Create bulk tasks
  const createBulkTasks = async (tasks) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      const response = await tasksAPI.createBulkTasks(tasks);
      dispatch({ type: TASK_ACTIONS.ADD_BULK_TASKS, payload: response.data.tasks });
      // Refresh stats after adding bulk tasks
      await fetchStats();
      toast.success(`${response.data.count} tasks created successfully!`);
      return response.data.tasks;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create tasks';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Update task with optimistic update
  const updateTask = async (id, updates) => {
    // Optimistic update - update task immediately
    const currentTask = state.tasks.find(task => task.id === id);
    if (currentTask) {
      const optimisticTask = { ...currentTask, ...updates, isOptimistic: true };
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: optimisticTask });
    }

    try {
      const response = await tasksAPI.updateTask(id, updates);
      // Replace optimistic update with real data
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: response.data.task });
      toast.success('Task updated successfully!');
      
      // Refresh stats
      fetchStats();
      return response.data.task;
    } catch (error) {
      // Revert optimistic update on error
      if (currentTask) {
        dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: currentTask });
      }
      const message = error.response?.data?.error || 'Failed to update task';
      toast.error(message);
      throw error;
    }
  };

  // Delete task with optimistic update
  const deleteTask = async (id) => {
    // Optimistic update - remove task immediately
    const currentTask = state.tasks.find(task => task.id === id);
    dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id });

    try {
      await tasksAPI.deleteTask(id);
      toast.success('Task deleted successfully!');
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      // Revert optimistic update on error
      if (currentTask) {
        dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: currentTask });
      }
      const message = error.response?.data?.error || 'Failed to delete task';
      toast.error(message);
      throw error;
    }
  };

  // Mark task complete
  const markTaskComplete = async (id) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      const response = await tasksAPI.markComplete(id);
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: response.data.task });
      toast.success('Task completed! 🎉');
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to mark task complete';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await tasksAPI.getStats();
      dispatch({ type: TASK_ACTIONS.SET_STATS, payload: response.data.stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await tasksAPI.getCategories();
      dispatch({ type: TASK_ACTIONS.SET_CATEGORIES, payload: response.data.categories });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Set filters
  const setFilters = (filters) => {
    dispatch({ type: TASK_ACTIONS.SET_FILTERS, payload: filters });
  };

  // Set active filter
  const setActiveFilter = (filter) => {
    dispatch({ type: TASK_ACTIONS.SET_ACTIVE_FILTER, payload: filter });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });
  };

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchCategories();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(state.filters).filter(([_, value]) => value !== '')
    );
    fetchTasks(activeFilters);
  }, [state.filters]);

  const value = {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    activeFilter: state.activeFilter,
    stats: state.stats,
    categories: state.categories,
    
    // Actions
    fetchTasks,
    createTask,
    createBulkTasks,
    updateTask,
    deleteTask,
    markTaskComplete,
    fetchStats,
    fetchCategories,
    setFilters,
    setActiveFilter,
    clearError,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

// Hook to use task context
export function useTask() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}

export default TaskContext;
