const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      // Gmail SMTP configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail email
          pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
        }
      });

      console.log('📧 Email Service initialized');
    } catch (error) {
      console.error('Email Service initialization failed:', error);
    }
  }

  async sendTaskReminder(userEmail, task) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const deadlineFormatted = task.deadline 
        ? new Date(task.deadline).toLocaleString() 
        : 'No deadline set';

      const reminderTimeFormatted = task.reminder_time
        ? new Date(task.reminder_time).toLocaleString()
        : 'Not set';

      const emailContent = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Task Reminder: ${task.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">🔔 Task Reminder</h1>
              </div>
              
              <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <h2 style="color: #1e40af; margin: 0 0 15px 0;">${task.title}</h2>
                ${task.description ? `<p style="color: #64748b; margin: 0 0 15px 0; line-height: 1.5;">${task.description}</p>` : ''}
                
                <div style="margin-top: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #374151;">Priority:</span>
                    <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; ${this.getPriorityStyles(task.priority)}">${task.priority}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #374151;">Category:</span>
                    <span style="color: #64748b;">${task.category}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #374151;">Deadline:</span>
                    <span style="color: #dc2626; font-weight: bold;">${deadlineFormatted}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #374151;">Status:</span>
                    <span style="color: #059669;">${task.status}</span>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #64748b; margin: 0 0 20px 0;">Don't let this task slip away! Complete it now to stay on track.</p>
                <a href="${process.env.APP_URL || 'http://localhost:5000'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Smart Todo App</a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated reminder from Smart Todo App. If you no longer wish to receive these notifications, please update your preferences in the app.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(emailContent);
      console.log(`✅ Email reminder sent to ${userEmail} for task: ${task.title}`);
      return result;
    } catch (error) {
      console.error('Failed to send email reminder:', error);
      throw error;
    }
  }

  async sendTaskNotification(userEmail, message, taskTitle, type = 'info') {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const subject = this.getSubjectByType(type, taskTitle);
      const iconByType = {
        'info': '💡',
        'reminder': '🔔',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
      };

      const emailContent = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">${iconByType[type] || '📝'} Smart Todo Notification</h1>
              </div>
              
              <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 16px;">${message}</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || 'http://localhost:5000'}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Smart Todo App</a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated notification from Smart Todo App.</p>
              </div>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(emailContent);
      console.log(`✅ Email notification sent to ${userEmail}: ${message}`);
      return result;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  getPriorityStyles(priority) {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'background-color: #fee2e2; color: #dc2626;';
      case 'medium':
        return 'background-color: #fef3c7; color: #d97706;';
      case 'low':
        return 'background-color: #dcfce7; color: #16a34a;';
      default:
        return 'background-color: #f3f4f6; color: #6b7280;';
    }
  }

  getSubjectByType(type, taskTitle) {
    switch (type) {
      case 'reminder':
        return `🔔 Task Reminder: ${taskTitle}`;
      case 'success':
        return `✅ Task Update: ${taskTitle}`;
      case 'warning':
        return `⚠️ Task Alert: ${taskTitle}`;
      case 'error':
        return `❌ Task Issue: ${taskTitle}`;
      default:
        return `📝 Smart Todo Notification: ${taskTitle}`;
    }
  }

  async testEmailConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();