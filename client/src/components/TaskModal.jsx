import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, Tag, Save, Sparkles } from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useAI } from '../contexts/AIContext';

function TaskModal({ task, onClose }) {
  const { createTask, updateTask } = useTask();
  const { enhanceTask, loading: aiLoading } = useAI();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Medium',
    category: 'General',
    status: 'Pending',
    reminder_time: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'General', 'Work', 'Personal', 'Health', 'Finance', 
    'Study', 'Shopping', 'Travel'
  ];
  
  const priorities = ['Low', 'Medium', 'High'];
  const statuses = ['Pending', 'In Progress', 'Completed'];

  useEffect(() => {
    if (task) {
      // Helper function to format ISO string for datetime-local input
      const formatForDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Get local date components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: task.title || '',
        description: task.description || '',
        deadline: formatForDateTimeLocal(task.deadline),
        priority: task.priority || 'Medium',
        category: task.category || 'General',
        status: task.status || 'Pending',
        reminder_time: formatForDateTimeLocal(task.reminder_time)
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEnhance = async () => {
    if (!formData.title.trim()) return;
    
    try {
      const enhancement = await enhanceTask(formData.title, formData.description);
      
      // Helper function to format suggested deadline for datetime-local input
      const formatSuggestedDeadline = (deadlineString) => {
        if (!deadlineString) return '';
        const date = new Date(deadlineString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setFormData(prev => ({
        ...prev,
        title: enhancement.enhanced_title || prev.title,
        category: enhancement.suggested_category || prev.category,
        priority: enhancement.estimated_priority || prev.priority,
        description: enhancement.suggested_description || prev.description,
        deadline: enhancement.suggested_deadline ? formatSuggestedDeadline(enhancement.suggested_deadline) : prev.deadline
      }));
    } catch (error) {
      console.error('Enhancement failed:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.deadline && formData.reminder_time) {
      const deadline = new Date(formData.deadline);
      const reminder = new Date(formData.reminder_time);
      
      if (reminder >= deadline) {
        newErrors.reminder_time = 'Reminder must be before deadline';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      // Helper function to convert datetime-local string to proper ISO string
      const formatDateTimeLocal = (dateTimeString) => {
        if (!dateTimeString) return null;
        // datetime-local gives us "2025-09-13T14:30"
        // We need to treat this as the user's local time and preserve it
        const date = new Date(dateTimeString);
        // Get timezone offset and adjust to maintain the selected time
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString();
      };

      const taskData = {
        ...formData,
        deadline: formatDateTimeLocal(formData.deadline),
        reminder_time: formatDateTimeLocal(formData.reminder_time)
      };
      
      console.log('Submitting task data:', {
        deadline: formData.deadline,
        formatted_deadline: taskData.deadline,
        reminder_time: formData.reminder_time,
        formatted_reminder: taskData.reminder_time
      });
      
      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Task Title *
              </label>
              <button
                type="button"
                onClick={handleEnhance}
                disabled={!formData.title.trim() || aiLoading}
                className="flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Enhance
              </button>
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`input ${errors.title ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="Enter task title..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="textarea"
              placeholder="Add task description..."
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="h-4 w-4 inline mr-1" />
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="select"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="select"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (only for editing) */}
          {task && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="select"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Deadline
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Reminder */}
          <div>
            <label htmlFor="reminder_time" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Reminder
            </label>
            <input
              type="datetime-local"
              id="reminder_time"
              name="reminder_time"
              value={formData.reminder_time}
              onChange={handleChange}
              className={`input ${errors.reminder_time ? 'border-red-300 focus:ring-red-500' : ''}`}
            />
            {errors.reminder_time && (
              <p className="mt-1 text-sm text-red-600">{errors.reminder_time}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {task ? 'Update Task' : 'Create Task'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;
