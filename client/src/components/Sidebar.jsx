import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  Brain, 
  Mic, 
  FileText,
  Calendar,
  Settings,
  Filter
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';

function Sidebar() {
  const { stats, filters, setFilters } = useTask();

  const menuItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: CheckSquare, label: 'All Tasks', count: stats.total },
    { icon: Clock, label: 'Pending', count: stats.pending },
    { icon: AlertTriangle, label: 'Overdue', count: stats.overdue },
    { icon: Calendar, label: 'Today' },
  ];

  const aiFeatures = [
    { icon: Brain, label: 'AI Insights' },
    { icon: Mic, label: 'Voice Input' },
    { icon: FileText, label: 'Bulk Import' },
    { icon: BarChart3, label: 'Analytics' },
  ];

  const categories = [
    { name: 'Work', color: 'bg-blue-500', count: 5 },
    { name: 'Personal', color: 'bg-purple-500', count: 3 },
    { name: 'Health', color: 'bg-green-500', count: 2 },
    { name: 'Finance', color: 'bg-yellow-500', count: 1 },
    { name: 'Study', color: 'bg-indigo-500', count: 4 },
    { name: 'Shopping', color: 'bg-pink-500', count: 2 },
  ];

  const priorities = [
    { name: 'High', color: 'bg-red-500', count: stats.high_priority },
    { name: 'Medium', color: 'bg-yellow-500', count: 8 },
    { name: 'Low', color: 'bg-green-500', count: 4 },
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters({
      [filterType]: filters[filterType] === value ? '' : value
    });
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Overview
          </h3>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href="#"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.active 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* AI Features */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            AI Features
          </h3>
          <nav className="space-y-1">
            {aiFeatures.map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Filters Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Filters
            </h3>
            <Filter className="h-3 w-3 text-gray-400" />
          </div>

          {/* Priority Filter */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Priority</h4>
            <div className="space-y-1">
              {priorities.map((priority) => (
                <button
                  key={priority.name}
                  onClick={() => handleFilterChange('priority', priority.name)}
                  className={`flex items-center justify-between w-full px-2 py-1 rounded text-sm transition-colors ${
                    filters.priority === priority.name
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${priority.color} mr-2`}></div>
                    {priority.name}
                  </div>
                  <span className="text-xs text-gray-500">{priority.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Categories</h4>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleFilterChange('category', category.name)}
                  className={`flex items-center justify-between w-full px-2 py-1 rounded text-sm transition-colors ${
                    filters.category === category.name
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${category.color} mr-2`}></div>
                    {category.name}
                  </div>
                  <span className="text-xs text-gray-500">{category.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Stats</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Completion Rate</span>
              <span className="font-medium">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tasks Today</span>
              <span className="font-medium">{stats.pending + stats.in_progress}</span>
            </div>
            <div className="flex justify-between">
              <span>Overdue</span>
              <span className="font-medium text-red-600">{stats.overdue}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-gray-200">
          <a
            href="#"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </a>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
