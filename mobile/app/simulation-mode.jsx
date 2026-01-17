import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SimulationModeScreen() {
  const [selectedTab, setSelectedTab] = useState('Portfolio');
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [tradeType, setTradeType] = useState('long');
  const [quantity, setQuantity] = useState('');

  const simulationData = {
    virtualBalance: 500000,
    totalPnL: 25750,
    todayPnL: 3200,
    winRate: 72,
    portfolioValue: 525750,
    openPositions: 3,
    totalTrades: 18,
  };

  const marketData = {
    soybean: { price: 4820, change: 2.3 },
    mustard: { price: 6450, change: -0.8 },
    groundnut: { price: 5800, change: 1.5 },
  };

  const positions = [
    { id: 1, crop: 'soybean', type: 'long', quantity: 50, entryPrice: 4780, currentPrice: 4820 },
    { id: 2, crop: 'mustard', type: 'short', quantity: 30, entryPrice: 6500, currentPrice: 6450 },
    { id: 3, crop: 'groundnut', type: 'long', quantity: 25, entryPrice: 5750, currentPrice: 5800 },
  ];

  const tradeHistory = [
    { crop: 'soybean', type: 'long', quantity: 40, entryPrice: 4650, exitPrice: 4780, pnl: 5200 },
    { crop: 'mustard', type: 'short', quantity: 35, entryPrice: 6600, exitPrice: 6520, pnl: 2800 },
  ];

  const leaderboard = [
    { rank: 1, name: 'Rajesh K.', pnl: 85000, winRate: 82 },
    { rank: 2, name: 'Amit S.', pnl: 72000, winRate: 78 },
    { rank: 3, name: 'Priya M.', pnl: 65000, winRate: 75 },
    { rank: 156, name: 'You', pnl: 25750, winRate: 72, isYou: true },
  ];

  const formatCurrency = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  const calculatePnL = (pos) => {
    const diff = pos.type === 'long' ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
    return diff * pos.quantity;
  };

  const executeTrade = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Enter valid quantity');
      return;
    }
    Alert.alert('Trade Executed', `${tradeType.toUpperCase()} ${quantity} qt of ${selectedCrop} at ₹${marketData[selectedCrop]?.price}`);
    setQuantity('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trading Simulator</Text>
            <Text style={styles.headerSubtitle}>Practice with virtual money</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Portfolio</Text>
            <Text style={styles.summaryValue}>{formatCurrency(simulationData.portfolioValue)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>+{formatCurrency(simulationData.totalPnL)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Win Rate</Text>
            <Text style={styles.summaryValue}>{simulationData.winRate}%</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Portfolio', 'Trade', 'Positions', 'History', 'Leaderboard'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.tabActive]} onPress={() => setSelectedTab(tab)}>
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'Portfolio' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Performance</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}><Text style={styles.metricLabel}>Virtual Balance</Text><Text style={styles.metricValue}>{formatCurrency(simulationData.virtualBalance)}</Text></View>
                <View style={styles.metricItem}><Text style={styles.metricLabel}>Today's P&L</Text><Text style={[styles.metricValue, { color: '#16a34a' }]}>+{formatCurrency(simulationData.todayPnL)}</Text></View>
                <View style={styles.metricItem}><Text style={styles.metricLabel}>Open Positions</Text><Text style={styles.metricValue}>{simulationData.openPositions}</Text></View>
                <View style={styles.metricItem}><Text style={styles.metricLabel}>Total Trades</Text><Text style={styles.metricValue}>{simulationData.totalTrades}</Text></View>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Market Prices</Text>
              {Object.entries(marketData).map(([crop, data]) => (
                <View key={crop} style={styles.priceRow}>
                  <Text style={styles.cropName}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</Text>
                  <Text style={styles.price}>₹{data.price}</Text>
                  <Text style={[styles.change, { color: data.change >= 0 ? '#16a34a' : '#ef4444' }]}>{data.change >= 0 ? '+' : ''}{data.change}%</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'Trade' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>New Trade</Text>
            <Text style={styles.label}>Select Crop</Text>
            <View style={styles.selector}>
              {['soybean', 'mustard', 'groundnut'].map((crop) => (
                <TouchableOpacity key={crop} style={[styles.option, selectedCrop === crop && styles.optionActive]} onPress={() => setSelectedCrop(crop)}>
                  <Text style={[styles.optionText, selectedCrop === crop && { color: '#fff' }]}>{crop}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.currentPrice}>Current: ₹{marketData[selectedCrop]?.price}</Text>
            <Text style={[styles.label, { marginTop: 16 }]}>Trade Type</Text>
            <View style={styles.selector}>
              <TouchableOpacity style={[styles.option, tradeType === 'long' && styles.longActive]} onPress={() => setTradeType('long')}>
                <Text style={[styles.optionText, tradeType === 'long' && { color: '#fff' }]}>Long (Buy)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.option, tradeType === 'short' && styles.shortActive]} onPress={() => setTradeType('short')}>
                <Text style={[styles.optionText, tradeType === 'short' && { color: '#fff' }]}>Short (Sell)</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Quantity (Quintals)</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Enter quantity" keyboardType="numeric" />
            <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: tradeType === 'long' ? '#16a34a' : '#ef4444' }]} onPress={executeTrade}>
              <Text style={styles.tradeBtnText}>Execute {tradeType.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'Positions' && (
          <>
            <Text style={styles.sectionTitle}>Open Positions</Text>
            {positions.map((pos) => {
              const pnl = calculatePnL(pos);
              return (
                <View key={pos.id} style={styles.positionCard}>
                  <View style={styles.posHeader}>
                    <Text style={styles.posCrop}>{pos.crop.toUpperCase()}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: pos.type === 'long' ? '#dcfce7' : '#fee2e2' }]}>
                      <Text style={{ color: pos.type === 'long' ? '#16a34a' : '#ef4444', fontSize: 12, fontWeight: '600' }}>{pos.type.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.posRow}><Text style={styles.posLabel}>Qty</Text><Text style={styles.posValue}>{pos.quantity} qt</Text></View>
                  <View style={styles.posRow}><Text style={styles.posLabel}>Entry</Text><Text style={styles.posValue}>₹{pos.entryPrice}</Text></View>
                  <View style={styles.posRow}><Text style={styles.posLabel}>Current</Text><Text style={styles.posValue}>₹{pos.currentPrice}</Text></View>
                  <View style={styles.posRow}><Text style={styles.posLabel}>P&L</Text><Text style={[styles.posValue, { color: pnl >= 0 ? '#16a34a' : '#ef4444' }]}>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</Text></View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => Alert.alert('Position Closed', `P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`)}>
                    <Text style={styles.closeBtnText}>Close Position</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {selectedTab === 'History' && (
          <>
            <Text style={styles.sectionTitle}>Trade History</Text>
            {tradeHistory.map((trade, i) => (
              <View key={i} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCrop}>{trade.crop.toUpperCase()}</Text>
                  <Text style={[styles.historyPnl, { color: trade.pnl >= 0 ? '#16a34a' : '#ef4444' }]}>{trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}</Text>
                </View>
                <Text style={styles.historyDetails}>{trade.type.toUpperCase()} • {trade.quantity} qt • ₹{trade.entryPrice} → ₹{trade.exitPrice}</Text>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'Leaderboard' && (
          <>
            <Text style={styles.sectionTitle}>Top Traders</Text>
            {leaderboard.map((trader) => (
              <View key={trader.rank} style={[styles.leaderCard, trader.isYou && styles.youCard]}>
                <Text style={styles.rank}>#{trader.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.traderName}>{trader.name}</Text>
                  <Text style={styles.traderStats}>Win Rate: {trader.winRate}%</Text>
                </View>
                <Text style={[styles.traderPnl, { color: '#16a34a' }]}>+{formatCurrency(trader.pnl)}</Text>
              </View>
            ))}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#ddd6fe' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#ddd6fe' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  tabContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricItem: { width: (SCREEN_WIDTH - 64) / 2, alignItems: 'center' },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 18, fontWeight: '600', color: '#111' },
  priceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  cropName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111', textTransform: 'capitalize' },
  price: { fontSize: 15, fontWeight: '600', color: '#111', marginRight: 12 },
  change: { fontSize: 14, fontWeight: '600', width: 50, textAlign: 'right' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  selector: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  optionActive: { backgroundColor: '#7c3aed' },
  longActive: { backgroundColor: '#16a34a' },
  shortActive: { backgroundColor: '#ef4444' },
  optionText: { fontSize: 14, fontWeight: '500', color: '#6b7280', textTransform: 'capitalize' },
  currentPrice: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15 },
  tradeBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  tradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 },
  positionCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  posHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  posCrop: { fontSize: 16, fontWeight: '600', color: '#111' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  posLabel: { fontSize: 14, color: '#6b7280' },
  posValue: { fontSize: 14, fontWeight: '500', color: '#111' },
  closeBtn: { backgroundColor: '#f3f4f6', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  historyCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  historyCrop: { fontSize: 15, fontWeight: '600', color: '#111' },
  historyPnl: { fontSize: 15, fontWeight: '600' },
  historyDetails: { fontSize: 13, color: '#6b7280' },
  leaderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  youCard: { backgroundColor: '#f5f3ff', borderColor: '#7c3aed' },
  rank: { fontSize: 16, fontWeight: 'bold', color: '#7c3aed', width: 40 },
  traderName: { fontSize: 15, fontWeight: '600', color: '#111' },
  traderStats: { fontSize: 12, color: '#6b7280' },
  traderPnl: { fontSize: 15, fontWeight: '600' },
});
