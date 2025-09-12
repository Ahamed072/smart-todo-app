const db = require('./Database');

class Notification {
  static async findById(id) {
    try {
      const notification = await db.get('SELECT * FROM notifications WHERE id = ?', [id]);
      return notification;
    } catch (error) {
      throw new Error(`Error finding notification by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId, filters = {}) {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      let params = [userId];

      if (filters.unreadOnly) {
        query += ' AND is_read = FALSE';
      }

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const notifications = await db.query(query, params);
      return notifications;
    } catch (error) {
      throw new Error(`Error finding notifications by user ID: ${error.message}`);
    }
  }

  static async create(notificationData) {
    try {
      const {
        user_id,
        task_id,
        type,
        message,
        scheduled_for,
        is_read = false
      } = notificationData;

      const result = await db.run(
        `INSERT INTO notifications (user_id, task_id, type, message, scheduled_for, is_read) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, task_id, type, message, scheduled_for, is_read]
      );

      return this.findById(result.id);
    } catch (error) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  static async markAsRead(id) {
    try {
      await db.run(
        'UPDATE notifications SET is_read = TRUE WHERE id = ?',
        [id]
      );
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await db.run(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return result.changes;
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  static async getPending() {
    try {
      const notifications = await db.query(
        `SELECT n.*, t.title as task_title 
         FROM notifications n
         LEFT JOIN tasks t ON n.task_id = t.id
         WHERE n.scheduled_for <= datetime('now') 
         AND n.sent_at IS NULL
         ORDER BY n.scheduled_for ASC`
      );
      return notifications;
    } catch (error) {
      throw new Error(`Error getting pending notifications: ${error.message}`);
    }
  }

  static async markAsSent(id) {
    try {
      await db.run(
        'UPDATE notifications SET sent_at = datetime("now") WHERE id = ?',
        [id]
      );
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error marking notification as sent: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const result = await db.run('DELETE FROM notifications WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  static async deleteOld(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await db.run(
        'DELETE FROM notifications WHERE created_at < ? AND is_read = TRUE',
        [cutoffDate.toISOString()]
      );
      
      return result.changes;
    } catch (error) {
      throw new Error(`Error deleting old notifications: ${error.message}`);
    }
  }

  static async getUnreadCount(userId) {
    try {
      const result = await db.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return result.count;
    } catch (error) {
      throw new Error(`Error getting unread count: ${error.message}`);
    }
  }
}

module.exports = Notification;
