import React, { useState, useEffect } from 'react';
import { Plus, Mic, FileText, Brain, TrendingUp, Calendar, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAI } from '../contexts/AIContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUI } from '../contexts/UIContext';

// Components
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import VoiceInputModal from '../components/VoiceInputModal';
import BulkImportModal from '../components/BulkImportModal';
import AIInsightsPanel from '../components/AIInsightsPanel';
import StatsCards from '../components/StatsCards';

function Dashboard() {
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    tasks, 
    loading, 
    stats, 
    activeFilter,
    setActiveFilter,
    fetchTasks, 
    markTaskComplete, 
    deleteTask,
    filters 
  } = useTask();

  const { 
    generateDailySummary, 
    dailySummary, 
    getInsights 
  } = useAI();

  const { notifications } = useNotification();

  const {
    showTaskModal,
    showVoiceModal,
    showBulkModal,
    showAIInsights,
    selectedTask,
    openTaskModal,
    closeTaskModal,
    openVoiceModal,
    closeVoiceModal,
    openBulkModal,
    closeBulkModal,
    openAIInsights,
    closeAIInsights
  } = useUI();

  // Refresh daily summary when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      generateDailySummary(today);
    }
  }, [tasks.length]);

  // Fetch daily summary on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    generateDailySummary(today);
    getInsights();
  }, []);

  // Filter and search tasks
  const getFilteredTasks = () => {
    let filteredTasks = tasks;

    // Apply search filter
    if (searchQuery.trim()) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'pending':
        filteredTasks = filteredTasks.filter(task => task.status === 'Pending');
        break;
      case 'completed':
        filteredTasks = filteredTasks.filter(task => task.status === 'Completed');
        break;
      case 'inprogress':
        filteredTasks = filteredTasks.filter(task => task.status === 'In Progress');
        break;
      case 'high':
        filteredTasks = filteredTasks.filter(task => task.priority === 'High');
        break;
      case 'overdue':
        const now = new Date();
        filteredTasks = filteredTasks.filter(task => {
          if (!task.deadline) return false;
          const deadline = new Date(task.deadline);
          return deadline < now && task.status !== 'Completed';
        });
        break;
      case 'today':
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(task => {
          if (!task.deadline) return false;
          const taskDate = new Date(task.deadline).toISOString().split('T')[0];
          return taskDate === todayStr && task.status !== 'Completed';
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filteredTasks;
  };

  const handleStatsCardClick = (filterType) => {
    setActiveFilter(filterType);
    setSearchQuery(''); // Clear search when clicking stats cards
  };

  const handleTaskClick = (task) => {
    openTaskModal(task);
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await markTaskComplete(taskId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const filteredTasks = getFilteredTasks();
  const upcomingTasks = filteredTasks.filter(task => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    const now = new Date();
    const hours24 = 24 * 60 * 60 * 1000;
    return deadline.getTime() - now.getTime() <= hours24 && deadline.getTime() > now.getTime();
  });

  const overdueTasks = filteredTasks.filter(task => {
    if (!task.deadline) return false;
    return new Date(task.deadline) < new Date() && task.status !== 'Completed';
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! You have {stats.pending} pending tasks today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openBulkModal}
            className="btn-secondary px-4 py-2"
          >
            <FileText className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          
          <button
            onClick={openVoiceModal}
            className="btn-secondary px-4 py-2"
          >
            <Mic className="h-4 w-4 mr-2" />
            Voice Input
          </button>

          <button
            onClick={openAIInsights}
            className="btn-secondary px-4 py-2"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </button>

          <button
            onClick={() => openTaskModal()}
            className="btn-primary px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} tasks={tasks} onCardClick={handleStatsCardClick} />

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="inprogress">In Progress</option>
              <option value="high">High Priority</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
            </select>
            
            {(searchQuery || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {(searchQuery || activeFilter !== 'all') && (
          <div className="mt-3 text-sm text-gray-600">
            Showing {getFilteredTasks().length} of {tasks.length} tasks
            {searchQuery && ` matching "${searchQuery}"`}
            {activeFilter !== 'all' && ` filtered by ${activeFilter}`}
          </div>
        )}
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Brain className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Daily Summary
              </h3>
              <p className="text-gray-700 mb-3">{dailySummary.summary}</p>
              
              {/* Priority Focus */}
              {dailySummary.priority_focus && (
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">Priority Focus:</h4>
                  <p className="text-sm text-gray-600">{dailySummary.priority_focus}</p>
                </div>
              )}

              {/* Workload Estimation */}
              {dailySummary.estimated_workload && (
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dailySummary.estimated_workload === 'heavy' ? 'bg-red-100 text-red-800' :
                    dailySummary.estimated_workload === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {dailySummary.estimated_workload.charAt(0).toUpperCase() + dailySummary.estimated_workload.slice(1)} Workload
                  </span>
                </div>
              )}
              
              {/* Recommendations */}
              {dailySummary.recommendations && dailySummary.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {dailySummary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-primary-500 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-900">
                Overdue Tasks ({overdueTasks.length})
              </h3>
            </div>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between bg-white rounded p-2 border">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </span>
                  <span className="text-xs text-red-600">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-sm text-red-700">
                  +{overdueTasks.length - 3} more overdue tasks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">
                Due Soon ({upcomingTasks.length})
              </h3>
            </div>
            <div className="space-y-2">
              {upcomingTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between bg-white rounded p-2 border">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </span>
                  <span className="text-xs text-yellow-600">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {upcomingTasks.length > 3 && (
                <p className="text-sm text-yellow-700">
                  +{upcomingTasks.length - 3} more upcoming tasks
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tasks ({filteredTasks.length})
          </h2>
          
          <div className="flex items-center space-x-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="select text-sm"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner mr-3"></div>
            <span className="text-gray-600">Loading tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some(f => f) 
                ? 'No tasks match your current filters.'
                : 'Get started by creating your first task!'
              }
            </p>
            <button
              onClick={() => openTaskModal()}
              className="btn-primary px-6 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }>
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                viewMode={viewMode}
                onClick={() => handleTaskClick(task)}
                onComplete={() => handleTaskComplete(task.id)}
                onDelete={() => handleTaskDelete(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={closeTaskModal}
        />
      )}

      {showVoiceModal && (
        <VoiceInputModal
          onClose={closeVoiceModal}
        />
      )}

      {showBulkModal && (
        <BulkImportModal
          onClose={closeBulkModal}
        />
      )}

      {showAIInsights && (
        <AIInsightsPanel
          onClose={closeAIInsights}
        />
      )}
    </div>
  );
}

export default Dashboard;
