import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const useStreak = () => {
  const [streak, setStreak] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_days_active: 0,
    last_activity_date: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getStreak();
      setStreak(response.data.streak);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  return {
    streak,
    loading,
    error,
    refetchStreak: fetchStreak
  };
};