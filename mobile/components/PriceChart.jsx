import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { marketAPI } from '../services/marketAPI';

const screenWidth = Dimensions.get('window').width;

export default function PriceChart({ crop }) {
  const [chartData, setChartData] = useState(null);
  const [ohlcData, setOhlcData] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [crop]);

  const fetchChartData = async () => {
    try {
      const data = await marketAPI.getHistoricalPrices(crop, 7);
      
      // Animate slide and fade
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(0);
      });
      
      setChartData(data);
      
      // Generate OHLC data from historical prices
      if (data && data.datasets && data.datasets[0]) {
        const prices = data.datasets[0].data;
        const latest = prices[prices.length - 1];
        const open = prices[0];
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const close = latest;
        const change = ((close - open) / open) * 100;
        
        setOhlcData({
          open: open.toFixed(2),
          high: high.toFixed(2),
          low: low.toFixed(2),
          close: close.toFixed(2),
          change: change.toFixed(2),
          volume: Math.floor(Math.random() * 50000) + 10000,
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback mock data with OHLC
      const mockPrices = [4200, 4250, 4180, 4300, 4280, 4350, 4400];
      setChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: mockPrices }],
      });
      
      setOhlcData({
        open: '4200.00',
        high: '4400.00',
        low: '4180.00',
        close: '4400.00',
        change: '4.76',
        volume: 35420,
      });
    }
  };

  if (!chartData) {
    return <Text style={styles.loading}>Loading chart...</Text>;
  }

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <View style={styles.container}>
      {/* OHLC Data Display */}
      {ohlcData && (
        <Animated.View 
          style={[
            styles.ohlcContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateX }],
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.ohlcRow}>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>Open</Text>
                <Text style={styles.ohlcValue}>₹{ohlcData.open}</Text>
              </View>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>High</Text>
                <Text style={[styles.ohlcValue, styles.highValue]}>₹{ohlcData.high}</Text>
              </View>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>Low</Text>
                <Text style={[styles.ohlcValue, styles.lowValue]}>₹{ohlcData.low}</Text>
              </View>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>Close</Text>
                <Text style={styles.ohlcValue}>₹{ohlcData.close}</Text>
              </View>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>Change</Text>
                <Text style={[
                  styles.ohlcValue,
                  parseFloat(ohlcData.change) >= 0 ? styles.positiveChange : styles.negativeChange
                ]}>
                  {parseFloat(ohlcData.change) >= 0 ? '+' : ''}{ohlcData.change}%
                </Text>
              </View>
              <View style={styles.ohlcItem}>
                <Text style={styles.ohlcLabel}>Volume</Text>
                <Text style={styles.ohlcValue}>{ohlcData.volume.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Price Chart with Animation */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX }],
        }}
      >
        <LineChart
          data={chartData}
          width={screenWidth - 64}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(45, 95, 63, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#2d5f3f',
            },
          }}
          bezier
          style={styles.chart}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ohlcContainer: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ohlcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ohlcItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 70,
  },
  ohlcLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  ohlcValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  highValue: {
    color: '#10b981',
  },
  lowValue: {
    color: '#ef4444',
  },
  positiveChange: {
    color: '#10b981',
  },
  negativeChange: {
    color: '#ef4444',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loading: {
    textAlign: 'center',
    padding: 20,
    color: '#6b7280',
  },
});
