import React, { useState } from 'react';
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

export default function FuturesSimulatorScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('Indore Mandi');
  const [selectedTab, setSelectedTab] = useState('Futures');
  const [selectedCrop, setSelectedCrop] = useState('Soybean');

  const simulatedPnL = 3420;
  const pnlPercentage = 8.2;

  const availableFutures = [
    {
      id: 1,
      name: 'Soybean Oct 2024',
      exchange: 'NCDEX b7 Expires 28 Oct',
      lastTraded: 4820,
      lot: '10 MT b7',
      margin: '₹40,000',
      change: 98,
      changePercent: 2.1,
      tag: 'Hedge harvest',
      tagColor: '#dcfce7',
      tagTextColor: '#166534',
    },
    {
      id: 2,
      name: 'Soybean Nov 2024',
      exchange: 'NCDEX b7 Expires 28 Nov',
      lastTraded: 4890,
      lot: '10 MT b7',
      margin: '₹49,100',
      change: 64,
      changePercent: 1.3,
      tag: 'Post-harvest',
      tagColor: '#e0e7ff',
      tagTextColor: '#3730a3',
    },
    {
      id: 3,
      name: 'Mustard Oct 2024',
      exchange: 'NCDEX b7 Expires 30 Oct',
      lastTraded: 6430,
      lot: '10 MT b7',
      margin: '₹65,800',
      change: -48,
      changePercent: -0.6,
      tag: 'Diversify',
      tagColor: '#e0e7ff',
      tagTextColor: '#3730a3',
    },
    {
      id: 4,
      name: 'Soy Oil Sep 2024',
      exchange: 'NCDEX Expires 15 Sep',
      lastTraded: 11260,
      lot: '10 MT',
      margin: '₹12,400',
      change: 116,
      changePercent: 1.3,
      tag: 'Crush hedge',
      tagColor: '#dcfce7',
      tagTextColor: '#166534',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBuy = (future) => {
    Alert.alert('Buy Future', `Buy ${future.name} at ₹${future.price}?`);
  };

  const handleSell = (future) => {
    Alert.alert('Sell Future', `Sell ${future.name} at ₹${future.price}?`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle} numberOfLines={1}>Futures simulator</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Simulate NCDEX hedges for your crops</Text>
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
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Futures' && styles.tabActive]}
            onPress={() => setSelectedTab('Futures')}
          >
            <Text style={[styles.tabText, selectedTab === 'Futures' && styles.tabTextActive]}>
              Futures
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'History' && styles.tabActive]}
            onPress={() => setSelectedTab('History')}
          >
            <Text style={[styles.tabText, selectedTab === 'History' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crop & Contract Selector */}
        <View style={styles.cropSelector}>
          <Text style={styles.cropLabel}>Crop & contract</Text>
          <Text style={styles.cropTitle}>Soybean contracts</Text>
          <View style={styles.cropButtons}>
            {['Soybean', 'Mustard', 'Groundnut'].map((crop) => (
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

        {/* Simulated P&L */}
        <View style={styles.pnlCard}>
          <Text style={styles.pnlLabel}>Simulated P&L (open positions)</Text>
          <View style={styles.pnlRow}>
            <Text style={[styles.pnlAmount, { color: simulatedPnL >= 0 ? '#16a34a' : '#dc2626' }]}>
              +₹{simulatedPnL.toLocaleString('en-IN')}
            </Text>
            <View style={[styles.pnlBadge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[styles.pnlBadgeText, { color: '#16a34a' }]}>
                +{pnlPercentage}%
              </Text>
            </View>
            <TouchableOpacity style={styles.viewPositionsButton}>
              <Text style={styles.viewPositionsText}>View positions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Futures */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available futures</Text>
            <TouchableOpacity>
              <Text style={styles.sortFilterLink}>Sort / filter</Text>
            </TouchableOpacity>
          </View>

          {availableFutures.map((future) => (
            <View key={future.id} style={styles.futureCard}>
              <View style={styles.futureHeader}>
                <View style={styles.futureInfo}>
                  <Text style={styles.futureName}>{future.name}</Text>
                  <Text style={styles.futureExchange}>{future.exchange}</Text>
                </View>
                <View style={[styles.futureTag, { backgroundColor: future.tagColor }]}>
                  <Text style={[styles.futureTagText, { color: future.tagTextColor }]}>{future.tag}</Text>
                </View>
              </View>

              <View style={styles.futureDetails}>
                <View style={styles.futurePriceSection}>
                  <Text style={styles.futurePriceLabel}>Last traded</Text>
                  <View style={styles.futurePriceRow}>
                    <Text style={styles.futurePriceIcon}>₹</Text>
                    <Text style={styles.futurePriceValue}>{future.lastTraded.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.futureChangeBadge, { backgroundColor: future.change >= 0 ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.futureChangeText, { color: future.change >= 0 ? '#16a34a' : '#dc2626' }]}>
                      {future.change >= 0 ? '+' : ''}{future.change} ({future.changePercent >= 0 ? '+' : ''}{future.changePercent}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.futureStatsRow}>
                  <Text style={styles.futureStatText}>Lot: {future.lot} • Margin: {future.margin}</Text>
                </View>
              </View>

              <View style={styles.futureActions}>
                <TouchableOpacity
                  style={[styles.futureActionButton, styles.sellButton]}
                  onPress={() => handleSell(future)}
                >
                  <Text style={styles.sellButtonText}>Sell</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.futureActionButton, styles.buyButton]}
                  onPress={() => handleBuy(future)}
                >
                  <Text style={styles.futureActionText}>Buy</Text>
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
  
  // Crop Selector
  cropSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cropLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  cropButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cropButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  cropButtonActive: {
    backgroundColor: '#16a34a',
  },
  cropButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  cropButtonTextActive: {
    color: '#fff',
  },
  
  // P&L Card
  pnlCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pnlLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pnlAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pnlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewPositionsButton: {
    marginLeft: 'auto',
  },
  viewPositionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
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
  sortFilterLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  
  // Future Card
  futureCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  futureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  futureInfo: {
    flex: 1,
  },
  futureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  futureExchange: {
    fontSize: 12,
    color: '#6b7280',
  },
  futureTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  futureTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  futureDetails: {
    marginBottom: 16,
  },
  futurePriceSection: {
    marginBottom: 12,
  },
  futurePriceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  futurePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  futurePriceIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 2,
  },
  futurePriceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  futureChangeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  futureChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  futureStatsRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  futureStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  futureActions: {
    flexDirection: 'row',
    gap: 8,
  },
  futureActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sellButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buyButton: {
    backgroundColor: '#16a34a',
  },
  futureActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
