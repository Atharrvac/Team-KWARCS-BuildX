import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function NotificationToast({ notification, onDismiss, duration = 4000 }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getIcon = () => {
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
      warning: 'warning',
    };
    return icons[notification.type] || 'notifications';
  };

  const getColor = () => {
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
      warning: '#f59e0b',
    };
    return colors[notification.type] || '#16a34a';
  };

  const color = getColor();

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY }],
          opacity,
          borderLeftColor: color,
        }
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={dismiss} activeOpacity={0.9}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={getIcon()} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
