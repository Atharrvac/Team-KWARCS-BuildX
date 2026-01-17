import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';
import { useSupabaseAuth } from './SupabaseAuthContext';
import NotificationToast from '../components/NotificationToast';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);

  // Clear notifications when user changes (logout/login)
  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, [user?.id]);

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      setToastQueue(prev => prev.slice(1));
    }
  }, [currentToast, toastQueue]);

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  // Add a new notification with toast
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 100));
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification (unless explicitly disabled)
    if (notification.showToast !== false) {
      setToastQueue(prev => [...prev, newNotification]);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Delete notification
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up user-specific notifications for:', user.id);

    const marketplaceChannel = supabase
      .channel(`marketplace-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'marketplace_listings',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          const listing = payload.new;
          addNotification({
            type: 'marketplace',
            title: '✅ Listing Created',
            message: `Your ${listing.crop} listing is now live!`,
            data: listing,
          });
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'marketplace_listings',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          const listing = payload.new;
          addNotification({
            type: 'marketplace',
            title: '📝 Listing Updated',
            message: `Your ${listing.crop} listing has been updated`,
            data: listing,
          });
        }
      )
      .on('postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'marketplace_listings',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          addNotification({
            type: 'marketplace',
            title: '🗑️ Listing Deleted',
            message: 'Your listing has been removed',
            data: payload.old,
          });
        }
      )
      .subscribe();

    const contractsChannel = supabase
      .channel(`contracts-${user.id}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'contracts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const contract = payload.new;
          addNotification({
            type: 'contract',
            title: '📄 New Contract',
            message: `Contract created for ${contract.crop} - ${contract.quantity} qt`,
            data: contract,
          });
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'contracts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const contract = payload.new;
          addNotification({
            type: 'contract',
            title: '📋 Contract Updated',
            message: `Your ${contract.crop} contract status: ${contract.status}`,
            data: contract,
          });
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel(`profiles-${user.id}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          addNotification({
            type: 'profile',
            title: '👤 Profile Updated',
            message: 'Your profile has been updated successfully',
            data: payload.new,
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notification subscriptions for:', user.id);
      supabase.removeChannel(marketplaceChannel);
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user?.id, addNotification]);

  const getNotificationIcon = (type) => {
    const icons = {
      marketplace: 'storefront',
      contract: 'document-text',
      trade: 'swap-horizontal',
      profile: 'person',
      price_alert: 'trending-up',
      autohedge: 'shield-checkmark',
      system: 'information-circle',
      success: 'checkmark-circle',
      error: 'alert-circle',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type) => {
    const colors = {
      marketplace: '#16a34a',
      contract: '#3b82f6',
      trade: '#8b5cf6',
      profile: '#f59e0b',
      price_alert: '#ef4444',
      autohedge: '#10b981',
      system: '#6b7280',
      success: '#16a34a',
      error: '#ef4444',
    };
    return colors[type] || '#6b7280';
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getNotificationIcon,
    getNotificationColor,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast Notification Overlay */}
      {currentToast && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <NotificationToast 
            notification={currentToast} 
            onDismiss={dismissToast}
            duration={4000}
          />
        </View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});
