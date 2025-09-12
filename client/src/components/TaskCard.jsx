import React from 'react';
import { Clock, Calendar, Flag, MoreVertical, CheckCircle2, Trash2, Edit3, Star } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

function TaskCard({ task, viewMode = 'grid', onClick, onComplete, onDelete }) {
  const [showMenu, setShowMenu] = React.useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Work: 'bg-blue-100 text-blue-800',
      Personal: 'bg-purple-100 text-purple-800',
      Health: 'bg-green-100 text-green-800',
      Finance: 'bg-yellow-100 text-yellow-800',
      Study: 'bg-indigo-100 text-indigo-800',
      Shopping: 'bg-pink-100 text-pink-800',
      Travel: 'bg-cyan-100 text-cyan-800',
      General: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.General;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    
    const date = new Date(deadline);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'Completed';

  if (viewMode === 'list') {
    return (
      <div 
        className={`card p-4 hover:shadow-md transition-all cursor-pointer ${
          task.status === 'Completed' ? 'opacity-60' : ''
        } ${isOverdue ? 'border-l-4 border-red-500' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className={`p-1 rounded-full transition-colors ${
                task.status === 'Completed'
                  ? 'text-green-600 bg-green-100'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-medium text-gray-900 truncate ${
                  task.status === 'Completed' ? 'line-through' : ''
                }`}>
                  {task.title}
                </h3>
                {task.ai_generated && (
                  <Star className="h-4 w-4 text-yellow-500" title="AI Generated" />
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 truncate mb-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                  {task.category}
                </span>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {task.deadline && (
              <div className={`flex items-center text-sm ${
                isOverdue ? 'text-red-600' : 'text-gray-500'
              }`}>
                <Calendar className="h-4 w-4 mr-1" />
                {formatDeadline(task.deadline)}
              </div>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                      setShowMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className={`card p-4 hover:shadow-lg transition-all cursor-pointer ${
        task.status === 'Completed' ? 'opacity-60' : ''
      } ${isOverdue ? 'border-l-4 border-red-500' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            <Flag className="h-3 w-3 mr-1" />
            {task.priority}
          </span>
          {task.ai_generated && (
            <Star className="h-4 w-4 text-yellow-500" title="AI Generated" />
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Edit3 className="h-3 w-3 mr-2" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className={`font-semibold text-gray-900 mb-2 ${
        task.status === 'Completed' ? 'line-through' : ''
      }`}>
        {task.title}
      </h3>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.deadline && (
        <div className={`flex items-center text-sm mb-3 ${
          isOverdue ? 'text-red-600' : 'text-gray-500'
        }`}>
          <Calendar className="h-4 w-4 mr-1" />
          {formatDeadline(task.deadline)}
          {isOverdue && <span className="ml-2 text-red-600 font-medium">(Overdue)</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
            {task.category}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={`p-2 rounded-full transition-colors ${
            task.status === 'Completed'
              ? 'text-green-600 bg-green-100'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
          title={task.status === 'Completed' ? 'Completed' : 'Mark as complete'}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
