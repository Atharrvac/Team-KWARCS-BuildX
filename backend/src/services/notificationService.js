import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import websocketService from './websocketService.js';

class NotificationService {
  constructor() {
    // In-memory storage for development
    if (!global.notifications) {
      global.notifications = [];
    }
  }

  // Create a new notification
  async createNotification(userId, title, message, type, data = null) {
    try {
      const notification = {
        id: global.notifications.length + 1,
        userId: parseInt(userId),
        title,
        message,
        type,
        read: false,
        data,
        createdAt: new Date()
      };

      // Try to save to database
      try {
        const [dbNotification] = await db.insert(notifications)
          .values(notification)
          .returning();
        
        if (dbNotification) {
          notification.id = dbNotification.id;
        }
      } catch (dbError) {
        console.log('Database insert failed, using in-memory storage');
      }

      // Store in memory
      global.notifications.push(notification);

      // Send real-time notification via WebSocket (safely)
      try {
        if (websocketService && websocketService.sendToUser) {
          websocketService.sendToUser(userId, {
            type: 'notification',
            notification
          });
        }
      } catch (wsError) {
        console.log('WebSocket send failed (non-critical):', wsError.message);
      }

      console.log(`📬 Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get all notifications for a user
  async getUserNotifications(userId, limit = 50) {
    try {
      // Try database first
      try {
        const dbNotifications = await db.select()
          .from(notifications)
          .where(eq(notifications.userId, parseInt(userId)))
          .orderBy(desc(notifications.createdAt))
          .limit(limit);

        if (dbNotifications.length > 0) {
          return dbNotifications;
        }
      } catch (dbError) {
        console.log('Database query failed, using in-memory storage');
      }

      // Fallback to in-memory
      return global.notifications
        .filter(n => n.userId === parseInt(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      return userNotifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      // Try database first
      try {
        await db.update(notifications)
          .set({ read: true })
          .where(and(
            eq(notifications.id, parseInt(notificationId)),
            eq(notifications.userId, parseInt(userId))
          ));
      } catch (dbError) {
        console.log('Database update failed, using in-memory storage');
      }

      // Update in memory
      const notification = global.notifications.find(
        n => n.id === parseInt(notificationId) && n.userId === parseInt(userId)
      );
      
      if (notification) {
        notification.read = true;
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      // Try database first
      try {
        await db.update(notifications)
          .set({ read: true })
          .where(eq(notifications.userId, parseInt(userId)));
      } catch (dbError) {
        console.log('Database update failed, using in-memory storage');
      }

      // Update in memory
      global.notifications
        .filter(n => n.userId === parseInt(userId))
        .forEach(n => n.read = true);

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      // Try database first
      try {
        await db.delete(notifications)
          .where(and(
            eq(notifications.id, parseInt(notificationId)),
            eq(notifications.userId, parseInt(userId))
          ));
      } catch (dbError) {
        console.log('Database delete failed, using in-memory storage');
      }

      // Delete from memory
      const index = global.notifications.findIndex(
        n => n.id === parseInt(notificationId) && n.userId === parseInt(userId)
      );
      
      if (index !== -1) {
        global.notifications.splice(index, 1);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Notification type helpers
  async notifyPriceAlert(userId, crop, targetPrice, currentPrice, condition) {
    return this.createNotification(
      
      userId,
      `Price Alert: ${crop}`,
      `${crop} price ${condition === 'above' ? 'rose above' : 'fell below'} ₹${targetPrice}. Current: ₹${currentPrice}`,
      'price_alert',
      { crop, targetPrice, currentPrice, condition }
    );
  }

  async notifyContractCreated(userId, contractId, crop, quantity, price) {
    return this.createNotification(
      userId,
      'New Contract Created',
      `Forward contract for ${quantity} quintals of ${crop} at ₹${price}/quintal has been created.`,
      'contract',
      { contractId, crop, quantity, price, action: 'created' }
    );
  }

  async notifyContractSettled(userId, contractId, crop, quantity, price) {
    return this.createNotification(
      userId,
      'Contract Settled',
      `Your forward contract for ${quantity} quintals of ${crop} has been settled at ₹${price}/quintal.`,
      'contract',
      { contractId, crop, quantity, price, action: 'settled' }
    );
  }

  async notifyContractExpiring(userId, contractId, crop, daysLeft) {
    return this.createNotification(
      userId,
      'Contract Expiring Soon',
      `Your ${crop} contract expires in ${daysLeft} days. Take action now.`,
      'contract',
      { contractId, crop, daysLeft, action: 'expiring' }
    );
  }

  async notifyTradeExecuted(userId, tradeId, crop, type, quantity, price, pnl) {
    const pnlText = pnl >= 0 ? `Profit: ₹${pnl}` : `Loss: ₹${Math.abs(pnl)}`;
    return this.createNotification(
      userId,
      `Trade ${type === 'buy' ? 'Opened' : 'Closed'}`,
      `${type === 'buy' ? 'Bought' : 'Sold'} ${quantity} quintals of ${crop} at ₹${price}/quintal. ${pnl !== undefined ? pnlText : ''}`,
      'trade',
      { tradeId, crop, type, quantity, price, pnl }
    );
  }

  async notifyPositionClosed(userId, positionId, crop, pnl) {
    const pnlText = pnl >= 0 ? `Profit: ₹${pnl.toFixed(2)}` : `Loss: ₹${Math.abs(pnl).toFixed(2)}`;
    return this.createNotification(
      userId,
      'Position Closed',
      `Your ${crop} position has been closed. ${pnlText}`,
      'trade',
      { positionId, crop, pnl }
    );
  }

  async notifyNewOilseed(userId, crop, initialPrice) {
    return this.createNotification(
      userId,
      'New Oilseed Available',
      `${crop} is now available for trading at ₹${initialPrice}/quintal. Start hedging today!`,
      'market',
      { crop, initialPrice, action: 'new_listing' }
    );
  }

  async notifyMarketVolatility(userId, crop, volatility, change) {
    return this.createNotification(
      userId,
      `High Volatility Alert: ${crop}`,
      `${crop} showing ${volatility}% volatility with ${change > 0 ? '+' : ''}${change}% change. Consider hedging.`,
      'market',
      { crop, volatility, change }
    );
  }

  async notifyAutoHedgeActivated(userId, crop, acres, targetPrice) {
    return this.createNotification(
      userId,
      'AutoHedge Activated',
      `AutoHedge enabled for ${acres} acres of ${crop} with target price ₹${targetPrice}/quintal.`,
      'autohedge',
      { crop, acres, targetPrice, action: 'activated' }
    );
  }

  async notifyAutoHedgeSale(userId, crop, quantity, price, totalValue) {
    return this.createNotification(
      userId,
      'AutoHedge Sale Executed',
      `Sold ${quantity} quintals of ${crop} at ₹${price}/quintal. Total: ₹${totalValue}`,
      'autohedge',
      { crop, quantity, price, totalValue, action: 'sale' }
    );
  }

  async notifyLearningModuleCompleted(userId, moduleTitle, certificateId) {
    return this.createNotification(
      userId,
      'Module Completed! 🎉',
      `Congratulations! You completed "${moduleTitle}". Certificate ID: ${certificateId}`,
      'learning',
      { moduleTitle, certificateId, action: 'completed' }
    );
  }

  async notifyAchievementUnlocked(userId, achievementTitle, description) {
    return this.createNotification(
      userId,
      'Achievement Unlocked! 🏆',
      `${achievementTitle}: ${description}`,
      'achievement',
      { achievementTitle, description }
    );
  }

  async notifyWalletDeposit(userId, amount, balance) {
    return this.createNotification(
      userId,
      'Wallet Credited',
      `₹${amount} has been added to your wallet. New balance: ₹${balance}`,
      'wallet',
      { amount, balance, action: 'deposit' }
    );
  }

  async notifyWalletWithdrawal(userId, amount, balance) {
    return this.createNotification(
      userId,
      'Withdrawal Processed',
      `₹${amount} has been withdrawn from your wallet. New balance: ₹${balance}`,
      'wallet',
      { amount, balance, action: 'withdrawal' }
    );
  }

  async notifySystemUpdate(userId, title, message) {
    return this.createNotification(
      userId,
      title,
      message,
      'system',
      { action: 'update' }
    );
  }

  async notifyWeatherAlert(userId, location, alertType, description) {
    return this.createNotification(
      userId,
      `Weather Alert: ${alertType}`,
      `${description} in ${location}. This may affect crop prices.`,
      'weather',
      { location, alertType, description }
    );
  }
}

export default new NotificationService();
