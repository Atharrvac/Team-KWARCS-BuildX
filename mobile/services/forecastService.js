import axios from 'axios';
import { FORECAST_API_URL, FORECAST_API_KEY } from '../constants/api';

/**
 * Forecast Service - Connects to Gradio ML model for castor price predictions
 * API: http://10.217.104.97:7860
 * API Key: castor_d167aa169b5e4219a66779e45fbaaefe
 */

/**
 * Get price forecast from Gradio API
 * @param {string} commodity - Commodity name (default: 'castor')
 * @param {number} days - Number of days to forecast (default: 7)
 * @returns {Promise<Object>} Forecast data
 */
export const getForecast = async (commodity = 'castor', days = 7) => {
  const endpoints = [
    '/api/predict',
    '/run/predict', 
    '/call/predict',
    '/api/forecast',
    '/predict'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying forecast endpoint: ${FORECAST_API_URL}${endpoint}`);
      
      const response = await axios.post(`${FORECAST_API_URL}${endpoint}`, {
        data: [commodity, days]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FORECAST_API_KEY}`,
        },
        timeout: 30000
      });

      console.log('Forecast API response:', JSON.stringify(response.data));
      
      // Parse Gradio response format
      let forecastData = response.data?.data || response.data?.output || response.data;
      
      // If it's nested in an array, extract it
      if (Array.isArray(forecastData) && forecastData.length === 1) {
        forecastData = forecastData[0];
      }

      return {
        success: true,
        data: forecastData,
        commodity,
        days,
        raw: response.data
      };
    } catch (error) {
      console.log(`Endpoint ${endpoint} failed:`, error.message);
      continue;
    }
  }

  // Try with query parameters instead
  try {
    console.log('Trying with query params...');
    const response = await axios.get(`${FORECAST_API_URL}/api/predict`, {
      params: {
        commodity,
        days,
        api_key: FORECAST_API_KEY
      },
      timeout: 30000
    });
    
    return {
      success: true,
      data: response.data?.data || response.data,
      commodity,
      days
    };
  } catch (error) {
    console.error('All forecast endpoints failed:', error.message);
    return {
      success: false,
      error: 'Could not connect to forecast API. Make sure the ML server is running.',
      commodity,
      days
    };
  }
};

/**
 * Get real-time price prediction
 * @param {string} commodity - Commodity name
 * @returns {Promise<Object>} Current price prediction
 */
export const getRealTimePrediction = async (commodity = 'castor') => {
  try {
    const result = await getForecast(commodity, 1);
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Real-time prediction error:', error.message);
    return {
      success: false,
      error: error.message,
      commodity
    };
  }
};

/**
 * Check if forecast API is available
 * @returns {Promise<boolean>}
 */
export const checkForecastAPIHealth = async () => {
  try {
    const response = await axios.get(`${FORECAST_API_URL}/`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.log('Forecast API offline, using mock data');
    return false;
  }
};

/**
 * Get mock forecast data when API is unavailable
 */
export const getMockForecast = (commodity = 'castor', days = 7) => {
  const basePrices = {
    castor: 6788,
    soybean: 4300,
    mustard: 5850,
    groundnut: 6520,
    rapeseed: 5950,
  };
  
  const basePrice = basePrices[commodity] || 5000;
  const forecast = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const variation = (Math.random() - 0.5) * 100;
    const trend = i * (Math.random() > 0.5 ? 5 : -3);
    forecast.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice + variation + trend),
      predicted_price: Math.round(basePrice + variation + trend),
    });
  }
  
  return {
    success: true,
    data: forecast,
    commodity,
    days,
    isMock: true,
  };
};

export default {
  getForecast,
  getRealTimePrediction,
  checkForecastAPIHealth,
  getMockForecast,
};
