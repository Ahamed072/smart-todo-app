// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
let fetch;
try {
    fetch = globalThis.fetch;
    if (!fetch) {
        fetch = require('node-fetch');
    }
} catch (error) {
    fetch = require('node-fetch');
}

// Google Gemini Flash API configuration
const GEMINI_API_KEY = 'AIzaSyDdtvSitQ6x_qR-f-O1the27oEQyPLCEbU';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function testGeminiAPI() {
    console.log('🚀 Testing Google Gemini Flash API...\n');
    
    try {
        const testPrompt = "Generate 3 creative task suggestions for a todo app user who wants to improve their productivity.";
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: testPrompt
                }]
            }]
        };

        console.log('📤 Sending request to Gemini API...');
        console.log('Prompt:', testPrompt);
        console.log('');

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('✅ Success! Gemini API Response:');
        console.log('=====================================');
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const generatedText = data.candidates[0].content.parts[0].text;
            console.log(generatedText);
        } else {
            console.log('Raw response:', JSON.stringify(data, null, 2));
        }
        
        console.log('\n🎉 Gemini Flash API is working correctly!');
        return true;
        
    } catch (error) {
        console.error('❌ Error testing Gemini API:');
        console.error('Error details:', error.message);
        
        if (error.message.includes('403')) {
            console.error('🔑 This might be an API key issue. Please check your API key permissions.');
        } else if (error.message.includes('404')) {
            console.error('🔍 The API endpoint might be incorrect or the model name might have changed.');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('🌐 Network connectivity issue. Please check your internet connection.');
        }
        
        return false;
    }
}

// Run the test
if (require.main === module) {
    testGeminiAPI()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testGeminiAPI };