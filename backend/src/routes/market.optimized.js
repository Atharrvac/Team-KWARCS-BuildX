import express from 'express';
import { db } from '../db/index.js';
import { priceAlerts, notifications } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import marketService from '../services/marketService.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Simple in-memory cache with TTL
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttlSeconds = 5) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// Helper: Generate OHLC data (reusable)
function generateOHLC(basePrice) {
  const variation = (Math.random() - 0.5) * 50;
  const open = basePrice + variation;
  const high = basePrice + Math.abs(variation) + Math.random() * 30;
  const low = basePrice - Math.abs(variation) - Math.random() * 20;
  const close = basePrice;
  
  return {
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    prevClose: Math.round((basePrice - (basePrice * 0.02)) * 100) / 100,
    dayRange: `${Math.round(low * 100) / 100} - ${Math.round(high * 100) / 100}`,
    avgPrice: Math.round(((open + high + low + close) / 4) * 100) / 100,
  };
}

// Get current prices with caching
router.get('/prices', optionalAuth, async (req, res) => {
  try {
    // Check cache first
    const cached = cache.get('prices');
    if (cached) {
      return res.json(cached);
    }

    const prices = await marketService.getCurrentPrices();
    
    // Format response with OHLC data
    const formatted = prices.map((p, index) => {
      const basePrice = parseFloat(p.price);
      const ohlc = generateOHLC(basePrice);
      
      return {
        id: p.id || index + 1,
        crop: p.crop,
        name: p.crop.charAt(0).toUpperCase() + p.crop.slice(1),
        price: basePrice,
        change: parseFloat(p.change || 0),
        type: p.type || 'Spot',
        unit: '₹/quintal',
        volume: p.volume || Math.floor(Math.random() * 50000) + 10000,
        ...ohlc,
      };
    });
    
    // Cache for 5 seconds
    cache.set('prices', formatted, 5);
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Get market ticker data with caching
router.get('/ticker', async (req, res) => {
  try {
    const cached = cache.get('ticker');
    if (cached) {
      return res.json(cached);
    }

    const prices = await marketService.getCurrentPrices();
    const ticker = {};
    
    prices.slice(0, 2).forEach(p => {
      ticker[p.crop] = {
        price: parseFloat(p.price),
        change: parseFloat(p.change || 0),
        type: p.type || 'Spot',
      };
    });
    
    cache.set('ticker', ticker, 5);
    res.json(ticker);
  } catch (error) {
    console.error('Error fetching ticker:', error);
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
});

// Get historical prices with caching
router.get('/history/:crop', async (req, res) => {
  try {
    const { crop } = req.params;
    const days = parseInt(req.query.days) || 30;
    const cacheKey = `history_${crop}_${days}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const history = await marketService.getHistoricalPrices(crop, days);
    
    // Enhance with OHLC data if not already present
    if (history?.datasets?.[0]) {
      const prices = history.datasets[0].data;
      const ohlcData = prices.map((price, index) => {
        const variation = (Math.random() - 0.5) * 20;
        return {
          date: history.labels[index],
          open: Math.round((price + variation) * 100) / 100,
          high: Math.round((price + Math.abs(variation) + Math.random() * 15) * 100) / 100,
          low: Math.round((price - Math.abs(variation) - Math.random() * 10) * 100) / 100,
          close: Math.round(price * 100) / 100,
          volume: Math.floor(Math.random() * 5000) + 2000,
        };
      });
      
      history.ohlc = ohlcData;
    }
    
    cache.set(cacheKey, history, 10);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get price alerts for user
router.get('/alerts/:userId', async (req, res) => {
  try {
    const alerts = await db.select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, parseInt(req.params.userId)));
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create price alert
router.post('/alerts', validateRequest(schemas.priceAlert), async (req, res) => {
  try {
    const { userId, crop, targetPrice, condition } = req.body;
    
    const result = await db.insert(priceAlerts).values({
      userId,
      crop,
      targetPrice: targetPrice.toString(),
      condition,
      active: true,
    }).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Delete price alert
router.delete('/alerts/:id', async (req, res) => {
  try {
    await db.delete(priceAlerts).where(eq(priceAlerts.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Check and trigger price alerts (internal use)
router.post('/check-alerts', async (req, res) => {
  try {
    const activeAlerts = await db.select()
      .from(priceAlerts)
      .where(and(eq(priceAlerts.active, true), eq(priceAlerts.triggered, false)));
    
    const prices = await marketService.getCurrentPrices();
    const priceMap = new Map(prices.map(p => [p.crop, parseFloat(p.price)]));
    
    let triggeredCount = 0;
    
    for (const alert of activeAlerts) {
      const currentPrice = priceMap.get(alert.crop);
      if (!currentPrice) continue;
      
      const targetPrice = parseFloat(alert.targetPrice);
      const triggered = (alert.condition === 'above' && currentPrice >= targetPrice) ||
                       (alert.condition === 'below' && currentPrice <= targetPrice);
      
      if (triggered) {
        await db.update(priceAlerts)
          .set({ triggered: true, triggeredAt: new Date() })
          .where(eq(priceAlerts.id, alert.id));
        
        await db.insert(notifications).values({
          userId: alert.userId,
          title: 'Price Alert Triggered',
          message: `${alert.crop} price is now ${alert.condition} ₹${targetPrice}. Current price: ₹${currentPrice}`,
          type: 'price_alert',
          data: { alertId: alert.id, crop: alert.crop, price: currentPrice },
        });
        
        triggeredCount++;
      }
    }
    
    res.json({ checked: activeAlerts.length, triggered: triggeredCount });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
});

// Simulate price update (for testing)
router.post('/simulate-update', async (req, res) => {
  try {
    await marketService.simulatePriceUpdate();
    cache.clear(); // Clear cache on update
    res.json({ success: true, message: 'Prices updated' });
  } catch (error) {
    console.error('Error simulating update:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// Get ticker scroll data with caching
router.get('/ticker-scroll', async (req, res) => {
  try {
    const cached = cache.get('ticker-scroll');
    if (cached) {
      return res.json(cached);
    }

    // Base data (static)
    const baseTickerData = [
      { symbol: 'SOYBEAN', date: '20NOV2025', basePrice: 4300.00, baseChange: 1.2 },
      { symbol: 'MUSTARD', date: '20NOV2025', basePrice: 5845.94, baseChange: 0.17 },
      { symbol: 'RAPESEED', date: '20NOV2025', basePrice: 5924.90, baseChange: -0.25 },
      { symbol: 'GROUNDNUT', date: '19DEC2025', basePrice: 6532.00, baseChange: 0.45 },
      { symbol: 'CASTOR', date: '19DEC2025', basePrice: 6913.00, baseChange: -0.82 },
      { symbol: 'SESAME', date: '20NOV2025', basePrice: 12400.00, baseChange: 0.65 },
      { symbol: 'SUNFLOWER', date: '20NOV2025', basePrice: 6200.00, baseChange: 0.35 },
      { symbol: 'COTTONSEED', date: '19DEC2025', basePrice: 7850.00, baseChange: -0.45 },
      { symbol: 'SAFFLOWER', date: '19DEC2025', basePrice: 5500.00, baseChange: 0.25 },
      { symbol: 'NIGER', date: '20NOV2025', basePrice: 8200.00, baseChange: 1.05 },
      { symbol: 'LINSEED', date: '19DEC2025', basePrice: 6800.00, baseChange: -0.35 },
      { symbol: 'SOYOIL', date: '20NOV2025', basePrice: 1124.50, baseChange: -1.15 },
      { symbol: 'MUSTARDOIL', date: '20NOV2025', basePrice: 1450.00, baseChange: 0.85 },
      { symbol: 'GROUNDNUTOIL', date: '20NOV2025', basePrice: 1850.00, baseChange: 0.55 },
      { symbol: 'PALMOIL', date: '20NOV2025', basePrice: 1050.00, baseChange: 0.55 },
      { symbol: 'COCONUTOIL', date: '20NOV2025', basePrice: 3200.00, baseChange: 0.35 },
      { symbol: 'SUNFLOWEROIL', date: '20NOV2025', basePrice: 1380.00, baseChange: -0.45 },
    ];
    
    const tickerData = baseTickerData.map(item => ({
      symbol: item.symbol,
      date: item.date,
      price: item.basePrice + (Math.random() - 0.5) * 20,
      change: item.baseChange + (Math.random() - 0.5) * 0.3,
    }));
    
    cache.set('ticker-scroll', tickerData, 3);
    res.json(tickerData);
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    res.status(500).json({ error: 'Failed to fetch ticker data' });
  }
});

// Get contracts with pagination and caching
router.get('/contracts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const cacheKey = `contracts_${page}_${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Reduced base contracts (removed duplicates)
    const baseContracts = [
      { name: 'Soybean', symbol: 'SOYBEAN', date: '19-Dec-2025', type: 'FUTURES', basePrice: 4300.00 },
      { name: 'Mustard Seed', symbol: 'MUSTARD', date: '19-Dec-2025', type: 'FUTURES', basePrice: 5850.00 },
      { name: 'Rapeseed', symbol: 'RAPESEED', date: '19-Dec-2025', type: 'FUTURES', basePrice: 5950.00 },
      { name: 'Groundnut', symbol: 'GROUNDNUT', date: '19-Dec-2025', type: 'FUTURES', basePrice: 6520.00 },
      { name: 'Castor Seed', symbol: 'CASTOR', date: '19-Dec-2025', type: 'FUTURES', basePrice: 6788.00 },
      { name: 'Sesame Seed', symbol: 'SESAME', date: '19-Dec-2025', type: 'FUTURES', basePrice: 12400.00 },
      { name: 'Sunflower Seed', symbol: 'SUNFLOWER', date: '19-Dec-2025', type: 'FUTURES', basePrice: 6200.00 },
      { name: 'Cottonseed', symbol: 'COTTONSEED', date: '19-Dec-2025', type: 'FUTURES', basePrice: 7850.00 },
      { name: 'Safflower Seed', symbol: 'SAFFLOWER', date: '19-Dec-2025', type: 'FUTURES', basePrice: 5500.00 },
      { name: 'Niger Seed', symbol: 'NIGER', date: '19-Dec-2025', type: 'FUTURES', basePrice: 8200.00 },
      { name: 'Linseed', symbol: 'LINSEED', date: '19-Dec-2025', type: 'FUTURES', basePrice: 6800.00 },
      { name: 'Soybean Oil', symbol: 'SOYOIL', date: '19-Dec-2025', type: 'FUTURES', basePrice: 1124.50 },
      { name: 'Mustard Oil', symbol: 'MUSTARDOIL', date: '19-Dec-2025', type: 'FUTURES', basePrice: 1450.00 },
      { name: 'Groundnut Oil', symbol: 'GROUNDNUTOIL', date: '19-Dec-2025', type: 'FUTURES', basePrice: 1850.00 },
    ];
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContracts = baseContracts.slice(startIndex, endIndex);
    
    // Generate live data only for paginated items
    const liveContracts = paginatedContracts.map(contract => {
      const priceVariation = (Math.random() - 0.5) * 20;
      const open = contract.basePrice + priceVariation;
      const ltp = open + (Math.random() - 0.5) * 15;
      const high = Math.max(open, ltp) + Math.random() * 10;
      const low = Math.min(open, ltp) - Math.random() * 10;
      const change = ((ltp - open) / open) * 100;
      const volume = Math.floor(Math.random() * 50000) + 10000;
      
      return {
        name: contract.name,
        symbol: contract.symbol,
        date: contract.date,
        type: contract.type,
        dateTime: timeString,
        open: Math.round(open * 100) / 100,
        ltp: Math.round(ltp * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        change: Math.round(change * 100) / 100,
        volume,
      };
    });
    
    const response = {
      data: liveContracts,
      pagination: {
        page,
        limit,
        total: baseContracts.length,
        totalPages: Math.ceil(baseContracts.length / limit),
      },
    };
    
    cache.set(cacheKey, response, 5);
    res.json(response);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get chart data for specific commodity with caching
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `chart_${symbol}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const chartData = [];
    const basePrice = {
      'SOYBEAN': 4300,
      'MUSTARD': 5850,
      'RAPESEED': 5950,
      'GROUNDNUT': 6520,
      'CASTOR': 6788,
      'SESAME': 12400,
    }[symbol] || 5000;
    
    const dates = ['Nov 14', 'Nov 15', 'Nov 16', 'Nov 17', 'Nov 18', 'Nov 19', 'Nov 20'];
    
    for (let i = 0; i < 7; i++) {
      const priceVariation = (Math.random() - 0.5) * 200;
      const price = basePrice + priceVariation;
      const prevPrice = i > 0 ? chartData[i - 1].price : basePrice;
      const change = ((price - prevPrice) / prevPrice) * 100;
      
      chartData.push({
        date: dates[i],
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 5000) + 2000,
        change: Math.round(change * 100) / 100,
        high: Math.round((price * 1.02) * 100) / 100,
        low: Math.round((price * 0.98) * 100) / 100,
      });
    }
    
    cache.set(cacheKey, chartData, 10);
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get NCDEX oilseeds contracts data with caching
router.get('/ncdex/oilseeds', async (req, res) => {
  try {
    const { type = 'futures', filter = 'gainers' } = req.query;
    const cacheKey = `ncdex_${type}_${filter}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const baseData = {
      futures: {
        gainers: [
          { name: 'Soybean Dec25', contract: 'NCDEX:SOYBEAN', price: (4395 + Math.random() * 50).toFixed(2), change: (2.34 + Math.random() * 0.5).toFixed(2), volume: '12.5K', high: '4425.00', low: '4350.00', openInterest: '45.2K' },
          { name: 'Rapeseed Jan26', contract: 'NCDEX:RAPESEED', price: (5980 + Math.random() * 40).toFixed(2), change: (1.51 + Math.random() * 0.3).toFixed(2), volume: '8.3K', high: '6010.00', low: '5950.00', openInterest: '32.8K' },
          { name: 'Mustard Seed Dec25', contract: 'NCDEX:MUSTARD', price: (5854 + Math.random() * 35).toFixed(2), change: (0.77 + Math.random() * 0.2).toFixed(2), volume: '15.2K', high: '5880.00', low: '5820.00', openInterest: '52.1K' },
          { name: 'Groundnut Dec25', contract: 'NCDEX:GROUNDNUT', price: (6532 + Math.random() * 30).toFixed(2), change: (0.45 + Math.random() * 0.15).toFixed(2), volume: '5.8K', high: '6560.00', low: '6500.00', openInterest: '18.5K' },
        ],
        losers: [
          { name: 'Castor Seed Jan26', contract: 'NCDEX:CASTOR', price: (5245 - Math.random() * 30).toFixed(2), change: (-1.82 - Math.random() * 0.3).toFixed(2), volume: '4.2K', high: '5280.00', low: '5210.00', openInterest: '15.3K' },
          { name: 'Soybean Oil Dec25', contract: 'NCDEX:SOYOIL', price: (1124.50 - Math.random() * 15).toFixed(2), change: (-1.23 - Math.random() * 0.2).toFixed(2), volume: '9.7K', high: '1140.00', low: '1110.00', openInterest: '28.9K' },
          { name: 'Cottonseed Dec25', contract: 'NCDEX:COTTONSEED', price: (7850 - Math.random() * 40).toFixed(2), change: (-0.89 - Math.random() * 0.15).toFixed(2), volume: '3.5K', high: '7890.00', low: '7810.00', openInterest: '12.7K' },
          { name: 'Sunflower Jan26', contract: 'NCDEX:SUNFLOWER', price: (6180 - Math.random() * 25).toFixed(2), change: (-0.56 - Math.random() * 0.1).toFixed(2), volume: '6.1K', high: '6210.00', low: '6150.00', openInterest: '21.4K' },
        ],
      },
      options: {
        gainers: [
          { name: 'Soybean 4400 CE', contract: 'NCDEX:SOYBEAN-CE', price: (125.50 + Math.random() * 10).toFixed(2), change: (8.65 + Math.random() * 1.5).toFixed(2), volume: '2.8K', iv: '32.5%', delta: '0.68' },
          { name: 'Rapeseed 6000 CE', contract: 'NCDEX:RAPESEED-CE', price: (215.00 + Math.random() * 8).toFixed(2), change: (5.42 + Math.random() * 1.0).toFixed(2), volume: '1.5K', iv: '28.3%', delta: '0.72' },
          { name: 'Mustard 5900 CE', contract: 'NCDEX:MUSTARD-CE', price: (180.25 + Math.random() * 7).toFixed(2), change: (4.18 + Math.random() * 0.8).toFixed(2), volume: '2.1K', iv: '30.1%', delta: '0.65' },
          { name: 'Groundnut 6600 CE', contract: 'NCDEX:GROUNDNUT-CE', price: (95.75 + Math.random() * 5).toFixed(2), change: (3.87 + Math.random() * 0.6).toFixed(2), volume: '0.9K', iv: '35.7%', delta: '0.58' },
        ],
        losers: [
          { name: 'Soybean 4200 PE', contract: 'NCDEX:SOYBEAN-PE', price: (45.00 - Math.random() * 5).toFixed(2), change: (-12.35 - Math.random() * 2).toFixed(2), volume: '3.2K', iv: '38.2%', delta: '-0.42' },
          { name: 'Castor 5200 PE', contract: 'NCDEX:CASTOR-PE', price: (78.50 - Math.random() * 6).toFixed(2), change: (-9.18 - Math.random() * 1.5).toFixed(2), volume: '1.1K', iv: '41.5%', delta: '-0.55' },
          { name: 'Rapeseed 5800 PE', contract: 'NCDEX:RAPESEED-PE', price: (112.00 - Math.random() * 7).toFixed(2), change: (-6.72 - Math.random() * 1.2).toFixed(2), volume: '1.8K', iv: '33.8%', delta: '-0.48' },
          { name: 'Mustard 5700 PE', contract: 'NCDEX:MUSTARD-PE', price: (88.25 - Math.random() * 5).toFixed(2), change: (-5.45 - Math.random() * 0.9).toFixed(2), volume: '1.4K', iv: '36.4%', delta: '-0.51' },
        ],
      },
    };

    const data = baseData[type]?.[filter] || [];
    const formatted = data.map(item => ({
      ...item,
      change: parseFloat(item.change) > 0 ? `+${item.change}` : item.change,
    }));
    
    cache.set(cacheKey, formatted, 5);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching NCDEX data:', error);
    res.status(500).json({ error: 'Failed to fetch NCDEX data' });
  }
});

export default router;
