import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

export default function FpoAnalyticsScreen() {
  const metrics = [
    { label: 'Total Revenue', value: '₹45.2L', change: '+12.5%', icon: 'trending-up', color: '#059669' },
    { label: 'Avg Price/Qt', value: '₹5,245', change: '+5.2%', icon: 'cash', color: '#2d5f3f' },
    { label: 'Total Volume', value: '450 MT', change: '+8.3%', icon: 'cube', color: '#7c3aed' },
    { label: 'Active Members', value: '156', change: '+15', icon: 'people', color: '#1e40af' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.pageHeader}>
        <Text style={styles.title}>FPO Analytics</Text>
        <Text style={styles.subtitle}>Performance overview</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                <Ionicons name={metric.icon} size={24} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={[styles.metricChange, { color: metric.color }]}>{metric.change}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Performance</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="bar-chart" size={48} color="#9ca3af" />
            <Text style={styles.placeholderText}>Chart visualization coming soon</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Crops</Text>
          {['Soybean', 'Mustard', 'Groundnut'].map((crop, index) => (
            <View key={index} style={styles.cropCard}>
              <Text style={styles.cropName}>{crop}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${85 - index * 15}%` }]} />
              </View>
              <Text style={styles.cropValue}>₹{(15 - index * 3).toFixed(1)}L</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 4 },
  metricChange: { fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  chartPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 14, color: '#9ca3af', marginTop: 8 },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cropName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2d5f3f', borderRadius: 4 },
  cropValue: { fontSize: 14, fontWeight: '600', color: '#2d5f3f', textAlign: 'right' },
});
