import express from 'express';
import tradingService from '../services/tradingService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Available futures contracts (static data)
const availableFutures = [
  {
    id: 1,
    name: 'Soybean Oct 2024',
    exchange: 'NCDEX • Expires 28 Oct',
    price: 4820,
    lot: '10 MT •',
    margin: '₹40,000',
    change: 98,
    changePercent: 2.1,
    tag: 'Hedge harvest',
  },
  {
    id: 2,
    name: 'Soybean Nov 2024',
    exchange: 'NCDEX • Expires 28 Nov',
    price: 4890,
    lot: '10 MT •',
    margin: '₹49,100',
    change: 64,
    changePercent: 1.3,
    tag: 'Post-harvest',
  },
  {
    id: 3,
    name: 'Mustard Oct 2024',
    exchange: 'NCDEX • Expires 30 Oct',
    price: 6430,
    lot: '10 MT •',
    margin: '₹65,800',
    change: -48,
    changePercent: -0.6,
    tag: 'Diversify',
  },
  {
    id: 4,
    name: 'Soy Oil Sep 2024',
    exchange: 'NCDEX • Expires 15 Sep',
    price: 11260,
    lot: '10 MT',
    margin: '₹12,400',
    change: 116,
    changePercent: 1.3,
    tag: 'Crush hedge',
  },
];

// Test endpoint
router.post('/test', (req, res) => {
  console.log('[TEST] Test endpoint hit!');
  console.log('[TEST] Body:', req.body);
  res.json({ success: true, body: req.body });
});

// New clean position endpoint
router.post('/open-position', async (req, res) => {
  console.log('[OPEN-POSITION] Request received:', req.body);
  
  try {
    const { userId, crop, type, quantity, entryPrice } = req.body;
    
    // Validation
    if (!userId || !crop || !type || !quantity || !entryPrice) {
      console.log('[OPEN-POSITION] Validation failed');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'crop', 'type', 'quantity', 'entryPrice']
      });
    }
    
    if (!['long', 'short'].includes(type)) {
      return res.status(400).json({ error: 'Type must be long or short' });
    }
    
    if (quantity <= 0 || entryPrice <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be positive' });
    }
    
    console.log('[OPEN-POSITION] Opening position:', { userId, crop, type, quantity, entryPrice });
    
    const position = await tradingService.openPosition(parseInt(userId), {
      crop,
      type,
      quantity: parseFloat(quantity),
      entryPrice: parseFloat(entryPrice),
    });
    
    console.log('[OPEN-POSITION] Position created:', position);
    
    res.status(201).json({
      success: true,
      position,
      message: `${type.toUpperCase()} position opened for ${crop}`
    });
    
  } catch (error) {
    console.error('[OPEN-POSITION] Error:', error);
    res.status(500).json({ 
      error: 'Failed to open position', 
      details: error.message,
      success: false
    });
  }
});

// Get available futures
router.get('/futures', (req, res) => {
  res.json(availableFutures);
});

// Get futures by crop
router.get('/futures/:crop', (req, res) => {
  const { crop } = req.params;
  const filtered = availableFutures.filter(f => 
    f.name.toLowerCase().includes(crop.toLowerCase())
  );
  res.json(filtered);
});

// Get user positions - WORKING VERSION
router.get('/positions/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Use global mock storage
    if (!global.mockPositions) global.mockPositions = [];
    
    const userPositions = global.mockPositions
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
    
    res.json(userPositions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Create new position (buy/sell futures) - WORKING VERSION
router.post('/positions', async (req, res) => {
  try {
    const { userId, crop, type, quantity, entryPrice } = req.body;
    
    // Validation
    if (!userId || !crop || !type || !quantity || !entryPrice) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'crop', 'type', 'quantity', 'entryPrice']
      });
    }

    if (!['long', 'short'].includes(type)) {
      return res.status(400).json({ error: 'Type must be long or short' });
    }

    const numQuantity = parseFloat(quantity);
    const numEntryPrice = parseFloat(entryPrice);

    if (isNaN(numQuantity) || numQuantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    if (isNaN(numEntryPrice) || numEntryPrice <= 0) {
      return res.status(400).json({ error: 'Entry price must be a positive number' });
    }

    const numUserId = parseInt(userId);
    if (isNaN(numUserId) || numUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Generate unique ID using timestamp + random to avoid collisions
    const positionId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    
    // Create position using mock data (since DB is not available)
    const newPosition = {
      id: positionId,
      userId: numUserId,
      crop: crop.trim(),
      type,
      quantity: numQuantity,
      entryPrice: numEntryPrice,
      exitPrice: null,
      status: 'open',
      pnl: null,
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    
    // Store in a simple global array for this session
    if (!global.mockPositions) global.mockPositions = [];
    global.mockPositions.push(newPosition);
    
    // Also create a corresponding contract
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 60); // 60 days expiry
    
    const newContract = {
      id: positionId, // Same ID to link them
      userId: numUserId,
      crop: crop.trim(),
      quantity: numQuantity,
      lockedPrice: numEntryPrice,
      currentPrice: numEntryPrice,
      status: 'active',
      entryDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      pnl: 0,
      type: 'futures',
      tradingPositionId: positionId, // Link to trading position
    };
    
    // Store contract
    if (!global.mockContracts) global.mockContracts = [];
    global.mockContracts.push(newContract);
    
    return res.status(201).json({
      position: newPosition,
      contract: newContract,
      message: 'Position and contract created successfully'
    });
    
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to open position', 
      details: 'Server error'
    });
  }
});

// Close position - WORKING VERSION
router.post('/positions/:id/close', async (req, res) => {
  try {
    const { exitPrice } = req.body;
    const positionId = parseInt(req.params.id);

    if (isNaN(positionId) || positionId <= 0) {
      return res.status(400).json({ error: 'Invalid position ID' });
    }

    if (!exitPrice) {
      return res.status(400).json({ error: 'Exit price is required' });
    }

    const numExitPrice = parseFloat(exitPrice);
    if (isNaN(numExitPrice) || numExitPrice <= 0) {
      return res.status(400).json({ error: 'Exit price must be a positive number' });
    }
    
    // Use global mock storage
    if (!global.mockPositions) global.mockPositions = [];
    
    const position = global.mockPositions.find(p => p.id === positionId);
    
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    if (position.status === 'closed') {
      return res.status(400).json({ error: 'Position already closed' });
    }
    
    // Calculate P&L
    const quantity = parseFloat(position.quantity);
    const entry = parseFloat(position.entryPrice);
    
    const pnl = position.type === 'long' 
      ? (numExitPrice - entry) * quantity
      : (entry - numExitPrice) * quantity;
    
    // Update position
    position.exitPrice = numExitPrice;
    position.pnl = pnl;
    position.status = 'closed';
    position.closedAt = new Date().toISOString();
    
    // Also update the corresponding contract
    if (!global.mockContracts) global.mockContracts = [];
    const contract = global.mockContracts.find(c => c.id === positionId);
    
    if (contract) {
      contract.status = 'settled';
      contract.settledDate = new Date().toISOString();
      contract.currentPrice = parseFloat(exitPrice);
      contract.pnl = Math.round(pnl);
    }
    
    res.json({
      position,
      contract,
      message: 'Position and contract closed successfully'
    });
  } catch (error) {
    console.error('Error closing position:', error);
    res.status(500).json({ error: 'Failed to close position' });
  }
});

// Get trade history
router.get('/history/:userId', async (req, res) => {
  try {
    const positions = await tradingService.getUserPositions(parseInt(req.params.userId), 'closed');
    res.json(positions);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get P&L summary - WORKING VERSION
router.get('/pnl/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Use global mock storage
    if (!global.mockPositions) global.mockPositions = [];
    
    const userPositions = global.mockPositions.filter(p => p.userId === userId);
    const openPositions = userPositions.filter(p => p.status === 'open');
    const closedPositions = userPositions.filter(p => p.status === 'closed');
    
    const totalPnl = closedPositions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);
    const winningTrades = closedPositions.filter(p => parseFloat(p.pnl || 0) > 0).length;
    const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length * 100).toFixed(0) : 0;
    
    const summary = {
      totalPnl: totalPnl.toFixed(2),
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      winRate,
      winningTrades,
      losingTrades: closedPositions.length - winningTrades,
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ error: 'Failed to fetch P&L' });
  }
});

// Get wallet balance
router.get('/wallet/:userId', async (req, res) => {
  try {
    const balance = await tradingService.getWalletBalance(parseInt(req.params.userId));
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

export default router;
