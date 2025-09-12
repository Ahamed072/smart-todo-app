const cron = require('node-cron');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

class NotificationService {
  constructor() {
    this.wss = null;
    this.cronJob = null;
  }

  initialize(webSocketServer) {
    this.wss = webSocketServer;
    this.startNotificationScheduler();
    console.log('📬 Notification Service initialized');
  }

  startNotificationScheduler() {
    // Check for notifications every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      try {
        await this.processPendingNotifications();
        await this.scheduleUpcomingReminders();
      } catch (error) {
        console.error('Notification scheduler error:', error);
      }
    });

    console.log('⏰ Notification scheduler started (every minute)');
  }

  async processPendingNotifications() {
    try {
      const pendingNotifications = await Notification.getPending();
      
      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
        await Notification.markAsSent(notification.id);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  async scheduleUpcomingReminders() {
    try {
      // Get tasks with upcoming deadlines that don't have reminders scheduled
      const upcomingTasks = await this.getTasksNeedingReminders();
      
      for (const task of upcomingTasks) {
        await this.createTaskReminders(task);
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  async getTasksNeedingReminders() {
    try {
      // Get tasks with deadlines in the next 7 days that don't have reminders
      const tasks = await Task.findByUserId(1, {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Filter tasks that don't have reminders scheduled
      const tasksNeedingReminders = [];
      for (const task of tasks) {
        const existingReminders = await Notification.findByUserId(task.user_id, {
          type: 'reminder'
        });
        
        const hasReminder = existingReminders.some(reminder => 
          reminder.task_id === task.id && !reminder.sent_at
        );

        if (!hasReminder && task.deadline && task.status !== 'Completed') {
          tasksNeedingReminders.push(task);
        }
      }

      return tasksNeedingReminders;
    } catch (error) {
      console.error('Error getting tasks needing reminders:', error);
      return [];
    }
  }

  async createTaskReminders(task) {
    try {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const reminders = [];

      // Calculate reminder times based on priority
      const reminderOffsets = this.getReminderOffsets(task.priority);

      for (const offset of reminderOffsets) {
        const reminderTime = new Date(deadline.getTime() - offset);
        
        // Only schedule future reminders
        if (reminderTime > now) {
          reminders.push({
            user_id: task.user_id,
            task_id: task.id,
            type: 'reminder',
            message: `Reminder: "${task.title}" is due ${this.formatDeadline(deadline)}`,
            scheduled_for: reminderTime.toISOString()
          });
        }
      }

      // Create notifications
      for (const reminder of reminders) {
        await Notification.create(reminder);
      }

      return reminders.length;
    } catch (error) {
      console.error('Error creating task reminders:', error);
      return 0;
    }
  }

  getReminderOffsets(priority) {
    // Return offset times in milliseconds
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    switch (priority) {
      case 'High':
        return [day, 4 * hour, 30 * minute]; // 1 day, 4 hours, 30 min before
      case 'Medium':
        return [day, 2 * hour]; // 1 day, 2 hours before
      case 'Low':
        return [4 * hour]; // 4 hours before
      default:
        return [2 * hour]; // 2 hours before
    }
  }

  async sendNotification(notification) {
    try {
      // Send WebSocket notification to connected clients
      if (this.wss) {
        const message = {
          type: 'notification',
          data: {
            id: notification.id,
            message: notification.message,
            type: notification.type,
            task_id: notification.task_id,
            timestamp: new Date().toISOString()
          }
        };

        this.wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
          }
        });
      }

      console.log(`📧 Notification sent: ${notification.message}`);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  formatDeadline(deadline) {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return `in ${days} days`;
    } else if (days === 1) {
      return 'tomorrow';
    } else if (hours > 1) {
      return `in ${hours} hours`;
    } else if (hours === 1) {
      return 'in 1 hour';
    } else {
      return 'very soon';
    }
  }

  async createInstantNotification(userId, taskId, message, type = 'info') {
    try {
      const notification = await Notification.create({
        user_id: userId,
        task_id: taskId,
        type: type,
        message: message,
        scheduled_for: new Date().toISOString()
      });

      // Send immediately
      await this.sendNotification(notification);
      await Notification.markAsSent(notification.id);

      return notification;
    } catch (error) {
      console.error('Error creating instant notification:', error);
      throw error;
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Notification scheduler stopped');
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
