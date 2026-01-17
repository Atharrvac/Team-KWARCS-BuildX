import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

export default function CandlestickChart({ ohlcData, title }) {
  const [animatedData, setAnimatedData] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (ohlcData && ohlcData.length > 0) {
      // Animate chart appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      setAnimatedData(ohlcData);
    }
  }, [ohlcData]);

  if (!animatedData || animatedData.length === 0) {
    return <Text style={styles.loading}>Loading candlestick chart...</Text>;
  }

  const chartWidth = screenWidth - 64;
  const chartHeight = 250;
  const padding = 40;
  const candleWidth = (chartWidth - padding * 2) / animatedData.length - 4;

  // Find min and max prices for scaling
  const allPrices = animatedData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;

  const scaleY = (price) => {
    return chartHeight - padding - ((price - minPrice) / priceRange) * (chartHeight - padding * 2);
  };

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
      {title && <Text style={styles.title}>{title}</Text>}
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + (chartHeight - padding * 2) * ratio;
              const price = maxPrice - (priceRange * ratio);
              return (
                <React.Fragment key={i}>
                  <Line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <SvgText
                    x={padding - 5}
                    y={y + 4}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="end"
                  >
                    {price.toFixed(0)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Candlesticks */}
            {animatedData.map((candle, index) => {
              const x = padding + index * (candleWidth + 4) + candleWidth / 2;
              const isGreen = candle.close >= candle.open;
              const color = isGreen ? '#10b981' : '#ef4444';
              
              const highY = scaleY(candle.high);
              const lowY = scaleY(candle.low);
              const openY = scaleY(candle.open);
              const closeY = scaleY(candle.close);
              
              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.abs(closeY - openY) || 1;

              return (
                <React.Fragment key={index}>
                  {/* High-Low line (wick) */}
                  <Line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  
                  {/* Open-Close body */}
                  <Rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={isGreen ? color : '#fff'}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  
                  {/* Date label */}
                  {index % 2 === 0 && (
                    <SvgText
                      x={x}
                      y={chartHeight - padding + 15}
                      fontSize="9"
                      fill="#6b7280"
                      textAnchor="middle"
                    >
                      {candle.date}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Bullish (Close ≥ Open)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Bearish (Close &lt; Open)</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: 20,
    color: '#6b7280',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
});
