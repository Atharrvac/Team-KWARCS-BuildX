import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

export default function CollectiveTradingScreen() {
  const trades = [
    { id: 1, crop: 'Soybean', quantity: '50 MT', price: '₹4,820/qt', status: 'Active', members: 12 },
    { id: 2, crop: 'Mustard', quantity: '30 MT', price: '₹6,450/qt', status: 'Completed', members: 8 },
    { id: 3, crop: 'Groundnut', quantity: '25 MT', price: '₹5,800/qt', status: 'Pending', members: 6 },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Collective Trading</Text>
        <Text style={styles.subtitle}>Bulk orders & better prices</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create New Trade</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {trades.map((trade) => (
            <View key={trade.id} style={styles.tradeCard}>
              <View style={styles.tradeHeader}>
                <Text style={styles.tradeCrop}>{trade.crop}</Text>
                <View style={[
                  styles.statusBadge,
                  trade.status === 'Active' && styles.activeStatus,
                  trade.status === 'Completed' && styles.completedStatus,
                  trade.status === 'Pending' && styles.pendingStatus,
                ]}>
                  <Text style={styles.statusText}>{trade.status}</Text>
                </View>
              </View>
              <View style={styles.tradeDetails}>
                <View style={styles.tradeDetail}>
                  <Ionicons name="cube-outline" size={16} color="#6b7280" />
                  <Text style={styles.tradeDetailText}>{trade.quantity}</Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Ionicons name="cash-outline" size={16} color="#6b7280" />
                  <Text style={styles.tradeDetailText}>{trade.price}</Text>
                </View>
                <View style={styles.tradeDetail}>
                  <Ionicons name="people-outline" size={16} color="#6b7280" />
                  <Text style={styles.tradeDetailText}>{trade.members} members</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#2d5f3f" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  pageHeader: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  content: { flex: 1, padding: 20 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5f3f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tradeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeCrop: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  activeStatus: { backgroundColor: '#dbeafe' },
  completedStatus: { backgroundColor: '#d1fae5' },
  pendingStatus: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
  tradeDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  tradeDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tradeDetailText: { fontSize: 14, color: '#6b7280' },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewButtonText: { fontSize: 14, fontWeight: '600', color: '#2d5f3f' },
});
