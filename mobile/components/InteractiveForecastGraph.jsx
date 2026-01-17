import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function InteractiveForecastGraph({ 
  data, 
  title = '7-Day Forecast',
  showFullButton = false,
  onFullPress,
  currentPrice,
  predictions 
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Format data for chart
  const chartData = data || {
    labels: ['Nov 14', 'Nov 16', 'Nov 18', 'Nov 20', 'Nov 22', 'Nov 24', 'Nov 26'],
    datasets: [{
      data: [4283, 4260, 4323, 4310, 4334, 4350, 4330],
    }],
  };

  const handleDataPointClick = (data) => {
    const { index, value, x, y } = data;
    setSelectedPoint({
      index,
      value: Math.round(value),
      label: chartData.labels[index],
    });
    setTooltipPosition({ x, y });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trending-up" size={24} color="#22c55e" />
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 64}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffffff',
              fill: '#22c55e',
            },
            propsForBackgroundLines: {
              strokeDasharray: '5,5',
              stroke: '#e5e7eb',
              strokeWidth: 1,
            },
            propsForLabels: {
              fontSize: 10,
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          withDots={true}
          withShadow={false}
          segments={4}
          fromZero={false}
          onDataPointClick={handleDataPointClick}
        />

        {/* Tooltip */}
        {selectedPoint && (
          <View style={[styles.tooltip, { 
            left: Math.min(Math.max(tooltipPosition.x - 60, 10), SCREEN_WIDTH - 140),
            top: tooltipPosition.y - 80 
          }]}>
            <Text style={styles.tooltipDate}>{selectedPoint.label}</Text>
            <Text style={styles.tooltipPrice}>price : {selectedPoint.value}</Text>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </View>

      {/* See Full Forecast Button */}
      {showFullButton && (
        <TouchableOpacity 
          style={styles.fullButton}
          onPress={onFullPress}
        >
          <Text style={styles.fullButtonText}>See Full Forecast</Text>
          <Ionicons name="eye" size={20} color="#22c55e" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chartWrapper: {
    position: 'relative',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  tooltipDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  tooltipPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#22c55e',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#22c55e10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e40',
  },
  fullButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
});
