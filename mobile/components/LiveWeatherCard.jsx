import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import weatherService from '../services/weatherService';

const WEATHER_ICONS = {
  'Clear': { icon: 'sunny', color: '#f59e0b' },
  'Clouds': { icon: 'cloudy', color: '#64748b' },
  'Rain': { icon: 'rainy', color: '#3b82f6' },
  'Drizzle': { icon: 'rainy-outline', color: '#60a5fa' },
  'Thunderstorm': { icon: 'thunderstorm', color: '#7c3aed' },
  'Snow': { icon: 'snow', color: '#06b6d4' },
  'Mist': { icon: 'water', color: '#94a3b8' },
  'Haze': { icon: 'partly-sunny', color: '#fbbf24' },
  'Fog': { icon: 'cloud', color: '#9ca3af' },
};

export default function LiveWeatherCard({ 
  district = 'Indore',
  onDistrictChange,
  compact = false,
  showForecast = true,
}) {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const isHindi = i18n.language === 'hi';

  const districts = weatherService.getDistricts();

  useEffect(() => {
    loadWeatherData();
  }, [selectedDistrict]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [currentWeather, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(selectedDistrict),
        showForecast ? weatherService.getForecast(selectedDistrict) : null,
      ]);
      
      setWeather(currentWeather);
      setForecast(forecastData);
    } catch (err) {
      console.error('Weather load error:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = (newDistrict) => {
    setSelectedDistrict(newDistrict);
    if (onDistrictChange) {
      onDistrictChange(newDistrict);
    }
  };

  const getWeatherIcon = (condition) => {
    return WEATHER_ICONS[condition] || WEATHER_ICONS['Clear'];
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>
          {isHindi ? 'मौसम डेटा लोड हो रहा है...' : 'Loading weather data...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="cloud-offline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadWeatherData}>
          <Text style={styles.retryText}>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Ionicons 
            name={getWeatherIcon(weather?.condition).icon} 
            size={24} 
            color={getWeatherIcon(weather?.condition).color} 
          />
          <Text style={styles.compactTemp}>{weather?.temperature}°C</Text>
          <Text style={styles.compactLocation}>{selectedDistrict}</Text>
        </View>
        <Text style={styles.compactCondition}>{weather?.description}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Live Badge */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cloud" size={20} color="#16a34a" />
          <Text style={styles.title}>
            {isHindi ? 'लाइव मौसम' : 'Live Weather'}
          </Text>
          {weather?.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {weather?.isDemo && (
            <View style={[styles.liveBadge, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.liveText, { color: '#92400e' }]}>DEMO</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={loadWeatherData} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* District Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.districtScroll}
        contentContainerStyle={styles.districtContainer}
      >
        {districts.slice(0, 6).map((d) => (
          <TouchableOpacity
            key={d.name}
            style={[
              styles.districtChip,
              selectedDistrict === d.name && styles.districtChipActive,
            ]}
            onPress={() => handleDistrictChange(d.name)}
          >
            <Text style={[
              styles.districtChipText,
              selectedDistrict === d.name && styles.districtChipTextActive,
            ]}>
              {d.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current Weather */}
      <View style={styles.currentWeather}>
        <View style={styles.mainWeather}>
          <Ionicons 
            name={getWeatherIcon(weather?.condition).icon} 
            size={64} 
            color={getWeatherIcon(weather?.condition).color} 
          />
          <View style={styles.tempContainer}>
            <Text style={styles.temperature}>{weather?.temperature}°C</Text>
            <Text style={styles.feelsLike}>
              {isHindi ? 'महसूस' : 'Feels'} {weather?.feelsLike}°C
            </Text>
          </View>
        </View>
        <Text style={styles.condition}>{weather?.description}</Text>
        <Text style={styles.location}>
          📍 {selectedDistrict}, {weather?.state}
        </Text>
      </View>

      {/* Weather Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="water" size={20} color="#3b82f6" />
          <Text style={styles.detailLabel}>{isHindi ? 'नमी' : 'Humidity'}</Text>
          <Text style={styles.detailValue}>{weather?.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer" size={20} color="#8b5cf6" />
          <Text style={styles.detailLabel}>{isHindi ? 'हवा' : 'Wind'}</Text>
          <Text style={styles.detailValue}>{weather?.windSpeed} km/h</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="eye" size={20} color="#64748b" />
          <Text style={styles.detailLabel}>{isHindi ? 'दृश्यता' : 'Visibility'}</Text>
          <Text style={styles.detailValue}>{weather?.visibility} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cloudy" size={20} color="#94a3b8" />
          <Text style={styles.detailLabel}>{isHindi ? 'बादल' : 'Clouds'}</Text>
          <Text style={styles.detailValue}>{weather?.clouds}%</Text>
        </View>
      </View>

      {/* Agriculture Insights */}
      {weather?.agricultureInsights && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>
            🌾 {isHindi ? 'कृषि सलाह' : 'Agriculture Advisory'}
          </Text>
          <View style={styles.insightsGrid}>
            <View style={[
              styles.insightBadge,
              { backgroundColor: weather.agricultureInsights.cropRisk === 'Low' ? '#dcfce7' : '#fef3c7' }
            ]}>
              <Text style={[
                styles.insightBadgeText,
                { color: weather.agricultureInsights.cropRisk === 'Low' ? '#166534' : '#92400e' }
              ]}>
                {isHindi ? 'फसल जोखिम' : 'Crop Risk'}: {weather.agricultureInsights.cropRisk}
              </Text>
            </View>
            <View style={[
              styles.insightBadge,
              { backgroundColor: weather.agricultureInsights.sprayingCondition === 'Suitable' ? '#dcfce7' : '#fee2e2' }
            ]}>
              <Text style={[
                styles.insightBadgeText,
                { color: weather.agricultureInsights.sprayingCondition === 'Suitable' ? '#166534' : '#991b1b' }
              ]}>
                {isHindi ? 'छिड़काव' : 'Spraying'}: {weather.agricultureInsights.sprayingCondition}
              </Text>
            </View>
          </View>
          {weather.agricultureInsights.recommendations?.length > 0 && (
            <View style={styles.recommendations}>
              {weather.agricultureInsights.recommendations.map((rec, idx) => (
                <Text key={idx} style={styles.recommendationText}>• {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 5-Day Forecast */}
      {showForecast && forecast && (
        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>
            📅 {isHindi ? '5-दिन का पूर्वानुमान' : '5-Day Forecast'}
          </Text>
          
          {forecast.rainAlert && (
            <View style={styles.rainAlert}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.rainAlertText}>
                {forecast.rainAlertMessage || (isHindi ? 'बारिश की संभावना' : 'Rain expected')}
              </Text>
            </View>
          )}
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.forecastRow}>
              {forecast.forecast?.map((day, idx) => (
                <View key={idx} style={styles.forecastDay}>
                  <Text style={styles.forecastDate}>
                    {idx === 0 ? (isHindi ? 'आज' : 'Today') : day.date.split('/')[0]}
                  </Text>
                  <Ionicons 
                    name={getWeatherIcon(day.condition).icon} 
                    size={28} 
                    color={getWeatherIcon(day.condition).color} 
                  />
                  <Text style={styles.forecastTemp}>
                    {day.tempMax}° / {day.tempMin}°
                  </Text>
                  {day.rainChance > 20 && (
                    <View style={styles.rainChance}>
                      <Ionicons name="water" size={12} color="#3b82f6" />
                      <Text style={styles.rainChanceText}>{day.rainChance}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Data Source Indicator */}
      {weather?.isLive && (
        <View style={styles.sourceIndicator}>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
          <Text style={styles.sourceText}>
            {isHindi ? 'Open-Meteo से लाइव डेटा' : 'Live data from Open-Meteo API'}
          </Text>
        </View>
      )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#ef4444',
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  refreshBtn: {
    padding: 8,
  },
  districtScroll: {
    marginBottom: 16,
  },
  districtContainer: {
    gap: 8,
  },
  districtChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  districtChipActive: {
    backgroundColor: '#16a34a',
  },
  districtChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  districtChipTextActive: {
    color: '#fff',
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  tempContainer: {
    alignItems: 'flex-start',
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  feelsLike: {
    fontSize: 14,
    color: '#64748b',
  },
  condition: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#64748b',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  insightsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 10,
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  insightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  forecastSection: {
    marginTop: 8,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  rainAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  rainAlertText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
  },
  forecastRow: {
    flexDirection: 'row',
    gap: 12,
  },
  forecastDay: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    minWidth: 70,
  },
  forecastDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginTop: 6,
  },
  rainChance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  rainChanceText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  demoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  demoText: {
    fontSize: 11,
    color: '#64748b',
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  sourceText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '500',
  },
  // Compact styles
  compactContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTemp: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  compactLocation: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 'auto',
  },
  compactCondition: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'capitalize',
  },
});
