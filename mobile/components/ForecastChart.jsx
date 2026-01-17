import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import websocketService from '../services/websocketService';

const screenWidth = Dimensions.get('window').width;

export default function ForecastChart({ crop, onClose }) {
  const [forecastData, setForecastData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(7); // 7, 14, 30 days
  const [showHistorical, setShowHistorical] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchForecastData();
    
    // Listen for real-time prediction updates
    websocketService.on('predictionUpdate', handlePredictionUpdate);
    
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => {
      websocketService.off('predictionUpdate', handlePredictionUpdate);
    };
  }, [crop, timeframe]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      
      // Fetch AI forecast from backend
      const forecastResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/ai/predict/${crop}?days=${timeframe}`
      );
      const forecast = await forecastResponse.json();
      
      // Fetch historical data
      const historyResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/market/history/${crop}?days=${timeframe}`
      );
      const history = await historyResponse.json();
      
      setForecastData(forecast);
      setHistoricalData(history);
      setAiInsights(forecast.insights);
      
      // Request real-time updates via WebSocket
      websocketService.requestPrediction(crop, timeframe);
      
    } catch (error) {
      console.error('Error fetching forecast:', error);
      // Fallback to mock data
      setForecastData(generateMockForecast());
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionUpdate = (data) => {
    if (data.crop === crop) {
      setForecastData(data.prediction);
      setAiInsights(data.prediction.insights);
    }
  };

  const generateMockForecast = () => {
    const basePrice = 4300;
    const predictions = [];
    let price = basePrice;
    
    for (let i = 1; i <= timeframe; i++) {
      price = price * (1 + (Math.random() - 0.45) * 0.02);
      predictions.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: Math.round(price),
        confidence: Math.max(0.6, 0.9 - i * 0.02),
        high: Math.round(price * 1.03),
        low: Math.round(price * 0.97),
      });
    }
    
    return {
      crop,
      currentPrice: basePrice,
      predictions,
      trend: 'upward',
      recommendation: 'Consider hedging 50% of your produce',
      insights: {
        sentiment: 'Bullish',
        volatility: 'Medium',
        factors: ['Favorable weather', 'Strong demand', 'Limited supply'],
      },
    };
  };

  const getChartData = () => {
    if (!forecastData) return null;
    
    const labels = forecastData.predictions.map(p => {
      const date = new Date(p.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    
    const prices = forecastData.predictions.map(p => p.price);
    const highs = forecastData.predictions.map(p => p.high || p.price * 1.03);
    const lows = forecastData.predictions.map(p => p.low || p.price * 0.97);
    
    return {
      labels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: highs,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity * 0.3})`,
          strokeWidth: 1,
          withDots: false,
        },
        {
          data: lows,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity * 0.3})`,
          strokeWidth: 1,
          withDots: false,
        },
      ],
    };
  };

  const getTrendIcon = () => {
    if (!forecastData) return 'trending-up';
    return forecastData.trend === 'upward' ? 'trending-up' : 
           forecastData.trend === 'downward' ? 'trending-down' : 'remove';
  };

  const getTrendColor = () => {
    if (!forecastData) return '#10b981';
    return forecastData.trend === 'upward' ? '#10b981' : 
           forecastData.trend === 'downward' ? '#ef4444' : '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Generating AI forecast...</Text>
      </View>
    );
  }

  const chartData = getChartData();

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Price Forecast</Text>
            <Text style={styles.subtitle}>{crop.toUpperCase()}</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {[7, 14, 30].map(days => (
            <TouchableOpacity
              key={days}
              style={[
                styles.timeframeButton,
                timeframe === days && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(days)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === days && styles.timeframeTextActive,
                ]}
              >
                {days}D
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Price & Trend */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Current Price</Text>
              <Text style={styles.priceValue}>₹{forecastData?.currentPrice || 0}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
              <Ionicons name={getTrendIcon()} size={20} color={getTrendColor()} />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {forecastData?.trend || 'Stable'}
              </Text>
            </View>
          </View>
          
          {forecastData?.predictions && (
            <View style={styles.forecastSummary}>
              <Text style={styles.forecastLabel}>Predicted ({timeframe}D)</Text>
              <Text style={styles.forecastValue}>
                ₹{forecastData.predictions[forecastData.predictions.length - 1].price}
              </Text>
              <Text style={styles.changeText}>
                {((forecastData.predictions[forecastData.predictions.length - 1].price - forecastData.currentPrice) / forecastData.currentPrice * 100).toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {/* Interactive Chart */}
        {chartData && (
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Price Forecast</Text>
              <TouchableOpacity
                onPress={() => setShowHistorical(!showHistorical)}
                style={styles.toggleButton}
              >
                <Ionicons 
                  name={showHistorical ? 'eye' : 'eye-off'} 
                  size={18} 
                  color="#6b7280" 
                />
                <Text style={styles.toggleText}>Historical</Text>
              </TouchableOpacity>
            </View>
            
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={260}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#f9fafb',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#22c55e',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#e5e7eb',
                  strokeWidth: 1,
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines
              withVerticalLines
              withHorizontalLines
            />
            
            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>Forecast</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>High Range</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>Low Range</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Insights */}
        {aiInsights && (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <Text style={styles.insightsTitle}>AI Insights</Text>
            </View>
            
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Market Sentiment:</Text>
              <Text style={[
                styles.insightValue,
                { color: aiInsights.sentiment === 'Bullish' ? '#10b981' : '#ef4444' }
              ]}>
                {aiInsights.sentiment}
              </Text>
            </View>
            
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Volatility:</Text>
              <Text style={styles.insightValue}>{aiInsights.volatility}</Text>
            </View>
            
            {aiInsights.factors && (
              <View style={styles.factorsContainer}>
                <Text style={styles.factorsTitle}>Key Factors:</Text>
                {aiInsights.factors.map((factor, index) => (
                  <View key={index} style={styles.factorItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.factorText}>{factor}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recommendation */}
        {forecastData?.recommendation && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#8b5cf6" />
              <Text style={styles.recommendationTitle}>Recommendation</Text>
            </View>
            <Text style={styles.recommendationText}>
              {forecastData.recommendation}
            </Text>
          </View>
        )}

        {/* Confidence Levels */}
        {forecastData?.predictions && (
          <View style={styles.confidenceCard}>
            <Text style={styles.confidenceTitle}>Forecast Confidence</Text>
            {forecastData.predictions.slice(0, 5).map((pred, index) => (
              <View key={index} style={styles.confidenceRow}>
                <Text style={styles.confidenceDate}>
                  Day {index + 1}
                </Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill,
                      { 
                        width: `${pred.confidence * 100}%`,
                        backgroundColor: pred.confidence > 0.8 ? '#10b981' : 
                                       pred.confidence > 0.6 ? '#f59e0b' : '#ef4444'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceValue}>
                  {(pred.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  forecastSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  forecastLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  forecastValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontSize: 12,
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  factorsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  factorText: {
    fontSize: 14,
    color: '#4b5563',
  },
  recommendationCard: {
    backgroundColor: '#8b5cf620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  recommendationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  confidenceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  confidenceDate: {
    fontSize: 12,
    color: '#6b7280',
    width: 50,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    width: 40,
    textAlign: 'right',
  },
});
