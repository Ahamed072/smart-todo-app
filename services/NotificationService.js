const cron = require('node-cron');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const User = require('../models/User');
const EmailService = require('./EmailService');

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
        await this.processTaskReminders(); // Check for tasks with specific reminder times
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

      // Send email notification if it's a reminder and user has email
      if (notification.type === 'reminder' && notification.task_id) {
        try {
          // Get task and user details
          const task = await Task.findById(notification.task_id);
          const user = await User.findById(notification.user_id);
          
          if (task && user && user.email) {
            // Check if it's time to send the reminder (based on reminder_time or deadline)
            const now = new Date();
            const reminderTime = task.reminder_time ? new Date(task.reminder_time) : null;
            const deadline = task.deadline ? new Date(task.deadline) : null;
            
            // Send email if:
            // 1. It has a specific reminder_time and it's now that time
            // 2. OR it's approaching the deadline (for auto-generated reminders)
            let shouldSendEmail = false;
            
            if (reminderTime) {
              // Check if current time matches reminder time (within 1 minute tolerance)
              const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
              shouldSendEmail = timeDiff <= 60000; // 1 minute tolerance
            } else if (deadline) {
              // For auto-generated reminders, send if within the reminder window
              const timeUntilDeadline = deadline.getTime() - now.getTime();
              const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);
              
              // Send if within appropriate time window based on priority
              const reminderHours = this.getReminderOffsets(task.priority).map(ms => ms / (1000 * 60 * 60));
              shouldSendEmail = reminderHours.some(hours => Math.abs(hoursUntilDeadline - hours) <= 0.25); // 15 min tolerance
            }
            
            if (shouldSendEmail) {
              await EmailService.sendTaskReminder(user.email, task);
              console.log(`📧 Email reminder sent to ${user.email} for task: ${task.title}`);
            }
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the entire notification if email fails
        }
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

  async processTaskReminders() {
    try {
      const now = new Date();
      // Get all tasks with reminder_time set within the current minute
      const currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
      const nextMinute = new Date(currentTime.getTime() + 60000);
      
      // Query tasks that have reminder_time between current minute and next minute
      const tasksToRemind = await this.getTasksWithReminderTime(currentTime, nextMinute);
      
      for (const task of tasksToRemind) {
        try {
          // Get user details
          const user = await User.findById(task.user_id);
          if (user && user.email) {
            // Send email reminder
            await EmailService.sendTaskReminder(user.email, task);
            
            // Also create an in-app notification
            const message = `⏰ Reminder: ${task.title} is due ${this.formatDeadline(new Date(task.deadline))}`;
            await this.createInstantNotification(task.user_id, task.id, message, 'reminder');
            
            console.log(`✅ Processed reminder for task: ${task.title} (user: ${user.email})`);
          }
        } catch (taskError) {
          console.error(`Failed to process reminder for task ${task.id}:`, taskError);
        }
      }
    } catch (error) {
      console.error('Error processing task reminders:', error);
    }
  }

  async getTasksWithReminderTime(startTime, endTime) {
    try {
      // This would need to be implemented in the Task model
      // For now, let's use a simple query approach
      const db = require('../models/Database');
      
      const tasks = await db.query(
        `SELECT * FROM tasks 
         WHERE reminder_time IS NOT NULL 
         AND reminder_time >= ? 
         AND reminder_time < ? 
         AND status != 'Completed'`,
        [startTime.toISOString(), endTime.toISOString()]
      );
      
      return tasks;
    } catch (error) {
      console.error('Error getting tasks with reminder time:', error);
      return [];
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
