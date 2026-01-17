import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const marketAPI = {
  // Get current market prices
  getCurrentPrices: async () => {
    try {
      const response = await apiClient.get('/market/prices');
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return getMockPrices();
    }
  },

  // Get historical price data
  getHistoricalPrices: async (crop, days = 7) => {
    try {
      const response = await apiClient.get(`/market/history/${crop}?days=${days}`);
      const history = response.data;
      
      // Transform to chart format
      if (history && history.length > 0) {
        return {
          labels: history.map(h => new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })),
          datasets: [{
            data: history.map(h => h.price),
          }],
        };
      }
      
      // Return mock data if no history
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [4200, 4250, 4180, 4300, 4280, 4350, 4400],
        }],
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      // Return mock data on error
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          data: [4200, 4250, 4180, 4300, 4280, 4350, 4400],
        }],
      };
    }
  },

  // Get price alerts
  getPriceAlerts: async (userId) => {
    const response = await apiClient.get(`/market/alerts/${userId}`);
    return response.data;
  },

  // Create price alert
  createPriceAlert: async (alertData) => {
    const response = await apiClient.post('/market/alerts', alertData);
    return response.data;
  },
};

// Mock data for development
const getMockPrices = () => [
  { id: 1, crop: 'soybean', name: 'Soybean', price: 4250, change: 2.5, unit: '₹/quintal' },
  { id: 2, crop: 'mustard', name: 'Mustard', price: 5100, change: -1.2, unit: '₹/quintal' },
  { id: 3, crop: 'groundnut', name: 'Groundnut', price: 5800, change: 3.8, unit: '₹/quintal' },
  { id: 4, crop: 'sunflower', name: 'Sunflower', price: 6200, change: 1.5, unit: '₹/quintal' },
];

export default marketAPI;
