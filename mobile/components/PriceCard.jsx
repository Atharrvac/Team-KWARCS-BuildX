import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import websocketService from '../services/websocketService';

export default function PriceCard({ data, onPress }) {
  const [currentData, setCurrentData] = useState(data);
  const [isUpdating, setIsUpdating] = useState(false);
  const [priceDirection, setPriceDirection] = useState(null); // 'up' or 'down'
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const priceSlideAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    setCurrentData(data);
  }, [data]);
  
  useEffect(() => {
    // Listen for real-time price updates
    const handlePriceUpdate = (priceData) => {
      const cropUpdate = priceData.find(item => 
        item.name?.toLowerCase() === currentData.name?.toLowerCase() ||
        item.crop?.toLowerCase() === currentData.name?.toLowerCase()
      );
      
      if (cropUpdate) {
        const newPrice = cropUpdate.price || cropUpdate.currentPrice;
        const oldPrice = currentData.price;
        
        // Determine price direction
        if (newPrice > oldPrice) {
          setPriceDirection('up');
        } else if (newPrice < oldPrice) {
          setPriceDirection('down');
        }
        
        setIsUpdating(true);
        
        // Animate price change with slide effect
        Animated.sequence([
          Animated.parallel([
            Animated.timing(priceSlideAnim, {
              toValue: -10,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(priceSlideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
        
        // Card slide animation
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 5,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        
        setCurrentData(prev => ({
          ...prev,
          price: newPrice,
          change: cropUpdate.change || cropUpdate.changePercent || prev.change
        }));
        
        // Remove update indicator after animation
        setTimeout(() => {
          setIsUpdating(false);
          setPriceDirection(null);
        }, 1500);
      }
    };
    
    websocketService.on('priceUpdate', handlePriceUpdate);
    
    return () => {
      websocketService.off('priceUpdate', handlePriceUpdate);
    };
  }, [currentData.name, currentData.price]);
  
  const isPositive = currentData.change >= 0;

  return (
    <Animated.View
      style={{
        transform: [{ translateX: slideAnim }],
      }}
    >
      <TouchableOpacity 
        style={[
          styles.card, 
          isUpdating && styles.updating,
          priceDirection === 'up' && styles.priceUp,
          priceDirection === 'down' && styles.priceDown,
        ]} 
        onPress={onPress}
      >
        <View style={styles.header}>
          <Text style={styles.cropName}>{currentData.name}</Text>
          <View style={styles.iconContainer}>
            {isUpdating && (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons 
                  name="radio-button-on" 
                  size={12} 
                  color="#3b82f6" 
                  style={styles.liveIndicator}
                />
              </Animated.View>
            )}
            <Ionicons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={20} 
              color={isPositive ? '#10b981' : '#ef4444'} 
            />
          </View>
        </View>
        
        <Animated.View
          style={{
            transform: [
              { translateY: priceSlideAnim },
              { scale: pulseAnim },
            ],
          }}
        >
          <Text style={styles.price}>₹{currentData.price}</Text>
        </Animated.View>
        <Text style={styles.unit}>{currentData.unit}</Text>
        
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#d1fae5' : '#fee2e2' }]}>
          <Text style={[styles.changeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
            {isPositive ? '+' : ''}{currentData.change}%
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    marginRight: 4,
  },
  updating: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  priceUp: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  priceDown: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  unit: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  changeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
