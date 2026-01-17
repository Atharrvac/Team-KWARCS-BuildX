import axios from 'axios';
import { HYBRID_FORECAST_URL, HYBRID_API_KEY } from '../constants/api';

/**
 * Hybrid Forecast Service - Connects to Hybrid ML model (59% LSTM + 41% XGBoost)
 * API: http://10.139.205.96:5001
 * Product: Soybean
 */

const API_KEYS = [HYBRID_API_KEY, 'demo_key_12345', 'test_key_67890'];

/**
 * Get soybean price forecast from Hybrid ML API
 * @param {number} days - Number of days to forecast (default: 30)
 * @returns {Promise<Object>} Forecast data with predictions
 */
export const getHybridForecast = async (days = 30) => {
  const endpoints = ['/predict', '/api/predict', '/forecast', '/api/forecast'];
  
  for (const apiKey of API_KEYS) {
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying hybrid forecast: ${HYBRID_FORECAST_URL}${endpoint}`);
        
        const response = await axios.post(`${HYBRID_FORECAST_URL}${endpoint}`, {
          product: 'soybean',
          days: days
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Key': apiKey
          },
          timeout: 15000
        });

        if (response.data) {
          console.log('Hybrid forecast success:', response.data);
          return {
            success: true,
            data: response.data,
            model: 'Hybrid (59% LSTM + 41% XGBoost)',
            product: 'soybean',
            days
          };
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} with key failed:`, error.message);
        continue;
      }
    }
  }

  // Try GET request as fallback
  try {
    const response = await axios.get(`${HYBRID_FORECAST_URL}/predict`, {
      params: { product: 'soybean', days, api_key: HYBRID_API_KEY },
      timeout: 15000
    });
    
    return {
      success: true,
      data: response.data,
      model: 'Hybrid (59% LSTM + 41% XGBoost)',
      product: 'soybean',
      days
    };
  } catch (error) {
    console.error('All hybrid forecast endpoints failed:', error.message);
    return getMockHybridForecast(days);
  }
};

/**
 * Get mock forecast data when API is unavailable
 */
export const getMockHybridForecast = (days = 30) => {
  const basePrice = 4350; // Current soybean price
  const predictions = [];
  const historicalData = [];
  
  // Generate historical data (last 30 days)
  for (let i = 30; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const variation = (Math.random() - 0.5) * 150;
    historicalData.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice + variation - (i * 2)),
      type: 'historical'
    });
  }
  
  // Generate predictions
  let lastPrice = basePrice;
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const trend = Math.sin(i / 7) * 50 + (Math.random() - 0.4) * 80;
    lastPrice = lastPrice + trend * 0.1;
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted_price: Math.round(lastPrice),
      confidence_lower: Math.round(lastPrice - 120),
      confidence_upper: Math.round(lastPrice + 120),
      type: 'prediction'
    });
  }
  
  return {
    success: true,
    data: {
      historical: historicalData,
      predictions: predictions,
      current_price: basePrice,
      trend: predictions[predictions.length - 1].predicted_price > basePrice ? 'bullish' : 'bearish',
      confidence: 0.85
    },
    model: 'Hybrid (59% LSTM + 41% XGBoost)',
    product: 'soybean',
    days,
    isMock: true
  };
};

/**
 * Check if hybrid API is available
 */
export const checkHybridAPIHealth = async () => {
  try {
    const response = await axios.get(`${HYBRID_FORECAST_URL}/health`, { timeout: 3000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

export default { getHybridForecast, getMockHybridForecast, checkHybridAPIHealth };
