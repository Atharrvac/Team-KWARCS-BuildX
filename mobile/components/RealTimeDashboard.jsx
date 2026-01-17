import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import websocketService from '../services/websocketService';
import PriceCard from './PriceCard';
import AnimatedTickerTape from './AnimatedTickerTape';

export default function RealTimeDashboard() {
  const [prices, setPrices] = useState([]);
  const [marketSummary, setMarketSummary] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    initializeWebSocket();
    
    return () => {
      // Cleanup listeners
      websocketService.off('priceUpdate', handlePriceUpdate);
      websocketService.off('marketUpdate', handleMarketUpdate);
    };
  }, []);

  const initializeWebSocket = async () => {
    try {
      await websocketService.connect();
      setConnectionStatus('connected');
      
      // Set up event listeners
      websocketService.on('priceUpdate', handlePriceUpdate);
      websocketService.on('marketUpdate', handleMarketUpdate);
      
      // Request initial data
      fetchInitialData();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handlePriceUpdate = (priceData) => {
    console.log('Received price update:', priceData);
    setPrices(priceData);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleMarketUpdate = (marketData) => {
    console.log('Received market update:', marketData);
    setMarketSummary(marketData);
  };

  const fetchInitialData = async () => {
    try {
      // Fetch initial prices from API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/market/prices`);
      const data = await response.json();
      setPrices(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return 'radio-button-on';
      case 'connecting': return 'time';
      case 'disconnected': return 'radio-button-off';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Animated Ticker Tape */}
      {prices.length > 0 && (
        <AnimatedTickerTape 
          data={prices.map(p => ({
            symbol: p.crop?.toUpperCase() || p.name?.toUpperCase(),
            price: p.price,
            change: p.change,
          }))}
        />
      )}
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Ionicons 
            name={getConnectionStatusIcon()} 
            size={16} 
            color={getConnectionStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </Text>
        </View>
        
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last update: {lastUpdate}
          </Text>
        )}
      </View>

      {/* Market Summary */}
      {marketSummary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Market Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Volume:</Text>
            <Text style={styles.summaryValue}>
              {marketSummary.totalVolume?.toLocaleString()} quintals
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Active Markets:</Text>
            <Text style={styles.summaryValue}>{marketSummary.activeMarkets}</Text>
          </View>
        </View>
      )}

      {/* Price Cards */}
      <Text style={styles.sectionTitle}>Live Prices</Text>
      <View style={styles.priceGrid}>
        {prices.map((price, index) => (
          <PriceCard 
            key={price.id || index} 
            data={price} 
            onPress={() => console.log('Price card pressed:', price.name)}
          />
        ))}
      </View>

      {/* Real-time Indicators */}
      <View style={styles.indicatorsCard}>
        <Text style={styles.indicatorsTitle}>Real-time Features</Text>
        <View style={styles.indicator}>
          <Ionicons name="pulse" size={16} color="#3b82f6" />
          <Text style={styles.indicatorText}>Live price updates every 5 seconds</Text>
        </View>
        <View style={styles.indicator}>
          <Ionicons name="notifications" size={16} color="#10b981" />
          <Text style={styles.indicatorText}>Price alerts and notifications</Text>
        </View>
        <View style={styles.indicator}>
          <Ionicons name="trending-up" size={16} color="#f59e0b" />
          <Text style={styles.indicatorText}>AI-powered predictions</Text>
        </View>
        <View style={styles.indicator}>
          <Ionicons name="shield-checkmark" size={16} color="#8b5cf6" />
          <Text style={styles.indicatorText}>Automated hedging signals</Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  indicatorsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  indicatorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
});