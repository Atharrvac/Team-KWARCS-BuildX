// Uses environment variable for API URL
// For physical device: set EXPO_PUBLIC_API_URL in .env
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.250.22.138:3000/api";

// Forecast API (Gradio-based ML model)
export const FORECAST_API_URL = process.env.EXPO_PUBLIC_FORECAST_API_URL || "http://10.217.104.97:7860";
export const FORECAST_API_KEY = process.env.EXPO_PUBLIC_FORECAST_API_KEY || "castor_d167aa169b5e4219a66779e45fbaaefe";

// Hybrid ML Forecast API (59% LSTM + 41% XGBoost)
export const HYBRID_FORECAST_URL = process.env.EXPO_PUBLIC_HYBRID_FORECAST_URL || "http://10.139.205.96:5001";
export const HYBRID_API_KEY = process.env.EXPO_PUBLIC_HYBRID_API_KEY || "hybrid_api_key_2025";
