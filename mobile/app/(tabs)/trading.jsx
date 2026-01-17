import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AppHeader from '../../components/AppHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

export default function TradingScreen() {
  const [positions, setPositions] = useState([]);
  const [futures, setFutures] = useState([]);
  const [pnlSummary, setPnlSummary] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [quantity, setQuantity] = useState('');
  const [tradeType, setTradeType] = useState('long');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(4820);
  const [marketPrices, setMarketPrices] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  useEffect(() => {
    loadData();
    // Real-time price updates every 3 seconds
    const interval = setInterval(fetchCurrentPrice, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update current price when crop changes
  useEffect(() => {
    if (marketPrices[selectedCrop]) {
      setCurrentPrice(marketPrices[selectedCrop]);
    }
  }, [selectedCrop, marketPrices]);

  const loadData = async () => {
    await Promise.all([
      fetchPositions(),
      fetchFutures(),
      fetchPnL(),
      fetchCurrentPrice(),
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fetchCurrentPrice = async () => {
    try {
      const response = await axios.get(`${API_URL}/market/prices`);
      const prices = {};
      response.data.forEach(item => {
        prices[item.crop] = item.price;
      });
      setMarketPrices(prices);
      
      const selectedCropPrice = prices[selectedCrop];
      if (selectedCropPrice) {
        setCurrentPrice(selectedCropPrice);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await axios.get(`${API_URL}/trading/positions/1`);
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setPositions([]);
    }
  };

  const fetchFutures = async () => {
    try {
      const response = await axios.get(`${API_URL}/trading/futures`);
      setFutures(response.data);
    } catch (error) {
      console.error('Error fetching futures:', error);
    }
  };

  const fetchPnL = async () => {
    try {
      const response = await axios.get(`${API_URL}/trading/pnl/1`);
      setPnlSummary(response.data);
    } catch (error) {
      console.error('Error fetching P&L:', error);
    }
  };

  const openPosition = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    // Get the current price for the selected crop
    const priceForCrop = marketPrices[selectedCrop] || currentPrice;

    try {
      console.log('Opening position:', {
        userId: 1,
        crop: selectedCrop,
        type: tradeType,
        quantity: parseFloat(quantity),
        entryPrice: priceForCrop,
      });

      const response = await axios.post(`${API_URL}/trading/positions`, {
        userId: 1,
        crop: selectedCrop,
        type: tradeType,
        quantity: parseFloat(quantity),
        entryPrice: priceForCrop,
      });
      
      Alert.alert(
        '🎉 Position Opened Successfully!', 
        `${tradeType.toUpperCase()} ${selectedCrop.toUpperCase()}\n\n` +
        `📊 Quantity: ${quantity} quintals\n` +
        `💰 Entry Price: ₹${priceForCrop.toLocaleString('en-IN')}\n` +
        `💵 Total Value: ₹${(parseFloat(quantity) * priceForCrop).toLocaleString('en-IN')}\n` +
        `🔒 Margin Used: ₹${(parseFloat(quantity) * priceForCrop * 0.1).toLocaleString('en-IN')}`,
        [{ text: 'Continue Trading', style: 'default' }]
      );
      setQuantity('');
      setStopLoss('');
      setTakeProfit('');
      await loadData();
    } catch (error) {
      console.error('Error opening position:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to open position';
      Alert.alert('Error', `Failed to open position\n\n${errorMsg}`);
    }
  };

  const closePosition = async (position) => {
    // Get the correct price for this position's crop
    const exitPrice = marketPrices[position.crop] || currentPrice;
    const pnl = calculateUnrealizedPnL(position);
    
    Alert.alert(
      'Close Position',
      `Close ${position.type.toUpperCase()} ${position.crop.toUpperCase()}?\n\n` +
      `Exit Price: ₹${exitPrice.toLocaleString('en-IN')}\n` +
      `P&L: ${pnl >= 0 ? '+' : ''}₹${Math.round(pnl).toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(`${API_URL}/trading/positions/${position.id}/close`, {
                exitPrice: exitPrice,
              });
              
              Alert.alert('Success', 'Position closed successfully');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to close position');
            }
          },
        },
      ]
    );
  };

  const calculateUnrealizedPnL = (position) => {
    const entry = parseFloat(position.entryPrice);
    const qty = parseFloat(position.quantity);
    // Use the correct price for this position's crop
    const cropPrice = marketPrices[position.crop] || currentPrice;
    const pnl = position.type === 'long' 
      ? (cropPrice - entry) * qty
      : (entry - cropPrice) * qty;
    return pnl;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading trading data...</Text>
      </View>
    );
  }

  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed');

  return (
    <View style={styles.container}>
      {/* Header with Slide Menu */}
      <AppHeader />

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Enhanced P&L Summary */}
        {pnlSummary && (
          <View style={styles.pnlCard}>
            <View style={styles.pnlHeader}>
              <Text style={styles.pnlLabel}>Portfolio Summary</Text>
              <View style={styles.portfolioStatus}>
                <View style={[styles.statusDot, { backgroundColor: parseFloat(pnlSummary.totalPnl) >= 0 ? '#16a34a' : '#ef4444' }]} />
                <Text style={styles.statusText}>{parseFloat(pnlSummary.totalPnl) >= 0 ? 'Profitable' : 'Loss'}</Text>
              </View>
            </View>
            
            <Text style={[styles.pnlAmount, { color: parseFloat(pnlSummary.totalPnl) >= 0 ? '#16a34a' : '#ef4444' }]}>
              {parseFloat(pnlSummary.totalPnl) >= 0 ? '+' : ''}₹{parseFloat(pnlSummary.totalPnl).toLocaleString('en-IN')}
            </Text>
            
            <View style={styles.pnlStats}>
              <View style={styles.pnlStat}>
                <Text style={styles.pnlStatLabel}>Open Positions</Text>
                <Text style={styles.pnlStatValue}>{pnlSummary.openPositions}</Text>
              </View>
              <View style={styles.pnlStat}>
                <Text style={styles.pnlStatLabel}>Closed Trades</Text>
                <Text style={styles.pnlStatValue}>{pnlSummary.closedPositions}</Text>
              </View>
              <View style={styles.pnlStat}>
                <Text style={styles.pnlStatLabel}>Success Rate</Text>
                <Text style={[styles.pnlStatValue, { color: parseInt(pnlSummary.winRate) >= 60 ? '#16a34a' : '#ef4444' }]}>
                  {pnlSummary.winRate}%
                </Text>
              </View>
            </View>
            
            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{pnlSummary.winningTrades}</Text>
                <Text style={styles.quickStatLabel}>Wins</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{pnlSummary.losingTrades}</Text>
                <Text style={styles.quickStatLabel}>Losses</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>₹100K</Text>
                <Text style={styles.quickStatLabel}>Balance</Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Price */}
        <View style={styles.priceCard}>
          <View style={styles.priceCardHeader}>
            <Text style={styles.priceLabel}>Current {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} Price</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.priceValue}>₹{currentPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.priceSubtext}>Updates every 5 seconds</Text>
        </View>

        {/* Trade Form */}
        <View style={styles.tradeForm}>
          <Text style={styles.formTitle}>Open New Position</Text>
          
          {/* Crop Selector */}
          <Text style={styles.label}>Select Crop</Text>
          <View style={styles.cropSelector}>
            {['soybean', 'mustard', 'groundnut', 'sunflower'].map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.cropButton, selectedCrop === crop && styles.cropButtonActive]}
                onPress={() => {
                  setSelectedCrop(crop);
                  setCurrentPrice(marketPrices[crop] || currentPrice);
                }}
              >
                <Text style={[styles.cropButtonText, selectedCrop === crop && styles.cropButtonTextActive]}>
                  {crop.charAt(0).toUpperCase() + crop.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type Selector */}
          <Text style={styles.label}>Position Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, tradeType === 'long' && styles.typeButtonActive]}
              onPress={() => setTradeType('long')}
            >
              <Ionicons name="trending-up" size={20} color={tradeType === 'long' ? '#fff' : '#16a34a'} />
              <Text style={[styles.typeText, tradeType === 'long' && styles.typeTextActive]}>
                Long (Buy)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, tradeType === 'short' && styles.typeButtonActive]}
              onPress={() => setTradeType('short')}
            >
              <Ionicons name="trending-down" size={20} color={tradeType === 'short' ? '#fff' : '#ef4444'} />
              <Text style={[styles.typeText, tradeType === 'short' && styles.typeTextActive]}>
                Short (Sell)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Quantity (quintals)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
          
          {/* Position Value Calculator */}
          {quantity && currentPrice && (
            <View style={styles.calculatorCard}>
              <Text style={styles.calculatorTitle}>Position Details</Text>
              <View style={styles.calculatorRow}>
                <Text style={styles.calculatorLabel}>Total Value:</Text>
                <Text style={styles.calculatorValue}>₹{(parseFloat(quantity) * currentPrice).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.calculatorRow}>
                <Text style={styles.calculatorLabel}>Margin Required (10%):</Text>
                <Text style={styles.calculatorValue}>₹{(parseFloat(quantity) * currentPrice * 0.1).toLocaleString('en-IN')}</Text>
              </View>
              {stopLoss && (
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Max Loss:</Text>
                  <Text style={[styles.calculatorValue, {color: '#ef4444'}]}>
                    ₹{Math.abs((parseFloat(stopLoss) - currentPrice) * parseFloat(quantity)).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              {takeProfit && (
                <View style={styles.calculatorRow}>
                  <Text style={styles.calculatorLabel}>Max Profit:</Text>
                  <Text style={[styles.calculatorValue, {color: '#16a34a'}]}>
                    ₹{Math.abs((parseFloat(takeProfit) - currentPrice) * parseFloat(quantity)).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Advanced Options */}
          <View style={styles.advancedOptions}>
            <Text style={styles.label}>Advanced Options (Optional)</Text>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Stop Loss</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="₹"
                keyboardType="numeric"
                value={stopLoss}
                onChangeText={setStopLoss}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Take Profit</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="₹"
                keyboardType="numeric"
                value={takeProfit}
                onChangeText={setTakeProfit}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.tradeButton} onPress={openPosition}>
            <Text style={styles.tradeButtonText}>Open Position at ₹{currentPrice}</Text>
          </TouchableOpacity>
        </View>

        {/* Positions Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tab, !showHistory && styles.tabActive]}
            onPress={() => setShowHistory(false)}
          >
            <Text style={[styles.tabText, !showHistory && styles.tabTextActive]}>
              Open ({openPositions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, showHistory && styles.tabActive]}
            onPress={() => setShowHistory(true)}
          >
            <Text style={[styles.tabText, showHistory && styles.tabTextActive]}>
              History ({closedPositions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Open Positions */}
        {!showHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Positions</Text>
          {openPositions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No open positions</Text>
              <Text style={styles.emptySubtext}>Open a position to start trading</Text>
            </View>
          ) : (
            openPositions.map((position) => {
              const unrealizedPnL = calculateUnrealizedPnL(position);
              const pnlPercent = ((unrealizedPnL / (parseFloat(position.entryPrice) * parseFloat(position.quantity))) * 100).toFixed(2);
              
              return (
                <View key={position.id} style={styles.positionCard}>
                  <View style={styles.positionHeader}>
                    <View>
                      <Text style={styles.positionCrop}>{position.crop.toUpperCase()}</Text>
                      <Text style={styles.positionDate}>
                        Opened {new Date(position.openedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: position.type === 'long' ? '#dcfce7' : '#fee2e2' }]}>
                      <Text style={[styles.typeBadgeText, { color: position.type === 'long' ? '#16a34a' : '#ef4444' }]}>
                        {position.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.positionDetails}>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Quantity</Text>
                      <Text style={styles.positionValue}>{position.quantity} quintals</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Entry Price</Text>
                      <Text style={styles.positionValue}>₹{parseFloat(position.entryPrice).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Current Price</Text>
                      <Text style={styles.positionValue}>
                        ₹{(marketPrices[position.crop] || currentPrice).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Unrealized P&L</Text>
                      <Text style={[styles.positionValue, { color: unrealizedPnL >= 0 ? '#16a34a' : '#ef4444', fontWeight: '600' }]}>
                        {unrealizedPnL >= 0 ? '+' : ''}₹{Math.abs(Math.round(unrealizedPnL)).toLocaleString('en-IN')} ({pnlPercent}%)
                      </Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Position Value</Text>
                      <Text style={styles.positionValue}>₹{(parseFloat(position.quantity) * parseFloat(position.entryPrice)).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.positionRow}>
                      <Text style={styles.positionLabel}>Duration</Text>
                      <Text style={styles.positionValue}>{Math.floor((new Date() - new Date(position.openedAt)) / (1000 * 60 * 60 * 24))} days</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => closePosition(position)}
                  >
                    <Text style={styles.closeButtonText}>Close Position</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          </View>
        )}

        {/* Trading History */}
        {showHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trading History</Text>
            {closedPositions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No trading history</Text>
                <Text style={styles.emptySubtext}>Closed positions will appear here</Text>
              </View>
            ) : (
              closedPositions.map((position) => (
              <View key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View>
                    <Text style={styles.positionCrop}>{position.crop.toUpperCase()}</Text>
                    <Text style={styles.positionDate}>
                      Closed {new Date(position.closedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#6b7280' }]}>
                      {position.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.positionDetails}>
                  <View style={styles.positionRow}>
                    <Text style={styles.positionLabel}>Entry → Exit</Text>
                    <Text style={styles.positionValue}>
                      ₹{parseFloat(position.entryPrice).toFixed(0)} → ₹{parseFloat(position.exitPrice).toFixed(0)}
                    </Text>
                  </View>
                  <View style={styles.positionRow}>
                    <Text style={styles.positionLabel}>Realized P&L</Text>
                    <Text style={[styles.positionValue, { color: parseFloat(position.pnl) >= 0 ? '#16a34a' : '#ef4444', fontWeight: '600' }]}>
                      {parseFloat(position.pnl) >= 0 ? '+' : ''}₹{parseFloat(position.pnl).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastUpdatedText: { fontSize: 11, color: '#dcfce7' },
  
  tabSwitcher: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  tabActive: { backgroundColor: '#16a34a' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#dcfce7', marginTop: 4 },
  refreshButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  content: { flex: 1 },
  
  pnlCard: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  pnlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pnlLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  portfolioStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  pnlAmount: { fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  pnlStats: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  pnlStat: { flex: 1 },
  pnlStatLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  pnlStatValue: { fontSize: 18, fontWeight: '600', color: '#111827' },
  quickStats: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 8, padding: 12 },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 2 },
  quickStatLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase' },
  
  priceCard: { backgroundColor: '#f0fdf4', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  priceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  priceLabel: { fontSize: 13, color: '#166534' },
  priceValue: { fontSize: 28, fontWeight: 'bold', color: '#16a34a', marginBottom: 4 },
  priceSubtext: { fontSize: 12, color: '#166534' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 10, fontWeight: '600', color: '#16a34a' },
  
  tradeForm: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  cropSelector: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  cropButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cropButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  cropButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  cropButtonTextActive: { color: '#fff' },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  typeButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  typeText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  typeTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },
  tradeButton: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
  tradeButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#111827' },
  emptyState: { backgroundColor: '#fff', padding: 40, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  
  positionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  positionCrop: { fontSize: 16, fontWeight: '600', color: '#111827' },
  positionDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  positionDetails: { marginBottom: 12 },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  positionLabel: { fontSize: 13, color: '#6b7280' },
  positionValue: { fontSize: 13, fontWeight: '500', color: '#111827' },
  closeButton: { backgroundColor: '#ef4444', padding: 12, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  // Advanced Options
  advancedOptions: { marginTop: 8, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  optionLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  smallInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, padding: 8, fontSize: 13, width: 80, textAlign: 'center' },
  
  // Calculator
  calculatorCard: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#bae6fd' },
  calculatorTitle: { fontSize: 14, fontWeight: '600', color: '#0369a1', marginBottom: 8 },
  calculatorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  calculatorLabel: { fontSize: 12, color: '#0369a1' },
  calculatorValue: { fontSize: 12, fontWeight: '600', color: '#0c4a6e' },
});
