import React, { useState, useEffect } from 'react';
import { X, Brain, TrendingUp, Target, Clock, Lightbulb, BarChart, Calendar } from 'lucide-react';
import { useAI } from '../contexts/AIContext';
import { useTask } from '../contexts/TaskContext';

function AIInsightsPanel({ onClose }) {
  const { getInsights, insights, loading } = useAI();
  const { stats, tasks } = useTask();
  
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getInsights();
  }, []);

  // Helper function to get date-wise productivity data
  const getDailyProductivityData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get tasks created on this date
      const tasksCreated = tasks.filter(task => {
        const taskDate = new Date(task.created_at).toISOString().split('T')[0];
        return taskDate === dateStr;
      }).length;
      
      // Get tasks completed on this date (assuming updated_at indicates completion)
      const tasksCompleted = tasks.filter(task => {
        const taskDate = new Date(task.updated_at).toISOString().split('T')[0];
        return taskDate === dateStr && task.status === 'Completed';
      }).length;
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        created: tasksCreated,
        completed: tasksCompleted,
        productivity: tasksCreated > 0 ? Math.round((tasksCompleted / Math.max(tasksCreated, 1)) * 100) : 0
      });
    }
    
    return last7Days;
  };

  // Helper function to get category performance over time
  const getCategoryPerformance = () => {
    const categories = ['Work', 'Personal', 'Health', 'Finance', 'Study', 'Shopping', 'Travel', 'Other'];
    const categoryData = {};
    
    categories.forEach(category => {
      const categoryTasks = tasks.filter(task => task.category === category);
      const completed = categoryTasks.filter(task => task.status === 'Completed').length;
      const total = categoryTasks.length;
      
      categoryData[category] = {
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
    
    return categoryData;
  };

  // Helper function to get productivity by time period
  const getProductivityByPeriod = () => {
    const periods = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month'];
    const today = new Date();
    const data = {};
    
    periods.forEach(period => {
      let startDate, endDate;
      
      switch (period) {
        case 'Today':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'Yesterday':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'This Week':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'Last Week':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setDate(endDate.getDate() - endDate.getDay() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'This Month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      
      const periodTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= startDate && taskDate <= endDate;
      });
      
      const completed = periodTasks.filter(task => task.status === 'Completed').length;
      
      data[period] = {
        total: periodTasks.length,
        completed,
        completionRate: periodTasks.length > 0 ? Math.round((completed / periodTasks.length) * 100) : 0
      };
    });
    
    return data;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'productivity', label: 'Productivity', icon: TrendingUp },
    { id: 'daily-graphs', label: 'Daily Trends', icon: Calendar },
    { id: 'recommendations', label: 'Tips', icon: Lightbulb },
    { id: 'trends', label: 'Trends', icon: Calendar }
  ];

  const getCompletionRate = () => {
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  const getProductivityLevel = () => {
    const rate = getCompletionRate();
    if (rate >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rate >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (rate >= 40) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const productivity = getProductivityLevel();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="p-12 text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Generating AI insights...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Productivity Score */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Productivity Score
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-primary-600">
                        {insights?.productivity?.completion_rate || getCompletionRate()}%
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${productivity.bgColor} ${productivity.color}`}>
                        {productivity.level}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-full">
                    <Target className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-xl font-bold">{stats.completed}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-red-100 rounded">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overdue</p>
                      <p className="text-xl font-bold">{stats.overdue}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-100 rounded">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">High Priority</p>
                      <p className="text-xl font-bold">{stats.high_priority}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {insights && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                  <div className="space-y-3">
                    {insights.productivity && (
                      <div>
                        <p className="text-sm text-gray-600">Productivity Analysis:</p>
                        <p className="text-gray-700">
                          Completion Rate: {insights.productivity.completion_rate}% 
                          ({insights.productivity.completed_tasks}/{insights.productivity.total_tasks} tasks)
                        </p>
                      </div>
                    )}
                    
                    {insights.patterns && (
                      <div>
                        <p className="text-sm text-gray-600">Task Patterns:</p>
                        <p className="text-gray-700">
                          Most common category: {insights.patterns.most_common_category} | 
                          Average priority: {insights.patterns.average_priority}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Productivity Tab */}
          {activeTab === 'productivity' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-100 rounded-full mb-4">
                  <TrendingUp className="h-12 w-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {getCompletionRate()}% Completion Rate
                </h3>
                <p className="text-gray-600">
                  You've completed {stats.completed} out of {stats.total} tasks
                </p>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Task Completion</span>
                    <span>{getCompletionRate()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionRate()}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>High Priority Focus</span>
                    <span>{stats.total > 0 ? Math.round((stats.high_priority / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.total > 0 ? (stats.high_priority / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Workload Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Current Workload</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                    <p className="text-sm text-gray-600">In Progress</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Trends Tab */}
          {activeTab === 'daily-graphs' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Daily Productivity Trends</h3>
                <p className="text-gray-600">Track your productivity patterns over time</p>
              </div>

              {/* 7-Day Productivity Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Last 7 Days Performance</h4>
                <div className="space-y-4">
                  {getDailyProductivityData().map((day, index) => (
                    <div key={day.date} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Created: {day.created} | Completed: {day.completed}</span>
                          <span className="text-sm font-medium text-primary-600">{day.productivity}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              day.productivity >= 80 ? 'bg-green-500' :
                              day.productivity >= 60 ? 'bg-blue-500' :
                              day.productivity >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(day.productivity, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Productivity by Period */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Productivity by Time Period</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(getProductivityByPeriod()).map(([period, data]) => (
                    <div key={period} className="border border-gray-100 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2">{period}</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tasks:</span>
                          <span className="font-medium">{data.completed}/{data.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              data.completionRate >= 80 ? 'bg-green-500' :
                              data.completionRate >= 60 ? 'bg-blue-500' :
                              data.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(data.completionRate, 5)}%` }}
                          ></div>
                        </div>
                        <div className="text-center">
                          <span className={`text-sm font-bold ${
                            data.completionRate >= 80 ? 'text-green-600' :
                            data.completionRate >= 60 ? 'text-blue-600' :
                            data.completionRate >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {data.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Performance Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Category Performance</h4>
                <div className="space-y-3">
                  {Object.entries(getCategoryPerformance())
                    .filter(([_, data]) => data.total > 0)
                    .sort((a, b) => b[1].completionRate - a[1].completionRate)
                    .map(([category, data]) => (
                    <div key={category} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium text-gray-600">{category}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{data.completed}/{data.total} completed</span>
                          <span className="text-sm font-medium text-primary-600">{data.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              data.completionRate >= 80 ? 'bg-green-500' :
                              data.completionRate >= 60 ? 'bg-blue-500' :
                              data.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(data.completionRate, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {Object.values(getCategoryPerformance()).every(data => data.total === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No task data available yet</p>
                      <p className="text-sm">Start creating tasks to see your productivity trends!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-medium text-blue-900 mb-3">📊 Daily Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Best Performing Day</h5>
                    <div className="text-blue-700">
                      {(() => {
                        const dailyData = getDailyProductivityData();
                        const bestDay = dailyData.reduce((best, current) => 
                          current.productivity > best.productivity ? current : best
                        );
                        return bestDay.productivity > 0 ? 
                          `${bestDay.day} (${bestDay.productivity}% completion)` : 
                          'No completed tasks yet';
                      })()}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Most Productive Category</h5>
                    <div className="text-blue-700">
                      {(() => {
                        const categoryData = getCategoryPerformance();
                        const bestCategory = Object.entries(categoryData).reduce((best, [name, data]) => 
                          data.completionRate > (best.data?.completionRate || 0) ? { name, data } : best
                        , {});
                        return bestCategory.data?.total > 0 ? 
                          `${bestCategory.name} (${bestCategory.data.completionRate}%)` : 
                          'No categories available';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Smart Recommendations</h3>
                <p className="text-gray-600">Personalized tips to boost your productivity</p>
              </div>

              {insights?.recommendations && insights.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-blue-100 rounded">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-blue-900">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-1 bg-green-100 rounded">
                        <Target className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-900 mb-1">Start with High Priority</h4>
                        <p className="text-green-800">Focus on your high-priority tasks first thing in the morning when your energy is highest.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Time Blocking</h4>
                        <p className="text-blue-800">Schedule specific time blocks for different types of tasks to improve focus and reduce context switching.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-1 bg-purple-100 rounded">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-900 mb-1">Break Down Large Tasks</h4>
                        <p className="text-purple-800">Split complex tasks into smaller, manageable subtasks to maintain momentum and track progress.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">General Productivity Tips</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    Use the voice input feature for quick task capture
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    Set realistic deadlines and stick to them
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    Review and prioritize tasks at the start of each day
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    Take regular breaks to maintain focus and avoid burnout
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Calendar className="h-12 w-12 text-primary-500 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-gray-900">Task Trends</h3>
                <p className="text-gray-600">Insights into your task patterns and habits</p>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Tasks by Category</h4>
                <div className="space-y-3">
                  {['Work', 'Personal', 'Health', 'Finance', 'Study'].map((category, index) => {
                    const categoryTasks = tasks.filter(task => task.category === category).length;
                    const percentage = stats.total > 0 ? (categoryTasks / stats.total) * 100 : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500'][index]
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{categoryTasks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Priority Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'High', count: tasks.filter(t => t.priority === 'High').length, color: 'bg-red-500' },
                    { label: 'Medium', count: tasks.filter(t => t.priority === 'Medium').length, color: 'bg-yellow-500' },
                    { label: 'Low', count: tasks.filter(t => t.priority === 'Low').length, color: 'bg-green-500' }
                  ].map((priority) => (
                    <div key={priority.label} className="text-center">
                      <div className={`w-12 h-12 ${priority.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                        <span className="text-white font-bold">{priority.count}</span>
                      </div>
                      <p className="text-sm text-gray-600">{priority.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• {stats.completed} tasks completed this period</p>
                  <p>• {stats.pending} tasks currently pending</p>
                  <p>• {stats.overdue} tasks are overdue</p>
                  <p>• {tasks.filter(t => t.ai_generated).length} tasks created with AI assistance</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="btn-primary px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsPanel;
