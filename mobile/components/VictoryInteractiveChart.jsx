import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function VictoryInteractiveChart({ 
  data, 
  title, 
  type = 'line', // 'line', 'area', 'candlestick'
  showPrediction = false,
  onPointPress 
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [chartType, setChartType] = useState(type);

  // Format data for Victory
  const formatData = () => {
    if (!data || !data.labels || !data.datasets || !data.datasets[0]) return [];
    
    return data.labels.map((label, index) => ({
      x: label,
      y: data.datasets[0].data[index] || 0,
      label: `${label}: ₹${data.datasets[0].data[index] || 0}`,
    }));
  };

  const chartData = formatData();
  
  // Return early if no data
  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  // Get prediction data if available
  const predictionData = data?.datasets?.[1] ? 
    data.labels.map((label, index) => ({
      x: label,
      y: data.datasets[1].data[index],
      label: `Predicted: ₹${data.datasets[1].data[index]}`,
    })) : [];

  // Calculate domain for better visualization
  const allValues = chartData.map(d => d.y);
  if (predictionData.length > 0) {
    allValues.push(...predictionData.map(d => d.y));
  }
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  const handlePointPress = (point) => {
    setSelectedPoint(point);
    if (onPointPress) {
      onPointPress(point);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, chartType === 'line' && styles.typeButtonActive]}
            onPress={() => setChartType('line')}
          >
            <Ionicons name="trending-up" size={16} color={chartType === 'line' ? '#fff' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, chartType === 'area' && styles.typeButtonActive]}
            onPress={() => setChartType('area')}
          >
            <Ionicons name="analytics" size={16} color={chartType === 'area' ? '#fff' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Point Info */}
      {selectedPoint && (
        <View style={styles.selectedInfo}>
          <View style={styles.selectedInfoContent}>
            <Text style={styles.selectedLabel}>{selectedPoint.x}</Text>
            <Text style={styles.selectedValue}>₹{selectedPoint.y}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedPoint(null)}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Victory Chart */}
      <VictoryChart
        width={SCREEN_WIDTH - 64}
        height={280}
        padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
        domain={{ y: [minValue - padding, maxValue + padding] }}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={({ datum }) => datum.label}
            labelComponent={
              <VictoryTooltip
                cornerRadius={8}
                flyoutStyle={{
                  fill: '#1f2937',
                  stroke: '#1f2937',
                }}
                style={{
                  fill: '#ffffff',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            }
            onActivated={(points) => {
              if (points && points.length > 0) {
                handlePointPress(points[0]);
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

        {/* Area Chart */}
        {chartType === 'area' && (
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: 'url(#gradient)',
                fillOpacity: 0.3,
                stroke: '#22c55e',
                strokeWidth: 3,
              },
            }}
            interpolation="natural"
          />
        )}

        {/* Line Chart */}
        {chartType === 'line' && (
          <VictoryLine
            data={chartData}
            style={{
              data: {
                stroke: '#22c55e',
                strokeWidth: 3,
              },
            }}
            interpolation="natural"
          />
        )}

        {/* Prediction Line (Dashed) */}
        {showPrediction && predictionData.length > 0 && (
          <VictoryLine
            data={predictionData}
            style={{
              data: {
                stroke: '#3b82f6',
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
            }}
            interpolation="natural"
          />
        )}

        {/* Interactive Points */}
        <VictoryScatter
          data={chartData}
          size={6}
          style={{
            data: {
              fill: '#22c55e',
              stroke: '#ffffff',
              strokeWidth: 2,
            },
          }}
        />

        {/* Prediction Points */}
        {showPrediction && predictionData.length > 0 && (
          <VictoryScatter
            data={predictionData}
            size={5}
            style={{
              data: {
                fill: '#3b82f6',
                stroke: '#ffffff',
                strokeWidth: 2,
              },
            }}
          />
        )}
      </VictoryChart>

      {/* Stats Summary */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            ₹{Math.max(...allValues)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            ₹{Math.min(...allValues)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>
            ₹{Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length)}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Actual Price</Text>
        </View>
        {showPrediction && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Predicted</Text>
          </View>
        )}
      </View>

      {/* Interaction Hint */}
      <View style={styles.hint}>
        <Ionicons name="hand-left" size={14} color="#9ca3af" />
        <Text style={styles.hintText}>Tap on any point to see details</Text>
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
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
    gap: 4,
  },
  typeButton: {
    padding: 8,
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#22c55e',
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#22c55e20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22c55e40',
  },
  selectedInfoContent: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
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
