import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { Svg, Path, Line, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 280;
const CHART_WIDTH = SCREEN_WIDTH - 32;
const PADDING = { top: 20, bottom: 40, left: 10, right: 10 };

export default function InteractiveTradingChart({ 
  data, 
  timeRange, 
  chartType = 'line',
  onChartTypeChange 
}) {
  const [touchX, setTouchX] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  if (!data || data.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>Collecting data...</Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Get price range
  const prices = data.map(d => d.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Scale functions
  const scaleX = (index) => {
    return PADDING.left + (index / (data.length - 1)) * chartWidth;
  };

  const scaleY = (price) => {
    return PADDING.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  // Generate path for line chart
  const generatePath = () => {
    let path = '';
    data.forEach((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.price);
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  // Generate area path for gradient
  const generateAreaPath = () => {
    let path = generatePath();
    const lastX = scaleX(data.length - 1);
    const firstX = scaleX(0);
    path += ` L ${lastX} ${CHART_HEIGHT - PADDING.bottom}`;
    path += ` L ${firstX} ${CHART_HEIGHT - PADDING.bottom}`;
    path += ' Z';
    return path;
  };

  // Get chart color
  const getChartColor = () => {
    const first = data[0].price;
    const last = data[data.length - 1].price;
    return last >= first ? '#10b981' : '#ef4444';
  };

  // Handle touch
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      handleTouch(evt.nativeEvent.locationX);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (evt) => {
      handleTouch(evt.nativeEvent.locationX);
    },
    onPanResponderRelease: () => {
      setTouchX(null);
      setSelectedPoint(null);
    },
  });

  const handleTouch = (x) => {
    // Find closest data point
    const adjustedX = x - PADDING.left;
    const index = Math.round((adjustedX / chartWidth) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
    
    setTouchX(scaleX(clampedIndex));
    setSelectedPoint(data[clampedIndex]);
  };

  const formatPrice = (price) => {
    return `₹${price?.toFixed(2) || '0.00'}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const displayPrice = selectedPoint ? selectedPoint.price : data[data.length - 1].price;
  const displayTime = selectedPoint ? selectedPoint.timestamp : data[data.length - 1].timestamp;

  return (
    <View style={styles.container}>
      {/* Price Display */}
      <View style={styles.priceDisplay}>
        <Text style={[styles.price, { color: getChartColor() }]}>
          {formatPrice(displayPrice)}
        </Text>
        <Text style={styles.timestamp}>
          {formatTime(displayTime)}
        </Text>
      </View>

      {/* Chart Type Selector */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity
          style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeButtonActive]}
          onPress={() => onChartTypeChange?.('line')}
        >
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={chartType === 'line' ? '#fff' : '#6b7280'} 
          />
          <Text style={[styles.chartTypeText, chartType === 'line' && styles.chartTypeTextActive]}>
            Line
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.chartTypeButton, chartType === 'candle' && styles.chartTypeButtonActive]}
          onPress={() => onChartTypeChange?.('candle')}
        >
          <Ionicons 
            name="bar-chart" 
            size={16} 
            color={chartType === 'candle' ? '#fff' : '#6b7280'} 
          />
          <Text style={[styles.chartTypeText, chartType === 'candle' && styles.chartTypeTextActive]}>
            Candle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Chart */}
      <View style={styles.chartWrapper} {...panResponder.panHandlers}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={getChartColor()} stopOpacity="0.3" />
              <Stop offset="1" stopColor={getChartColor()} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = PADDING.top + chartHeight * ratio;
            return (
              <Line
                key={i}
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Area fill */}
          <Path
            d={generateAreaPath()}
            fill="url(#gradient)"
          />

          {/* Line */}
          <Path
            d={generatePath()}
            stroke={getChartColor()}
            strokeWidth="2"
            fill="none"
          />

          {/* Crosshair */}
          {touchX !== null && selectedPoint && (
            <>
              {/* Vertical line */}
              <Line
                x1={touchX}
                y1={PADDING.top}
                x2={touchX}
                y2={CHART_HEIGHT - PADDING.bottom}
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              
              {/* Horizontal line */}
              <Line
                x1={PADDING.left}
                y1={scaleY(selectedPoint.price)}
                x2={CHART_WIDTH - PADDING.right}
                y2={scaleY(selectedPoint.price)}
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              
              {/* Dot */}
              <Circle
                cx={touchX}
                cy={scaleY(selectedPoint.price)}
                r="6"
                fill={getChartColor()}
                stroke="#fff"
                strokeWidth="2"
              />
              
              {/* Price label */}
              <Rect
                x={CHART_WIDTH - PADDING.right - 60}
                y={scaleY(selectedPoint.price) - 12}
                width="60"
                height="24"
                fill="rgba(0,0,0,0.8)"
                rx="4"
              />
            </>
          )}
        </Svg>
      </View>

      {/* Chart Info */}
      <View style={styles.chartInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="finger-print" size={14} color="#6b7280" />
          <Text style={styles.infoText}>Touch & drag to explore</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="analytics" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{data.length} points</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  emptyContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Price Display
  priceDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Chart Type Selector
  chartTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  chartTypeButtonActive: {
    backgroundColor: '#2d5f3f',
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  
  // Chart
  chartWrapper: {
    paddingHorizontal: 16,
  },
  
  // Chart Info
  chartInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
