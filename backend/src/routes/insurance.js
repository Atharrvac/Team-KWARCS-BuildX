import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// In-memory storage
if (!global.insuranceData) {
  global.insuranceData = {
    policies: [],
    claims: [],
    applications: []
  };
}

// Available insurance plans for oilseed farmers
const insurancePlans = [
  {
    id: 1,
    name: 'Crop Price Insurance',
    type: 'price_protection',
    description: 'Protects against price drops below guaranteed minimum',
    coverage: 'Up to 80% of expected crop value',
    premium: '3-5% of insured amount',
    features: [
      'Guaranteed minimum price protection',
      'Covers all major oilseeds',
      'Quick claim settlement (7-10 days)',
      'No physical inspection required',
      'Based on market prices'
    ],
    eligibility: [
      'Registered farmer',
      'Minimum 2 acres cultivation',
      'Valid land documents',
      'Previous season records'
    ],
    icon: 'trending-down',
    color: '#3b82f6',
    popular: true
  },
  {
    id: 2,
    name: 'Weather-Based Crop Insurance (WBCI)',
    type: 'weather',
    description: 'Protection against adverse weather conditions',
    coverage: 'Up to 90% of sum insured',
    premium: '2-4% of sum insured',
    features: [
      'Covers drought, excess rainfall, heatwave',
      'Automatic trigger-based payouts',
      'No crop loss assessment needed',
      'Fast claim processing (5-7 days)',
      'Satellite and weather station data'
    ],
    eligibility: [
      'All farmers with valid KYC',
      'Minimum 1 acre',
      'Timely premium payment',
      'Crop sowing within window'
    ],
    icon: 'cloud-outline',
    color: '#0ea5e9',
    popular: false
  },
  {
    id: 3,
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    type: 'comprehensive',
    description: 'Government-subsidized comprehensive crop insurance',
    coverage: 'Full sum insured',
    premium: '2% for Kharif, 1.5% for Rabi (subsidized)',
    features: [
      'Heavily subsidized by government',
      'Covers all risks (drought, flood, pest)',
      'Pre-sowing to post-harvest coverage',
      'Localized calamities covered',
      'Prevented sowing coverage'
    ],
    eligibility: [
      'All farmers (loanee & non-loanee)',
      'Notified crops in notified areas',
      'Enrollment within cutoff date',
      'Valid Aadhaar and bank account'
    ],
    icon: 'shield-checkmark',
    color: '#16a34a',
    popular: true
  },
  {
    id: 4,
    name: 'Revenue Protection Insurance',
    type: 'revenue',
    description: 'Protects farm revenue from yield and price fluctuations',
    coverage: 'Up to 85% of expected revenue',
    premium: '4-6% of insured revenue',
    features: [
      'Combines yield and price protection',
      'Flexible coverage levels',
      'Individual farm coverage',
      'Harvest price protection',
      'Revenue guarantee'
    ],
    eligibility: [
      'Commercial farmers',
      'Minimum 5 acres',
      'Historical yield records',
      'Proper farm documentation'
    ],
    icon: 'cash-outline',
    color: '#f59e0b',
    popular: false
  },
  {
    id: 5,
    name: 'Input Cost Insurance',
    type: 'input_cost',
    description: 'Covers investment in seeds, fertilizers, and inputs',
    coverage: 'Up to 70% of input costs',
    premium: '2-3% of input costs',
    features: [
      'Protects input investment',
      'Covers seed, fertilizer, pesticide costs',
      'Quick disbursement on crop failure',
      'Minimal documentation',
      'Seasonal coverage'
    ],
    eligibility: [
      'Small and marginal farmers',
      'Valid input purchase bills',
      'Minimum 0.5 acres',
      'Timely enrollment'
    ],
    icon: 'leaf-outline',
    color: '#059669',
    popular: false
  }
];

// Get all insurance plans
router.get('/plans', (req, res) => {
  try {
    res.json({
      success: true,
      plans: insurancePlans,
      count: insurancePlans.length
    });
  } catch (error) {
    console.error('Error fetching insurance plans:', error);
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

// Get user's active policies
router.get('/policies/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userPolicies = global.insuranceData.policies.filter(
      p => p.userId === parseInt(userId)
    );
    
    res.json({
      success: true,
      policies: userPolicies,
      count: userPolicies.length
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// Apply for insurance
router.post('/apply', async (req, res) => {
  try {
    const { userId, planId, cropType, acres, sumInsured, season } = req.body;
    
    const plan = insurancePlans.find(p => p.id === parseInt(planId));
    if (!plan) {
      return res.status(404).json({ error: 'Insurance plan not found' });
    }
    
    const application = {
      id: Date.now(),
      userId: parseInt(userId),
      planId: parseInt(planId),
      planName: plan.name,
      cropType,
      acres: parseFloat(acres),
      sumInsured: parseFloat(sumInsured),
      season,
      status: 'pending',
      appliedDate: new Date(),
      documents: []
    };
    
    global.insuranceData.applications.push(application);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Insurance Application Submitted',
      `Your application for ${plan.name} has been submitted successfully. We'll review it within 24-48 hours.`,
      'insurance',
      { applicationId: application.id, planName: plan.name }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      application,
      message: 'Insurance application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying for insurance:', error);
    res.status(500).json({ error: 'Failed to submit insurance application' });
  }
});

// Get user's claims
router.get('/claims/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userClaims = global.insuranceData.claims.filter(
      c => c.userId === parseInt(userId)
    );
    
    res.json({
      success: true,
      claims: userClaims,
      count: userClaims.length
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// File insurance claim
router.post('/claim', async (req, res) => {
  try {
    const { userId, policyId, claimType, claimAmount, description } = req.body;
    
    const claim = {
      id: Date.now(),
      userId: parseInt(userId),
      policyId: parseInt(policyId),
      claimType,
      claimAmount: parseFloat(claimAmount),
      description,
      status: 'submitted',
      filedDate: new Date(),
      documents: []
    };
    
    global.insuranceData.claims.push(claim);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Insurance Claim Filed',
      `Your claim for ₹${claimAmount} has been filed. Claim ID: ${claim.id}`,
      'insurance',
      { claimId: claim.id, amount: claimAmount }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      claim,
      message: 'Insurance claim filed successfully'
    });
  } catch (error) {
    console.error('Error filing claim:', error);
    res.status(500).json({ error: 'Failed to file insurance claim' });
  }
});

// Get insurance statistics
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const userPolicies = global.insuranceData.policies.filter(
      p => p.userId === parseInt(userId)
    );
    const userClaims = global.insuranceData.claims.filter(
      c => c.userId === parseInt(userId)
    );
    
    const stats = {
      activePolicies: userPolicies.filter(p => p.status === 'active').length,
      totalCoverage: userPolicies.reduce((sum, p) => sum + (p.sumInsured || 0), 0),
      claimsFiled: userClaims.length,
      claimsApproved: userClaims.filter(c => c.status === 'approved').length,
      totalClaimAmount: userClaims
        .filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + c.claimAmount, 0)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
