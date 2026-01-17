import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SlideMenu from './SlideMenu';
import { useNotifications } from '../contexts/NotificationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AppHeader({ title, subtitle, userId = 1, mode = 'buyer', onModeChange, showToggle = false }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  
  // Use the notification context
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotificationIcon,
    getNotificationColor 
  } = useNotifications();

  const handleNotificationPress = () => {
    setNotificationVisible(true);
  };

  const handleNotificationClose = () => {
    setNotificationVisible(false);
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={20} color="#16a34a" />
            </View>
            <Text style={styles.appName}>AgriSure</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Sellers/Buyers Toggle - Like the image */}
            {showToggle && (
              <View style={styles.pillToggle}>
                <TouchableOpacity 
                  style={[styles.pillOption, mode === 'seller' && styles.pillOptionActive]}
                  onPress={() => onModeChange && onModeChange('seller')}
                >
                  <Text style={[styles.pillText, mode === 'seller' && styles.pillTextActive]}>Farmer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.pillOption, mode === 'buyer' && styles.pillOptionActive]}
                  onPress={() => onModeChange && onModeChange('buyer')}
                >
                  <Text style={[styles.pillText, mode === 'buyer' && styles.pillTextActive]}>Buyer</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#111827" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Slide Menu */}
      <SlideMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />

      {/* Real-time Notification Panel */}
      <Modal
        visible={notificationVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleNotificationClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.backdrop} onPress={handleNotificationClose} />
          <View style={styles.notificationPanel}>
            <View style={styles.dragHandle} />
            
            {/* Header */}
            <View style={styles.notifHeader}>
              <View style={styles.notifHeaderLeft}>
                <Text style={styles.notifTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.notifHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleNotificationClose}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotif}>
                  <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
                  <Text style={styles.emptyNotifTitle}>No notifications</Text>
                  <Text style={styles.emptyNotifText}>
                    You're all caught up! Notifications will appear here when something happens.
                  </Text>
                </View>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifItem, !notif.read && styles.notifItemUnread]}
                    onPress={() => markAsRead(notif.id)}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: getNotificationColor(notif.type) + '20' }]}>
                      <Ionicons 
                        name={getNotificationIcon(notif.type)} 
                        size={20} 
                        color={getNotificationColor(notif.type)} 
                      />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifItemTitle}>{notif.title}</Text>
                      <Text style={styles.notifItemMessage} numberOfLines={2}>{notif.message}</Text>
                      <Text style={styles.notifItemTime}>{formatTime(notif.createdAt)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => deleteNotification(notif.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  // Pill Toggle - Compact & Clean
  pillToggle: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 2,
  },
  pillOption: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillOptionActive: {
    backgroundColor: '#16a34a',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  pillTextActive: {
    color: '#fff',
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Notification Panel Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 0.3, // 30% for backdrop tap area
  },
  notificationPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.7, // 70% of screen
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  notifHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notifHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  notifList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyNotif: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyNotifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyNotifText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notifItemUnread: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notifItemMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  notifItemTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  deleteBtn: {
    padding: 6,
  },
});
