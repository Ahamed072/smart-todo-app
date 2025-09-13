import React from 'react';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';

function StreakDisplay() {
  const { streak, loading, error } = useStreak();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 rounded-lg">
        <div className="animate-pulse w-4 h-4 bg-orange-200 rounded"></div>
        <span className="text-sm text-orange-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail to avoid cluttering UI
  }

  const { current_streak, longest_streak, total_days_active } = streak;

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer group relative">
      <Flame className={`h-4 w-4 ${current_streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
      <span className="text-sm font-medium text-orange-700">
        {current_streak} Day{current_streak !== 1 ? 's' : ''}
      </span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <Flame className="h-3 w-3" />
            <span>Current Streak: {current_streak} days</span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="h-3 w-3" />
            <span>Best Streak: {longest_streak} days</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Active Days: {total_days_active}</span>
          </div>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

export default StreakDisplay;