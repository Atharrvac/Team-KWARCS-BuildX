import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const notifications = await notificationService.getUserNotifications(userId, limit);
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/:userId/unread/count', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.put('/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    await notificationService.deleteNotification(notificationId, userId);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Test notification (for development)
router.post('/test/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'system' } = req.body;
    
    let notification;
    
    switch (type) {
      case 'price_alert':
        notification = await notificationService.notifyPriceAlert(
          userId, 'Soybean', 5000, 5100, 'above'
        );
        break;
      case 'contract':
        notification = await notificationService.notifyContractCreated(
          userId, 123, 'Mustard', 100, 4500
        );
        break;
      case 'trade':
        notification = await notificationService.notifyTradeExecuted(
          userId, 456, 'Groundnut', 'buy', 50, 5500, 2500
        );
        break;
      case 'new_oilseed':
        notification = await notificationService.notifyNewOilseed(
          userId, 'Sunflower', 6000
        );
        break;
      case 'learning':
        notification = await notificationService.notifyLearningModuleCompleted(
          userId, 'Introduction to Commodity Trading', 'AGS-0001-01-2024'
        );
        break;
      default:
        notification = await notificationService.notifySystemUpdate(
          userId, 'Test Notification', 'This is a test notification'
        );
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ error: 'Failed to create test notification' });
  }
});

export default router;
