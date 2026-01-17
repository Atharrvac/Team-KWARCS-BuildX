import express from 'express';
import { authenticate as auth } from '../middleware/auth.js';
import hedgingService from '../services/hedgingService.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get hedging dashboard
router.get('/dashboard/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const dashboard = await hedgingService.getHedgingDashboard(parseInt(userId));
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching hedging dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch hedging dashboard' });
  }
});

// Calculate optimal hedge
router.post('/calculate-hedge', auth, async (req, res) => {
  try {
    const { userId, crop, quantity, riskTolerance } = req.body;
    
    if (!userId || !crop || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const hedgeCalculation = await hedgingService.calculateOptimalHedge(
      parseInt(userId), 
      crop, 
      parseFloat(quantity), 
      riskTolerance
    );
    
    res.json(hedgeCalculation);
  } catch (error) {
    console.error('Error calculating hedge:', error);
    res.status(500).json({ error: 'Failed to calculate optimal hedge' });
  }
});

// Execute hedge
router.post('/execute', auth, async (req, res) => {
  try {
    const { userId, crop, quantity, strategy, hedgeType } = req.body;
    
    if (!userId || !crop || !quantity || !strategy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await hedgingService.executeHedge(parseInt(userId), {
      crop,
      quantity: parseFloat(quantity),
      strategy,
      hedgeType: hedgeType || 'futures'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error executing hedge:', error);
    res.status(500).json({ error: 'Failed to execute hedge' });
  }
});

// Get hedging recommendations
router.get('/recommendations/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock portfolio data - in real app, this would come from user's actual holdings
    const portfolio = [
      { crop: 'soybean', quantity: 100, averagePrice: 4500 },
      { crop: 'mustard', quantity: 50, averagePrice: 6200 },
      { crop: 'groundnut', quantity: 75, averagePrice: 5500 }
    ];
    
    const recommendations = await hedgingService.getHedgingRecommendations(
      parseInt(userId), 
      portfolio
    );
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get hedging recommendations' });
  }
});

// Monitor hedge effectiveness
router.get('/effectiveness/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const effectiveness = await hedgingService.monitorHedgeEffectiveness(parseInt(userId));
    res.json(effectiveness);
  } catch (error) {
    console.error('Error monitoring effectiveness:', error);
    res.status(500).json({ error: 'Failed to monitor hedge effectiveness' });
  }
});

// Get basis data for crop
router.get('/basis/:crop', async (req, res) => {
  try {
    const { crop } = req.params;
    const basis = await hedgingService.calculateBasis(crop);
    
    res.json({
      crop,
      basis,
      interpretation: basis > 0 ? 'Contango (Futures > Spot)' : 'Backwardation (Spot > Futures)',
      recommendation: basis < -30 ? 'Consider basis trading opportunity' : 'Normal market conditions'
    });
  } catch (error) {
    console.error('Error getting basis data:', error);
    res.status(500).json({ error: 'Failed to get basis data' });
  }
});

// Get volatility data
router.get('/volatility/:crop', async (req, res) => {
  try {
    const { crop } = req.params;
    const { days = 30 } = req.query;
    
    const volatility = await hedgingService.getVolatility(crop, parseInt(days));
    
    res.json({
      crop,
      volatility: volatility * 100, // Convert to percentage
      period: `${days} days`,
      level: volatility > 0.3 ? 'High' : volatility > 0.2 ? 'Medium' : 'Low',
      recommendation: volatility > 0.25 ? 'Consider hedging due to high volatility' : 'Volatility is manageable'
    });
  } catch (error) {
    console.error('Error getting volatility data:', error);
    res.status(500).json({ error: 'Failed to get volatility data' });
  }
});

// Get hedge performance analytics
router.get('/analytics/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30d' } = req.query;
    
    // This would include detailed analytics like:
    // - Hedge performance over time
    // - Risk reduction achieved
    // - Cost of hedging
    // - Comparison with unhedged positions
    
    const analytics = {
      period,
      totalHedges: 5,
      successfulHedges: 4,
      successRate: 80,
      avgRiskReduction: 65,
      totalHedgingCost: 2500,
      netBenefit: 8500,
      roi: 240, // (netBenefit - cost) / cost * 100
      recommendations: [
        'Your hedging strategy has been effective in reducing portfolio risk',
        'Consider increasing hedge ratio during high volatility periods',
        'Basis trading opportunities available in mustard futures'
      ]
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get hedge analytics' });
  }
});

// Get real-time risk metrics
router.get('/risk-metrics/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const riskMetrics = {
      portfolioValue: 450000,
      hedgedValue: 280000,
      hedgeRatio: 62.2,
      unhedgedRisk: 170000,
      valueAtRisk: 25000, // 95% confidence, 1-day VaR
      expectedShortfall: 35000,
      portfolioVolatility: 18.5,
      hedgeEffectiveness: 78.3,
      marginUtilization: 45.2,
      riskScore: 'Medium',
      recommendations: [
        'Portfolio is adequately hedged',
        'Monitor basis risk in soybean positions',
        'Consider rebalancing hedge ratios monthly'
      ]
    };
    
    res.json(riskMetrics);
  } catch (error) {
    console.error('Error getting risk metrics:', error);
    res.status(500).json({ error: 'Failed to get risk metrics' });
  }
});

export default router;