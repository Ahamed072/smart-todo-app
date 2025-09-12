const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Simplified auth for single user system
const simpleAuth = (req, res, next) => {
  // For demo purposes, we'll use a simple approach
  // In production, you'd want proper JWT validation
  req.user = { id: 1, name: 'Admin', email: 'admin@smarttodo.com' };
  next();
};

module.exports = {
  authenticateToken,
  simpleAuth
};
