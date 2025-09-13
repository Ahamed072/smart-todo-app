class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'meta-llama/llama-3.1-8b-instruct'; // Free model (offer ongoing)
    this.initialize();
  }

  initialize() {
    try {
      // Use the OpenRouter-style API key from .env
      const possibleKeys = [
        process.env.OPENROUTER_API_KEY,
        process.env.AI_API_KEY,
        process.env.GEMINI_API_KEY
      ];

      this.apiKey = possibleKeys.find(key => key && key !== 'your-gemini-api-key-here');

      if (!this.apiKey) {
        console.warn('⚠️  AI API key not configured. AI features will use mock responses.');
        return;
      }

      console.log('🤖 AI Service initialized with model:', this.model);
    } catch (error) {
      console.error('AI Service initialization failed:', error);
    }
  }

  async makeRequest(messages) {
    try {
      console.log('🔑 Making AI request with model:', this.model);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Smart AI Todo App'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI API request failed:', error);
      throw error;
    }
  }

  async extractTasks(text, userTimezone = 'UTC') {
    try {
      if (!this.apiKey) {
        console.log('⚠️  No API key configured, using mock responses');
        return this.getMockTasks(text);
      }

      const messages = [{
        role: 'user',
        content: `Extract ALL actionable tasks from the following text. Look for multiple tasks, action items, reminders, and to-dos. Return a JSON array of tasks with the following structure:
[
  {
    "title": "clear task title",
    "description": "additional context if any",
    "deadline": "ISO 8601 datetime or null",
    "priority": "High|Medium|Low",
    "category": "Work|Personal|Health|Finance|Study|Shopping|Travel|Other",
    "confidence_score": 0.0-1.0
  }
]

IMPORTANT RULES:
1. Extract EVERY actionable task you can find, not just one
2. Look for bullet points, numbered lists, action words (call, send, buy, complete, etc.)
3. Each task should be a separate object in the array
4. Infer deadlines from relative dates (tomorrow, next week, Friday, etc.)
5. Use current date context: ${new Date().toISOString()}
6. Timezone: ${userTimezone}
7. Assign priority based on urgency indicators (urgent, important, ASAP, etc.)
8. Choose the most appropriate category for each task
9. Return valid JSON only, no other text
10. If text contains multiple tasks, return multiple objects

Examples of what to look for:
- "Call John, then send email to client, and buy groceries" = 3 tasks
- "Meeting at 2pm, doctor appointment Thursday, submit report Friday" = 3 tasks
- "Board meeting presentation due Friday 3PM, Doctor appointment Thursday 2PM, Pick up dry cleaning" = 3 tasks

Text to analyze:
"${text}"`
      }];

      const response = await this.makeRequest(messages);

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map(task => ({
          ...task,
          ai_generated: true,
          confidence_score: task.confidence_score || 0.8
        }));
      }

      return [];
    } catch (error) {
      console.error('AI task extraction error:', error);
      console.log('🔄 Falling back to mock task extraction');
      return this.getMockTasks(text);
    }
  }

  async enhanceTask(title, context = '') {
    try {
      if (!this.apiKey) {
        return this.getMockEnhancement(title);
      }

      const messages = [{
        role: 'user',
        content: `Enhance the following task with better details. Return JSON with this structure:
{
  "enhanced_title": "improved and clear title",
  "suggested_category": "Work|Personal|Health|Finance|Study|Shopping|Travel|Other",
  "estimated_priority": "High|Medium|Low",
  "suggested_deadline": "ISO 8601 datetime or null",
  "suggested_description": "helpful context or null"
}

Task: "${title}"
Context: "${context}"

Return only valid JSON, no other text.`
      }];

      const response = await this.makeRequest(messages);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getMockEnhancement(title);
    } catch (error) {
      console.error('AI task enhancement error:', error);
      return this.getMockEnhancement(title);
    }
  }

  async generateDailySummary(tasks, date = new Date()) {
    try {
      if (!this.apiKey) {
        console.log('⚠️  No API key configured, using mock summary');
        return this.getMockSummary(tasks);
      }

      const messages = [{
        role: 'user',
        content: `Generate a helpful daily summary for these tasks. Return JSON with this structure:
{
  "summary": "brief overview of the day's tasks",
  "recommendations": ["actionable suggestion 1", "suggestion 2"],
  "priority_focus": "what to focus on first",
  "estimated_workload": "light|moderate|heavy"
}

Date: ${date.toDateString()}
Tasks: ${JSON.stringify(tasks, null, 2)}

Return only valid JSON, no other text.`
      }];

      const response = await this.makeRequest(messages);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getMockSummary(tasks);
    } catch (error) {
      console.error('AI summary generation error:', error);
      console.log('🔄 Falling back to mock summary');
      return this.getMockSummary(tasks);
    }
  }

  // Mock responses for when AI is not available
  getMockTasks(text) {
    const lines = text.split(/\n|;|,|\band\b|\bthen\b/i).filter(line => line.trim().length > 0);
    const mockTasks = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length < 5) return; // Skip very short lines

      const lowerLine = trimmedLine.toLowerCase();
      
      // Detect task patterns
      let taskTitle = trimmedLine;
      let priority = 'Medium';
      let category = 'Other';
      
      // Remove bullet points and numbers
      taskTitle = taskTitle.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
      
      // Determine priority
      if (lowerLine.includes('urgent') || lowerLine.includes('asap') || lowerLine.includes('important')) {
        priority = 'High';
      } else if (lowerLine.includes('low priority') || lowerLine.includes('when possible')) {
        priority = 'Low';
      }
      
      // Determine category
      if (lowerLine.includes('meeting') || lowerLine.includes('call') || lowerLine.includes('presentation') || lowerLine.includes('email') || lowerLine.includes('report')) {
        category = 'Work';
      } else if (lowerLine.includes('doctor') || lowerLine.includes('appointment') || lowerLine.includes('health') || lowerLine.includes('dentist')) {
        category = 'Health';
      } else if (lowerLine.includes('buy') || lowerLine.includes('shop') || lowerLine.includes('purchase') || lowerLine.includes('groceries')) {
        category = 'Shopping';
      } else if (lowerLine.includes('mom') || lowerLine.includes('family') || lowerLine.includes('personal') || lowerLine.includes('birthday')) {
        category = 'Personal';
      } else if (lowerLine.includes('study') || lowerLine.includes('read') || lowerLine.includes('learn')) {
        category = 'Study';
      }

      // Extract deadline
      let deadline = null;
      const today = new Date();
      
      if (lowerLine.includes('tomorrow')) {
        deadline = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (lowerLine.includes('friday')) {
        const friday = new Date(today);
        friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
        deadline = friday.toISOString();
      } else if (lowerLine.includes('thursday')) {
        const thursday = new Date(today);
        thursday.setDate(today.getDate() + (4 - today.getDay() + 7) % 7);
        deadline = thursday.toISOString();
      } else if (lowerLine.includes('saturday')) {
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
        deadline = saturday.toISOString();
      } else if (lowerLine.includes('sunday')) {
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
        deadline = sunday.toISOString();
      }

      mockTasks.push({
        title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
        description: `Extracted from line ${index + 1}`,
        deadline,
        priority,
        category,
        confidence_score: 0.75,
        ai_generated: true
      });
    });

    return mockTasks.length > 0 ? mockTasks : [{
      title: 'Review and organize tasks',
      description: 'Extracted from provided text',
      deadline: null,
      priority: 'Medium',
      category: 'Other',
      confidence_score: 0.5,
      ai_generated: true
    }];
  }

  getMockEnhancement(title) {
    return {
      enhanced_title: title.charAt(0).toUpperCase() + title.slice(1),
      suggested_category: 'General',
      estimated_priority: 'Medium',
      suggested_deadline: null,
      suggested_description: 'AI enhancement not available - using mock response'
    };
  }

  getMockSummary(tasks) {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter(t => t.priority === 'High').length;
    
    return {
      summary: `You have ${totalTasks} tasks today. ${highPriority} are high priority.`,
      recommendations: [
        'Focus on high-priority items first',
        'Break down large tasks into smaller steps',
        'Take breaks between tasks'
      ],
      priority_focus: highPriority > 0 ? 'Start with high-priority tasks' : 'Work through tasks systematically',
      estimated_workload: totalTasks > 5 ? 'heavy' : totalTasks > 2 ? 'moderate' : 'light'
    };
  }
}

// Create singleton instance
const aiService = new AIService();

module.exports = aiService;
