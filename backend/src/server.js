import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { testConnection } from './db/index.js';
import websocketService from './services/websocketService.js';

dotenv.config();

// Import routes
import marketRoutes from './routes/market.js';
import aiRoutes from './routes/ai.js';
import contractsRoutes from './routes/contracts.js';
import tradingRoutes from './routes/trading.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import learningRoutes from './routes/learning.js';
import autohedgeRoutes from './routes/autohedge.js';
import hedgingRoutes from './routes/hedging.js';
import dssRoutes from './routes/dss.js';
import userRoutes from './routes/user.js';
import notificationsRoutes from './routes/notifications.js';
import insuranceRoutes from './routes/insurance.js';
import communityRoutes from './routes/community.js';
import feedbackRoutes from './routes/feedback.js';
import marketplaceRoutes from './routes/marketplace.js';
import paymentsRoutes from './routes/payments.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'];

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    mode: process.env.DATABASE_URL ? 'production' : 'development',
  });
});

// API Routes
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/autohedge', autohedgeRoutes);
app.use('/api/hedging', hedgingRoutes);
app.use('/api/dss', dssRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/payments', paymentsRoutes);

// WebSocket stats endpoint
app.get('/api/ws/stats', (req, res) => {
  res.json(websocketService.getStats());
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    error: statusCode === 500 && isProduction 
      ? 'Internal server error' 
      : (err.message || 'Internal server error'),
    ...(statusCode !== 500 && !isProduction && { stack: err.stack }),
  });
});

// Initialize WebSocket service
websocketService.initialize(server);

// Start server
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🌾 OILSEED HEDGING PLATFORM API`);
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket server running on ws://0.0.0.0:${PORT}`);
  console.log(`📊 Market API: http://localhost:${PORT}/api/market`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
  console.log(`📝 Contracts API: http://localhost:${PORT}/api/contracts`);
  console.log(`💹 Trading API: http://localhost:${PORT}/api/trading`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`💰 Wallet API: http://localhost:${PORT}/api/wallet`);
  console.log(`📚 Learning API: http://localhost:${PORT}/api/learning`);
  console.log(`🛡️  AutoHedge API: http://localhost:${PORT}/api/autohedge`);
  console.log(`⚖️  Hedging API: http://localhost:${PORT}/api/hedging`);
  console.log(`🎯 DSS API: http://localhost:${PORT}/api/dss`);
  console.log(`🔔 Notifications API: http://localhost:${PORT}/api/notifications`);
  console.log(`🛡️  Insurance API: http://localhost:${PORT}/api/insurance`);
  console.log(`👥 Community API: http://localhost:${PORT}/api/community`);
  console.log(`💬 Feedback API: http://localhost:${PORT}/api/feedback`);
  console.log(`🏪 Marketplace API: http://localhost:${PORT}/api/marketplace`);
  console.log(`💳 Payments API: http://localhost:${PORT}/api/payments`);
  console.log(`📈 WebSocket Stats: http://localhost:${PORT}/api/ws/stats`);
  
  // Test database connection
  console.log(`\n🔌 Testing database connection...`);
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.log(`⚠️  Database not connected - using mock data`);
    console.log(`   Set DATABASE_URL in .env to enable database features\n`);
  } else {
    console.log(`✅ Database ready\n`);
  }
});

export default app;
