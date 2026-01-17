import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function NotificationDemo({ userId = 1 }) {
  const [loading, setLoading] = useState(false);

  const createTestNotification = async (type) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/notifications/test/${userId}`,
        { type },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      Alert.alert('Success', `${type} notification created!`);
    } catch (error) {
      console.error('Error creating notification:', error);
      Alert.alert('Error', 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { type: 'price_alert', label: 'Price Alert', icon: 'trending-up', color: '#ef4444' },
    { type: 'contract', label: 'Contract', icon: 'document-text', color: '#3b82f6' },
    { type: 'trade', label: 'Trade', icon: 'swap-horizontal', color: '#8b5cf6' },
    { type: 'new_oilseed', label: 'New Oilseed', icon: 'leaf', color: '#16a34a' },
    { type: 'learning', label: 'Learning', icon: 'school', color: '#06b6d4' },
    { type: 'system', label: 'System', icon: 'information-circle', color: '#6b7280' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Notifications</Text>
      <Text style={styles.subtitle}>Tap to create test notifications</Text>
      
      <ScrollView style={styles.grid} showsVerticalScrollIndicator={false}>
        {notificationTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[styles.card, { borderColor: item.color }]}
            onPress={() => createTestNotification(item.type)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  grid: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
