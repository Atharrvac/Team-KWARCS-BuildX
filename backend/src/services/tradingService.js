import { db, isDatabaseAvailable as checkDbAvailable } from '../db/index.js';
import { positions, walletTransactions } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

// In-memory storage for when database is not available
let mockPositions = [];
let mockWalletTransactions = [];
let positionIdCounter = 1;
let transactionIdCounter = 1;

// Generate unique ID using timestamp + random
const generateUniqueId = () => {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
};

class TradingService {
  // Check if database is available
  isDatabaseAvailable() {
    return checkDbAvailable();
  }
  
  // Get user positions
  async getUserPositions(userId, status = null) {
    // Always use mock data when database is not available
    if (!this.isDatabaseAvailable()) {
      let filtered = mockPositions.filter(p => p.userId === userId);
      if (status) {
        filtered = filtered.filter(p => p.status === status);
      }
      return filtered.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
    }
    
    try {
      let query = db.select().from(positions).where(eq(positions.userId, userId));
      
      if (status) {
        query = query.where(and(eq(positions.userId, userId), eq(positions.status, status)));
      }
      
      const result = await query.orderBy(desc(positions.openedAt));
      return result;
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Fallback to mock data on error
      let filtered = mockPositions.filter(p => p.userId === userId);
      if (status) {
        filtered = filtered.filter(p => p.status === status);
      }
      return filtered.sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
    }
  }
  
  // Open new position
  async openPosition(userId, { crop, type, quantity, entryPrice }) {
    console.log('[TradingService] openPosition called with:', { userId, crop, type, quantity, entryPrice });
    console.log('[TradingService] Database available:', this.isDatabaseAvailable());
    
    // Always use mock data when database is not available
    if (!this.isDatabaseAvailable()) {
      console.log('[TradingService] Using mock data');
      const newPosition = {
        id: generateUniqueId(),
        userId,
        crop,
        type,
        quantity: quantity.toString(),
        entryPrice: entryPrice.toString(),
        exitPrice: null,
        status: 'open',
        pnl: null,
        openedAt: new Date().toISOString(),
        closedAt: null,
      };
      mockPositions.push(newPosition);
      console.log('[TradingService] Position created:', newPosition);
      
      // Record wallet transaction for margin
      const margin = parseFloat(quantity) * parseFloat(entryPrice) * 0.1; // 10% margin
      console.log('[TradingService] Recording margin transaction:', margin);
      await this.recordWalletTransaction(userId, 'margin_block', -margin, `Margin for ${type} ${crop}`);
      
      console.log('[TradingService] Position opened successfully');
      return newPosition;
    }
    
    try {
      const result = await db.insert(positions).values({
        userId,
        crop,
        type,
        quantity: quantity.toString(),
        entryPrice: entryPrice.toString(),
        status: 'open',
        openedAt: new Date(),
      }).returning();
      
      // Record wallet transaction for margin
      const margin = parseFloat(quantity) * parseFloat(entryPrice) * 0.1; // 10% margin
      await this.recordWalletTransaction(userId, 'margin_block', -margin, `Margin for ${type} ${crop}`);
      
      return result[0];
    } catch (error) {
      console.error('Error opening position:', error);
      throw error;
    }
  }
  
  // Close position
  async closePosition(positionId, exitPrice) {
    // Always use mock data when database is not available
    if (!this.isDatabaseAvailable()) {
      const pos = mockPositions.find(p => p.id === positionId);
      
      if (!pos) {
        throw new Error('Position not found');
      }
      
      const quantity = parseFloat(pos.quantity);
      const entry = parseFloat(pos.entryPrice);
      const exit = parseFloat(exitPrice);
      
      // Calculate P&L
      const pnl = pos.type === 'long' 
        ? (exit - entry) * quantity
        : (entry - exit) * quantity;
      
      // Update position
      pos.exitPrice = exitPrice.toString();
      pos.pnl = pnl.toString();
      pos.status = 'closed';
      pos.closedAt = new Date().toISOString();
      
      // Record P&L in wallet
      await this.recordWalletTransaction(pos.userId, 'trade_pnl', pnl, `P&L from ${pos.type} ${pos.crop}`);
      
      // Release margin
      const margin = quantity * entry * 0.1;
      await this.recordWalletTransaction(pos.userId, 'margin_release', margin, `Margin release for ${pos.type} ${pos.crop}`);
      
      return pos;
    }
    
    try {
      const position = await db.select().from(positions).where(eq(positions.id, positionId)).limit(1);
      
      if (!position || position.length === 0) {
        throw new Error('Position not found');
      }
      
      const pos = position[0];
      const quantity = parseFloat(pos.quantity);
      const entry = parseFloat(pos.entryPrice);
      const exit = parseFloat(exitPrice);
      
      // Calculate P&L
      const pnl = pos.type === 'long' 
        ? (exit - entry) * quantity
        : (entry - exit) * quantity;
      
      // Update position
      const result = await db.update(positions)
        .set({
          exitPrice: exitPrice.toString(),
          pnl: pnl.toString(),
          status: 'closed',
          closedAt: new Date(),
        })
        .where(eq(positions.id, positionId))
        .returning();
      
      // Record P&L in wallet
      await this.recordWalletTransaction(pos.userId, 'trade_pnl', pnl, `P&L from ${pos.type} ${pos.crop}`);
      
      // Release margin
      const margin = quantity * entry * 0.1;
      await this.recordWalletTransaction(pos.userId, 'margin_release', margin, `Margin release for ${pos.type} ${pos.crop}`);
      
      return result[0];
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }
  
  // Get P&L summary
  async getPnLSummary(userId) {
    try {
      const allPositions = await this.getUserPositions(userId);
      
      const openPositions = allPositions.filter(p => p.status === 'open');
      const closedPositions = allPositions.filter(p => p.status === 'closed');
      
      const totalPnl = closedPositions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);
      const winningTrades = closedPositions.filter(p => parseFloat(p.pnl || 0) > 0).length;
      const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length * 100).toFixed(0) : 0;
      
      return {
        totalPnl: totalPnl.toFixed(2),
        openPositions: openPositions.length,
        closedPositions: closedPositions.length,
        winRate,
        winningTrades,
        losingTrades: closedPositions.length - winningTrades,
      };
    } catch (error) {
      console.error('Error calculating P&L:', error);
      return { totalPnl: '0.00', openPositions: 0, closedPositions: 0, winRate: 0, winningTrades: 0, losingTrades: 0 };
    }
  }
  
  // Record wallet transaction
  async recordWalletTransaction(userId, type, amount, description) {
    // Always use mock data when database is not available
    if (!this.isDatabaseAvailable()) {
      const userTransactions = mockWalletTransactions.filter(t => t.userId === userId);
      const lastTx = userTransactions.length > 0 
        ? userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;
      
      const currentBalance = lastTx ? parseFloat(lastTx.balance) : 100000; // Default 1 lakh
      const newBalance = currentBalance + parseFloat(amount);
      
      const newTransaction = {
        id: transactionIdCounter++,
        userId,
        type,
        amount: amount.toString(),
        balance: newBalance.toString(),
        description,
        reference: null,
        createdAt: new Date().toISOString(),
      };
      
      mockWalletTransactions.push(newTransaction);
      return newBalance;
    }
    
    try {
      // Get current balance
      const lastTx = await db.select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(1);
      
      const currentBalance = lastTx.length > 0 ? parseFloat(lastTx[0].balance) : 100000; // Default 1 lakh
      const newBalance = currentBalance + parseFloat(amount);
      
      await db.insert(walletTransactions).values({
        userId,
        type,
        amount: amount.toString(),
        balance: newBalance.toString(),
        description,
        createdAt: new Date(),
      });
      
      return newBalance;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }
  
  // Get wallet balance
  async getWalletBalance(userId) {
    // Always use mock data when database is not available
    if (!this.isDatabaseAvailable()) {
      const userTransactions = mockWalletTransactions.filter(t => t.userId === userId);
      const lastTx = userTransactions.length > 0 
        ? userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        : null;
      
      return lastTx ? parseFloat(lastTx.balance) : 100000;
    }
    
    try {
      const lastTx = await db.select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(1);
      
      return lastTx.length > 0 ? parseFloat(lastTx[0].balance) : 100000;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 100000;
    }
  }
}

export default new TradingService();
