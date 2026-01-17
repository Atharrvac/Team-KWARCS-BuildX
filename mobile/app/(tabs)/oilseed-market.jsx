import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TradingViewChart from '../../components/TradingViewChart';
import OilseedSelector from '../../components/OilseedSelector';

export default function OilseedMarket() {
  const [selectedOilseed, setSelectedOilseed] = useState('soybean');
  const [timeframe, setTimeframe] = useState('D');

  const timeframes = [
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
    { label: '1M', value: 'M' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Oilseed Markets</Text>
        <Text style={styles.subtitle}>Live TradingView Charts</Text>
      </View>

      {/* Oilseed Selector */}
      <OilseedSelector 
        selected={selectedOilseed}
        onSelect={setSelectedOilseed}
      />

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.value}
            style={[
              styles.timeframeButton,
              timeframe === tf.value && styles.timeframeButtonActive
            ]}
            onPress={() => setTimeframe(tf.value)}
          >
            <Text style={[
              styles.timeframeText,
              timeframe === tf.value && styles.timeframeTextActive
            ]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TradingView Chart */}
      <View style={styles.chartContainer}>
        <TradingViewChart 
          symbol={selectedOilseed}
          interval={timeframe}
          height={450}
        />
      </View>

      {/* Market Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color="#2d5f3f" />
          <Text style={styles.infoTitle}>About {selectedOilseed.charAt(0).toUpperCase() + selectedOilseed.slice(1)}</Text>
        </View>
        <Text style={styles.infoText}>
          Real-time market data powered by TradingView. Charts include technical indicators, 
          volume analysis, and historical price movements.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Chart Features</Text>
        <View style={styles.feature}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.featureText}>Moving Averages & RSI</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="bar-chart" size={16} color="#3b82f6" />
          <Text style={styles.featureText}>Volume Analysis</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="time" size={16} color="#f59e0b" />
          <Text style={styles.featureText}>Multiple Timeframes</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="expand" size={16} color="#8b5cf6" />
          <Text style={styles.featureText}>Full-screen Mode</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#2d5f3f',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#d1fae5',
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeframeButtonActive: {
    backgroundColor: '#2d5f3f',
    borderColor: '#2d5f3f',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4b5563',
  },
});
