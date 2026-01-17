// API Configuration
// Get local machine IP for development
const getLocalIP = () => {
  // This will be replaced by the EXPO_PUBLIC_API_URL env variable
  return '10.250.22.138';
};

const LOCAL_IP = getLocalIP();
const DEV_API_URL = `http://${LOCAL_IP}:3000/api`;
const PROD_API_URL = 'https://api.agrisure.com/api'; // Replace with your production URL

// Use environment variable or default to dev
export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;

// WebSocket URL
export const WS_URL = API_URL.replace('http', 'ws').replace('/api', '');

console.log('🔗 API URL configured:', API_URL);
console.log('🔌 WebSocket URL:', WS_URL);

// API Endpoints
export const ENDPOINTS = {
  // Market
  MARKET_PRICES: '/market/prices',
  MARKET_HISTORY: '/market/history',
  
  // AI
  AI_PREDICTIONS: '/ai/predictions',
  AI_RECOMMENDATIONS: '/ai/recommendations',
  
  // Trading
  TRADING_POSITIONS: '/trading/positions',
  TRADING_EXECUTE: '/trading/execute',
  
  // Learning
  LEARNING_MODULES: '/learning/modules',
  LEARNING_PROGRESS: '/learning/progress',
  LEARNING_CERTIFICATES: '/learning/certificates',
  
  // User
  USER_PROFILE: '/user/profile',
  USER_WALLET: '/wallet/balance',
  
  // Contracts
  CONTRACTS: '/contracts',
  
  // AutoHedge
  AUTOHEDGE: '/autohedge',
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
};

export default {
  API_URL,
  WS_URL,
  ENDPOINTS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
};
