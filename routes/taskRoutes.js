const express = require('express');
const TaskController = require('../controllers/TaskController');
const { simpleAuth } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(simpleAuth);

// Main task CRUD operations
router.get('/', TaskController.getAllTasks);
router.get('/stats', TaskController.getTaskStats);
router.get('/categories', TaskController.getCategories);
router.get('/upcoming', TaskController.getUpcomingTasks);
router.get('/overdue', TaskController.getOverdueTasks);
router.get('/:id', TaskController.getTaskById);

router.post('/', TaskController.createTask);
router.post('/bulk', TaskController.createBulkTasks);

router.put('/:id', TaskController.updateTask);
router.post('/:id/complete', TaskController.markTaskComplete);

router.delete('/:id', TaskController.deleteTask);

module.exports = router;
