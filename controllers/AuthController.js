const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthController {
  static async register(req, res) {
    try {
      const { firstName, lastName, username, email, password } = req.body;

      // Validation
      if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ error: 'First name, last name, username, email, and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check if username is already taken
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Check if email is already taken
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        password_hash
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username || newUser.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: newUser.id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          username: newUser.username || newUser.name,
          email: newUser.email,
          name: newUser.name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username || user.name,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username || user.name,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const updateData = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const updatedUser = await User.update(req.user.id, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async validateToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware validated it)
      res.json({ 
        valid: true, 
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Token validation failed' });
    }
  }
}

module.exports = AuthController;
