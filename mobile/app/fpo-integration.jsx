import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import axios from 'axios';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function FPOIntegrationScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('Dashboard');
  const [fpoData, setFpoData] = useState({});
  const [memberData, setMemberData] = useState({});
  const [collectiveOrders, setCollectiveOrders] = useState([]);
  const [priceComparison, setPriceComparison] = useState({});
  const [joinFpoForm, setJoinFpoForm] = useState({
    farmerName: '',
    farmSize: '',
    crops: [],
    location: '',
    phone: ''
  });

  useEffect(() => {
    loadFPOData();
  }, []);

  const loadFPOData = async () => {
    try {
      // Mock FPO data - in production, this would come from API
      setFpoData({
        fpoName: 'Madhya Pradesh Oilseed Farmers FPO',
        registrationNumber: 'FPO/MP/2023/001',
        totalMembers: 1247,
        totalFarmArea: 8950, // hectares
        establishedYear: 2020,
        location: 'Indore, Madhya Pradesh',
        crops: ['Soybean', 'Mustard', 'Groundnut'],
        avgPricePremium: 8.5, // percentage above market
        totalTurnover: 15600000, // in rupees
        status: 'Active',
        benefits: [
          'Collective bargaining for better prices',
          'Reduced input costs through bulk purchasing',
          'Access to credit and insurance',
          'Technical support and training',
          'Direct market linkages',
          'Quality certification support'
        ]
      });

      setMemberData({
        memberId: 'FPO001247',
        joinedDate: '2023-03-15',
        farmSize: 5.2,
        crops: ['Soybean', 'Mustard'],
        totalSales: 125000,
        avgPremium: 12.3,
        status: 'Active Member'
      });

      setCollectiveOrders([
        {
          id: 1,
          crop: 'Soybean',
          totalQuantity: 2500,
          memberContribution: 45,
          targetPrice: 4950,
          currentMarketPrice: 4820,
          premium: 130,
          status: 'Open',
          deadline: '2024-01-15',
          participants: 156
        },
        {
          id: 2,
          crop: 'Mustard',
          totalQuantity: 1200,
          memberContribution: 25,
          targetPrice: 6680,
          currentMarketPrice: 6450,
          premium: 230,
          status: 'Filled',
          deadline: '2024-01-10',
          participants: 89
        }
      ]);

      setPriceComparison({
        soybean: {
          marketPrice: 4820,
          fpoPrice: 4950,
          premium: 130,
          premiumPercent: 2.7
        },
        mustard: {
          marketPrice: 6450,
          fpoPrice: 6680,
          premium: 230,
          premiumPercent: 3.6
        },
        groundnut: {
          marketPrice: 5800,
          fpoPrice: 6020,
          premium: 220,
          premiumPercent: 3.8
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading FPO data:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFPOData();
    setRefreshing(false);
  };

  const joinCollectiveOrder = async (orderId) => {
    try {
      Alert.alert(
        'Join Collective Order',
        'Are you sure you want to join this collective order?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: async () => {
              // API call to join order
              Alert.alert('Success', 'You have successfully joined the collective order!');
              loadFPOData(); // Refresh data
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error joining collective order:', error);
      Alert.alert('Error', 'Failed to join collective order');
    }
  };

  const submitJoinFPO = async () => {
    try {
      if (!joinFpoForm.farmerName || !joinFpoForm.farmSize || !joinFpoForm.phone) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      // API call to submit FPO membership application
      Alert.alert(
        'Application Submitted',
        'Your FPO membership application has been submitted. You will be contacted within 3-5 business days.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting FPO application:', error);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading FPO data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#059669', '#047857']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>FPO Integration</Text>
            <Text style={styles.headerSubtitle}>Collective farming benefits</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="information-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {['Dashboard', 'Collective Orders', 'Price Benefits', 'Join FPO'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Tab */}
        {selectedTab === 'Dashboard' && (
          <>
            {/* FPO Overview */}
            <View style={styles.overviewCard}>
              <View style={styles.fpoHeader}>
                <View style={styles.fpoIcon}>
                  <Ionicons name="people" size={32} color="#059669" />
                </View>
                <View style={styles.fpoInfo}>
                  <Text style={styles.fpoName}>{fpoData.fpoName}</Text>
                  <Text style={styles.fpoLocation}>{fpoData.location}</Text>
                  <View style={styles.fpoStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{fpoData.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fpoStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{fpoData.totalMembers}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{fpoData.totalFarmArea}</Text>
                  <Text style={styles.statLabel}>Hectares</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{fpoData.avgPricePremium}%</Text>
                  <Text style={styles.statLabel}>Avg Premium</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(fpoData.totalTurnover / 1000000)}M</Text>
                  <Text style={styles.statLabel}>Turnover</Text>
                </View>
              </View>
            </View>

            {/* Member Benefits */}
            <View style={styles.benefitsCard}>
              <Text style={styles.cardTitle}>FPO Benefits</Text>
              {fpoData.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Member Dashboard */}
            {memberData.memberId && (
              <View style={styles.memberCard}>
                <Text style={styles.cardTitle}>Your Membership</Text>
                <View style={styles.memberInfo}>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberLabel}>Member ID</Text>
                    <Text style={styles.memberValue}>{memberData.memberId}</Text>
                  </View>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberLabel}>Joined Date</Text>
                    <Text style={styles.memberValue}>{new Date(memberData.joinedDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberLabel}>Farm Size</Text>
                    <Text style={styles.memberValue}>{memberData.farmSize} hectares</Text>
                  </View>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberLabel}>Total Sales</Text>
                    <Text style={[styles.memberValue, { color: '#059669' }]}>
                      {formatCurrency(memberData.totalSales)}
                    </Text>
                  </View>
                  <View style={styles.memberRow}>
                    <Text style={styles.memberLabel}>Avg Premium Earned</Text>
                    <Text style={[styles.memberValue, { color: '#059669' }]}>
                      {memberData.avgPremium}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Collective Orders Tab */}
        {selectedTab === 'Collective Orders' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Collective Orders</Text>
            <Text style={styles.sectionSubtitle}>Join with other farmers for better prices</Text>

            {collectiveOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCrop}>{order.crop}</Text>
                  <View style={[styles.orderStatus, {
                    backgroundColor: order.status === 'Open' ? '#dcfce7' : '#fef3c7'
                  }]}>
                    <Text style={[styles.orderStatusText, {
                      color: order.status === 'Open' ? '#059669' : '#f59e0b'
                    }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Total Quantity</Text>
                    <Text style={styles.orderValue}>{order.totalQuantity} quintals</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Your Contribution</Text>
                    <Text style={styles.orderValue}>{order.memberContribution} quintals</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Target Price</Text>
                    <Text style={[styles.orderValue, { color: '#059669' }]}>
                      {formatCurrency(order.targetPrice)}
                    </Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Market Price</Text>
                    <Text style={styles.orderValue}>{formatCurrency(order.currentMarketPrice)}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Premium</Text>
                    <Text style={[styles.orderValue, { color: '#059669', fontWeight: '600' }]}>
                      +{formatCurrency(order.premium)}
                    </Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Participants</Text>
                    <Text style={styles.orderValue}>{order.participants} farmers</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Deadline</Text>
                    <Text style={styles.orderValue}>{new Date(order.deadline).toLocaleDateString()}</Text>
                  </View>
                </View>

                {order.status === 'Open' && (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => joinCollectiveOrder(order.id)}
                  >
                    <Text style={styles.joinButtonText}>Join Collective Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Price Benefits Tab */}
        {selectedTab === 'Price Benefits' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Comparison</Text>
            <Text style={styles.sectionSubtitle}>See how FPO prices compare to market rates</Text>

            {Object.entries(priceComparison).map(([crop, data]) => (
              <View key={crop} style={styles.priceCard}>
                <View style={styles.priceHeader}>
                  <Text style={styles.priceCrop}>{crop.toUpperCase()}</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>+{data.premiumPercent}%</Text>
                  </View>
                </View>

                <View style={styles.priceComparison}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Market Price</Text>
                    <Text style={styles.priceValue}>{formatCurrency(data.marketPrice)}</Text>
                  </View>
                  <View style={styles.priceArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>FPO Price</Text>
                    <Text style={[styles.priceValue, { color: '#059669', fontWeight: '600' }]}>
                      {formatCurrency(data.fpoPrice)}
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumInfo}>
                  <Text style={styles.premiumLabel}>Premium Earned</Text>
                  <Text style={styles.premiumAmount}>+{formatCurrency(data.premium)} per quintal</Text>
                </View>
              </View>
            ))}

            <View style={styles.benefitsSummary}>
              <Text style={styles.summaryTitle}>Annual Benefits Estimate</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Additional Income</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>
                  +{formatCurrency(45000)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Input Cost Savings</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>
                  -{formatCurrency(12000)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Benefit</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '600' }]}>
                  +{formatCurrency(57000)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Join FPO Tab */}
        {selectedTab === 'Join FPO' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join FPO</Text>
            <Text style={styles.sectionSubtitle}>Apply for FPO membership and start earning better prices</Text>

            <View style={styles.joinForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farmer Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={joinFpoForm.farmerName}
                  onChangeText={(text) => setJoinFpoForm({...joinFpoForm, farmerName: text})}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Size (Hectares) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={joinFpoForm.farmSize}
                  onChangeText={(text) => setJoinFpoForm({...joinFpoForm, farmSize: text})}
                  placeholder="Enter farm size in hectares"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Crops</Text>
                <View style={styles.cropSelector}>
                  {['Soybean', 'Mustard', 'Groundnut', 'Sunflower'].map((crop) => (
                    <TouchableOpacity
                      key={crop}
                      style={[styles.cropOption, joinFpoForm.crops.includes(crop) && styles.cropOptionActive]}
                      onPress={() => {
                        const crops = joinFpoForm.crops.includes(crop)
                          ? joinFpoForm.crops.filter(c => c !== crop)
                          : [...joinFpoForm.crops, crop];
                        setJoinFpoForm({...joinFpoForm, crops});
                      }}
                    >
                      <Text style={[styles.cropOptionText, joinFpoForm.crops.includes(crop) && styles.cropOptionTextActive]}>
                        {crop}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={joinFpoForm.location}
                  onChangeText={(text) => setJoinFpoForm({...joinFpoForm, location: text})}
                  placeholder="Village, District, State"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={joinFpoForm.phone}
                  onChangeText={(text) => setJoinFpoForm({...joinFpoForm, phone: text})}
                  placeholder="Enter 10-digit mobile number"
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={submitJoinFPO}>
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </TouchableOpacity>

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  * By submitting this application, you agree to the FPO terms and conditions. 
                  Our team will contact you within 3-5 business days to complete the membership process.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // Tabs
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  
  // Overview Card
  overviewCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fpoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  fpoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpoInfo: {
    flex: 1,
  },
  fpoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  fpoLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  fpoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  fpoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Benefits Card
  benefitsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  
  // Member Card
  memberCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberInfo: {
    gap: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  memberValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  
  // Order Card
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderCrop: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  joinButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Price Card
  priceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  premiumBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceArrow: {
    marginHorizontal: 16,
  },
  premiumInfo: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  premiumLabel: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 4,
  },
  premiumAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  
  // Benefits Summary
  benefitsSummary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Join Form
  joinForm: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cropSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cropOptionActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  cropOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  cropOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});