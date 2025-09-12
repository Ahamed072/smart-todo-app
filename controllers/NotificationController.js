const Notification = require('../models/Notification');
const NotificationService = require('../services/NotificationService');

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        unreadOnly: req.query.unread === 'true',
        type: req.query.type,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const notifications = await Notification.findByUserId(userId, filters);

      res.json({
        notifications,
        count: notifications.length,
        filters
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { id } = req.params;

      // Verify notification belongs to user
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (notification.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedNotification = await Notification.markAsRead(id);

      res.json({
        message: 'Notification marked as read',
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const updatedCount = await Notification.markAllAsRead(userId);

      res.json({
        message: `${updatedCount} notifications marked as read`,
        updated_count: updatedCount
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;

      // Verify notification belongs to user
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (notification.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const deleted = await Notification.delete(id);

      if (deleted) {
        res.json({ message: 'Notification deleted successfully' });
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await Notification.getUnreadCount(userId);

      res.json({ unread_count: count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }

  static async createTestNotification(req, res) {
    try {
      const userId = req.user.id;
      const { message, type = 'test' } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const notification = await NotificationService.createInstantNotification(
        userId,
        null,
        message,
        type
      );

      res.status(201).json({
        message: 'Test notification created and sent',
        notification
      });
    } catch (error) {
      console.error('Create test notification error:', error);
      res.status(500).json({ error: 'Failed to create test notification' });
    }
  }

  static async getPendingReminders(req, res) {
    try {
      const pendingNotifications = await Notification.getPending();

      res.json({
        pending_notifications: pendingNotifications,
        count: pendingNotifications.length
      });
    } catch (error) {
      console.error('Get pending reminders error:', error);
      res.status(500).json({ error: 'Failed to get pending reminders' });
    }
  }

  static async cleanupOldNotifications(req, res) {
    try {
      const daysOld = req.query.days ? parseInt(req.query.days) : 30;
      const deletedCount = await Notification.deleteOld(daysOld);

      res.json({
        message: `${deletedCount} old notifications cleaned up`,
        deleted_count: deletedCount,
        days_threshold: daysOld
      });
    } catch (error) {
      console.error('Cleanup old notifications error:', error);
      res.status(500).json({ error: 'Failed to cleanup old notifications' });
    }
  }
}

module.exports = NotificationController;
