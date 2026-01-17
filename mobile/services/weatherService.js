import AsyncStorage from '@react-native-async-storage/async-storage';

// Open-Meteo API - 100% FREE, NO API KEY REQUIRED
// https://open-meteo.com/ - Open source weather API
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

// Indian agricultural districts with coordinates
const DISTRICTS = {
  'Indore': { lat: 22.7196, lon: 75.8577, state: 'MP' },
  'Jaipur': { lat: 26.9124, lon: 75.7873, state: 'RJ' },
  'Latur': { lat: 18.4088, lon: 76.5604, state: 'MH' },
  'Nagpur': { lat: 21.1458, lon: 79.0882, state: 'MH' },
  'Akola': { lat: 20.7002, lon: 77.0082, state: 'MH' },
  'Kota': { lat: 25.2138, lon: 75.8648, state: 'RJ' },
  'Ujjain': { lat: 23.1765, lon: 75.7885, state: 'MP' },
  'Dewas': { lat: 22.9676, lon: 76.0534, state: 'MP' },
  'Rajkot': { lat: 22.3039, lon: 70.8022, state: 'GJ' },
  'Junagadh': { lat: 21.5222, lon: 70.4579, state: 'GJ' },
};

// WMO Weather interpretation codes
const WMO_CODES = {
  0: { condition: 'Clear', description: 'Clear sky' },
  1: { condition: 'Clear', description: 'Mainly clear' },
  2: { condition: 'Clouds', description: 'Partly cloudy' },
  3: { condition: 'Clouds', description: 'Overcast' },
  45: { condition: 'Fog', description: 'Foggy' },
  48: { condition: 'Fog', description: 'Depositing rime fog' },
  51: { condition: 'Drizzle', description: 'Light drizzle' },
  53: { condition: 'Drizzle', description: 'Moderate drizzle' },
  55: { condition: 'Drizzle', description: 'Dense drizzle' },
  61: { condition: 'Rain', description: 'Slight rain' },
  63: { condition: 'Rain', description: 'Moderate rain' },
  65: { condition: 'Rain', description: 'Heavy rain' },
  71: { condition: 'Snow', description: 'Slight snow' },
  73: { condition: 'Snow', description: 'Moderate snow' },
  75: { condition: 'Snow', description: 'Heavy snow' },
  80: { condition: 'Rain', description: 'Slight rain showers' },
  81: { condition: 'Rain', description: 'Moderate rain showers' },
  82: { condition: 'Rain', description: 'Violent rain showers' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm' },
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with hail' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
};

// Cache duration: 15 minutes for weather data
const CACHE_DURATION = 15 * 60 * 1000;

class WeatherService {
  constructor() {
    this.cache = {};
  }

  // Get current weather for a location using Open-Meteo (FREE, NO API KEY)
  async getCurrentWeather(district = 'Indore') {
    const cacheKey = `weather_current_${district}`;
    
    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const coords = DISTRICTS[district] || DISTRICTS['Indore'];
      
      // Open-Meteo API - completely free, no API key needed
      const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover&timezone=Asia/Kolkata`;
      
      console.log('Fetching weather from Open-Meteo:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const weatherData = this.formatCurrentWeather(data, district);
      
      // Cache the result
      await this.saveToCache(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Return cached data if available, even if expired
      const expiredCache = await this.getFromCache(cacheKey, true);
      if (expiredCache) return { ...expiredCache, isStale: true };
      return this.getMockCurrentWeather(district);
    }
  }

  // Get 7-day forecast using Open-Meteo
  async getForecast(district = 'Indore') {
    const cacheKey = `weather_forecast_${district}`;
    
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const coords = DISTRICTS[district] || DISTRICTS['Indore'];
      
      const url = `${OPEN_METEO_BASE_URL}/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia/Kolkata`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();
      const forecastData = this.formatForecast(data, district);
      
      await this.saveToCache(cacheKey, forecastData);
      
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      const expiredCache = await this.getFromCache(cacheKey, true);
      if (expiredCache) return { ...expiredCache, isStale: true };
      return this.getMockForecast(district);
    }
  }

  // Get weather for multiple districts (for DSS map)
  async getMultiDistrictWeather(districts = Object.keys(DISTRICTS)) {
    const results = {};
    
    for (const district of districts) {
      results[district] = await this.getCurrentWeather(district);
    }
    
    return results;
  }

  // Format Open-Meteo current weather response
  formatCurrentWeather(data, district) {
    const coords = DISTRICTS[district] || {};
    const current = data.current;
    const weatherCode = current.weather_code;
    const weatherInfo = WMO_CODES[weatherCode] || WMO_CODES[0];
    
    return {
      district,
      state: coords.state,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      pressure: Math.round(current.surface_pressure),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: this.getWindDirection(current.wind_direction_10m),
      condition: weatherInfo.condition,
      description: weatherInfo.description,
      icon: this.getIconFromCondition(weatherInfo.condition),
      visibility: 10, // Open-Meteo doesn't provide visibility, default to good
      clouds: current.cloud_cover,
      sunrise: '06:15 AM', // Would need separate API call for sun times
      sunset: '06:45 PM',
      updatedAt: new Date().toISOString(),
      isLive: true, // Flag to show this is real data
      // Agricultural insights
      agricultureInsights: this.getAgricultureInsights({
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        condition: weatherInfo.condition,
      }),
    };
  }

  // Format Open-Meteo forecast response
  formatForecast(data, district) {
    const daily = data.daily;
    
    const forecast = daily.time.slice(0, 5).map((date, idx) => {
      const weatherCode = daily.weather_code[idx];
      const weatherInfo = WMO_CODES[weatherCode] || WMO_CODES[0];
      
      return {
        date: new Date(date).toLocaleDateString('en-IN'),
        tempMax: Math.round(daily.temperature_2m_max[idx]),
        tempMin: Math.round(daily.temperature_2m_min[idx]),
        humidity: 60, // Open-Meteo daily doesn't include humidity
        condition: weatherInfo.condition,
        rainChance: daily.precipitation_probability_max[idx] || 0,
        rainfall: Math.round((daily.precipitation_sum[idx] || 0) * 10) / 10,
        windSpeed: Math.round(daily.wind_speed_10m_max[idx]),
      };
    });

    const rainDays = forecast.filter(d => d.rainChance > 50);
    
    return {
      district,
      forecast,
      rainAlert: rainDays.length > 0,
      rainAlertMessage: rainDays.length > 0 
        ? `🌧️ Rain expected in ${rainDays.length} day(s) - plan harvesting accordingly`
        : '☀️ No significant rain expected in next 5 days',
      totalRainfall: forecast.reduce((sum, d) => sum + d.rainfall, 0),
      updatedAt: new Date().toISOString(),
      isLive: true,
    };
  }

  // Get icon name from condition
  getIconFromCondition(condition) {
    const iconMap = {
      'Clear': '01d',
      'Clouds': '03d',
      'Rain': '10d',
      'Drizzle': '09d',
      'Thunderstorm': '11d',
      'Snow': '13d',
      'Fog': '50d',
    };
    return iconMap[condition] || '01d';
  }

  // Get agriculture-specific insights
  getAgricultureInsights(data) {
    const { temp, humidity, windSpeed, condition } = data;
    
    const insights = {
      cropRisk: 'Low',
      harvestCondition: 'Good',
      irrigationNeeded: false,
      sprayingCondition: 'Suitable',
      recommendations: [],
    };

    // Temperature analysis
    if (temp > 40) {
      insights.cropRisk = 'High';
      insights.recommendations.push('🌡️ High temperature - ensure adequate irrigation');
    } else if (temp > 35) {
      insights.cropRisk = 'Moderate';
      insights.recommendations.push('⚠️ Monitor crop stress due to heat');
    } else if (temp >= 25 && temp <= 32) {
      insights.recommendations.push('✅ Temperature optimal for most oilseed crops');
    }

    // Humidity analysis
    if (humidity > 80) {
      insights.sprayingCondition = 'Not Suitable';
      insights.recommendations.push('💧 High humidity - avoid pesticide spraying');
    } else if (humidity < 30) {
      insights.irrigationNeeded = true;
      insights.recommendations.push('🚿 Low humidity - increase irrigation frequency');
    } else {
      insights.recommendations.push('💨 Humidity levels suitable for field operations');
    }

    // Weather condition analysis
    if (condition === 'Rain' || condition === 'Thunderstorm' || condition === 'Drizzle') {
      insights.harvestCondition = 'Poor';
      insights.sprayingCondition = 'Not Suitable';
      insights.cropRisk = 'Moderate';
      insights.recommendations.push('🌧️ Postpone harvesting and spraying activities');
    } else if (condition === 'Clear') {
      insights.harvestCondition = 'Excellent';
      insights.recommendations.push('☀️ Ideal conditions for harvesting');
    }

    // Wind analysis
    if (windSpeed > 25) {
      insights.sprayingCondition = 'Not Suitable';
      insights.recommendations.push('💨 High wind - avoid spraying operations');
    }

    return insights;
  }

  // Mock data fallback (only used if API fails)
  getMockCurrentWeather(district) {
    const baseTemp = 28 + Math.random() * 10;
    const conditions = ['Clear', 'Clouds', 'Haze'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      district,
      state: DISTRICTS[district]?.state || 'IN',
      temperature: Math.round(baseTemp),
      feelsLike: Math.round(baseTemp + 2),
      humidity: Math.round(45 + Math.random() * 30),
      pressure: Math.round(1008 + Math.random() * 10),
      windSpeed: Math.round(5 + Math.random() * 15),
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      condition,
      description: condition.toLowerCase(),
      icon: condition === 'Clear' ? '01d' : condition === 'Clouds' ? '03d' : '50d',
      visibility: Math.round(5 + Math.random() * 5),
      clouds: Math.round(Math.random() * 60),
      sunrise: '06:15 AM',
      sunset: '06:45 PM',
      updatedAt: new Date().toISOString(),
      agricultureInsights: {
        cropRisk: 'Low',
        harvestCondition: 'Good',
        irrigationNeeded: false,
        sprayingCondition: 'Suitable',
        recommendations: ['✅ Good conditions for field operations'],
      },
      isDemo: true,
    };
  }

  getMockForecast(district) {
    const forecast = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const hasRain = Math.random() > 0.7;
      
      forecast.push({
        date: date.toLocaleDateString('en-IN'),
        tempMax: Math.round(32 + Math.random() * 8),
        tempMin: Math.round(22 + Math.random() * 5),
        humidity: Math.round(50 + Math.random() * 30),
        condition: hasRain ? 'Rain' : (Math.random() > 0.5 ? 'Clouds' : 'Clear'),
        rainChance: hasRain ? Math.round(40 + Math.random() * 50) : Math.round(Math.random() * 20),
        rainfall: hasRain ? Math.round(Math.random() * 20) : 0,
      });
    }

    return {
      district,
      forecast,
      rainAlert: forecast.some(d => d.rainChance > 50),
      rainAlertMessage: '⚠️ Demo mode - connect to internet for live forecast',
      totalRainfall: forecast.reduce((sum, d) => sum + d.rainfall, 0),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };
  }

  // Helper functions
  getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  }

  getMostFrequent(arr) {
    const counts = {};
    arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  // Cache management
  async getFromCache(key, ignoreExpiry = false) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (ignoreExpiry || Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return null;
  }

  async saveToCache(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }

  // Get available districts
  getDistricts() {
    return Object.keys(DISTRICTS).map(name => ({
      name,
      ...DISTRICTS[name],
    }));
  }
}

export const weatherService = new WeatherService();
export default weatherService;
