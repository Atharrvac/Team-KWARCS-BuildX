import { db, isDbConnected } from '../db/index.js';
import { marketPrices } from '../db/schema.js';
import { desc, eq, and, gte, sql } from 'drizzle-orm';

class MarketService {
  constructor() {
    // Store current prices in memory for real-time updates
    this.currentPrices = {
      soybean: { 
        price: 4820, 
        change: 2.1, 
        volume: 15000, 
        type: 'NCDEX', 
        basePrice: 4820,
        spotPrice: 4800,
        futuresPrice: 4820,
        high: 4850,
        low: 4780,
        openInterest: 25000
      },
      mustard: { 
        price: 6450, 
        change: -0.4, 
        volume: 12000, 
        type: 'Spot', 
        basePrice: 6450,
        spotPrice: 6450,
        futuresPrice: 6480,
        high: 6480,
        low: 6420,
        openInterest: 18000
      },
      groundnut: { 
        price: 5800, 
        change: 3.8, 
        volume: 8000, 
        type: 'Spot', 
        basePrice: 5800,
        spotPrice: 5800,
        futuresPrice: 5820,
        high: 5820,
        low: 5750,
        openInterest: 12000
      },
      sunflower: { 
        price: 6200, 
        change: 1.5, 
        volume: 10000, 
        type: 'Spot', 
        basePrice: 6200,
        spotPrice: 6200,
        futuresPrice: 6230,
        high: 6230,
        low: 6180,
        openInterest: 15000
      },
    };
    
    // NCDEX futures contracts
    this.ncdexContracts = {
      soybean: [
        { month: 'Dec 2024', price: 4820, volume: 15000, openInterest: 25000, expiry: '2024-12-20' },
        { month: 'Jan 2025', price: 4850, volume: 8000, openInterest: 18000, expiry: '2025-01-20' },
        { month: 'Feb 2025', price: 4880, volume: 5000, openInterest: 12000, expiry: '2025-02-20' }
      ],
      mustard: [
        { month: 'Dec 2024', price: 6480, volume: 12000, openInterest: 18000, expiry: '2024-12-20' },
        { month: 'Jan 2025', price: 6520, volume: 7000, openInterest: 15000, expiry: '2025-01-20' }
      ],
      groundnut: [
        { month: 'Dec 2024', price: 5820, volume: 8000, openInterest: 12000, expiry: '2024-12-20' },
        { month: 'Jan 2025', price: 5850, volume: 4000, openInterest: 8000, expiry: '2025-01-20' }
      ]
    };
    
    // Start real-time price simulation
    this.startPriceSimulation();
  }

  // Simulate real-time price changes
  startPriceSimulation() {
    setInterval(() => {
      Object.keys(this.currentPrices).forEach(crop => {
        const data = this.currentPrices[crop];
        const basePrice = data.basePrice;
        
        // Random price movement (-0.5% to +0.5%)
        const movement = (Math.random() - 0.5) * 0.01;
        const newPrice = data.price * (1 + movement);
        
        // Keep price within ±5% of base price
        const minPrice = basePrice * 0.95;
        const maxPrice = basePrice * 1.05;
        const constrainedPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        
        // Calculate change percentage from base
        const changePercent = ((constrainedPrice - basePrice) / basePrice) * 100;
        
        // Update volume slightly
        const volumeChange = Math.floor((Math.random() - 0.5) * 500);
        const newVolume = Math.max(5000, data.volume + volumeChange);
        
        this.currentPrices[crop] = {
          ...data,
          price: Math.round(constrainedPrice),
          change: parseFloat(changePercent.toFixed(2)),
          volume: newVolume,
        };
      });
    }, 3000); // Update every 3 seconds for real-time feel
  }

  // Get current market prices
  async getCurrentPrices() {
    if (db && isDbConnected()) {
      try {
        // Try to get from database first
        const prices = await db
          .select()
          .from(marketPrices)
          .orderBy(desc(marketPrices.timestamp))
          .limit(20);
        
        if (prices.length > 0) {
          // Group by crop and get latest
          const latestPrices = {};
          prices.forEach(price => {
            if (!latestPrices[price.crop]) {
              latestPrices[price.crop] = price;
            }
          });
          return Object.values(latestPrices);
        }
      } catch (error) {
        console.error('Error fetching prices from DB:', error);
      }
    }
    
    // Return simulated real-time prices
    return this.getMockPrices();
  }
  
  // Get historical prices for a crop
  async getHistoricalPrices(crop, days = 30) {
    if (db && isDbConnected()) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const history = await db
          .select()
          .from(marketPrices)
          .where(
            and(
              eq(marketPrices.crop, crop),
              gte(marketPrices.timestamp, startDate)
            )
          )
          .orderBy(marketPrices.timestamp);
        
        if (history.length > 0) {
          return history;
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    }
    
    return this.generateMockHistory(crop, days);
  }
  
  // Update market price
  async updatePrice(crop, price, change, volume, type = 'Spot') {
    if (!db) {
      // Just update in-memory prices if no database
      return { crop, price, change, volume, type, timestamp: new Date() };
    }
    
    try {
      const result = await db.insert(marketPrices).values({
        crop,
        price: price.toString(),
        change: change.toString(),
        volume,
        type,
        timestamp: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating price:', error);
      throw error;
    }
  }
  
  // Simulate real-time price updates
  async simulatePriceUpdate() {
    const crops = ['soybean', 'mustard', 'groundnut', 'sunflower'];
    const basePrices = { soybean: 4820, mustard: 6450, groundnut: 5800, sunflower: 6200 };
    
    for (const crop of crops) {
      const basePrice = basePrices[crop];
      const change = (Math.random() - 0.5) * 100; // -50 to +50
      const newPrice = basePrice + change;
      const changePercent = (change / basePrice) * 100;
      const volume = Math.floor(Math.random() * 10000) + 5000;
      
      await this.updatePrice(crop, newPrice, changePercent, volume);
    }
  }
  
  // Get NCDEX futures contracts
  async getNcdexFutures() {
    return this.ncdexContracts;
  }

  // Get spot prices
  async getSpotPrices() {
    return Object.entries(this.currentPrices).map(([crop, data]) => ({
      crop,
      spotPrice: data.spotPrice,
      change: data.change,
      volume: data.volume,
      high: data.high,
      low: data.low
    }));
  }

  // Get mandi prices by location
  async getMandiPrices(location) {
    const locationMultiplier = {
      'indore': 1.0,
      'bhopal': 0.98,
      'ujjain': 1.02,
      'dewas': 0.99,
      'neemuch': 1.01
    };
    
    const multiplier = locationMultiplier[location.toLowerCase()] || 1.0;
    
    return Object.entries(this.currentPrices).map(([crop, data]) => ({
      crop,
      location,
      price: Math.round(data.spotPrice * multiplier),
      change: data.change,
      volume: Math.round(data.volume * 0.8), // Mandi volumes are typically lower
      quality: 'FAQ',
      arrivals: Math.floor(Math.random() * 500) + 100
    }));
  }

  // Get current price for a specific crop
  async getCurrentPrice(crop) {
    return this.currentPrices[crop]?.price || 0;
  }

  // Get spot price for a specific crop
  async getSpotPrice(crop) {
    return this.currentPrices[crop]?.spotPrice || 0;
  }

  // Get futures price for a specific crop
  async getFuturesPrice(crop) {
    return this.currentPrices[crop]?.futuresPrice || 0;
  }

  // Get market summary
  async getMarketSummary() {
    const prices = Object.values(this.currentPrices);
    const gainers = prices.filter(p => p.change > 0).length;
    const losers = prices.filter(p => p.change < 0).length;
    const unchanged = prices.filter(p => p.change === 0).length;
    
    const totalVolume = prices.reduce((sum, p) => sum + p.volume, 0);
    const avgChange = prices.reduce((sum, p) => sum + p.change, 0) / prices.length;
    
    return {
      totalCommodities: prices.length,
      gainers,
      losers,
      unchanged,
      totalVolume,
      avgChange: parseFloat(avgChange.toFixed(2)),
      marketTrend: avgChange > 0.5 ? 'Bullish' : avgChange < -0.5 ? 'Bearish' : 'Neutral',
      topGainer: prices.reduce((max, p) => p.change > max.change ? p : max),
      topLoser: prices.reduce((min, p) => p.change < min.change ? p : min)
    };
  }

  // Get top movers (gainers and losers)
  async getTopMovers() {
    const prices = Object.entries(this.currentPrices).map(([crop, data]) => ({
      crop,
      ...data
    }));
    
    const sorted = prices.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    
    return {
      topGainers: prices.filter(p => p.change > 0).sort((a, b) => b.change - a.change).slice(0, 3),
      topLosers: prices.filter(p => p.change < 0).sort((a, b) => a.change - b.change).slice(0, 3),
      mostActive: sorted.slice(0, 3)
    };
  }

  // Get volatility data
  async getVolatilityData(crop, period = 30) {
    const history = await this.getHistoricalPrices(crop, period);
    
    if (history.length < 2) {
      return {
        crop,
        period,
        volatility: 15.5, // Default volatility percentage
        level: 'Medium'
      };
    }
    
    // Calculate returns
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const return_ = (parseFloat(history[i].price) - parseFloat(history[i-1].price)) / parseFloat(history[i-1].price);
      returns.push(return_);
    }
    
    // Calculate volatility (standard deviation of returns)
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in %
    
    return {
      crop,
      period,
      volatility: parseFloat(volatility.toFixed(2)),
      level: volatility > 25 ? 'High' : volatility > 15 ? 'Medium' : 'Low',
      returns: returns.slice(-7) // Last 7 days returns
    };
  }

  // Get basis data (spot vs futures difference)
  async getBasisData(crop) {
    const data = this.currentPrices[crop];
    if (!data) return null;
    
    const basis = data.spotPrice - data.futuresPrice;
    
    return {
      crop,
      spotPrice: data.spotPrice,
      futuresPrice: data.futuresPrice,
      basis,
      basisPercentage: ((basis / data.spotPrice) * 100).toFixed(2),
      interpretation: basis > 0 ? 'Contango' : 'Backwardation',
      strength: Math.abs(basis) > 50 ? 'Strong' : Math.abs(basis) > 20 ? 'Moderate' : 'Weak'
    };
  }

  // Mock data fallback with real-time prices
  getMockPrices() {
    const cropNames = {
      soybean: 'Soybean',
      mustard: 'Mustard', 
      groundnut: 'Groundnut',
      sunflower: 'Sunflower'
    };
    
    return Object.entries(this.currentPrices).map(([crop, data], index) => ({
      id: index + 1,
      crop,
      name: cropNames[crop] || crop.charAt(0).toUpperCase() + crop.slice(1),
      price: Math.round(data.price),
      change: parseFloat(data.change.toFixed(2)),
      volume: data.volume,
      type: data.type,
      unit: '₹/quintal',
      high: data.high,
      low: data.low,
      openInterest: data.openInterest
    }));
  }
  
  generateMockHistory(crop, days) {
    const basePrice = this.currentPrices[crop]?.basePrice || 4250;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: (basePrice + Math.random() * 200 - 100).toFixed(2),
      volume: Math.floor(Math.random() * 5000) + 5000,
      high: (basePrice + Math.random() * 150).toFixed(2),
      low: (basePrice - Math.random() * 150).toFixed(2),
      openInterest: Math.floor(Math.random() * 10000) + 15000
    }));
  }
}

export default new MarketService();
