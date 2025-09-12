import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';

const AIContext = createContext();

// AI actions
const AI_ACTIONS = {
  LOADING_START: 'LOADING_START',
  LOADING_END: 'LOADING_END',
  SET_EXTRACTED_TASKS: 'SET_EXTRACTED_TASKS',
  SET_ENHANCED_TASK: 'SET_ENHANCED_TASK',
  SET_DAILY_SUMMARY: 'SET_DAILY_SUMMARY',
  SET_INSIGHTS: 'SET_INSIGHTS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_VOICE_STATUS: 'SET_VOICE_STATUS',
  SET_VOICE_TRANSCRIPT: 'SET_VOICE_TRANSCRIPT',
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  extractedTasks: [],
  enhancedTask: null,
  dailySummary: null,
  insights: null,
  voiceStatus: 'idle', // idle, listening, processing
  voiceTranscript: '',
  isSupported: false,
};

// Reducer
function aiReducer(state, action) {
  switch (action.type) {
    case AI_ACTIONS.LOADING_START:
      return { ...state, loading: true, error: null };
    
    case AI_ACTIONS.LOADING_END:
      return { ...state, loading: false };
    
    case AI_ACTIONS.SET_EXTRACTED_TASKS:
      return { ...state, extractedTasks: action.payload, loading: false };
    
    case AI_ACTIONS.SET_ENHANCED_TASK:
      return { ...state, enhancedTask: action.payload, loading: false };
    
    case AI_ACTIONS.SET_DAILY_SUMMARY:
      return { ...state, dailySummary: action.payload, loading: false };
    
    case AI_ACTIONS.SET_INSIGHTS:
      return { ...state, insights: action.payload, loading: false };
    
    case AI_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case AI_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case AI_ACTIONS.SET_VOICE_STATUS:
      return { ...state, voiceStatus: action.payload };
    
    case AI_ACTIONS.SET_VOICE_TRANSCRIPT:
      return { ...state, voiceTranscript: action.payload };
    
    default:
      return state;
  }
}

// Voice recognition hook
function useVoiceRecognition() {
  const [recognition, setRecognition] = React.useState(null);
  const [isSupported, setIsSupported] = React.useState(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      setRecognition(recognitionInstance);
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  return { recognition, isSupported };
}

// Provider component
export function AIProvider({ children }) {
  const [state, dispatch] = useReducer(aiReducer, initialState);
  const { recognition, isSupported } = useVoiceRecognition();

  // Initialize voice support status
  useEffect(() => {
    dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: isSupported ? 'idle' : 'unsupported' });
  }, [isSupported]);

  // Extract tasks from text
  const extractTasks = async (text, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      const response = await aiAPI.extractTasks(text, timezone);
      dispatch({ type: AI_ACTIONS.SET_EXTRACTED_TASKS, payload: response.data.tasks });
      toast.success(`${response.data.count} tasks extracted successfully!`);
      return response.data.tasks;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to extract tasks';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Enhance task
  const enhanceTask = async (title, context = '') => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      const response = await aiAPI.enhanceTask(title, context);
      dispatch({ type: AI_ACTIONS.SET_ENHANCED_TASK, payload: response.data.enhancement });
      return response.data.enhancement;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to enhance task';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Generate daily summary
  const generateDailySummary = async (date) => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      const response = await aiAPI.generateDailySummary(date);
      dispatch({ type: AI_ACTIONS.SET_DAILY_SUMMARY, payload: response.data.summary });
      return response.data.summary;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to generate summary';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Get AI insights
  const getInsights = async () => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      const response = await aiAPI.getInsights();
      dispatch({ type: AI_ACTIONS.SET_INSIGHTS, payload: response.data.insights });
      return response.data.insights;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get insights';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Start voice recording
  const startVoiceRecording = () => {
    if (!recognition || !isSupported) {
      toast.error('Voice recognition is not supported in your browser');
      return;
    }

    dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'listening' });
    dispatch({ type: AI_ACTIONS.SET_VOICE_TRANSCRIPT, payload: '' });

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      dispatch({ type: AI_ACTIONS.SET_VOICE_TRANSCRIPT, payload: transcript });
    };

    recognition.onend = () => {
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
      toast.error('Voice recognition error. Please try again.');
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
      toast.error('Failed to start voice recognition');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (recognition) {
      recognition.stop();
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
    }
  };

  // Process voice input
  const processVoiceInput = async (transcript, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'processing' });
      
      const response = await aiAPI.processVoiceInput(transcript, timezone);
      dispatch({ type: AI_ACTIONS.SET_EXTRACTED_TASKS, payload: response.data.tasks });
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
      
      toast.success(`${response.data.count} tasks extracted from voice input!`);
      return response.data.tasks;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process voice input';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      dispatch({ type: AI_ACTIONS.SET_VOICE_STATUS, payload: 'idle' });
      toast.error(message);
      throw error;
    }
  };

  // Smart categorize tasks
  const smartCategorize = async (tasks) => {
    try {
      dispatch({ type: AI_ACTIONS.LOADING_START });
      const response = await aiAPI.smartCategorize(tasks);
      dispatch({ type: AI_ACTIONS.LOADING_END });
      return response.data.categorized_tasks;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to categorize tasks';
      dispatch({ type: AI_ACTIONS.SET_ERROR, payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AI_ACTIONS.CLEAR_ERROR });
  };

  // Clear extracted tasks
  const clearExtractedTasks = () => {
    dispatch({ type: AI_ACTIONS.SET_EXTRACTED_TASKS, payload: [] });
  };

  const value = {
    // State
    loading: state.loading,
    error: state.error,
    extractedTasks: state.extractedTasks,
    enhancedTask: state.enhancedTask,
    dailySummary: state.dailySummary,
    insights: state.insights,
    voiceStatus: state.voiceStatus,
    voiceTranscript: state.voiceTranscript,
    isVoiceSupported: isSupported,
    
    // Actions
    extractTasks,
    enhanceTask,
    generateDailySummary,
    getInsights,
    startVoiceRecording,
    stopVoiceRecording,
    processVoiceInput,
    smartCategorize,
    clearError,
    clearExtractedTasks,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

// Hook to use AI context
export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export default AIContext;
