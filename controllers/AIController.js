const AIService = require('../services/AIService');
const Task = require('../models/Task');

class AIController {
  static async extractTasks(req, res) {
    try {
      const { text, user_timezone = 'UTC' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for task extraction' });
      }

      if (text.trim().length < 10) {
        return res.status(400).json({ error: 'Text is too short for meaningful task extraction' });
      }

      console.log('🤖 Extracting tasks from text:', text.substring(0, 100) + '...');

      const extractedTasks = await AIService.extractTasks(text, user_timezone);

      res.json({
        message: 'Tasks extracted successfully',
        tasks: extractedTasks,
        count: extractedTasks.length,
        original_text: text.substring(0, 200) + (text.length > 200 ? '...' : '')
      });
    } catch (error) {
      console.error('Extract tasks error:', error);
      res.status(500).json({ 
        error: 'Failed to extract tasks',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async enhanceTask(req, res) {
    try {
      const { title, context = '' } = req.body;

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Task title is required' });
      }

      console.log('🤖 Enhancing task:', title);

      const enhancement = await AIService.enhanceTask(title, context);

      res.json({
        message: 'Task enhanced successfully',
        original_title: title,
        enhancement
      });
    } catch (error) {
      console.error('Enhance task error:', error);
      res.status(500).json({ 
        error: 'Failed to enhance task',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async generateDailySummary(req, res) {
    try {
      const userId = req.user.id;
      const { date } = req.query;

      // Get tasks for the specified date (default to today)
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const tasks = await Task.findByUserId(userId, {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });

      console.log('🤖 Generating daily summary for', tasks.length, 'tasks');

      const summary = await AIService.generateDailySummary(tasks, targetDate);

      res.json({
        message: 'Daily summary generated successfully',
        date: targetDate.toDateString(),
        task_count: tasks.length,
        summary
      });
    } catch (error) {
      console.error('Generate daily summary error:', error);
      res.status(500).json({ 
        error: 'Failed to generate daily summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async processVoiceInput(req, res) {
    try {
      const { transcript, user_timezone = 'UTC' } = req.body;

      if (!transcript || typeof transcript !== 'string') {
        return res.status(400).json({ error: 'Voice transcript is required' });
      }

      console.log('🎤 Processing voice input:', transcript);

      // Extract tasks from voice transcript
      const extractedTasks = await AIService.extractTasks(transcript, user_timezone);

      res.json({
        message: 'Voice input processed successfully',
        transcript,
        tasks: extractedTasks,
        count: extractedTasks.length
      });
    } catch (error) {
      console.error('Process voice input error:', error);
      res.status(500).json({ 
        error: 'Failed to process voice input',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async smartCategorize(req, res) {
    try {
      const { tasks } = req.body;

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'Tasks array is required' });
      }

      console.log('🤖 Smart categorizing', tasks.length, 'tasks');

      const categorizedTasks = [];

      for (const task of tasks) {
        if (task.title) {
          const enhancement = await AIService.enhanceTask(task.title, task.description || '');
          categorizedTasks.push({
            ...task,
            suggested_category: enhancement.suggested_category,
            suggested_priority: enhancement.estimated_priority,
            confidence_score: 0.8
          });
        }
      }

      res.json({
        message: 'Tasks categorized successfully',
        original_count: tasks.length,
        categorized_tasks: categorizedTasks
      });
    } catch (error) {
      console.error('Smart categorize error:', error);
      res.status(500).json({ 
        error: 'Failed to categorize tasks',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getAIInsights(req, res) {
    try {
      const userId = req.user.id;

      // Get user's tasks for insights
      const allTasks = await Task.findByUserId(userId);
      const completedTasks = allTasks.filter(task => task.status === 'Completed');
      const pendingTasks = allTasks.filter(task => task.status !== 'Completed');

      // Generate insights
      const insights = {
        productivity: {
          completion_rate: allTasks.length > 0 ? (completedTasks.length / allTasks.length * 100).toFixed(1) : 0,
          total_tasks: allTasks.length,
          completed_tasks: completedTasks.length,
          pending_tasks: pendingTasks.length
        },
        patterns: {
          most_common_category: AIController.getMostCommonCategory(allTasks),
          average_priority: AIController.getAveragePriority(allTasks),
          peak_creation_time: 'Morning' // Simplified for demo
        },
        recommendations: [
          'Consider breaking down large tasks into smaller steps',
          'Set specific deadlines for better time management',
          'Focus on high-priority tasks during peak hours'
        ]
      };

      res.json({
        message: 'AI insights generated successfully',
        insights
      });
    } catch (error) {
      console.error('Get AI insights error:', error);
      res.status(500).json({ 
        error: 'Failed to generate AI insights',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static getMostCommonCategory(tasks) {
    const categoryCounts = {};
    tasks.forEach(task => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });

    let mostCommon = 'General';
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = category;
      }
    }

    return mostCommon;
  }

  static getAveragePriority(tasks) {
    if (tasks.length === 0) return 'Medium';

    const priorityScores = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const totalScore = tasks.reduce((sum, task) => sum + (priorityScores[task.priority] || 2), 0);
    const averageScore = totalScore / tasks.length;

    if (averageScore >= 2.5) return 'High';
    if (averageScore >= 1.5) return 'Medium';
    return 'Low';
  }
}

module.exports = AIController;
