import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function MarketScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      const response = await axios.get(`${API_URL}/market/prices`);
      setMarketData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading market data:', error);
      // Set mock data on error
      setMarketData([
        { crop: 'soybean', price: 4820, change: 2.1, volume: 15000 },
        { crop: 'mustard', price: 6450, change: -0.4, volume: 12000 },
        { crop: 'groundnut', price: 5800, change: 3.8, volume: 8000 },
      ]);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  const formatChange = (change) => {
    const changeNum = parseFloat(change);
    return `${changeNum >= 0 ? '+' : ''}${changeNum.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    return parseFloat(change) >= 0 ? '#16a34a' : '#ef4444';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Market</Text>
            <Text style={styles.headerSubtitle}>Live commodity prices</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Market Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gainers</Text>
              <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                {marketData.filter(item => parseFloat(item.change) > 0).length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Losers</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                {marketData.filter(item => parseFloat(item.change) < 0).length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Volume</Text>
              <Text style={styles.summaryValue}>
                {Math.round(marketData.reduce((sum, item) => sum + (item.volume || 0), 0) / 1000)}K
              </Text>
            </View>
          </View>
        </View>

        {/* Price List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Prices</Text>
          
          {marketData.map((item, index) => (
            <TouchableOpacity key={index} style={styles.priceCard}>
              <View style={styles.priceCardLeft}>
                <Text style={styles.priceCrop}>{item.crop?.toUpperCase()}</Text>
                <Text style={styles.priceVolume}>Vol: {Math.round((item.volume || 0) / 1000)}K</Text>
              </View>
              <View style={styles.priceCardCenter}>
                <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.priceCardRight}>
                <View style={[styles.changeContainer, { 
                  backgroundColor: parseFloat(item.change) >= 0 ? '#dcfce7' : '#fee2e2' 
                }]}>
                  <Ionicons 
                    name={parseFloat(item.change) >= 0 ? 'trending-up' : 'trending-down'} 
                    size={12} 
                    color={getChangeColor(item.change)} 
                  />
                  <Text style={[styles.changeText, { color: getChangeColor(item.change) }]}>
                    {formatChange(item.change)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  priceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priceCardLeft: {
    flex: 1,
  },
  priceCardCenter: {
    flex: 1,
    alignItems: 'center',
  },
  priceCardRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  priceCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceVolume: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});