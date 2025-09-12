class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = 'meta-llama/llama-3.1-8b-instruct:free';
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

      console.log('🤖 AI Service initialized with free model:', this.model);
    } catch (error) {
      console.error('AI Service initialization failed:', error);
    }
  }

  async makeRequest(messages) {
    try {
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
        throw new Error(`API request failed: ${response.status}`);
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
        return this.getMockTasks(text);
      }

      const messages = [{
        role: 'user',
        content: `Extract actionable tasks from the following text. Return a JSON array of tasks with the following structure:
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

Rules:
1. Only extract clear, actionable tasks
2. Infer deadlines from relative dates (tomorrow, next week, etc.)
3. Use current date context: ${new Date().toISOString()}
4. Timezone: ${userTimezone}
5. Assign priority based on urgency indicators
6. Choose the most appropriate category
7. Return valid JSON only, no other text

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
      return this.getMockSummary(tasks);
    }
  }

  // Mock responses for when AI is not available
  getMockTasks(text) {
    const keywords = text.toLowerCase();
    const mockTasks = [];

    // Simple keyword detection for demo
    if (keywords.includes('meeting') || keywords.includes('call')) {
      mockTasks.push({
        title: 'Attend meeting/call',
        description: 'Extracted from: ' + text.substring(0, 100),
        deadline: null,
        priority: 'Medium',
        category: 'Work',
        confidence_score: 0.7,
        ai_generated: true
      });
    }

    if (keywords.includes('email') || keywords.includes('send')) {
      mockTasks.push({
        title: 'Send email',
        description: 'Extracted from: ' + text.substring(0, 100),
        deadline: null,
        priority: 'Medium',
        category: 'Work',
        confidence_score: 0.6,
        ai_generated: true
      });
    }

    if (keywords.includes('buy') || keywords.includes('shop') || keywords.includes('purchase')) {
      mockTasks.push({
        title: 'Shopping task',
        description: 'Extracted from: ' + text.substring(0, 100),
        deadline: null,
        priority: 'Low',
        category: 'Shopping',
        confidence_score: 0.8,
        ai_generated: true
      });
    }

    return mockTasks.length > 0 ? mockTasks : [{
      title: 'Review and organize tasks',
      description: 'Extracted from provided text',
      deadline: null,
      priority: 'Medium',
      category: 'General',
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
