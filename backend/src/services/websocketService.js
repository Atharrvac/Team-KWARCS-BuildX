import { WebSocketServer } from 'ws';
import marketService from './marketService.js';
import aiService from './aiService.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.userConnections = new Map(); // Map userId -> Set of WebSocket connections
    this.priceUpdateInterval = null;
    this.marketDataInterval = null;
    this.pendingSettlements = new Map(); // Map contractId -> settlement request data
  }

  // Initialize WebSocket server
  initialize(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);
      
      // Send initial data
      this.sendInitialData(ws);
      
      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
        // Remove from user connections
        this.removeUserConnection(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error.message || error);
        this.clients.delete(ws);
        this.removeUserConnection(ws);
      });
    });
    
    // Start real-time data broadcasting
    this.startRealTimeUpdates();
    
    console.log('✅ WebSocket server initialized');
  }
  
  // Register user connection for targeted messaging
  registerUserConnection(userId, ws) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId).add(ws);
    ws.userId = userId;
    console.log(`📱 User ${userId} connected (${this.userConnections.get(userId).size} connections)`);
  }
  
  // Remove user connection
  removeUserConnection(ws) {
    if (ws.userId && this.userConnections.has(ws.userId)) {
      this.userConnections.get(ws.userId).delete(ws);
      if (this.userConnections.get(ws.userId).size === 0) {
        this.userConnections.delete(ws.userId);
      }
      console.log(`📱 User ${ws.userId} disconnected`);
    }
  }
  
  // Send initial data to new client
  async sendInitialData(ws) {
    try {
      // Send current market prices
      const prices = await marketService.getCurrentPrices();
      this.sendToClient(ws, {
        type: 'INITIAL_PRICES',
        data: prices
      });
      
      // Send market summary
      const summary = await marketService.getMarketSummary();
      this.sendToClient(ws, {
        type: 'MARKET_SUMMARY',
        data: summary
      });
      
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }
  
  // Handle messages from clients
  handleClientMessage(ws, message) {
    switch (message.type) {
      case 'SUBSCRIBE_PRICES':
        // Client wants to subscribe to specific crop prices
        ws.subscribedCrops = message.crops || ['soybean', 'mustard', 'groundnut', 'sunflower'];
        break;
        
      case 'REQUEST_PREDICTION':
        // Client requests AI prediction
        this.handlePredictionRequest(ws, message.data);
        break;
        
      case 'PING':
        // Heartbeat
        this.sendToClient(ws, { type: 'PONG' });
        break;
      
      case 'REGISTER_USER':
        // Register user for targeted notifications
        if (message.userId) {
          this.registerUserConnection(message.userId, ws);
          this.sendToClient(ws, { type: 'USER_REGISTERED', userId: message.userId });
        }
        break;
      
      case 'SETTLEMENT_REQUEST':
        // Buyer requests settlement - notify farmer
        this.handleSettlementRequest(ws, message.data);
        break;
      
      case 'SETTLEMENT_RESPONSE':
        // Farmer responds to settlement request
        this.handleSettlementResponse(ws, message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  // Handle settlement request from buyer
  async handleSettlementRequest(ws, data) {
    const { contractId, farmerId, buyerId, buyerName, contractDetails } = data;
    
    // Ensure contractId is a string for consistent comparison
    const contractIdStr = String(contractId);
    
    console.log(`🔔 Settlement request: Buyer ${buyerId} -> ALL FARMERS for contract ${contractIdStr}`);
    
    // Store pending settlement
    this.pendingSettlements.set(contractIdStr, {
      contractId: contractIdStr,
      farmerId,
      buyerId,
      buyerName,
      contractDetails,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    });
    
    // BROADCAST to ALL connected clients (all farmers will see it)
    // Each farmer's app will filter based on their mode (seller mode)
    this.broadcast({
      type: 'SETTLEMENT_REQUEST_RECEIVED',
      data: {
        contractId: contractIdStr,
        farmerId, // Original contract owner
        buyerId,
        buyerName: buyerName || 'Buyer',
        contractDetails,
        message: `${buyerName || 'A buyer'} wants to settle a contract for ${contractDetails?.crop || 'crop'}`,
        requestedAt: new Date().toISOString()
      }
    });
    
    console.log(`📢 Settlement request broadcasted to ${this.clients.size} connected clients`);
    
    // Confirm to buyer that request was sent
    this.sendToClient(ws, {
      type: 'SETTLEMENT_REQUEST_SENT',
      data: {
        contractId: contractIdStr,
        message: 'Settlement request sent to all farmers. Waiting for approval...'
      }
    });
  }
  
  // Handle settlement response from farmer
  async handleSettlementResponse(ws, data) {
    const { contractId, approved, farmerId } = data;
    
    // Ensure contractId is a string for consistent comparison
    const contractIdStr = String(contractId);
    
    const pendingSettlement = this.pendingSettlements.get(contractIdStr);
    if (!pendingSettlement) {
      console.log(`⚠️ No pending settlement found for contract ${contractIdStr}`);
      // Still broadcast the response even if we don't have the pending settlement
      // This ensures the buyer gets notified
    }
    
    const buyerId = pendingSettlement?.buyerId;
    const contractDetails = pendingSettlement?.contractDetails;
    
    console.log(`📝 Settlement response: Farmer ${farmerId} ${approved ? 'APPROVED' : 'REJECTED'} contract ${contractIdStr}`);
    
    // Update pending settlement status if exists
    if (pendingSettlement) {
      pendingSettlement.status = approved ? 'approved' : 'rejected';
      pendingSettlement.respondedAt = new Date().toISOString();
      pendingSettlement.respondedBy = farmerId;
    }
    
    // BROADCAST response to ALL clients so everyone knows the settlement was handled
    this.broadcast({
      type: 'SETTLEMENT_RESPONSE_RECEIVED',
      data: {
        contractId: contractIdStr,
        approved,
        farmerId,
        buyerId,
        contractDetails,
        message: approved 
          ? `Settlement approved for ${contractDetails?.crop || 'contract'}!`
          : `Settlement declined for ${contractDetails?.crop || 'contract'}.`,
        respondedAt: new Date().toISOString()
      }
    });
    
    console.log(`📢 Settlement response broadcasted to ${this.clients.size} connected clients`);
    
    // Also broadcast that this settlement request is now closed
    this.broadcast({
      type: 'SETTLEMENT_CLOSED',
      data: {
        contractId: contractIdStr,
        status: approved ? 'approved' : 'rejected',
        respondedBy: farmerId
      }
    });
    
    // Confirm to the farmer who responded
    this.sendToClient(ws, {
      type: 'SETTLEMENT_RESPONSE_SENT',
      data: {
        contractId: contractIdStr,
        approved,
        message: approved ? 'Settlement approved and buyer notified' : 'Settlement declined'
      }
    });
    
    // Clean up the pending settlement
    this.pendingSettlements.delete(contractIdStr);
  }
  
  // Send message to specific user by ID
  sendToUserById(userId, message) {
    const userSockets = this.userConnections.get(userId);
    if (userSockets && userSockets.size > 0) {
      const messageStr = JSON.stringify(message);
      userSockets.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            console.error(`Error sending to user ${userId}:`, error);
          }
        }
      });
      console.log(`📤 Sent ${message.type} to user ${userId}`);
      return true;
    }
    console.log(`⚠️ User ${userId} not connected, message queued`);
    return false;
  }
  
  // Get pending settlement for a contract
  getPendingSettlement(contractId) {
    return this.pendingSettlements.get(contractId);
  }
  
  // Clear pending settlement
  clearPendingSettlement(contractId) {
    this.pendingSettlements.delete(contractId);
  }
  
  // Handle prediction requests
  async handlePredictionRequest(ws, data) {
    try {
      const { crop, days } = data;
      const prediction = await aiService.generatePrediction(crop, days);
      
      this.sendToClient(ws, {
        type: 'PREDICTION_UPDATE',
        data: {
          crop,
          prediction,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error handling prediction request:', error);
    }
  }
  
  // Start real-time updates with automatic recalculation
  startRealTimeUpdates() {
    // Store last prices for change detection
    this.lastPrices = {};
    
    // Price updates every 3 seconds (faster for real-time feel)
    this.priceUpdateInterval = setInterval(async () => {
      try {
        const prices = await marketService.getCurrentPrices();
        
        // Detect significant price changes
        const significantChanges = [];
        prices.forEach(price => {
          const lastPrice = this.lastPrices[price.crop];
          if (lastPrice) {
            const changePercent = Math.abs(((price.price - lastPrice) / lastPrice) * 100);
            if (changePercent > 0.5) { // 0.5% change triggers recalculation
              significantChanges.push(price.crop);
            }
          }
          this.lastPrices[price.crop] = price.price;
        });
        
        // Broadcast price updates
        this.broadcast({
          type: 'PRICE_UPDATE',
          data: prices,
          timestamp: new Date().toISOString(),
          significantChanges
        });
        
        // Auto-recalculate forecasts for crops with significant changes
        if (significantChanges.length > 0) {
          this.triggerForecastRecalculation(significantChanges);
        }
      } catch (error) {
        console.error('Error broadcasting price updates:', error);
      }
    }, 3000); // Every 3 seconds
    
    // Market data updates every 15 seconds (more frequent)
    this.marketDataInterval = setInterval(async () => {
      try {
        const summary = await marketService.getMarketSummary();
        this.broadcast({
          type: 'MARKET_UPDATE',
          data: summary,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error broadcasting market updates:', error);
      }
    }, 15000); // Every 15 seconds
    
    // Forecast updates every 30 seconds (much more frequent)
    this.forecastUpdateInterval = setInterval(async () => {
      try {
        const crops = ['soybean', 'mustard', 'groundnut', 'sunflower'];
        for (const crop of crops) {
          const aiService = (await import('./aiService.js')).default;
          const currentPrice = await marketService.getCurrentPrice(crop);
          const prediction = await aiService.generatePrediction(crop, 14, currentPrice);
          
          this.broadcast({
            type: 'PREDICTION_UPDATE',
            data: {
              crop,
              prediction,
              timestamp: new Date().toISOString(),
              autoGenerated: true
            }
          });
        }
      } catch (error) {
        console.error('Error broadcasting forecast updates:', error);
      }
    }, 30000); // Every 30 seconds
    
    console.log('✅ Real-time updates started (prices: 3s, market: 15s, forecasts: 30s)');
  }
  
  // Trigger immediate forecast recalculation for specific crops
  async triggerForecastRecalculation(crops) {
    try {
      // Dynamic import to avoid circular dependency
      const { default: aiService } = await import('./aiService.js');
      const { default: marketService } = await import('./marketService.js');
      
      for (const crop of crops) {
        const currentPrice = await marketService.getCurrentPrice(crop);
        const prediction = await aiService.generatePrediction(crop, 14, currentPrice);
        
        this.broadcast({
          type: 'PREDICTION_UPDATE',
          data: {
            crop,
            prediction,
            timestamp: new Date().toISOString(),
            triggered: 'price_change'
          }
        });
      }
      
      console.log(`🔄 Auto-recalculated forecasts for: ${crops.join(', ')}`);
    } catch (error) {
      console.error('Error in forecast recalculation:', error);
    }
  }
  
  // Broadcast message to all connected clients
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('Error sending message to client:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }
  
  // Send message to specific client
  sendToClient(client, message) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  }
  
  // Send message to specific user (by userId)
  sendToUser(userId, message) {
    // Try targeted delivery first
    const delivered = this.sendToUserById(userId, {
      type: 'USER_NOTIFICATION',
      ...message
    });
    
    // Fallback to broadcast if user not found
    if (!delivered) {
      this.broadcast({
        type: 'USER_NOTIFICATION',
        userId: parseInt(userId),
        ...message
      });
    }
  }
  
  // Broadcast notification to all clients
  broadcastNotification(notification) {
    this.broadcast({
      type: 'NOTIFICATION',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }
  
  // Broadcast price alert
  broadcastPriceAlert(crop, currentPrice, threshold, direction) {
    this.broadcast({
      type: 'PRICE_ALERT',
      data: {
        crop,
        currentPrice,
        threshold,
        direction, // 'above' or 'below'
        message: `${crop} price ${direction} ₹${threshold}/quintal (Current: ₹${currentPrice})`
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Broadcast trading signal
  broadcastTradingSignal(signal) {
    this.broadcast({
      type: 'TRADING_SIGNAL',
      data: signal,
      timestamp: new Date().toISOString()
    });
  }
  
  // Broadcast market news
  broadcastMarketNews(news) {
    this.broadcast({
      type: 'MARKET_NEWS',
      data: news,
      timestamp: new Date().toISOString()
    });
  }
  
  // Stop real-time updates
  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    
    if (this.forecastUpdateInterval) {
      clearInterval(this.forecastUpdateInterval);
    }
    
    // Close all client connections
    this.clients.forEach(client => {
      client.close();
    });
    
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('✅ WebSocket service stopped');
  }
  
  // Get connection stats
  getStats() {
    return {
      connectedClients: this.clients.size,
      isRunning: !!this.wss,
      uptime: process.uptime()
    };
  }
}

export default new WebSocketService();