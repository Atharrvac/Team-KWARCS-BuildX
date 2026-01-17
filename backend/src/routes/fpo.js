import express from 'express';
import fpoService from '../services/fpoService.js';
import { authenticate as auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get FPO details
router.get('/details/:fpoId', async (req, res) => {
  try {
    const { fpoId } = req.params;
    const fpoDetails = await fpoService.getFPODetails(fpoId);
    
    if (!fpoDetails) {
      return res.status(404).json({ error: 'FPO not found' });
    }
    
    res.json(fpoDetails);
  } catch (error) {
    console.error('Error fetching FPO details:', error);
    res.status(500).json({ error: 'Failed to fetch FPO details' });
  }
});

// Get member data
router.get('/member/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const memberData = await fpoService.getMemberData(parseInt(userId));
    
    res.json(memberData);
  } catch (error) {
    console.error('Error fetching member data:', error);
    res.status(500).json({ error: 'Failed to fetch member data' });
  }
});

// Get collective orders
router.get('/collective-orders', async (req, res) => {
  try {
    const { fpoId } = req.query;
    const orders = await fpoService.getCollectiveOrders(fpoId);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching collective orders:', error);
    res.status(500).json({ error: 'Failed to fetch collective orders' });
  }
});

// Join collective order
router.post('/collective-orders/:orderId/join', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, quantity } = req.body;
    
    if (!userId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await fpoService.joinCollectiveOrder(
      parseInt(userId), 
      parseInt(orderId), 
      { quantity: parseFloat(quantity) }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error joining collective order:', error);
    res.status(500).json({ error: error.message || 'Failed to join collective order' });
  }
});

// Get price comparison
router.get('/price-comparison', async (req, res) => {
  try {
    const comparison = await fpoService.getPriceComparison();
    res.json(comparison);
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    res.status(500).json({ error: 'Failed to fetch price comparison' });
  }
});

// Submit membership application
router.post('/membership/apply', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Validate required fields
    const requiredFields = ['farmerName', 'farmSize', 'phone'];
    const missingFields = requiredFields.filter(field => !applicationData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }
    
    const result = await fpoService.submitMembershipApplication(applicationData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting membership application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get benefits analysis
router.get('/benefits/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const benefits = await fpoService.getBenefitsAnalysis(parseInt(userId));
    
    res.json(benefits);
  } catch (error) {
    console.error('Error fetching benefits analysis:', error);
    res.status(500).json({ error: 'Failed to fetch benefits analysis' });
  }
});

// Get FPO directory
router.get('/directory', async (req, res) => {
  try {
    const { location } = req.query;
    const directory = await fpoService.getFPODirectory(location);
    
    res.json(directory);
  } catch (error) {
    console.error('Error fetching FPO directory:', error);
    res.status(500).json({ error: 'Failed to fetch FPO directory' });
  }
});

// Get FPO performance metrics
router.get('/performance/:fpoId', async (req, res) => {
  try {
    const { fpoId } = req.params;
    const performance = await fpoService.getFPOPerformance(fpoId);
    
    if (!performance) {
      return res.status(404).json({ error: 'FPO not found' });
    }
    
    res.json(performance);
  } catch (error) {
    console.error('Error fetching FPO performance:', error);
    res.status(500).json({ error: 'Failed to fetch FPO performance' });
  }
});

// Get real-time FPO dashboard
router.get('/dashboard/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [memberData, fpoDetails, collectiveOrders, priceComparison, benefits] = await Promise.all([
      fpoService.getMemberData(parseInt(userId)),
      fpoService.getFPODetails('MP_FPO_001'),
      fpoService.getCollectiveOrders('MP_FPO_001'),
      fpoService.getPriceComparison(),
      fpoService.getBenefitsAnalysis(parseInt(userId))
    ]);
    
    res.json({
      memberData,
      fpoDetails,
      collectiveOrders,
      priceComparison,
      benefits,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching FPO dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch FPO dashboard' });
  }
});

export default router;