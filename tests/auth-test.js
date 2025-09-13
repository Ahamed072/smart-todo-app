require('dotenv').config();

async function testAuth() {
  console.log('🔧 Testing Authentication System...\n');
  
  const baseURL = 'http://localhost:5000/api/auth';
  
  // Test 1: Register a new user
  console.log('Test 1: User Registration');
  try {
    const registerResponse = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      console.log('Token:', registerData.token ? 'Generated' : 'Missing');
      console.log('User:', registerData.user);
    } else {
      console.log('❌ Registration failed:', registerData.error);
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
  }
  console.log('---\n');
  
  // Test 2: Login with the same user
  console.log('Test 2: User Login');
  try {
    const loginResponse = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login successful');
      console.log('Token:', loginData.token ? 'Generated' : 'Missing');
      console.log('User:', loginData.user);
      
      // Test 3: Validate token
      console.log('\nTest 3: Token Validation');
      const validateResponse = await fetch(`${baseURL}/validate`, {
        headers: { 
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const validateData = await validateResponse.json();
      
      if (validateResponse.ok) {
        console.log('✅ Token validation successful');
        console.log('Valid:', validateData.valid);
        console.log('User:', validateData.user);
      } else {
        console.log('❌ Token validation failed:', validateData.error);
      }
    } else {
      console.log('❌ Login failed:', loginData.error);
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
  console.log('---\n');
  
  // Test 4: Try login with wrong credentials
  console.log('Test 4: Invalid Credentials');
  try {
    const wrongLoginResponse = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'wrongpassword'
      })
    });
    
    const wrongLoginData = await wrongLoginResponse.json();
    
    if (!wrongLoginResponse.ok) {
      console.log('✅ Correctly rejected invalid credentials');
      console.log('Error:', wrongLoginData.error);
    } else {
      console.log('❌ Should have rejected invalid credentials');
    }
  } catch (error) {
    console.error('❌ Invalid login test error:', error.message);
  }
  
  console.log('\n🏁 Authentication Test Complete');
}

// Run tests
if (require.main === module) {
  testAuth().catch(console.error);
}

module.exports = { testAuth };