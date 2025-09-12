const Task = require('../models/Task');
const NotificationService = require('../services/NotificationService');

class TaskController {
  static async getAllTasks(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        category: req.query.category,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const tasks = await Task.findByUserId(userId, filters);

      res.json({
        tasks,
        count: tasks.length,
        filters: filters
      });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
  }

  static async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findById(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if task belongs to user
      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ task });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ error: 'Failed to retrieve task' });
    }
  }

  static async createTask(req, res) {
    try {
      const userId = req.user.id;
      const {
        title,
        description,
        deadline,
        priority = 'Medium',
        category = 'General',
        status = 'Pending',
        reminder_time
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const taskData = {
        user_id: userId,
        title: title.trim(),
        description: description?.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        priority,
        category,
        status,
        reminder_time: reminder_time ? new Date(reminder_time).toISOString() : null,
        ai_generated: false
      };

      const task = await Task.create(taskData);

      // Send notification about new task
      await NotificationService.createInstantNotification(
        userId,
        task.id,
        `New task created: "${task.title}"`,
        'info'
      );

      res.status(201).json({
        message: 'Task created successfully',
        task
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  static async createBulkTasks(req, res) {
    try {
      const userId = req.user.id;
      const { tasks } = req.body;

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'Tasks array is required' });
      }

      // Validate each task
      const validatedTasks = tasks.map(task => {
        if (!task.title) {
          throw new Error('All tasks must have a title');
        }

        return {
          user_id: userId,
          title: task.title.trim(),
          description: task.description?.trim(),
          deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
          priority: task.priority || 'Medium',
          category: task.category || 'General',
          status: task.status || 'Pending',
          reminder_time: task.reminder_time ? new Date(task.reminder_time).toISOString() : null,
          ai_generated: task.ai_generated || false,
          confidence_score: task.confidence_score || 0.0
        };
      });

      const createdTasks = await Task.createBulk(validatedTasks);

      // Send notification about bulk creation
      await NotificationService.createInstantNotification(
        userId,
        null,
        `${createdTasks.length} tasks created successfully`,
        'success'
      );

      res.status(201).json({
        message: `${createdTasks.length} tasks created successfully`,
        tasks: createdTasks,
        count: createdTasks.length
      });
    } catch (error) {
      console.error('Create bulk tasks error:', error);
      res.status(500).json({ error: error.message || 'Failed to create tasks' });
    }
  }

  static async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get existing task to verify ownership
      const existingTask = await Task.findById(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (existingTask.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Process updates
      const updateData = {};
      
      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.description !== undefined) updateData.description = updates.description?.trim();
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline ? new Date(updates.deadline).toISOString() : null;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.reminder_time !== undefined) updateData.reminder_time = updates.reminder_time ? new Date(updates.reminder_time).toISOString() : null;

      const updatedTask = await Task.update(id, updateData);

      res.json({
        message: 'Task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }

  static async deleteTask(req, res) {
    try {
      const { id } = req.params;

      // Get existing task to verify ownership
      const existingTask = await Task.findById(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (existingTask.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const deleted = await Task.delete(id);

      if (deleted) {
        res.json({ message: 'Task deleted successfully' });
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  static async markTaskComplete(req, res) {
    try {
      const { id } = req.params;

      // Get existing task to verify ownership
      const existingTask = await Task.findById(id);
      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      if (existingTask.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedTask = await Task.markComplete(id);

      // Send notification about completion
      await NotificationService.createInstantNotification(
        req.user.id,
        id,
        `Task completed: "${updatedTask.title}"`,
        'success'
      );

      res.json({
        message: 'Task marked as complete',
        task: updatedTask
      });
    } catch (error) {
      console.error('Mark complete error:', error);
      res.status(500).json({ error: 'Failed to mark task as complete' });
    }
  }

  static async getUpcomingTasks(req, res) {
    try {
      const userId = req.user.id;
      const hoursAhead = req.query.hours ? parseInt(req.query.hours) : 24;

      const tasks = await Task.getUpcoming(userId, hoursAhead);

      res.json({
        tasks,
        count: tasks.length,
        hoursAhead
      });
    } catch (error) {
      console.error('Get upcoming tasks error:', error);
      res.status(500).json({ error: 'Failed to retrieve upcoming tasks' });
    }
  }

  static async getOverdueTasks(req, res) {
    try {
      const userId = req.user.id;
      const tasks = await Task.getOverdue(userId);

      res.json({
        tasks,
        count: tasks.length
      });
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      res.status(500).json({ error: 'Failed to retrieve overdue tasks' });
    }
  }

  static async getTaskStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await Task.getStats(userId);

      res.json({ stats });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve task statistics' });
    }
  }

  static async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const categories = await Task.getCategories(userId);

      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  }
}

module.exports = TaskController;
