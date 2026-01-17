import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

export default function WeatherMapModal({ visible, onClose, location = 'Indore' }) {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    if (visible) {
      loadWeatherData();
    }
  }, [visible, location]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dss/weather/${location}`);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error loading weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Sunny': return 'sunny';
      case 'Partly Cloudy': return 'partly-sunny';
      case 'Cloudy': return 'cloudy';
      case 'Rainy': return 'rainy';
      default: return 'cloud';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Weather Intelligence</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Current Weather */}
              <View style={styles.currentWeather}>
                <Text style={styles.sectionTitle}>Current Conditions</Text>
                <View style={styles.currentGrid}>
                  <View style={styles.currentItem}>
                    <Ionicons name="thermometer" size={32} color="#ef4444" />
                    <Text style={styles.currentValue}>{weatherData?.current.temperature}°C</Text>
                    <Text style={styles.currentLabel}>Temperature</Text>
                  </View>
                  <View style={styles.currentItem}>
                    <Ionicons name="water" size={32} color="#3b82f6" />
                    <Text style={styles.currentValue}>{weatherData?.current.humidity}%</Text>
                    <Text style={styles.currentLabel}>Humidity</Text>
                  </View>
                  <View style={styles.currentItem}>
                    <Ionicons name="rainy" size={32} color="#06b6d4" />
                    <Text style={styles.currentValue}>{weatherData?.current.rainfall}mm</Text>
                    <Text style={styles.currentLabel}>Rainfall</Text>
                  </View>
                  <View style={styles.currentItem}>
                    <Ionicons name="speedometer" size={32} color="#8b5cf6" />
                    <Text style={styles.currentValue}>{weatherData?.current.windSpeed}km/h</Text>
                    <Text style={styles.currentLabel}>Wind Speed</Text>
                  </View>
                </View>
              </View>

              {/* 7-Day Forecast */}
              <View style={styles.forecastSection}>
                <Text style={styles.sectionTitle}>7-Day Forecast</Text>
                {weatherData?.forecast.map((day, index) => (
                  <View key={index} style={styles.forecastCard}>
                    <View style={styles.forecastLeft}>
                      <Ionicons 
                        name={getWeatherIcon(day.condition)} 
                        size={32} 
                        color="#16a34a" 
                      />
                      <View style={styles.forecastInfo}>
                        <Text style={styles.forecastDate}>
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text style={styles.forecastCondition}>{day.condition}</Text>
                      </View>
                    </View>
                    <View style={styles.forecastRight}>
                      <Text style={styles.forecastTemp}>
                        {day.temperature.max}° / {day.temperature.min}°
                      </Text>
                      {day.rainfall > 0 && (
                        <Text style={styles.forecastRain}>
                          <Ionicons name="rainy" size={12} color="#3b82f6" /> {day.rainfall}mm
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Crop Impact */}
              <View style={styles.cropImpactSection}>
                <Text style={styles.sectionTitle}>Crop Impact Analysis</Text>
                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>NDVI (Vegetation Index)</Text>
                    <Text style={[styles.impactValue, { color: '#16a34a' }]}>
                      {weatherData?.cropImpact.ndvi}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Soil Moisture</Text>
                    <Text style={[styles.impactValue, { color: '#3b82f6' }]}>
                      {weatherData?.cropImpact.moisture}%
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Crop Health</Text>
                    <Text style={[styles.impactValue, { color: '#16a34a' }]}>
                      {weatherData?.cropImpact.health}
                    </Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Yield Impact</Text>
                    <Text style={[styles.impactValue, { color: '#16a34a' }]}>
                      {weatherData?.cropImpact.yieldImpact}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Alerts */}
              {weatherData?.alerts && weatherData.alerts.length > 0 && (
                <View style={styles.alertsSection}>
                  <Text style={styles.sectionTitle}>Weather Alerts</Text>
                  {weatherData.alerts.map((alert, index) => (
                    <View key={index} style={styles.alertCard}>
                      <Ionicons name="warning" size={20} color="#f59e0b" />
                      <View style={styles.alertContent}>
                        <Text style={styles.alertMessage}>{alert.message}</Text>
                        <Text style={styles.alertImpact}>{alert.impact}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  currentWeather: {
    marginBottom: 24,
  },
  currentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  currentItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  currentLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  forecastSection: {
    marginBottom: 24,
  },
  forecastCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  forecastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  forecastInfo: {
    gap: 4,
  },
  forecastDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  forecastCondition: {
    fontSize: 12,
    color: '#6b7280',
  },
  forecastRight: {
    alignItems: 'flex-end',
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  forecastRain: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  cropImpactSection: {
    marginBottom: 24,
  },
  impactCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  impactLabel: {
    fontSize: 14,
    color: '#166534',
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertsSection: {
    marginBottom: 24,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  alertImpact: {
    fontSize: 12,
    color: '#92400e',
  },
});
