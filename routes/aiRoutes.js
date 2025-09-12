const express = require('express');
const AIController = require('../controllers/AIController');
const { simpleAuth } = require('../middleware/auth');

const router = express.Router();

// All AI routes require authentication
router.use(simpleAuth);

// Core AI features
router.post('/extract-tasks', AIController.extractTasks);
router.post('/enhance-task', AIController.enhanceTask);
router.get('/daily-summary', AIController.generateDailySummary);

// Voice processing
router.post('/voice-input', AIController.processVoiceInput);

// Advanced AI features
router.post('/categorize', AIController.smartCategorize);
router.get('/insights', AIController.getAIInsights);

module.exports = router;
