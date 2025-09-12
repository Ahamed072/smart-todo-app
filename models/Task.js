const db = require('./Database');

class Task {
  static async findById(id) {
    try {
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      return task;
    } catch (error) {
      throw new Error(`Error finding task by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId, filters = {}) {
    try {
      let query = 'SELECT * FROM tasks WHERE user_id = ?';
      let params = [userId];

      // Apply filters
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.startDate) {
        query += ' AND deadline >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND deadline <= ?';
        params.push(filters.endDate);
      }

      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern);
      }

      // Order by priority and deadline
      query += ' ORDER BY CASE priority WHEN "High" THEN 1 WHEN "Medium" THEN 2 WHEN "Low" THEN 3 END, deadline ASC, created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const tasks = await db.query(query, params);
      return tasks;
    } catch (error) {
      throw new Error(`Error finding tasks by user ID: ${error.message}`);
    }
  }

  static async create(taskData) {
    try {
      const {
        user_id,
        title,
        description,
        deadline,
        priority = 'Medium',
        category = 'General',
        status = 'Pending',
        reminder_time,
        ai_generated = false,
        confidence_score = 0.0
      } = taskData;

      const result = await db.run(
        `INSERT INTO tasks (
          user_id, title, description, deadline, priority, category, 
          status, reminder_time, ai_generated, confidence_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, title, description, deadline, priority, category,
          status, reminder_time, ai_generated, confidence_score
        ]
      );

      return this.findById(result.id);
    } catch (error) {
      throw new Error(`Error creating task: ${error.message}`);
    }
  }

  static async createBulk(tasksData) {
    try {
      await db.beginTransaction();
      const createdTasks = [];

      for (const taskData of tasksData) {
        const task = await this.create(taskData);
        createdTasks.push(task);
      }

      await db.commit();
      return createdTasks;
    } catch (error) {
      await db.rollback();
      throw new Error(`Error creating bulk tasks: ${error.message}`);
    }
  }

  static async update(id, taskData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(taskData).forEach(key => {
        if (taskData[key] !== undefined && key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(taskData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(new Date().toISOString());
      values.push(id);

      await db.run(
        `UPDATE tasks SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
        values
      );

      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating task: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const result = await db.run('DELETE FROM tasks WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Error deleting task: ${error.message}`);
    }
  }

  static async markComplete(id) {
    try {
      return this.update(id, { status: 'Completed' });
    } catch (error) {
      throw new Error(`Error marking task complete: ${error.message}`);
    }
  }

  static async getUpcoming(userId, hoursAhead = 24) {
    try {
      const futureTime = new Date();
      futureTime.setHours(futureTime.getHours() + hoursAhead);

      const tasks = await db.query(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND status != 'Completed' 
         AND deadline BETWEEN datetime('now') AND datetime(?)
         ORDER BY deadline ASC`,
        [userId, futureTime.toISOString()]
      );

      return tasks;
    } catch (error) {
      throw new Error(`Error getting upcoming tasks: ${error.message}`);
    }
  }

  static async getOverdue(userId) {
    try {
      const tasks = await db.query(
        `SELECT * FROM tasks 
         WHERE user_id = ? AND status != 'Completed' 
         AND deadline < datetime('now')
         ORDER BY deadline ASC`,
        [userId]
      );

      return tasks;
    } catch (error) {
      throw new Error(`Error getting overdue tasks: ${error.message}`);
    }
  }

  static async getStats(userId) {
    try {
      const stats = await db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN priority = 'High' AND status != 'Completed' THEN 1 ELSE 0 END) as high_priority,
          SUM(CASE WHEN deadline < datetime('now') AND status != 'Completed' THEN 1 ELSE 0 END) as overdue
         FROM tasks WHERE user_id = ?`,
        [userId]
      );

      return stats;
    } catch (error) {
      throw new Error(`Error getting task stats: ${error.message}`);
    }
  }

  static async getCategories(userId) {
    try {
      const categories = await db.query(
        'SELECT DISTINCT category FROM tasks WHERE user_id = ? ORDER BY category',
        [userId]
      );

      return categories.map(row => row.category);
    } catch (error) {
      throw new Error(`Error getting categories: ${error.message}`);
    }
  }
}

module.exports = Task;
