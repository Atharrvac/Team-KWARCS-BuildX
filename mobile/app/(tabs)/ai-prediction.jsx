import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import AppHeader from '../../components/AppHeader';
import { getMockForecast } from '../../services/forecastService';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock historical data
const generateHistoricalData = (basePrice) => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      price: basePrice + (Math.random() - 0.5) * 200,
    });
  }
  return data;
};

const COMMODITIES = [
  { id: 'soybean', name: 'Soybean', icon: '🌱', basePrice: 4300 },
  { id: 'mustard', name: 'Mustard', icon: '🌾', basePrice: 5850 },
  { id: 'groundnut', name: 'Groundnut', icon: '🥜', basePrice: 6520 },
  { id: 'castor', name: 'Castor', icon: '🌿', basePrice: 6788 },
  { id: 'sunflower', name: 'Sunflower', icon: '🌻', basePrice: 6200 },
];

export default function ForecastScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState('soybean');
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(4300);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    const interval = setInterval(updatePrices, 5000);
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    
    return () => clearInterval(interval);
  }, [selectedCommodity, selectedPeriod]);

  const loadData = () => {
    const commodity = COMMODITIES.find(c => c.id === selectedCommodity);
    const basePrice = commodity?.basePrice || 5000;
    
    // Generate historical data
    setHistoricalData(generateHistoricalData(basePrice));
    
    // Generate forecast data
    const forecast = getMockForecast(selectedCommodity, selectedPeriod);
    setForecastData(forecast.data || []);
    setCurrentPrice(basePrice + (Math.random() - 0.5) * 50);
  };

  const updatePrices = () => {
    const commodity = COMMODITIES.find(c => c.id === selectedCommodity);
    const basePrice = commodity?.basePrice || 5000;
    setCurrentPrice(basePrice + (Math.random() - 0.5) * 100);
    
    // Update forecast with slight variations
    setForecastData(prev => prev.map(item => ({
      ...item,
      price: item.price + (Math.random() - 0.5) * 20,
    })));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const getHistoricalChartData = () => ({
    labels: historicalData.map(d => d.date),
    datasets: [{ data: historicalData.map(d => Math.round(d.price)) }],
  });

  const getForecastChartData = () => {
    if (forecastData.length === 0) return null;
    return {
      labels: ['Now', ...forecastData.slice(0, 6).map((_, i) => `Day ${i + 1}`)],
      datasets: [{ data: [currentPrice, ...forecastData.slice(0, 6).map(d => Math.round(d.price))] }],
    };
  };

  const trend = forecastData.length > 0 && forecastData[forecastData.length - 1]?.price > currentPrice ? 'upward' : 'downward';
  const trendColor = trend === 'upward' ? '#16a34a' : '#ef4444';
  const priceChange = forecastData.length > 0 ? ((forecastData[forecastData.length - 1]?.price - currentPrice) / currentPrice * 100).toFixed(1) : 0;

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {/* Live Badge */}
        <View style={styles.liveRow}>
          <Animated.View style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </Animated.View>
          <Text style={styles.updateText}>Auto-updating every 5s</Text>
        </View>

        {/* Commodity Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commodityScroll}>
          {COMMODITIES.map(c => (
            <TouchableOpacity key={c.id} style={[styles.commodityBtn, selectedCommodity === c.id && styles.commodityBtnActive]} onPress={() => setSelectedCommodity(c.id)}>
              <Text style={styles.commodityIcon}>{c.icon}</Text>
              <Text style={[styles.commodityName, selectedCommodity === c.id && styles.commodityNameActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {[7, 14, 30].map(days => (
            <TouchableOpacity key={days} style={[styles.periodBtn, selectedPeriod === days && styles.periodBtnActive]} onPress={() => setSelectedPeriod(days)}>
              <Text style={[styles.periodText, selectedPeriod === days && styles.periodTextActive]}>{days}-Day</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.priceLabel}>Current Price</Text>
              <Text style={styles.priceValue}>₹{Math.round(currentPrice)}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
              <Ionicons name={trend === 'upward' ? 'trending-up' : 'trending-down'} size={20} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>{priceChange}%</Text>
            </View>
          </View>
          <View style={styles.insightsRow}>
            <View style={styles.insightItem}><Ionicons name="analytics" size={14} color="#6b7280" /><Text style={styles.insightText}>{trend === 'upward' ? 'Bullish' : 'Bearish'}</Text></View>
            <View style={styles.insightItem}><Ionicons name="shield-checkmark" size={14} color="#6b7280" /><Text style={styles.insightText}>Medium Risk</Text></View>
          </View>
        </View>

        {/* Historical Chart */}
        {historicalData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📊 Historical Prices (7 Days)</Text>
            <LineChart
              data={getHistoricalChartData()}
              width={SCREEN_WIDTH - 48}
              height={200}
              yAxisLabel="₹"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: () => '#6b7280',
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#3b82f6' },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Forecast Chart */}
        {getForecastChartData() && (
          <View style={styles.chartCard}>
            <View style={styles.forecastHeader}>
              <Text style={styles.chartTitle}>🔮 AI Price Forecast</Text>
              <View style={styles.aiBadge}><Ionicons name="hardware-chip" size={14} color="#8b5cf6" /><Text style={styles.aiText}>ML Model</Text></View>
            </View>
            <LineChart
              data={getForecastChartData()}
              width={SCREEN_WIDTH - 48}
              height={220}
              yAxisLabel="₹"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#faf5ff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                labelColor: () => '#6b7280',
                propsForDots: { r: '5', strokeWidth: '2', stroke: '#f97316' },
              }}
              bezier
              style={styles.chart}
            />
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={styles.legendText}>Current</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f97316' }]} /><Text style={styles.legendText}>Forecast</Text></View>
            </View>
          </View>
        )}

        {/* Recommendation Card */}
        <View style={styles.recCard}>
          <Ionicons name="bulb" size={24} color="#f59e0b" />
          <View style={styles.recContent}>
            <Text style={styles.recTitle}>AI Recommendation</Text>
            <Text style={styles.recText}>
              {trend === 'upward' 
                ? 'Prices expected to rise. Consider holding or buying futures to lock in current prices.'
                : 'Prices may decline. Consider selling or forward contracts to secure current prices.'}
            </Text>
          </View>
        </View>

        {/* Forecast Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Detailed Forecast</Text>
          {forecastData.slice(0, 7).map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableDate}>{item.date || `Day ${i + 1}`}</Text>
              <Text style={styles.tablePrice}>₹{Math.round(item.price)}</Text>
              <Text style={[styles.tableChange, { color: item.price > currentPrice ? '#16a34a' : '#ef4444' }]}>
                {item.price > currentPrice ? '+' : ''}{((item.price - currentPrice) / currentPrice * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flex: 1 },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  updateText: { fontSize: 12, color: '#9ca3af' },
  commodityScroll: { paddingHorizontal: 16, marginBottom: 12 },
  commodityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  commodityBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  commodityIcon: { fontSize: 18 },
  commodityName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  commodityNameActive: { color: '#fff' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#16a34a' },
  periodText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  periodTextActive: { color: '#fff' },
  priceCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 12, color: '#6b7280' },
  priceValue: { fontSize: 28, fontWeight: '700', color: '#111' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  trendText: { fontSize: 14, fontWeight: '700' },
  insightsRow: { flexDirection: 'row', gap: 16 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightText: { fontSize: 12, color: '#6b7280' },
  chartCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  forecastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  aiText: { fontSize: 11, fontWeight: '600', color: '#8b5cf6' },
  chart: { borderRadius: 12 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },
  recCard: { flexDirection: 'row', backgroundColor: '#fffbeb', marginHorizontal: 16, padding: 16, borderRadius: 16, marginBottom: 16, gap: 12, borderWidth: 1, borderColor: '#fde68a' },
  recContent: { flex: 1 },
  recTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  recText: { fontSize: 13, color: '#78350f', lineHeight: 18 },
  tableCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  tableTitle: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableDate: { flex: 1, fontSize: 14, color: '#6b7280' },
  tablePrice: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111', textAlign: 'center' },
  tableChange: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
});
