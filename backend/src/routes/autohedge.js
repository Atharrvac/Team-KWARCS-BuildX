import express from 'express';

const router = express.Router();

// In-memory storage for AutoHedge enrollments
let enrollments = [
  {
    id: 1,
    userId: 'demo-user',
    cropType: 'soybean',
    totalAcres: 100,
    enrolledAcres: 60,
    enrollPercent: 60,
    elevator: 'Shakti Oil Mill, Indore',
    status: 'active',
    pricingWindow: { start: '2024-02-28', end: '2024-07-31' },
    bushelsSoldToday: 245,
    bushelsTotalDaily: 400,
    performanceVsHarvest: 0.25,
    autoSelling: true,
    createdAt: '2024-02-15',
  },
];

// Daily pricing history
let pricingHistory = [];

// Get user's AutoHedge enrollments
router.get('/enrollments/:userId', (req, res) => {
  const { userId } = req.params;
  const userEnrollments = enrollments.filter(e => e.userId === userId);
  res.json(userEnrollments);
});

// Get enrollment by ID
router.get('/enrollment/:id', (req, res) => {
  const enrollment = enrollments.find(e => e.id === parseInt(req.params.id));
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  res.json(enrollment);
});

// Create new enrollment
router.post('/enroll', (req, res) => {
  const { userId, cropType, totalAcres, enrollPercent, elevator } = req.body;
  
  const enrollment = {
    id: Date.now(),
    userId,
    cropType,
    totalAcres: parseInt(totalAcres),
    enrolledAcres: Math.round((enrollPercent / 100) * parseInt(totalAcres)),
    enrollPercent,
    elevator,
    status: 'pending_confirmation',
    pricingWindow: { start: '2024-02-28', end: '2024-07-31' },
    bushelsSoldToday: 0,
    bushelsTotalDaily: Math.round((enrollPercent / 100) * parseInt(totalAcres) * 40), // Assuming 40 bushels/acre
    performanceVsHarvest: 0,
    autoSelling: false,
    createdAt: new Date().toISOString(),
  };
  
  enrollments.push(enrollment);
  res.status(201).json(enrollment);
});

// Update enrollment status
router.patch('/enrollment/:id/status', (req, res) => {
  const { status } = req.body;
  const enrollment = enrollments.find(e => e.id === parseInt(req.params.id));
  
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  
  enrollment.status = status;
  if (status === 'active') {
    enrollment.autoSelling = true;
  }
  
  res.json(enrollment);
});

// Boost sale (sell additional bushels immediately)
router.post('/enrollment/:id/boost', (req, res) => {
  const { bushels } = req.body;
  const enrollment = enrollments.find(e => e.id === parseInt(req.params.id));
  
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  
  const boostSale = {
    id: Date.now(),
    enrollmentId: enrollment.id,
    bushels,
    price: 4820 + Math.random() * 100 - 50, // Simulated current price
    timestamp: new Date().toISOString(),
    type: 'boost',
  };
  
  pricingHistory.push(boostSale);
  
  res.json({
    success: true,
    boostSale,
    message: `Successfully boosted sale of ${bushels} bushels`,
  });
});

// Get pricing history for enrollment
router.get('/enrollment/:id/history', (req, res) => {
  const enrollmentId = parseInt(req.params.id);
  const history = pricingHistory.filter(h => h.enrollmentId === enrollmentId);
  res.json(history);
});

// Get AutoHedge statistics
router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const userEnrollments = enrollments.filter(e => e.userId === userId);
  
  const totalEnrolled = userEnrollments.reduce((sum, e) => sum + e.enrolledAcres, 0);
  const activeEnrollments = userEnrollments.filter(e => e.status === 'active').length;
  const avgPerformance = userEnrollments.reduce((sum, e) => sum + e.performanceVsHarvest, 0) / userEnrollments.length || 0;
  
  res.json({
    totalEnrolled,
    activeEnrollments,
    avgPerformance: avgPerformance.toFixed(2),
    totalBushelsSold: pricingHistory.filter(h => 
      userEnrollments.some(e => e.id === h.enrollmentId)
    ).reduce((sum, h) => sum + h.bushels, 0),
  });
});

// Simulate daily pricing (would be run by cron job in production)
router.post('/simulate-daily-pricing', (req, res) => {
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  const pricings = [];
  
  activeEnrollments.forEach(enrollment => {
    const dailyBushels = Math.round(enrollment.bushelsTotalDaily / 120); // Spread over 120 trading days
    const currentPrice = 4820 + Math.random() * 100 - 50;
    
    const pricing = {
      id: Date.now() + Math.random(),
      enrollmentId: enrollment.id,
      bushels: dailyBushels,
      price: currentPrice,
      timestamp: new Date().toISOString(),
      type: 'auto',
    };
    
    pricingHistory.push(pricing);
    pricings.push(pricing);
    
    // Update today's sold bushels
    enrollment.bushelsSoldToday += dailyBushels;
  });
  
  res.json({
    success: true,
    pricings,
    message: `Priced ${pricings.length} enrollments`,
  });
});

// Cancel enrollment
router.delete('/enrollment/:id', (req, res) => {
  const index = enrollments.findIndex(e => e.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }
  
  const enrollment = enrollments[index];
  enrollment.status = 'cancelled';
  enrollment.autoSelling = false;
  
  res.json({
    success: true,
    message: 'Enrollment cancelled successfully',
  });
});

export default router;
