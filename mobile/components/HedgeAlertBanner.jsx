import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const HedgeAlertBanner = ({ alerts = [] }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation for LIVE indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (alerts.length === 0) return;

    // Calculate total width of all alerts
    const totalWidth = alerts.length * (SCREEN_WIDTH - 32);

    // Continuous scrolling animation
    const scrollAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: -totalWidth,
          duration: alerts.length * 8000, // 8 seconds per alert
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    scrollAnimation.start();

    return () => scrollAnimation.stop();
  }, [alerts, scrollX]);

  if (alerts.length === 0) return null;

  // Duplicate alerts for seamless loop
  const duplicatedAlerts = [...alerts, ...alerts];

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        {/* LIVE Indicator - Fixed on left */}
        <View style={styles.liveContainer}>
          <Animated.View 
            style={[
              styles.liveDot,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Scrolling Alerts */}
        <View style={styles.scrollContainer}>
          <Animated.View
            style={[
              styles.alertsWrapper,
              {
                transform: [{ translateX: scrollX }],
              },
            ]}
          >
            {duplicatedAlerts.map((alert, index) => (
              <View
                key={`alert-${index}`}
                style={[
                  styles.alertItem,
                  { backgroundColor: alert.bgColor || '#dcfce7' },
                ]}
              >
                <Ionicons
                  name={alert.icon || 'shield-checkmark'}
                  size={20}
                  color={getIconColor(alert.type)}
                  style={styles.alertIcon}
                />
                <Text style={[styles.alertText, { color: getTextColor(alert.type) }]}>
                  {alert.text}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Hedge Alert Label - Fixed on right */}
        <View style={styles.labelContainer}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={styles.labelText}>HEDGE</Text>
        </View>
      </View>
    </View>
  );
};

const getIconColor = (type) => {
  switch (type) {
    case 'positive':
      return '#16a34a';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#16a34a';
  }
};

const getTextColor = (type) => {
  switch (type) {
    case 'positive':
      return '#166534';
    case 'warning':
      return '#92400e';
    case 'info':
      return '#1e40af';
    default:
      return '#166534';
  }
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#16a34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  alertsWrapper: {
    flexDirection: 'row',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: SCREEN_WIDTH - 32,
  },
  alertIcon: {
    marginRight: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
});

export default HedgeAlertBanner;
