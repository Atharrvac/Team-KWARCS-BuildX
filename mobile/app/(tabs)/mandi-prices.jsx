import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ContractsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('Indore Mandi');
  const [selectedTab, setSelectedTab] = useState('Forward');
  const [selectedCrop, setSelectedCrop] = useState('Soybean');

  const aiSuggestion = {
    crop: 'Soybean',
    range: '₹4,780 - ₹4,900 / quintal',
    confidence: 68,
  };

  const activeContracts = [
    {
      id: 1,
      crop: 'Soybean b7 50 MT',
      buyer: 'Shakti Oil Mill',
      forwardPrice: '₹4,820 / quintal',
      deliveryWindow: '15 Oct - 30 Oct',
      harvestLockIn: 'Kharif 2024 harvest',
      payment: '2 days after delivery',
      status: 'Active',
    },
    {
      id: 2,
      crop: 'Mustard b7 20 MT',
      buyer: 'Narmada Traders Neemuch',
      forwardPrice: '₹6,520 / quintal',
      deliveryWindow: '10 Jan - 25 Jan',
      advance: '18%',
      digitalSignature: true,
      status: 'Pending sign',
    },
    {
      id: 3,
      crop: 'Soybean b7 30 MT',
      buyer: 'FPO b7 Farmers Group',
      forwardPrice: '₹4,760 / quintal',
      deliveryWindow: '05 Nov - 15 Nov',
      payoutType: 'FPO pool',
      expectedPayout: '~₹18,900',
      expectedDate: '2 days after delivery • 8-15 Nov',
      status: 'Active',
    },
  ];

  const pastContracts = [
    {
      id: 4,
      crop: 'Soybean b7 40 MT',
      completedDate: '28 Mar 2024',
      lockedPrice: '₹4,520 / quintal',
      realizedMargin: '+₹26 / quintal',
      settled: 'Payment received',
      status: 'Completed',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNewContract = () => {
    Alert.alert('New Contract', 'Create a new forward contract');
  };

  const handleViewContract = (contract) => {
    Alert.alert('Contract Details', `View details for ${contract.crop}`);
  };

  const handleDownload = (contract) => {
    Alert.alert('Download', `Download contract for ${contract.crop}`);
  };

  const handleShare = (contract) => {
    Alert.alert('Share', `Share contract for ${contract.crop}`);
  };

  const handleReview = (contract) => {
    Alert.alert('Review & Sign', `Review and sign contract for ${contract.crop}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle} numberOfLines={1}>Contracts</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Manage forward deals and hedging contracts</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="person-circle-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Selector */}
        <TouchableOpacity style={styles.locationSelector} activeOpacity={0.7}>
          <Text style={styles.locationLabel}>Location:</Text>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.locationText}>{location}</Text>
          <Ionicons name="chevron-down" size={14} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Forward Price Suggestion */}
        <View style={styles.aiSuggestionCard}>
          <View style={styles.aiSuggestionHeader}>
            <View style={styles.aiSuggestionTitleRow}>
              <Ionicons name="sparkles" size={20} color="#16a34a" />
              <Text style={styles.aiSuggestionTitle}>AI forward price suggestion</Text>
            </View>
            <TouchableOpacity style={styles.cropDropdown}>
              <Text style={styles.cropDropdownText}>Soybean</Text>
              <Ionicons name="chevron-down" size={16} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <Text style={styles.aiSuggestionRange}>
            Suggested lock-in range: ₹4,780 – ₹4,900 / quintal
          </Text>
          <View style={styles.aiSuggestionFooter}>
            <View style={styles.confidenceSection}>
              <Text style={styles.confidenceLabel}>Confidence:</Text>
              <Text style={styles.confidenceValue}>68%</Text>
            </View>
            <TouchableOpacity style={styles.seeStrategyButton}>
              <Text style={styles.seeStrategyText}>See strategy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Forward' && styles.tabActive]}
            onPress={() => setSelectedTab('Forward')}
          >
            <Text style={[styles.tabText, selectedTab === 'Forward' && styles.tabTextActive]}>
              Forward
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Futures' && styles.tabActive]}
            onPress={() => setSelectedTab('Futures')}
          >
            <Text style={[styles.tabText, selectedTab === 'Futures' && styles.tabTextActive]}>
              Futures
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'All' && styles.tabActive]}
            onPress={() => setSelectedTab('All')}
          >
            <Text style={[styles.tabText, selectedTab === 'All' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crop Filter */}
        <View style={styles.cropFilter}>
          <Text style={styles.filterLabel}>Showing contracts for</Text>
          <View style={styles.cropButtons}>
            <View style={styles.cropBadge}>
              <Text style={styles.cropBadgeText}>Kharif 2024 harvest</Text>
            </View>
            {['Soybean', 'Mustard', 'All crops'].map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.cropButton, selectedCrop === crop && styles.cropButtonActive]}
                onPress={() => setSelectedCrop(crop)}
              >
                <Text style={[styles.cropButtonText, selectedCrop === crop && styles.cropButtonTextActive]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Forward Contracts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active forward contracts</Text>
            <TouchableOpacity onPress={handleNewContract}>
              <Text style={styles.newContractLink}>New contract</Text>
            </TouchableOpacity>
          </View>

          {activeContracts.map((contract) => (
            <View key={contract.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <View style={styles.contractHeaderLeft}>
                  <Text style={styles.contractCrop}>{contract.crop}</Text>
                  {contract.buyer && (
                    <Text style={styles.contractBuyer}>Buyer: {contract.buyer}</Text>
                  )}
                </View>
                <View style={styles.contractHeaderRight}>
                  {contract.harvestLockIn && (
                    <View style={styles.harvestBadge}>
                      <Text style={styles.harvestBadgeText}>Harvest lock-in</Text>
                    </View>
                  )}
                  {contract.status === 'Active' ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{contract.status}</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusBadgePending]}>
                      <Text style={[styles.statusBadgeText, styles.statusBadgeTextPending]}>
                        {contract.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.contractDetails}>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Forward price</Text>
                  <Text style={styles.contractValue}>{contract.forwardPrice}</Text>
                </View>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Delivery window</Text>
                  <Text style={styles.contractValue}>{contract.deliveryWindow}</Text>
                </View>
                {contract.payment && (
                  <View style={styles.contractRow}>
                    <Text style={styles.contractLabel}>
                      {contract.advance ? `Min: ${contract.advance} / Max: 49 MT` : `Payment: ${contract.payment}`}
                    </Text>
                    <Text style={styles.contractValue}></Text>
                  </View>
                )}
                {contract.advance && (
                  <View style={styles.contractRow}>
                    <Text style={styles.contractLabel}>Digital signature required</Text>
                    <Text style={styles.contractValue}>Advance: {contract.advance}</Text>
                  </View>
                )}
                {contract.payoutType && (
                  <View style={styles.contractRow}>
                    <Text style={styles.contractLabel}>Payout to {contract.payoutType}</Text>
                    <Text style={styles.contractValue}></Text>
                  </View>
                )}
              </View>

              <View style={styles.contractActions}>
                {contract.status === 'Pending sign' ? (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(contract)}>
                      <Text style={styles.actionButtonText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={() => handleReview(contract)}
                    >
                      <Text style={styles.actionButtonTextPrimary}>Review & sign</Text>
                    </TouchableOpacity>
                  </>
                ) : contract.payoutType ? (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleViewContract(contract)}>
                      <Text style={styles.actionButtonText}>Close early</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={() => handleViewContract(contract)}
                    >
                      <Text style={styles.actionButtonTextPrimary}>View details</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDownload(contract)}>
                      <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonPrimary]}
                      onPress={() => handleViewContract(contract)}
                    >
                      <Text style={styles.actionButtonTextPrimary}>View details</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Past Contracts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past contracts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {pastContracts.map((contract) => (
            <View key={contract.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <View>
                  <Text style={styles.contractCrop}>{contract.crop}</Text>
                  <Text style={styles.contractBuyer}>Completed on {contract.completedDate}</Text>
                </View>
                <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
                  <Text style={[styles.statusBadgeText, styles.statusBadgeTextCompleted]}>
                    {contract.status}
                  </Text>
                </View>
              </View>

              <View style={styles.contractDetails}>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Locked price</Text>
                  <Text style={styles.contractValue}>{contract.lockedPrice}</Text>
                </View>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Realized vs mandi</Text>
                  <Text style={[styles.contractValue, styles.contractValuePositive]}>
                    {contract.realizedMargin}
                  </Text>
                </View>
                <View style={styles.contractRow}>
                  <Text style={styles.contractLabel}>Settled by</Text>
                  <Text style={styles.contractValue}>{contract.settled}</Text>
                </View>
              </View>

              <View style={styles.contractActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View summary</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
    paddingRight: 4,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    width: 72,
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 16,
  },
  iconButton: {
    padding: 4,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  locationText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  
  // AI Suggestion
  aiSuggestionCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiSuggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSuggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  cropDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cropDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  aiSuggestionRange: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  aiSuggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  seeStrategyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#16a34a',
    borderRadius: 6,
  },
  seeStrategyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Tabs
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  
  // Crop Filter
  cropFilter: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  cropButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cropBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  cropButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  cropButtonActive: {
    backgroundColor: '#16a34a',
  },
  cropButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  cropButtonTextActive: {
    color: '#fff',
  },
  
  // Section
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  newContractLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  
  // Contract Card
  contractCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contractHeaderLeft: {
    flex: 1,
  },
  contractHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  contractCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  contractBuyer: {
    fontSize: 12,
    color: '#6b7280',
  },
  harvestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  harvestBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeTextPending: {
    color: '#92400e',
  },
  statusBadgeCompleted: {
    backgroundColor: '#e5e7eb',
  },
  statusBadgeTextCompleted: {
    color: '#374151',
  },
  contractDetails: {
    marginBottom: 16,
    gap: 8,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  contractValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
  },
  contractValuePositive: {
    color: '#16a34a',
  },
  contractActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtonPrimary: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  actionButtonTextPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
