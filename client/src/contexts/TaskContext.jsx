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
  SET_STATS: 'SET_STATS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  tasks: [],
  loading: false,
  error: null,
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
      return { ...state, tasks: action.payload, loading: false, error: null };
    
    case TASK_ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.ADD_BULK_TASKS:
      return {
        ...state,
        tasks: [...action.payload, ...state.tasks],
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        loading: false,
        error: null,
      };
    
    case TASK_ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
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

  // Fetch tasks
  const fetchTasks = async (filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      const response = await tasksAPI.getAllTasks(filters);
      dispatch({ type: TASK_ACTIONS.SET_TASKS, payload: response.data.tasks });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch tasks';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
    }
  };

  // Create task
  const createTask = async (taskData) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      const response = await tasksAPI.createTask(taskData);
      dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: response.data.task });
      toast.success('Task created successfully!');
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create task';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
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
      toast.success(`${response.data.count} tasks created successfully!`);
      return response.data.tasks;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create tasks';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Update task
  const updateTask = async (id, updates) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      const response = await tasksAPI.updateTask(id, updates);
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: response.data.task });
      toast.success('Task updated successfully!');
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update task';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      dispatch({ type: TASK_ACTIONS.LOADING_START });
      await tasksAPI.deleteTask(id);
      dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: id });
      toast.success('Task deleted successfully!');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete task';
      dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: message });
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
