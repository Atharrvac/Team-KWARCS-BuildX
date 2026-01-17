import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AnimatedTickerTape({ data }) {
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous scrolling animation
    const startScrolling = () => {
      scrollAnim.setValue(0);
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -1,
          duration: 30000, // 30 seconds for full scroll
          useNativeDriver: true,
        })
      ).start();
    };

    startScrolling();
  }, [data]);

  const translateX = scrollAnim.interpolate({
    inputRange: [0, -1],
    outputRange: [screenWidth, -screenWidth * 2],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.tickerContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {data && data.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <View key={index} style={styles.tickerItem}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
              <View style={styles.changeContainer}>
                <Ionicons
                  name={isPositive ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={isPositive ? '#10b981' : '#ef4444'}
                />
                <Text style={[styles.change, { color: isPositive ? '#10b981' : '#ef4444' }]}>
                  {Math.abs(item.change).toFixed(2)}%
                </Text>
              </View>
              <View style={styles.separator} />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  tickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  symbol: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d1d5db',
    marginRight: 6,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#4b5563',
    marginLeft: 24,
  },
});
