import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Target, Calendar } from 'lucide-react';

function StatsCards({ stats, onCardClick, tasks = [] }) {
  // Calculate today's tasks count
  const getTodayTasksCount = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split('T')[0];
      return taskDate === todayStr && task.status !== 'Completed';
    }).length;
  };

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      filterType: 'all'
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      subtitle: stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% completion rate` : '0% completion rate',
      filterType: 'completed'
    },
    {
      title: 'Today',
      value: getTodayTasksCount(),
      icon: Calendar,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      filterType: 'today'
    },
    {
      title: 'Overdue',
      value: stats.overdue || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      filterType: 'overdue'
    },
    {
      title: 'High Priority',
      value: stats.high_priority || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      filterType: 'high'
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      filterType: 'pending'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`card p-4 ${card.bgColor} ${card.borderColor} hover:shadow-md transition-all cursor-pointer hover:scale-105`}
          onClick={() => onCardClick && onCardClick(card.filterType)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
