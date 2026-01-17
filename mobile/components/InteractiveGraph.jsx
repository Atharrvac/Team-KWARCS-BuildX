import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function InteractiveGraph({ data, title, onDataPointPress }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipAnim = useRef(new Animated.Value(0)).current;

  const handleDataPointClick = (data) => {
    const { index, value, dataset, x, y } = data;
    
    setSelectedPoint({
      index,
      value,
      label: chartData.labels[index],
      dataset,
    });
    
    setTooltipPosition({ x, y });
    
    // Animate tooltip
    Animated.spring(tooltipAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    
    if (onDataPointPress) {
      onDataPointPress({ index, value, label: chartData.labels[index] });
    }
  };

  const hideTooltip = () => {
    Animated.timing(tooltipAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedPoint(null);
    });
  };

  const chartData = {
    labels: data.labels || [],
    datasets: data.datasets || [],
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Handle touch start
        const { locationX, locationY } = evt.nativeEvent;
        // Calculate which data point was touched
        const chartWidth = screenWidth - 64;
        const pointWidth = chartWidth / (chartData.labels.length - 1);
        const index = Math.round(locationX / pointWidth);
        
        if (index >= 0 && index < chartData.labels.length) {
          const value = chartData.datasets[0].data[index];
          handleDataPointClick({
            index,
            value,
            dataset: 0,
            x: locationX,
            y: locationY,
          });
        }
      },
      onPanResponderMove: (evt) => {
        // Handle touch move
        const { locationX, locationY } = evt.nativeEvent;
        const chartWidth = screenWidth - 64;
        const pointWidth = chartWidth / (chartData.labels.length - 1);
        const index = Math.round(locationX / pointWidth);
        
        if (index >= 0 && index < chartData.labels.length) {
          const value = chartData.datasets[0].data[index];
          handleDataPointClick({
            index,
            value,
            dataset: 0,
            x: locationX,
            y: locationY,
          });
        }
      },
      onPanResponderRelease: () => {
        // Keep tooltip visible for a moment
        setTimeout(hideTooltip, 2000);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Ionicons name="analytics" size={20} color="#6b7280" />
        </View>
      )}
      
      <View {...panResponder.panHandlers} style={styles.chartWrapper}>
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
              r: '6',
              strokeWidth: '2',
              stroke: '#22c55e',
              fill: '#ffffff',
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
          withShadow={false}
          onDataPointClick={handleDataPointClick}
        />
        
        {/* Interactive Tooltip */}
        {selectedPoint && (
          <Animated.View
            style={[
              styles.tooltip,
              {
                left: tooltipPosition.x - 60,
                top: tooltipPosition.y - 80,
                opacity: tooltipAnim,
                transform: [
                  {
                    scale: tooltipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipLabel}>{selectedPoint.label}</Text>
              <Text style={styles.tooltipValue}>₹{selectedPoint.value}</Text>
              <View style={styles.tooltipArrow} />
            </View>
          </Animated.View>
        )}
      </View>
      
      {/* Data Summary */}
      {chartData.datasets[0] && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>High</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              ₹{Math.max(...chartData.datasets[0].data)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Low</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              ₹{Math.min(...chartData.datasets[0].data)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avg</Text>
            <Text style={styles.summaryValue}>
              ₹{Math.round(
                chartData.datasets[0].data.reduce((a, b) => a + b, 0) / 
                chartData.datasets[0].data.length
              )}
            </Text>
          </View>
        </View>
      )}
      
      {/* Touch Hint */}
      <View style={styles.hint}>
        <Ionicons name="hand-left" size={14} color="#9ca3af" />
        <Text style={styles.hintText}>Touch and drag to explore data points</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chartWrapper: {
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  tooltipContent: {
    alignItems: 'center',
  },
  tooltipLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1f2937',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
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
});
