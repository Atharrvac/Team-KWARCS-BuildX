import { db } from '../db/index.js';

class FPOService {
  constructor() {
    // Real-time FPO data
    this.fpoData = {
      'MP_FPO_001': {
        id: 'MP_FPO_001',
        name: 'Madhya Pradesh Oilseed Farmers FPO',
        registrationNumber: 'FPO/MP/2023/001',
        totalMembers: 1247,
        totalFarmArea: 8950,
        establishedYear: 2020,
        location: 'Indore, Madhya Pradesh',
        crops: ['Soybean', 'Mustard', 'Groundnut'],
        avgPricePremium: 8.5,
        totalTurnover: 15600000,
        status: 'Active',
        benefits: [
          'Collective bargaining for better prices',
          'Reduced input costs through bulk purchasing',
          'Access to credit and insurance',
          'Technical support and training',
          'Direct market linkages',
          'Quality certification support'
        ]
      }
    };

    this.memberData = {
      1: {
        memberId: 'FPO001247',
        fpoId: 'MP_FPO_001',
        joinedDate: '2023-03-15',
        farmSize: 5.2,
        crops: ['Soybean', 'Mustard'],
        totalSales: 125000,
        avgPremium: 12.3,
        status: 'Active Member'
      }
    };

    this.collectiveOrders = [
      {
        id: 1,
        fpoId: 'MP_FPO_001',
        crop: 'Soybean',
        totalQuantity: 2500,
        targetPrice: 4950,
        currentMarketPrice: 4820,
        premium: 130,
        status: 'Open',
        deadline: '2024-01-15',
        participants: 156,
        memberContribution: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        id: 2,
        fpoId: 'MP_FPO_001',
        crop: 'Mustard',
        totalQuantity: 1200,
        targetPrice: 6680,
        currentMarketPrice: 6450,
        premium: 230,
        status: 'Filled',
        deadline: '2024-01-10',
        participants: 89,
        memberContribution: {},
        createdAt: new Date('2023-12-20'),
        updatedAt: new Date()
      }
    ];

    this.priceComparison = {
      soybean: {
        marketPrice: 4820,
        fpoPrice: 4950,
        premium: 130,
        premiumPercent: 2.7
      },
      mustard: {
        marketPrice: 6450,
        fpoPrice: 6680,
        premium: 230,
        premiumPercent: 3.6
      },
      groundnut: {
        marketPrice: 5800,
        fpoPrice: 6020,
        premium: 220,
        premiumPercent: 3.8
      }
    };

    // Start real-time updates
    this.startRealTimeUpdates();
  }

  startRealTimeUpdates() {
    setInterval(() => {
      // Update collective orders
      this.collectiveOrders.forEach(order => {
        if (order.status === 'Open') {
          // Simulate participants joining
          const participantChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          order.participants = Math.max(1, order.participants + participantChange);
          
          // Update quantity based on participants
          order.totalQuantity = order.participants * (Math.floor(Math.random() * 20) + 10);
          
          // Check if order should be filled
          if (order.participants >= 150 && Math.random() > 0.7) {
            order.status = 'Filled';
          }
        }
      });

      // Update price comparison with market prices
      Object.keys(this.priceComparison).forEach(crop => {
        const marketPrice = 4820 + (Math.random() - 0.5) * 100; // Simulate market price
        const fpoPrice = marketPrice * (1 + (Math.random() * 0.05 + 0.02)); // 2-7% premium
        const premium = fpoPrice - marketPrice;
        const premiumPercent = (premium / marketPrice) * 100;

        this.priceComparison[crop] = {
          marketPrice: Math.round(marketPrice),
          fpoPrice: Math.round(fpoPrice),
          premium: Math.round(premium),
          premiumPercent: parseFloat(premiumPercent.toFixed(2))
        };
      });
    }, 5000); // Update every 5 seconds
  }

  // Get FPO details
  async getFPODetails(fpoId) {
    return this.fpoData[fpoId] || null;
  }

  // Get member data
  async getMemberData(userId) {
    return this.memberData[userId] || null;
  }

  // Get collective orders
  async getCollectiveOrders(fpoId = null) {
    if (fpoId) {
      return this.collectiveOrders.filter(order => order.fpoId === fpoId);
    }
    return this.collectiveOrders;
  }

  // Join collective order
  async joinCollectiveOrder(userId, orderId, contribution) {
    const order = this.collectiveOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'Open') {
      throw new Error('Order not available for joining');
    }

    // Add member contribution
    order.memberContribution[userId] = {
      quantity: contribution.quantity,
      joinedAt: new Date(),
      status: 'Active'
    };

    // Update order totals
    order.participants += 1;
    order.totalQuantity += contribution.quantity;
    order.updatedAt = new Date();

    return {
      success: true,
      order: order,
      message: `Successfully joined collective order for ${order.crop}`
    };
  }

  // Get price comparison
  async getPriceComparison() {
    return this.priceComparison;
  }

  // Submit FPO membership application
  async submitMembershipApplication(applicationData) {
    const applicationId = `APP_${Date.now()}`;
    
    // Store application (in real app, this would go to database)
    const application = {
      id: applicationId,
      ...applicationData,
      status: 'Pending',
      submittedAt: new Date(),
      estimatedProcessingTime: '3-5 business days'
    };

    return {
      success: true,
      applicationId: applicationId,
      application: application,
      message: 'Application submitted successfully. You will be contacted within 3-5 business days.'
    };
  }

  // Get FPO benefits analysis
  async getBenefitsAnalysis(userId) {
    const memberData = await this.getMemberData(userId);
    if (!memberData) {
      return {
        additionalIncome: 45000,
        inputCostSavings: 12000,
        totalBenefit: 57000,
        benefitPercentage: 15.2
      };
    }

    // Calculate based on member's actual data
    const additionalIncome = memberData.totalSales * (memberData.avgPremium / 100);
    const inputCostSavings = memberData.farmSize * 2000; // Estimated savings per hectare
    const totalBenefit = additionalIncome + inputCostSavings;
    const benefitPercentage = (totalBenefit / memberData.totalSales) * 100;

    return {
      additionalIncome: Math.round(additionalIncome),
      inputCostSavings: Math.round(inputCostSavings),
      totalBenefit: Math.round(totalBenefit),
      benefitPercentage: parseFloat(benefitPercentage.toFixed(2))
    };
  }

  // Get FPO directory
  async getFPODirectory(location = null) {
    const allFPOs = [
      {
        id: 'MP_FPO_001',
        name: 'Madhya Pradesh Oilseed Farmers FPO',
        location: 'Indore, Madhya Pradesh',
        crops: ['Soybean', 'Mustard', 'Groundnut'],
        members: 1247,
        established: 2020,
        contact: '+91-9876543210',
        status: 'Active'
      },
      {
        id: 'MP_FPO_002',
        name: 'Malwa Region Farmers FPO',
        location: 'Ujjain, Madhya Pradesh',
        crops: ['Soybean', 'Wheat'],
        members: 856,
        established: 2019,
        contact: '+91-9876543211',
        status: 'Active'
      },
      {
        id: 'MP_FPO_003',
        name: 'Nimar Valley FPO',
        location: 'Khandwa, Madhya Pradesh',
        crops: ['Soybean', 'Cotton'],
        members: 642,
        established: 2021,
        contact: '+91-9876543212',
        status: 'Active'
      }
    ];

    if (location) {
      return allFPOs.filter(fpo => 
        fpo.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    return allFPOs;
  }

  // Get FPO performance metrics
  async getFPOPerformance(fpoId) {
    const fpo = this.fpoData[fpoId];
    if (!fpo) return null;

    return {
      fpoId: fpoId,
      totalRevenue: fpo.totalTurnover,
      avgPricePremium: fpo.avgPricePremium,
      memberSatisfaction: 87.5,
      contractsFulfilled: 156,
      totalContracts: 178,
      fulfillmentRate: 87.6,
      avgDeliveryTime: 2.3,
      qualityScore: 92.1,
      marketReach: 15, // Number of markets
      yearOverYearGrowth: 23.4
    };
  }
}

export default new FPOService();