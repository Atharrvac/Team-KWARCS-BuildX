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

export default function HedgingScreen() {
  const [selectedTab, setSelectedTab] = useState('Dashboard');
  const [calculatorData, setCalculatorData] = useState({ crop: 'soybean', quantity: '', riskTolerance: 'medium' });

  const hedgingDashboard = {
    totalHedgeValue: 280000,
    totalUnrealizedPnL: 12500,
    hedgePositions: 3,
    riskMetrics: { portfolioVolatility: 18.5, hedgeEffectiveness: 78.3, marginUtilization: 45.2 }
  };

  const recommendations = [
    { crop: 'soybean', recommendation: 'hedge_profits', confidence: 80, reason: 'High volatility - consider locking in gains', currentPrice: 4820, unrealizedPnL: 8500, pnlPercentage: 12.5 },
    { crop: 'mustard', recommendation: 'sell_futures', confidence: 72, reason: 'Price expected to decline', currentPrice: 6450, unrealizedPnL: -2100, pnlPercentage: -3.2 }
  ];

  const effectiveness = [
    { crop: 'soybean', quantity: 50, entryPrice: 4650, hedgePnL: 8500, hedgeEfficiency: 0.82, status: 'effective' },
    { crop: 'mustard', quantity: 30, entryPrice: 6500, hedgePnL: 1500, hedgeEfficiency: 0.65, status: 'moderate' }
  ];

  const formatCurrency = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Hedging</Text>
            <Text style={styles.headerSubtitle}>Risk management</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Dashboard', 'Calculator', 'Recommendations'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, selectedTab === tab && styles.tabActive]} onPress={() => setSelectedTab(tab)}>
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'Dashboard' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Portfolio Overview</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Total Hedged</Text>
                  <Text style={styles.value}>{formatCurrency(hedgingDashboard.totalHedgeValue)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Unrealized P&L</Text>
                  <Text style={[styles.value, { color: '#16a34a' }]}>+{formatCurrency(hedgingDashboard.totalUnrealizedPnL)}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Active Hedges</Text>
                  <Text style={styles.value}>{hedgingDashboard.hedgePositions}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.label}>Effectiveness</Text>
                  <Text style={[styles.value, { color: '#16a34a' }]}>{hedgingDashboard.riskMetrics.hedgeEffectiveness}%</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Active Positions</Text>
            {effectiveness.map((pos, i) => (
              <View key={i} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionCrop}>{pos.crop.toUpperCase()}</Text>
                  <View style={[styles.badge, { backgroundColor: pos.status === 'effective' ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={{ color: pos.status === 'effective' ? '#16a34a' : '#f59e0b', fontSize: 12, fontWeight: '600' }}>{pos.status}</Text>
                  </View>
                </View>
                <View style={styles.positionRow}><Text style={styles.posLabel}>Quantity</Text><Text style={styles.posValue}>{pos.quantity} qt</Text></View>
                <View style={styles.positionRow}><Text style={styles.posLabel}>Entry</Text><Text style={styles.posValue}>₹{pos.entryPrice}</Text></View>
                <View style={styles.positionRow}><Text style={styles.posLabel}>P&L</Text><Text style={[styles.posValue, { color: pos.hedgePnL >= 0 ? '#16a34a' : '#ef4444' }]}>{pos.hedgePnL >= 0 ? '+' : ''}{formatCurrency(pos.hedgePnL)}</Text></View>
              </View>
            ))}
          </>
        )}

        {selectedTab === 'Calculator' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hedge Calculator</Text>
            <Text style={styles.label}>Select Crop</Text>
            <View style={styles.cropSelector}>
              {['soybean', 'mustard', 'groundnut'].map((crop) => (
                <TouchableOpacity key={crop} style={[styles.cropOption, calculatorData.crop === crop && styles.cropOptionActive]} onPress={() => setCalculatorData({ ...calculatorData, crop })}>
                  <Text style={[styles.cropText, calculatorData.crop === crop && { color: '#fff' }]}>{crop}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Quantity (Quintals)</Text>
            <TextInput style={styles.input} value={calculatorData.quantity} onChangeText={(t) => setCalculatorData({ ...calculatorData, quantity: t })} placeholder="Enter quantity" keyboardType="numeric" />
            <Text style={[styles.label, { marginTop: 16 }]}>Risk Tolerance</Text>
            <View style={styles.cropSelector}>
              {['low', 'medium', 'high'].map((r) => (
                <TouchableOpacity key={r} style={[styles.cropOption, calculatorData.riskTolerance === r && styles.cropOptionActive]} onPress={() => setCalculatorData({ ...calculatorData, riskTolerance: r })}>
                  <Text style={[styles.cropText, calculatorData.riskTolerance === r && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.calcBtn} onPress={() => Alert.alert('Hedge Calculated', `Recommended: Hedge 70% of ${calculatorData.quantity || 0} qt ${calculatorData.crop} with ${calculatorData.riskTolerance} risk`)}>
              <Text style={styles.calcBtnText}>Calculate Optimal Hedge</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'Recommendations' && (
          <>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {recommendations.map((rec, i) => (
              <View key={i} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <Ionicons name={rec.recommendation === 'hedge_profits' ? 'shield-checkmark' : 'trending-down'} size={24} color={rec.recommendation === 'hedge_profits' ? '#16a34a' : '#3b82f6'} />
                  <Text style={styles.recCrop}>{rec.crop.toUpperCase()}</Text>
                  <Text style={styles.confidence}>{rec.confidence}%</Text>
                </View>
                <Text style={styles.recReason}>{rec.reason}</Text>
                <View style={styles.recMetrics}>
                  <View><Text style={styles.metricLabel}>Price</Text><Text style={styles.metricValue}>₹{rec.currentPrice}</Text></View>
                  <View><Text style={styles.metricLabel}>P&L</Text><Text style={[styles.metricValue, { color: rec.unrealizedPnL >= 0 ? '#16a34a' : '#ef4444' }]}>{rec.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(rec.unrealizedPnL)}</Text></View>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>{rec.recommendation === 'hedge_profits' ? 'Lock Profits' : 'Sell Futures'}</Text>
                </TouchableOpacity>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#dbeafe' },
  tabContainer: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: (SCREEN_WIDTH - 64) / 2, alignItems: 'center' },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 12 },
  positionCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  positionCrop: { fontSize: 16, fontWeight: '600', color: '#111' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  posLabel: { fontSize: 14, color: '#6b7280' },
  posValue: { fontSize: 14, fontWeight: '500', color: '#111' },
  cropSelector: { flexDirection: 'row', gap: 8 },
  cropOption: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cropOptionActive: { backgroundColor: '#3b82f6' },
  cropText: { fontSize: 14, fontWeight: '500', color: '#6b7280', textTransform: 'capitalize' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, marginTop: 8 },
  calcBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  recCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  recCrop: { fontSize: 16, fontWeight: '600', color: '#111', flex: 1 },
  confidence: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  recReason: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  recMetrics: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  metricLabel: { fontSize: 12, color: '#9ca3af' },
  metricValue: { fontSize: 16, fontWeight: '600', color: '#111' },
  actionBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
