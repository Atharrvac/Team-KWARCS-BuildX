import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export const aiPredictionAPI = {
  // Get AI price prediction
  getPricePrediction: async (crop, days = 7) => {
    try {
      const response = await axios.post(`${API_URL}/ai/predict`, {
        crop,
        days,
        includeConfidence: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting prediction:', error);
      return getMockPrediction(crop);
    }
  },

  // Get trading recommendation
  getTradingRecommendation: async (crop, position) => {
    try {
      const response = await axios.post(`${API_URL}/ai/recommend`, {
        crop,
        position,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting recommendation:', error);
      return { action: 'hold', confidence: 0.5, reason: 'Insufficient data' };
    }
  },

  // Analyze market sentiment
  getMarketSentiment: async (crop) => {
    try {
      const response = await axios.get(`${API_URL}/ai/sentiment/${crop}`);
      return response.data;
    } catch (error) {
      console.error('Error getting sentiment:', error);
      return { sentiment: 'neutral', score: 0 };
    }
  },
};

// Mock prediction data
const getMockPrediction = (crop) => ({
  crop,
  currentPrice: 4250,
  predictions: [
    { date: '2025-11-20', price: 4280, confidence: 0.85 },
    { date: '2025-11-21', price: 4310, confidence: 0.82 },
    { date: '2025-11-22', price: 4290, confidence: 0.78 },
    { date: '2025-11-23', price: 4350, confidence: 0.75 },
    { date: '2025-11-24', price: 4380, confidence: 0.72 },
    { date: '2025-11-25', price: 4400, confidence: 0.68 },
    { date: '2025-11-26', price: 4420, confidence: 0.65 },
  ],
  trend: 'upward',
  recommendation: 'Consider holding or buying',
});

export default aiPredictionAPI;
