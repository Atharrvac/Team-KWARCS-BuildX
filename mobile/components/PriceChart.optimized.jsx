import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { marketAPI } from '../services/marketAPI';

const screenWidth = Dimensions.get('window').width;

// Memoized OHLC Item Component
const OHLCItem = memo(({ label, value, style }) => (
  <View style={styles.ohlcItem}>
    <Text style={styles.ohlcLabel}>{label}</Text>
    <Text style={[styles.ohlcValue, style]}>{value}</Text>
  </View>
));

function PriceChart({ crop }) {
  const [chartData, setChartData] = useState(null);
  const [ohlcData, setOhlcData] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  // Memoize chart config to prevent recreation
  const chartConfig = useMemo(() => ({
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
  }), []);

  // Memoize animation
  const animateChart = useCallback(() => {
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
  }, [slideAnim, fadeAnim]);

  // Optimized data fetching with error handling
  const fetchChartData = useCallback(async () => {
    try {
      const data = await marketAPI.getHistoricalPrices(crop, 7);
      
      animateChart();
      setChartData(data);
      
      // Calculate OHLC only if data exists
      if (data?.datasets?.[0]?.data) {
        const prices = data.datasets[0].data;
        const latest = prices[prices.length - 1];
        const open = prices[0];
        const high = Math.max(...prices);
        const low = Math.min(...prices);
        const change = ((latest - open) / open) * 100;
        
        setOhlcData({
          open: open.toFixed(2),
          high: high.toFixed(2),
          low: low.toFixed(2),
          close: latest.toFixed(2),
          change: change.toFixed(2),
          volume: Math.floor(Math.random() * 50000) + 10000,
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Set fallback data only on error
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
  }, [crop, animateChart]);

  useEffect(() => {
    fetchChartData();
    // Reduced update frequency from 5s to 10s to save resources
    intervalRef.current = setInterval(fetchChartData, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchChartData]);

  // Memoize transform interpolation
  const translateX = useMemo(() => 
    slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    }), [slideAnim]
  );

  if (!chartData) {
    return <Text style={styles.loading}>Loading chart...</Text>;
  }

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
              <OHLCItem label="Open" value={`₹${ohlcData.open}`} />
              <OHLCItem label="High" value={`₹${ohlcData.high}`} style={styles.highValue} />
              <OHLCItem label="Low" value={`₹${ohlcData.low}`} style={styles.lowValue} />
              <OHLCItem label="Close" value={`₹${ohlcData.close}`} />
              <OHLCItem 
                label="Change" 
                value={`${parseFloat(ohlcData.change) >= 0 ? '+' : ''}${ohlcData.change}%`}
                style={parseFloat(ohlcData.change) >= 0 ? styles.positiveChange : styles.negativeChange}
              />
              <OHLCItem label="Volume" value={ohlcData.volume.toLocaleString()} />
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
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Animated.View>
    </View>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(PriceChart, (prevProps, nextProps) => {
  return prevProps.crop === nextProps.crop;
});

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
