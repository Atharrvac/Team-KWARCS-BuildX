import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AIPredictionScreen() {
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [prediction, setPrediction] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadPredictions();
  }, [selectedCrop, days]);

  const loadPredictions = async () => {
    try {
      const [predResponse, sentResponse] = await Promise.all([
        axios.post(`${API_URL}/ai/predict`, { crop: selectedCrop, days }),
        axios.get(`${API_URL}/ai/sentiment/${selectedCrop}`),
      ]);
      
      setPrediction(predResponse.data);
      setSentiment(sentResponse.data);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPredictions();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Generating AI predictions...</Text>
      </View>
    );
  }

  const chartData = prediction ? {
    labels: prediction.predictions.slice(0, 7).map((_, i) => `Day ${i + 1}`),
    datasets: [{
      data: [prediction.currentPrice, ...prediction.predictions.slice(0, 6).map(p => p.price)],
    }],
  } : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AI Price Insights</Text>
            <Text style={styles.headerSubtitle}>ML-powered predictions</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Crop Selector */}
        <View style={styles.cropSelector}>
          {['soybean', 'mustard', 'groundnut', 'sunflower'].map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[styles.cropButton, selectedCrop === crop && styles.cropButtonActive]}
              onPress={() => setSelectedCrop(crop)}
            >
              <Text style={[styles.cropButtonText, selectedCrop === crop && styles.cropButtonTextActive]}>
                {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Price */}
        {prediction && (
          <View style={styles.currentPriceCard}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <Text style={styles.currentPriceValue}>₹{prediction.currentPrice.toLocaleString('en-IN')}</Text>
            <View style={[styles.trendBadge, { backgroundColor: prediction.trend === 'upward' ? '#dcfce7' : '#fee2e2' }]}>
              <Ionicons 
                name={prediction.trend === 'upward' ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={prediction.trend === 'upward' ? '#16a34a' : '#ef4444'} 
              />
              <Text style={[styles.trendText, { color: prediction.trend === 'upward' ? '#16a34a' : '#ef4444' }]}>
                {prediction.trend === 'upward' ? 'Upward' : 'Downward'} Trend
              </Text>
            </View>
          </View>
        )}

        {/* Price Chart */}
        {chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Price Forecast ({days} Days)</Text>
            <LineChart
              data={chartData}
              width={SCREEN_WIDTH - 64}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#16a34a',
                },
              }}
              bezier
              style={styles.chart}
            />
            
            {/* Days Selector */}
            <View style={styles.daysSelector}>
              {[7, 14, 30].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayButton, days === d && styles.dayButtonActive]}
                  onPress={() => setDays(d)}
                >
                  <Text style={[styles.dayButtonText, days === d && styles.dayButtonTextActive]}>
                    {d}D
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI Recommendation */}
        {prediction && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="sparkles" size={24} color="#16a34a" />
              <Text style={styles.recommendationTitle}>AI Recommendation</Text>
            </View>
            <Text style={styles.recommendationText}>{prediction.recommendation}</Text>
          </View>
        )}

        {/* Market Sentiment */}
        {sentiment && (
          <View style={styles.sentimentCard}>
            <Text style={styles.sentimentTitle}>Market Sentiment</Text>
            <View style={styles.sentimentRow}>
              <View style={[styles.sentimentBadge, { 
                backgroundColor: sentiment.sentiment === 'bullish' ? '#dcfce7' : 
                                sentiment.sentiment === 'bearish' ? '#fee2e2' : '#f3f4f6' 
              }]}>
                <Text style={[styles.sentimentBadgeText, { 
                  color: sentiment.sentiment === 'bullish' ? '#16a34a' : 
                        sentiment.sentiment === 'bearish' ? '#ef4444' : '#6b7280' 
                }]}>
                  {sentiment.sentiment.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.sentimentScore}>
                Score: {(parseFloat(sentiment.score) * 100).toFixed(0)}%
              </Text>
            </View>
            
            <Text style={styles.factorsTitle}>Key Factors:</Text>
            {sentiment.factors.map((factor, index) => (
              <View key={index} style={styles.factorRow}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Predictions Table */}
        {prediction && (
          <View style={styles.predictionsCard}>
            <Text style={styles.predictionsTitle}>Daily Predictions</Text>
            {prediction.predictions.map((pred, index) => (
              <View key={index} style={styles.predictionRow}>
                <View style={styles.predictionDate}>
                  <Text style={styles.predictionDayText}>Day {index + 1}</Text>
                  <Text style={styles.predictionDateText}>
                    {new Date(pred.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.predictionPrice}>
                  <Text style={styles.predictionPriceText}>₹{pred.price.toLocaleString('en-IN')}</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceBarFill, { width: `${pred.confidence * 100}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>{(pred.confidence * 100).toFixed(0)}% confidence</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.disclaimerText}>
            AI predictions are based on historical data and market trends. Actual prices may vary. 
            Use as guidance only, not financial advice.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#dcfce7', marginTop: 4 },
  refreshButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  content: { flex: 1 },
  
  cropSelector: { flexDirection: 'row', padding: 16, gap: 8 },
  cropButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center' },
  cropButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  cropButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  cropButtonTextActive: { color: '#fff' },
  
  currentPriceCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  currentPriceLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  currentPriceValue: { fontSize: 36, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  trendText: { fontSize: 14, fontWeight: '600' },
  
  chartCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  chart: { marginVertical: 8, borderRadius: 16 },
  daysSelector: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dayButton: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  dayButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  dayButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  dayButtonTextActive: { color: '#fff' },
  
  recommendationCard: { backgroundColor: '#f0fdf4', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  recommendationTitle: { fontSize: 16, fontWeight: '600', color: '#166534' },
  recommendationText: { fontSize: 14, color: '#166534', lineHeight: 20 },
  
  sentimentCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  sentimentTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  sentimentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sentimentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sentimentBadgeText: { fontSize: 14, fontWeight: '600' },
  sentimentScore: { fontSize: 14, color: '#6b7280' },
  factorsTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  factorText: { fontSize: 13, color: '#6b7280' },
  
  predictionsCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  predictionsTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  predictionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  predictionDate: {},
  predictionDayText: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  predictionDateText: { fontSize: 12, color: '#6b7280' },
  predictionPrice: { alignItems: 'flex-end' },
  predictionPriceText: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  confidenceBar: { width: 80, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  confidenceBarFill: { height: '100%', backgroundColor: '#16a34a' },
  confidenceText: { fontSize: 11, color: '#6b7280' },
  
  disclaimerCard: { flexDirection: 'row', backgroundColor: '#f9fafb', marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 8, gap: 8 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 16 },
});
