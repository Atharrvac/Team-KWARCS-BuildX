import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { VictoryChart, VictoryCandlestick, VictoryAxis, VictoryTooltip, VictoryVoronoiContainer, VictoryLine } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function VictoryCandlestickChart({ 
  data, 
  title = 'Price Analysis',
  showVolume = true,
  onCandlePress 
}) {
  const [selectedCandle, setSelectedCandle] = useState(null);
  const [showMA, setShowMA] = useState(true); // Moving Average

  // Format OHLC data for Victory Candlestick
  const formatCandlestickData = () => {
    if (!data || !data.ohlc || !Array.isArray(data.ohlc)) return [];
    
    return data.ohlc.map((candle, index) => ({
      x: index + 1,
      open: candle.open || 0,
      close: candle.close || 0,
      high: candle.high || 0,
      low: candle.low || 0,
      date: candle.date || '',
      volume: candle.volume || 0,
    }));
  };

  const candleData = formatCandlestickData();
  
  // Return early if no data
  if (candleData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No OHLC data available</Text>
      </View>
    );
  }

  // Calculate Moving Average (7-period)
  const calculateMA = () => {
    if (candleData.length < 7) return [];
    
    return candleData.map((candle, index) => {
      if (index < 6) return null;
      
      const sum = candleData
        .slice(index - 6, index + 1)
        .reduce((acc, c) => acc + c.close, 0);
      
      return {
        x: candle.x,
        y: sum / 7,
      };
    }).filter(Boolean);
  };

  const maData = calculateMA();

  // Get price range
  const allPrices = candleData.flatMap(c => [c.open, c.close, c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1;

  const handleCandlePress = (candle) => {
    setSelectedCandle(candle);
    if (onCandlePress) {
      onCandlePress(candle);
    }
  };

  // Calculate price change
  const priceChange = candleData.length > 0 ? 
    ((candleData[candleData.length - 1].close - candleData[0].open) / candleData[0].open) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={[
            styles.changeText,
            { color: priceChange >= 0 ? '#10b981' : '#ef4444' }
          ]}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.maToggle, showMA && styles.maToggleActive]}
          onPress={() => setShowMA(!showMA)}
        >
          <Ionicons name="trending-up" size={16} color={showMA ? '#fff' : '#6b7280'} />
          <Text style={[styles.maText, showMA && styles.maTextActive]}>MA</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Candle Info */}
      {selectedCandle && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedRow}>
            <View style={styles.selectedItem}>
              <Text style={styles.selectedLabel}>Date</Text>
              <Text style={styles.selectedValue}>{selectedCandle.date}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedCandle(null)}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.ohlcGrid}>
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>Open</Text>
              <Text style={styles.ohlcValue}>₹{selectedCandle.open}</Text>
            </View>
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>High</Text>
              <Text style={[styles.ohlcValue, { color: '#10b981' }]}>₹{selectedCandle.high}</Text>
            </View>
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>Low</Text>
              <Text style={[styles.ohlcValue, { color: '#ef4444' }]}>₹{selectedCandle.low}</Text>
            </View>
            <View style={styles.ohlcItem}>
              <Text style={styles.ohlcLabel}>Close</Text>
              <Text style={styles.ohlcValue}>₹{selectedCandle.close}</Text>
            </View>
          </View>
          {selectedCandle.volume && (
            <View style={styles.volumeInfo}>
              <Ionicons name="bar-chart" size={14} color="#6b7280" />
              <Text style={styles.volumeText}>
                Volume: {selectedCandle.volume.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Candlestick Chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <VictoryChart
          width={Math.max(SCREEN_WIDTH - 64, candleData.length * 40)}
          height={300}
          padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
          domain={{ y: [minPrice - padding, maxPrice + padding] }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={({ datum }) => 
                `${datum.date}\nO: ₹${datum.open}\nH: ₹${datum.high}\nL: ₹${datum.low}\nC: ₹${datum.close}`
              }
              labelComponent={
                <VictoryTooltip
                  cornerRadius={8}
                  flyoutStyle={{
                    fill: '#1f2937',
                    stroke: '#1f2937',
                  }}
                  style={{
                    fill: '#ffffff',
                    fontSize: 11,
                  }}
                />
              }
              onActivated={(points) => {
                if (points && points.length > 0) {
                  handleCandlePress(points[0]);
                }
              }}
            />
          }
        >
          {/* X Axis */}
          <VictoryAxis
            style={{
              axis: { stroke: '#e5e7eb' },
              tickLabels: { 
                fontSize: 10, 
                fill: '#6b7280',
                angle: -45,
                textAnchor: 'end',
              },
              grid: { stroke: '#f3f4f6', strokeDasharray: '4,4' },
            }}
            tickFormat={(t) => {
              const candle = candleData[t - 1];
              return candle ? new Date(candle.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
            }}
          />

          {/* Y Axis */}
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: '#e5e7eb' },
              tickLabels: { fontSize: 10, fill: '#6b7280' },
              grid: { stroke: '#f3f4f6', strokeDasharray: '4,4' },
            }}
            tickFormat={(t) => `₹${t}`}
          />

          {/* Candlestick */}
          <VictoryCandlestick
            data={candleData}
            candleColors={{ positive: '#10b981', negative: '#ef4444' }}
            candleWidth={20}
            style={{
              data: {
                strokeWidth: 1,
              },
            }}
          />

          {/* Moving Average Line */}
          {showMA && maData.length > 0 && (
            <VictoryLine
              data={maData}
              style={{
                data: {
                  stroke: '#f59e0b',
                  strokeWidth: 2,
                },
              }}
            />
          )}
        </VictoryChart>
      </ScrollView>

      {/* Technical Indicators */}
      <View style={styles.indicators}>
        <View style={styles.indicatorItem}>
          <View style={[styles.indicatorDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.indicatorText}>Bullish</Text>
        </View>
        <View style={styles.indicatorItem}>
          <View style={[styles.indicatorDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.indicatorText}>Bearish</Text>
        </View>
        {showMA && (
          <View style={styles.indicatorItem}>
            <View style={[styles.indicatorDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.indicatorText}>MA(7)</Text>
          </View>
        )}
      </View>

      {/* Market Sentiment */}
      <View style={styles.sentiment}>
        <Ionicons 
          name={priceChange >= 0 ? 'trending-up' : 'trending-down'} 
          size={20} 
          color={priceChange >= 0 ? '#10b981' : '#ef4444'} 
        />
        <Text style={styles.sentimentText}>
          Market is {priceChange >= 0 ? 'Bullish' : 'Bearish'}
        </Text>
      </View>

      {/* Interaction Hint */}
      <View style={styles.hint}>
        <Ionicons name="hand-left" size={14} color="#9ca3af" />
        <Text style={styles.hintText}>Tap on candles • Scroll horizontally • Toggle MA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  maToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  maToggleActive: {
    backgroundColor: '#f59e0b',
  },
  maText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  maTextActive: {
    color: '#fff',
  },
  selectedInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedItem: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  ohlcGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ohlcItem: {
    alignItems: 'center',
  },
  ohlcLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  ohlcValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  volumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  volumeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: '#6b7280',
  },
  sentiment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sentimentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
});
