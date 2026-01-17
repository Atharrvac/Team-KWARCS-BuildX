import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config/api';
import AppHeader from '../components/AppHeader';

export default function InsuranceScreen() {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = 1; // Demo user

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/insurance/plans`),
        axios.get(`${API_URL}/insurance/stats/${userId}`)
      ]);
      
      setPlans(plansRes.data.plans || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error loading insurance data:', error);
      Alert.alert('Error', 'Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApply = (plan) => {
    Alert.alert(
      plan.name,
      `Premium: ${plan.premium}\nCoverage: ${plan.coverage}\n\nWould you like to apply for this insurance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply Now', onPress: () => applyForInsurance(plan) }
      ]
    );
  };

  const applyForInsurance = async (plan) => {
    try {
      const response = await axios.post(`${API_URL}/insurance/apply`, {
        userId,
        planId: plan.id,
        cropType: 'soybean',
        acres: 10,
        sumInsured: 500000,
        season: 'Kharif 2024'
      });
      
      Alert.alert('Success', response.data.message);
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading insurance plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insurance</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
              <Text style={styles.statValue}>{stats.activePolicies || 0}</Text>
              <Text style={styles.statLabel}>Active Policies</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>₹{(stats.totalCoverage || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Coverage</Text>
            </View>
          </View>
        )}

        {/* Insurance Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Insurance Plans</Text>
          <Text style={styles.sectionSubtitle}>Protect your crops and income</Text>
        </View>

        {plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                <Ionicons name={plan.icon} size={28} color={plan.color} />
              </View>
              <View style={styles.planHeaderText}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planType}>{plan.type.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.planDetails}>
              <View style={styles.planDetail}>
                <Ionicons name="shield-outline" size={16} color="#6b7280" />
                <Text style={styles.planDetailText}>{plan.coverage}</Text>
              </View>
              <View style={styles.planDetail}>
                <Ionicons name="cash-outline" size={16} color="#6b7280" />
                <Text style={styles.planDetailText}>{plan.premium}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Key Features:</Text>
              {plan.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: plan.color }]}
              onPress={() => handleApply(plan)}
            >
              <Text style={styles.applyButtonText}>Apply Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle" size={32} color="#3b82f6" />
          <Text style={styles.helpTitle}>Need Help Choosing?</Text>
          <Text style={styles.helpText}>
            Our insurance experts can help you select the right plan for your farm
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Talk to Expert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  planCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planHeaderText: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  planType: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  planDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planDetailText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helpSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
