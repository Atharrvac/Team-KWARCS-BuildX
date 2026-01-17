import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MarketDetailCard({ data }) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [displayData, setDisplayData] = useState(data);

  useEffect(() => {
    // Animate on mount and data change
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setDisplayData(data);
  }, [data]);

  if (!displayData) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const isPositive = displayData.change >= 0;
  const changeColor = isPositive ? '#10b981' : '#ef4444';
  const changeBg = isPositive ? '#d1fae5' : '#fee2e2';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{displayData.name}</Text>
          <Text style={styles.subtitle}>{displayData.type} • {displayData.unit}</Text>
        </View>
        <View style={[styles.changeBadge, { backgroundColor: changeBg }]}>
          <Ionicons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={changeColor} 
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {isPositive ? '+' : ''}{displayData.change}%
          </Text>
        </View>
      </View>

      {/* Current Price */}
      <View style={styles.priceSection}>
        <Text style={styles.currentPrice}>₹{displayData.price}</Text>
        <Text style={styles.priceLabel}>Current Price</Text>
      </View>

      {/* OHLC Data Grid */}
      <View style={styles.ohlcGrid}>
        <View style={styles.ohlcCard}>
          <Text style={styles.ohlcLabel}>OPEN</Text>
          <Text style={styles.ohlcValue}>₹{displayData.open || displayData.price}</Text>
        </View>
        <View style={[styles.ohlcCard, styles.highCard]}>
          <Text style={[styles.ohlcLabel, styles.highLabel]}>HIGH</Text>
          <Text style={[styles.ohlcValue, styles.highValue]}>
            ₹{displayData.high || (displayData.price * 1.02).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.ohlcCard, styles.lowCard]}>
          <Text style={[styles.ohlcLabel, styles.lowLabel]}>LOW</Text>
          <Text style={[styles.ohlcValue, styles.lowValue]}>
            ₹{displayData.low || (displayData.price * 0.98).toFixed(2)}
          </Text>
        </View>
        <View style={styles.ohlcCard}>
          <Text style={styles.ohlcLabel}>CLOSE</Text>
          <Text style={styles.ohlcValue}>₹{displayData.close || displayData.price}</Text>
        </View>
      </View>

      {/* Additional Trading Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Previous Close</Text>
          <Text style={styles.infoValue}>
            ₹{displayData.prevClose || (displayData.price * 0.99).toFixed(2)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Day Range</Text>
          <Text style={styles.infoValue}>
            {displayData.dayRange || `${(displayData.price * 0.98).toFixed(2)} - ${(displayData.price * 1.02).toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Volume</Text>
          <Text style={styles.infoValue}>
            {displayData.volume?.toLocaleString() || '0'} quintals
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Avg Price</Text>
          <Text style={styles.infoValue}>
            ₹{displayData.avgPrice || displayData.price}
          </Text>
        </View>
      </View>

      {/* Market Indicators */}
      <View style={styles.indicatorsSection}>
        <Text style={styles.sectionTitle}>Market Indicators</Text>
        <View style={styles.indicatorRow}>
          <View style={styles.indicator}>
            <Ionicons name="pulse" size={16} color="#3b82f6" />
            <Text style={styles.indicatorText}>Live Updates</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="trending-up" size={16} color="#10b981" />
            <Text style={styles.indicatorText}>
              {isPositive ? 'Bullish' : 'Bearish'} Trend
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ohlcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ohlcCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  highCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  lowCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  ohlcLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highLabel: {
    color: '#059669',
  },
  lowLabel: {
    color: '#dc2626',
  },
  ohlcValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  highValue: {
    color: '#059669',
  },
  lowValue: {
    color: '#dc2626',
  },
  infoSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  indicatorsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 16,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorText: {
    fontSize: 13,
    color: '#4b5563',
  },
});
