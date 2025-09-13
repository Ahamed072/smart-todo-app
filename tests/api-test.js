require('dotenv').config();
const aiService = require('../services/AIService');

async function testOpenRouterAPI() {
  console.log('🔧 Testing OpenRouter API Connection...\n');
  
  // Test 1: Check if API key is configured
  console.log('Test 1: API Key Configuration');
  console.log('API Key exists:', aiService.apiKey ? '✅ Yes' : '❌ No');
  console.log('Base URL:', aiService.baseUrl);
  console.log('Model:', aiService.model);
  console.log('---\n');
  
  if (!aiService.apiKey) {
    console.log('⚠️  API key not found. Please check your .env file for OPENROUTER_API_KEY');
    return;
  }
  
  // Test 2: Simple API call
  console.log('Test 2: Simple API Call');
  try {
    const testMessages = [{
      role: 'user',
      content: 'Hello, can you respond with just "API working correctly"?'
    }];
    
    const response = await aiService.makeRequest(testMessages);
    console.log('✅ API Response received:', response);
    console.log('---\n');
  } catch (error) {
    console.error('❌ API Call failed:', error.message);
    console.log('---\n');
  }
  
  // Test 3: Task extraction functionality
  console.log('Test 3: Task Extraction');
  try {
    const testText = "Call John tomorrow at 2pm, buy groceries this evening, and submit the report by Friday";
    const extractedTasks = await aiService.extractTasks(testText);
    console.log('✅ Task extraction successful:');
    console.log(JSON.stringify(extractedTasks, null, 2));
    console.log('---\n');
  } catch (error) {
    console.error('❌ Task extraction failed:', error.message);
    console.log('---\n');
  }
  
  // Test 4: Insights generation
  console.log('Test 4: Insights Generation');
  try {
    const mockTasks = [
      { title: 'Complete project', category: 'Work', priority: 'High', status: 'completed' },
      { title: 'Buy groceries', category: 'Personal', priority: 'Medium', status: 'pending' },
      { title: 'Exercise', category: 'Health', priority: 'Low', status: 'completed' }
    ];
    
    const mockStats = { total: 3, completed: 2, pending: 1, overdue: 0 };
    const insights = await aiService.generateInsights(mockTasks, mockStats);
    console.log('✅ Insights generation successful:');
    console.log(insights);
    console.log('---\n');
  } catch (error) {
    console.error('❌ Insights generation failed:', error.message);
    console.log('---\n');
  }
  
  console.log('🏁 API Test Complete');
}

// Test direct API call without service wrapper
async function testDirectAPI() {
  console.log('\n🔧 Testing Direct OpenRouter API Call...\n');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('❌ No API key found in environment variables');
    return;
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Smart AI Todo App Test'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'user',
            content: 'Please respond with "Direct API test successful" if you can receive this message.'
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Direct API Error ${response.status}:`, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Direct API Response:', data.choices[0].message.content);
    console.log('✅ Usage:', data.usage);
    
  } catch (error) {
    console.error('❌ Direct API call failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testOpenRouterAPI();
  await testDirectAPI();
}

// Export for manual testing
module.exports = {
  testOpenRouterAPI,
  testDirectAPI,
  runAllTests
};

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}