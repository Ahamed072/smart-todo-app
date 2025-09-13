const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createTestUser() {
  try {
    const password_hash = await bcrypt.hash('password123', 10);
    
    const userData = {
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      email: 'test@example.com',
      password_hash: password_hash
    };

    const user = await User.create(userData);
    console.log('Test user created successfully:', {
      id: user.id,
      username: user.username,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    });
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();