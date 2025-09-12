const express = require('express');
const AuthController = require('../controllers/AuthController');
const { simpleAuth } = require('../middleware/auth');

const router = express.Router();

// Login route (no auth required)
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', simpleAuth, AuthController.getProfile);
router.put('/profile', simpleAuth, AuthController.updateProfile);
router.get('/validate', simpleAuth, AuthController.validateToken);

module.exports = router;
