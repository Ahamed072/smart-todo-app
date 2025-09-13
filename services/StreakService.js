const Database = require('../models/Database');

class StreakService {
    constructor() {
        this.db = Database.getDb();
    }

    /**
     * Update user streak when they complete or create a task
     * @param {number} userId - The user ID
     * @returns {Promise<object>} Updated streak data
     */
    async updateUserStreak(userId) {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Get current user data
            const user = this.db.prepare(`
                SELECT current_streak, longest_streak, last_activity_date, total_days_active 
                FROM users 
                WHERE id = ?
            `).get(userId);

            if (!user) {
                throw new Error('User not found');
            }

            let {
                current_streak = 0,
                longest_streak = 0,
                last_activity_date = null,
                total_days_active = 0
            } = user;

            // If this is the first activity or same day, handle accordingly
            if (!last_activity_date || last_activity_date === today) {
                if (!last_activity_date) {
                    // First ever activity
                    current_streak = 1;
                    total_days_active = 1;
                } else if (last_activity_date === today) {
                    // Same day activity, no streak change
                    return {
                        current_streak,
                        longest_streak,
                        total_days_active,
                        streak_updated: false
                    };
                }
            } else {
                // Calculate days between last activity and today
                const lastDate = new Date(last_activity_date);
                const todayDate = new Date(today);
                const daysDifference = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

                if (daysDifference === 1) {
                    // Consecutive day - increment streak
                    current_streak += 1;
                    total_days_active += 1;
                } else if (daysDifference > 1) {
                    // Gap in activity - reset streak
                    current_streak = 1;
                    total_days_active += 1;
                }
            }

            // Update longest streak if current is higher
            if (current_streak > longest_streak) {
                longest_streak = current_streak;
            }

            // Update user record
            this.db.prepare(`
                UPDATE users 
                SET current_streak = ?, 
                    longest_streak = ?, 
                    last_activity_date = ?, 
                    total_days_active = ?
                WHERE id = ?
            `).run(current_streak, longest_streak, today, total_days_active, userId);

            return {
                current_streak,
                longest_streak,
                total_days_active,
                last_activity_date: today,
                streak_updated: true
            };

        } catch (error) {
            console.error('Error updating user streak:', error);
            throw error;
        }
    }

    /**
     * Get user streak data
     * @param {number} userId - The user ID
     * @returns {Promise<object>} User streak data
     */
    async getUserStreak(userId) {
        try {
            const streak = this.db.prepare(`
                SELECT current_streak, longest_streak, last_activity_date, total_days_active 
                FROM users 
                WHERE id = ?
            `).get(userId);

            if (!streak) {
                return {
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity_date: null,
                    total_days_active: 0
                };
            }

            return streak;
        } catch (error) {
            console.error('Error getting user streak:', error);
            throw error;
        }
    }

    /**
     * Check if user needs streak reset (for daily cleanup)
     * @param {number} userId - The user ID
     * @returns {Promise<boolean>} Whether streak was reset
     */
    async checkAndResetStreak(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const user = this.db.prepare(`
                SELECT current_streak, last_activity_date 
                FROM users 
                WHERE id = ?
            `).get(userId);

            if (!user || !user.last_activity_date) {
                return false;
            }

            const lastDate = new Date(user.last_activity_date);
            const todayDate = new Date(today);
            const daysDifference = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            // If more than 1 day gap, reset streak
            if (daysDifference > 1 && user.current_streak > 0) {
                this.db.prepare(`
                    UPDATE users 
                    SET current_streak = 0 
                    WHERE id = ?
                `).run(userId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking streak reset:', error);
            throw error;
        }
    }

    /**
     * Get streak statistics for all users (admin function)
     * @returns {Promise<object>} Streak statistics
     */
    async getStreakStats() {
        try {
            const stats = this.db.prepare(`
                SELECT 
                    COUNT(*) as total_users,
                    AVG(current_streak) as avg_current_streak,
                    MAX(current_streak) as max_current_streak,
                    AVG(longest_streak) as avg_longest_streak,
                    MAX(longest_streak) as max_longest_streak,
                    AVG(total_days_active) as avg_days_active
                FROM users 
                WHERE current_streak IS NOT NULL
            `).get();

            return stats || {
                total_users: 0,
                avg_current_streak: 0,
                max_current_streak: 0,
                avg_longest_streak: 0,
                max_longest_streak: 0,
                avg_days_active: 0
            };
        } catch (error) {
            console.error('Error getting streak stats:', error);
            throw error;
        }
    }
}

module.exports = new StreakService();