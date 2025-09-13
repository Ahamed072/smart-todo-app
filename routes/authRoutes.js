const express = require('express');
const AuthController = require('../controllers/AuthController');
const StreakService = require('../services/StreakService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.get('/validate', authenticateToken, AuthController.validateToken);
router.post('/refresh-token', AuthController.refreshToken);

// Streak routes
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const streak = await StreakService.getUserStreak(req.user.id);
    res.json({ streak });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Failed to get streak data' });
  }
});

module.exports = router;
