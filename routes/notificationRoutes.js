const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// Main notification operations
router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/pending', NotificationController.getPendingReminders);

router.post('/test', NotificationController.createTestNotification);
router.post('/cleanup', NotificationController.cleanupOldNotifications);

router.put('/:id/read', NotificationController.markAsRead);
router.put('/mark-all-read', NotificationController.markAllAsRead);

router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
