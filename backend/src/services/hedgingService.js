import { db } from '../db/index.js';
import { positions, marketPrices, users, contracts, walletTransactions } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import marketService from './marketService.js';

class HedgingService {
  // Calculate optimal hedge ratio
  async calculateOptimalHedge(userId, crop, quantity, riskTolerance = 'medium') {
    try {
      // Get historical price data
      const historicalData = await marketService.getHistoricalPrices(crop, 90);
      const currentPrice = await marketService.getCurrentPrice(crop);
      
      // Calculate volatility
      const returns = [];
      for (let i = 1; i < historicalData.length; i++) {
        const return_ = (historicalData[i].price - historicalData[i-1].price) / historicalData[i-1].price;
        returns.push(return_);
      }
      
      const volatility = this.calculateVolatility(returns);
      
      // Risk tolerance multipliers
      const riskMultipliers = {
        low: 0.8,
        medium: 1.0,
        high: 1.2
      };
      
      const multiplier = riskMultipliers[riskTolerance] || 1.0;
      
      // Calculate optimal hedge ratio using minimum variance approach
      const spotVariance = volatility * volatility;
      const futuresVariance = spotVariance * 1.1; // Futures typically more volatile
      const correlation = 0.85; // Typical correlation between spot and futures
      
      const optimalRatio = (correlation * Math.sqrt(spotVariance / futuresVariance)) * multiplier;
      const hedgeQuantity = Math.round(quantity * Math.min(optimalRatio, 1.0));
      
      // Get basis data
      const basis = await this.calculateBasis(crop);
      
      return {
        recommendedHedgeRatio: Math.min(optimalRatio, 1.0),
        hedgeQuantity,
        totalQuantity: quantity,
        currentPrice,
        volatility: volatility * 100, // Convert to percentage
        basis,
        riskReduction: (1 - (1 - optimalRatio) * (1 - optimalRatio)) * 100,
        strategy: this.getHedgingStrategy(optimalRatio, volatility, basis)
      };
    } catch (error) {
      console.error('Error calculating optimal hedge:', error);
      throw error;
    }
  }

  // Execute hedging strategy
  async executeHedge(userId, hedgeData) {
    try {
      const { crop, quantity, strategy, hedgeType = 'futures' } = hedgeData;
      
      // Get current market price
      const currentPrice = await marketService.getCurrentPrice(crop);
      
      // Create hedge position
      const position = await db.insert(positions).values({
        userId,
        crop,
        type: strategy === 'long_hedge' ? 'long' : 'short',
        quantity: quantity.toString(),
        entryPrice: currentPrice.toString(),
        status: 'open',
        positionType: 'hedge',
        hedgeType,
        openedAt: new Date(),
      }).returning();

      // Update user wallet
      const marginRequired = quantity * currentPrice * 0.1; // 10% margin
      await this.updateWalletBalance(userId, -marginRequired, 'margin_blocked', {
        positionId: position[0].id,
        description: `Margin for ${crop} hedge`
      });

      return {
        success: true,
        position: position[0],
        marginRequired,
        message: `Hedge position opened successfully for ${quantity} quintals of ${crop}`
      };
    } catch (error) {
      console.error('Error executing hedge:', error);
      throw error;
    }
  }

  // Get hedging recommendations
  async getHedgingRecommendations(userId, portfolio) {
    try {
      const recommendations = [];
      
      for (const holding of portfolio) {
        const { crop, quantity, averagePrice } = holding;
        
        // Get current market conditions
        const currentPrice = await marketService.getCurrentPrice(crop);
        const volatility = await this.getVolatility(crop);
        const basis = await this.calculateBasis(crop);
        
        // Calculate unrealized P&L
        const unrealizedPnL = (currentPrice - averagePrice) * quantity;
        const pnlPercentage = ((currentPrice - averagePrice) / averagePrice) * 100;
        
        // Generate recommendation based on market conditions
        let recommendation = 'hold';
        let confidence = 50;
        let reason = 'Market conditions are neutral';
        
        if (volatility > 0.25) { // High volatility
          if (pnlPercentage > 10) {
            recommendation = 'hedge_profits';
            confidence = 80;
            reason = 'High volatility with good profits - consider locking in gains';
          } else if (pnlPercentage < -5) {
            recommendation = 'hedge_losses';
            confidence = 75;
            reason = 'High volatility with losses - consider limiting downside';
          }
        }
        
        if (basis < -50) { // Negative basis - futures trading below spot
          recommendation = 'sell_futures';
          confidence = 70;
          reason = 'Negative basis presents arbitrage opportunity';
        }
        
        recommendations.push({
          crop,
          quantity,
          currentPrice,
          unrealizedPnL,
          pnlPercentage,
          recommendation,
          confidence,
          reason,
          volatility: volatility * 100,
          basis,
          suggestedHedgeRatio: await this.calculateOptimalHedgeRatio(crop, quantity),
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting hedging recommendations:', error);
      throw error;
    }
  }

  // Monitor hedge effectiveness
  async monitorHedgeEffectiveness(userId) {
    try {
      // Get all hedge positions
      const hedgePositions = await db.select()
        .from(positions)
        .where(and(
          eq(positions.userId, userId),
          eq(positions.positionType, 'hedge'),
          eq(positions.status, 'open')
        ));

      const effectiveness = [];
      
      for (const position of hedgePositions) {
        const currentPrice = await marketService.getCurrentPrice(position.crop);
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        
        // Calculate hedge P&L
        const hedgePnL = position.type === 'long' 
          ? (currentPrice - entryPrice) * quantity
          : (entryPrice - currentPrice) * quantity;
        
        // Calculate effectiveness metrics
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
        const hedgeEfficiency = Math.abs(hedgePnL) / (Math.abs(priceChange) * quantity * entryPrice / 100);
        
        effectiveness.push({
          positionId: position.id,
          crop: position.crop,
          hedgeType: position.hedgeType,
          entryPrice,
          currentPrice,
          quantity,
          hedgePnL,
          priceChange,
          hedgeEfficiency: Math.min(hedgeEfficiency, 1.0),
          status: hedgeEfficiency > 0.8 ? 'effective' : hedgeEfficiency > 0.5 ? 'moderate' : 'ineffective',
          daysOpen: Math.floor((new Date() - new Date(position.openedAt)) / (1000 * 60 * 60 * 24))
        });
      }
      
      return effectiveness;
    } catch (error) {
      console.error('Error monitoring hedge effectiveness:', error);
      throw error;
    }
  }

  // Get basis data (spot vs futures price difference)
  async calculateBasis(crop) {
    try {
      const spotPrice = await marketService.getSpotPrice(crop);
      const futuresPrice = await marketService.getFuturesPrice(crop);
      
      return spotPrice - futuresPrice; // Positive = contango, Negative = backwardation
    } catch (error) {
      console.error('Error calculating basis:', error);
      return 0;
    }
  }

  // Calculate volatility from returns array
  calculateVolatility(returns) {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  // Get hedging strategy recommendation
  getHedgingStrategy(hedgeRatio, volatility, basis) {
    if (hedgeRatio > 0.8) {
      return {
        strategy: 'full_hedge',
        description: 'High hedge ratio recommended due to high risk exposure',
        action: 'Hedge 80-100% of position'
      };
    } else if (hedgeRatio > 0.5) {
      return {
        strategy: 'partial_hedge',
        description: 'Moderate hedge ratio balances risk and upside potential',
        action: 'Hedge 50-80% of position'
      };
    } else if (basis < -30) {
      return {
        strategy: 'basis_trade',
        description: 'Negative basis presents arbitrage opportunity',
        action: 'Consider basis trading strategy'
      };
    } else {
      return {
        strategy: 'minimal_hedge',
        description: 'Low volatility environment, minimal hedging needed',
        action: 'Hedge 20-50% of position or hold'
      };
    }
  }

  // Update wallet balance
  async updateWalletBalance(userId, amount, type, metadata = {}) {
    try {
      await db.insert(walletTransactions).values({
        userId,
        amount: amount.toString(),
        type,
        description: metadata.description || `${type} transaction`,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  // Get volatility for a crop
  async getVolatility(crop, days = 30) {
    try {
      const historicalData = await marketService.getHistoricalPrices(crop, days);
      const returns = [];
      
      for (let i = 1; i < historicalData.length; i++) {
        const return_ = (historicalData[i].price - historicalData[i-1].price) / historicalData[i-1].price;
        returns.push(return_);
      }
      
      return this.calculateVolatility(returns);
    } catch (error) {
      console.error('Error calculating volatility:', error);
      return 0.15; // Default volatility
    }
  }

  // Calculate optimal hedge ratio
  async calculateOptimalHedgeRatio(crop, quantity) {
    try {
      const volatility = await this.getVolatility(crop);
      const basis = await this.calculateBasis(crop);
      
      // Simple optimal hedge ratio calculation
      const correlation = 0.85; // Assumed correlation between spot and futures
      const spotVariance = volatility * volatility;
      const futuresVariance = spotVariance * 1.1;
      
      const optimalRatio = correlation * Math.sqrt(spotVariance / futuresVariance);
      return Math.min(optimalRatio, 1.0);
    } catch (error) {
      console.error('Error calculating optimal hedge ratio:', error);
      return 0.7; // Default hedge ratio
    }
  }

  // Get real-time hedging dashboard data
  async getHedgingDashboard(userId) {
    try {
      // Get user's open hedge positions
      const hedgePositions = await db.select()
        .from(positions)
        .where(and(
          eq(positions.userId, userId),
          eq(positions.positionType, 'hedge'),
          eq(positions.status, 'open')
        ));

      // Calculate total hedge exposure
      let totalHedgeValue = 0;
      let totalUnrealizedPnL = 0;
      const hedgeBreakdown = {};

      for (const position of hedgePositions) {
        const currentPrice = await marketService.getCurrentPrice(position.crop);
        const entryPrice = parseFloat(position.entryPrice);
        const quantity = parseFloat(position.quantity);
        
        const positionValue = quantity * currentPrice;
        const unrealizedPnL = position.type === 'long' 
          ? (currentPrice - entryPrice) * quantity
          : (entryPrice - currentPrice) * quantity;
        
        totalHedgeValue += positionValue;
        totalUnrealizedPnL += unrealizedPnL;
        
        if (!hedgeBreakdown[position.crop]) {
          hedgeBreakdown[position.crop] = {
            quantity: 0,
            value: 0,
            pnl: 0,
            positions: 0
          };
        }
        
        hedgeBreakdown[position.crop].quantity += quantity;
        hedgeBreakdown[position.crop].value += positionValue;
        hedgeBreakdown[position.crop].pnl += unrealizedPnL;
        hedgeBreakdown[position.crop].positions += 1;
      }

      // Get market volatility data
      const marketVolatility = {};
      const crops = ['soybean', 'mustard', 'groundnut', 'sunflower'];
      
      for (const crop of crops) {
        marketVolatility[crop] = await this.getVolatility(crop);
      }

      return {
        totalHedgeValue,
        totalUnrealizedPnL,
        hedgePositions: hedgePositions.length,
        hedgeBreakdown,
        marketVolatility,
        riskMetrics: {
          portfolioVolatility: await this.calculatePortfolioVolatility(userId),
          hedgeEffectiveness: await this.calculateOverallHedgeEffectiveness(userId),
          marginUtilization: await this.calculateMarginUtilization(userId)
        }
      };
    } catch (error) {
      console.error('Error getting hedging dashboard:', error);
      throw error;
    }
  }

  // Calculate portfolio volatility
  async calculatePortfolioVolatility(userId) {
    try {
      // Simplified portfolio volatility calculation
      const positions = await db.select()
        .from(positions)
        .where(and(eq(positions.userId, userId), eq(positions.status, 'open')));

      if (positions.length === 0) return 0;

      let weightedVolatility = 0;
      let totalValue = 0;

      for (const position of positions) {
        const currentPrice = await marketService.getCurrentPrice(position.crop);
        const quantity = parseFloat(position.quantity);
        const positionValue = quantity * currentPrice;
        const volatility = await this.getVolatility(position.crop);
        
        weightedVolatility += (positionValue * volatility);
        totalValue += positionValue;
      }

      return totalValue > 0 ? (weightedVolatility / totalValue) * 100 : 0;
    } catch (error) {
      console.error('Error calculating portfolio volatility:', error);
      return 0;
    }
  }

  // Calculate overall hedge effectiveness
  async calculateOverallHedgeEffectiveness(userId) {
    try {
      const effectiveness = await this.monitorHedgeEffectiveness(userId);
      
      if (effectiveness.length === 0) return 0;
      
      const avgEffectiveness = effectiveness.reduce((sum, e) => sum + e.hedgeEfficiency, 0) / effectiveness.length;
      return avgEffectiveness * 100;
    } catch (error) {
      console.error('Error calculating overall hedge effectiveness:', error);
      return 0;
    }
  }

  // Calculate margin utilization
  async calculateMarginUtilization(userId) {
    try {
      // Get total margin blocked
      const marginTransactions = await db.select()
        .from(walletTransactions)
        .where(and(
          eq(walletTransactions.userId, userId),
          eq(walletTransactions.type, 'margin_blocked')
        ));

      const totalMarginBlocked = marginTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Assume available balance of 100,000 (this should come from user's actual balance)
      const availableBalance = 100000;
      const marginUtilization = (Math.abs(totalMarginBlocked) / availableBalance) * 100;
      
      return Math.min(marginUtilization, 100);
    } catch (error) {
      console.error('Error calculating margin utilization:', error);
      return 0;
    }
  }
}

export default new HedgingService();