import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const openTaskModal = (task = null) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setShowTaskModal(false);
  };

  const openVoiceModal = () => setShowVoiceModal(true);
  const closeVoiceModal = () => setShowVoiceModal(false);

  const openBulkModal = () => setShowBulkModal(true);
  const closeBulkModal = () => setShowBulkModal(false);

  const openAIInsights = () => setShowAIInsights(true);
  const closeAIInsights = () => setShowAIInsights(false);

  const openAnalytics = () => {
    // For now, just open AI insights as analytics
    setShowAIInsights(true);
  };

  const value = {
    // Modal states
    showTaskModal,
    showVoiceModal,
    showBulkModal,
    showAIInsights,
    selectedTask,

    // Modal actions
    openTaskModal,
    closeTaskModal,
    openVoiceModal,
    closeVoiceModal,
    openBulkModal,
    closeBulkModal,
    openAIInsights,
    closeAIInsights,
    openAnalytics,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export default UIContext;