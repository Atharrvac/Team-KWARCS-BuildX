import express from 'express';
import aiService from '../services/aiService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Price prediction endpoint
router.post('/predict', optionalAuth, async (req, res) => {
  try {
    const { crop, days = 7, currentPrice } = req.body;
    
    if (!crop) {
      return res.status(400).json({ error: 'Crop is required' });
    }
    
    const prediction = await aiService.generatePrediction(crop, days, currentPrice);
    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Trading recommendation
router.post('/recommend', optionalAuth, async (req, res) => {
  try {
    const { crop, position, currentPrice } = req.body;
    
    if (!crop) {
      return res.status(400).json({ error: 'Crop is required' });
    }
    
    // Generate prediction first
    const prediction = await aiService.generatePrediction(crop, 7, currentPrice);
    
    // Determine action based on trend
    let action = 'hold';
    const avgPredicted = prediction.predictions.reduce((sum, p) => sum + p.price, 0) / prediction.predictions.length;
    const change = ((avgPredicted - prediction.currentPrice) / prediction.currentPrice) * 100;
    
    if (change > 2) action = 'buy';
    else if (change < -2) action = 'sell';
    
    res.json({
      action,
      confidence: 0.75,
      reason: prediction.recommendation,
      suggestedPrice: Math.round(avgPredicted),
      trend: prediction.trend,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

// Market sentiment analysis
router.get('/sentiment/:crop', optionalAuth, async (req, res) => {
  try {
    const { crop } = req.params;
    const sentiment = await aiService.getMarketSentiment(crop);
    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// Get AI insights for dashboard
router.get('/insights/:crop', optionalAuth, async (req, res) => {
  try {
    const { crop } = req.params;
    const days = parseInt(req.query.days) || 7;
    
    const [prediction, sentiment] = await Promise.all([
      aiService.generatePrediction(crop, days),
      aiService.getMarketSentiment(crop),
    ]);
    
    res.json({
      crop,
      prediction,
      sentiment,
      summary: {
        trend: prediction.trend,
        confidence: prediction.predictions[0]?.confidence || 0.7,
        recommendation: prediction.recommendation,
      },
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Get price forecast (GET endpoint for easier frontend integration)
router.get('/predict/:crop', optionalAuth, async (req, res) => {
  try {
    const { crop } = req.params;
    const days = parseInt(req.query.days) || 7;
    const currentPrice = req.query.currentPrice ? parseFloat(req.query.currentPrice) : null;
    
    const prediction = await aiService.generatePrediction(crop, days, currentPrice);
    res.json(prediction);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Batch predictions for multiple crops
router.post('/predict/batch', optionalAuth, async (req, res) => {
  try {
    const { crops, days = 7 } = req.body;
    
    if (!crops || !Array.isArray(crops)) {
      return res.status(400).json({ error: 'Crops array is required' });
    }
    
    const predictions = await Promise.all(
      crops.map(crop => aiService.generatePrediction(crop, days))
    );
    
    res.json({ predictions });
  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({ error: 'Failed to generate batch predictions' });
  }
});

// Real-time forecast update (for WebSocket integration)
router.post('/forecast/update', optionalAuth, async (req, res) => {
  try {
    const { crop, days = 7, currentPrice } = req.body;
    
    const prediction = await aiService.generatePrediction(crop, days, currentPrice);
    
    // Broadcast to WebSocket clients if available
    if (req.app.locals.websocketService) {
      req.app.locals.websocketService.broadcast({
        type: 'PREDICTION_UPDATE',
        data: {
          crop,
          prediction,
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    res.json(prediction);
  } catch (error) {
    console.error('Forecast update error:', error);
    res.status(500).json({ error: 'Failed to update forecast' });
  }
});

export default router;
