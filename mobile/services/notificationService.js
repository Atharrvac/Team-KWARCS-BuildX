import axios from 'axios';
import { API_URL } from '../config/api';

class NotificationService {
  constructor() {
    this.baseURL = `${API_URL}/notifications`;
    this.listeners = [];
  }

  // Get all notifications for user
  async getNotifications(userId, limit = 50) {
    try {
      const response = await axios.get(`${this.baseURL}/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/${userId}/unread/count`);
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const response = await axios.put(`${this.baseURL}/${notificationId}/read`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      const response = await axios.put(`${this.baseURL}/${userId}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const response = await axios.delete(`${this.baseURL}/${notificationId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      price_alert: 'trending-up',
      contract: 'document-text',
      trade: 'swap-horizontal',
      market: 'bar-chart',
      autohedge: 'shield-checkmark',
      learning: 'school',
      achievement: 'trophy',
      wallet: 'wallet',
      system: 'information-circle',
      weather: 'cloud',
    };
    return icons[type] || 'notifications';
  }

  // Get notification color based on type
  getNotificationColor(type) {
    const colors = {
      price_alert: '#ef4444',
      contract: '#3b82f6',
      trade: '#8b5cf6',
      market: '#f59e0b',
      autohedge: '#16a34a',
      learning: '#06b6d4',
      achievement: '#f59e0b',
      wallet: '#10b981',
      system: '#6b7280',
      weather: '#0ea5e9',
    };
    return colors[type] || '#6b7280';
  }
}

export default new NotificationService();
