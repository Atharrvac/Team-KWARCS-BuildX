import express from 'express';

const router = express.Router();

// Mock wallet data
const walletData = {
  'demo-user': {
    availableBalance: 32450,
    marginBlocked: 12000,
    pendingSettlements: 8600,
    hedgingPnL: 1820,
    kharifFunded: 7600,
    recommendedBuffer: 18000,
  },
};

// Recent activity
const recentActivity = [
  {
    id: 1,
    type: 'payout',
    title: 'Payout from Soybean b7 50 MT',
    subtitle: 'Final settlement • Shakti Oil Mill',
    date: 'Today • To SBT 4821',
    icon: 'checkmark-circle',
    iconColor: '#16a34a',
    userId: 'demo-user',
  },
  {
    id: 2,
    type: 'margin',
    title: 'Margin top-up (futures)',
    subtitle: 'Soybean hedge on NCDEX (simulated)',
    date: 'Yesterday • From wallet',
    icon: 'arrow-up-circle',
    iconColor: '#f59e0b',
    userId: 'demo-user',
  },
  {
    id: 3,
    type: 'withdrawal',
    title: 'Withdrawal to bank',
    subtitle: 'Manual withdrawal request',
    date: '18 Nov • UTR ending 9823',
    icon: 'arrow-down-circle',
    iconColor: '#6b7280',
    userId: 'demo-user',
  },
  {
    id: 4,
    type: 'advance',
    title: 'Advance from Mustard b7 20 MT',
    subtitle: '18% advance • Narmada Traders',
    date: '14 Nov • In wallet',
    icon: 'cash',
    iconColor: '#16a34a',
    userId: 'demo-user',
  },
];

// Upcoming payouts
const upcomingPayouts = [
  {
    id: 1,
    crop: 'Soybean b7 30 MT',
    type: 'FPO pool',
    amount: '~₹18,900',
    date: 'Expected 2 days after delivery • 8-15 Nov',
    destination: 'To FPO account',
    userId: 'demo-user',
  },
  {
    id: 2,
    crop: 'Mustard b7 20 MT',
    type: 'Rabi',
    amount: '~₹26,000',
    date: 'Payment after Jan delivery window',
    destination: 'Linked to wallet',
    userId: 'demo-user',
  },
];

// Get wallet balance
router.get('/balance/:userId', (req, res) => {
  const { userId } = req.params;
  const balance = walletData[userId] || {
    availableBalance: 0,
    marginBlocked: 0,
    pendingSettlements: 0,
    hedgingPnL: 0,
    kharifFunded: 0,
    recommendedBuffer: 0,
  };
  res.json(balance);
});

// Get recent activity
router.get('/activity/:userId', (req, res) => {
  const { userId } = req.params;
  const activity = recentActivity.filter(a => a.userId === userId);
  res.json(activity);
});

// Get upcoming payouts
router.get('/payouts/:userId', (req, res) => {
  const { userId } = req.params;
  const payouts = upcomingPayouts.filter(p => p.userId === userId);
  res.json(payouts);
});

// Add money to wallet
router.post('/add-money', (req, res) => {
  const { userId, amount } = req.body;
  if (!walletData[userId]) {
    walletData[userId] = {
      availableBalance: 0,
      marginBlocked: 0,
      pendingSettlements: 0,
      hedgingPnL: 0,
      kharifFunded: 0,
      recommendedBuffer: 0,
    };
  }
  walletData[userId].availableBalance += amount;
  res.json({ success: true, newBalance: walletData[userId].availableBalance });
});

// Withdraw money
router.post('/withdraw', (req, res) => {
  const { userId, amount } = req.body;
  if (!walletData[userId] || walletData[userId].availableBalance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  walletData[userId].availableBalance -= amount;
  res.json({ success: true, newBalance: walletData[userId].availableBalance });
});

// Generate comprehensive wallet report
router.get('/report/:userId', (req, res) => {
  const { userId } = req.params;
  const { period = '30days' } = req.query;
  
  const balance = walletData[userId] || {
    availableBalance: 32450,
    marginBlocked: 12000,
    pendingSettlements: 8600,
    hedgingPnL: 1820,
    kharifFunded: 7600,
    recommendedBuffer: 18000,
  };

  // Generate transaction history
  const transactions = [
    {
      id: 'TXN001',
      date: new Date().toISOString(),
      type: 'credit',
      category: 'Payout',
      description: 'Soybean b7 50 MT - Final settlement',
      amount: 45000,
      balance: balance.availableBalance,
      reference: 'Shakti Oil Mill',
    },
    {
      id: 'TXN002',
      date: new Date(Date.now() - 86400000).toISOString(),
      type: 'debit',
      category: 'Margin',
      description: 'Margin top-up for futures hedge',
      amount: 12000,
      balance: balance.availableBalance - 12000,
      reference: 'NCDEX Soybean Dec25',
    },
    {
      id: 'TXN003',
      date: new Date(Date.now() - 172800000).toISOString(),
      type: 'debit',
      category: 'Withdrawal',
      description: 'Bank withdrawal',
      amount: 20000,
      balance: balance.availableBalance - 32000,
      reference: 'UTR ending 9823',
    },
    {
      id: 'TXN004',
      date: new Date(Date.now() - 345600000).toISOString(),
      type: 'credit',
      category: 'Advance',
      description: 'Mustard b7 20 MT - 18% advance',
      amount: 26000,
      balance: balance.availableBalance - 6000,
      reference: 'Narmada Traders',
    },
    {
      id: 'TXN005',
      date: new Date(Date.now() - 604800000).toISOString(),
      type: 'credit',
      category: 'Hedge Profit',
      description: 'Profit from closed hedge position',
      amount: 1820,
      balance: balance.availableBalance - 7820,
      reference: 'Soybean Futures',
    },
  ];

  // Calculate statistics
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryBreakdown = transactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { credit: 0, debit: 0, count: 0 };
    }
    if (t.type === 'credit') {
      acc[t.category].credit += t.amount;
    } else {
      acc[t.category].debit += t.amount;
    }
    acc[t.category].count += 1;
    return acc;
  }, {});

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    period,
    userId,
    summary: {
      currentBalance: balance.availableBalance,
      marginBlocked: balance.marginBlocked,
      pendingSettlements: balance.pendingSettlements,
      hedgingPnL: balance.hedgingPnL,
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      transactionCount: transactions.length,
    },
    breakdown: {
      byCategory: categoryBreakdown,
      byType: {
        credit: {
          amount: totalCredits,
          count: transactions.filter(t => t.type === 'credit').length,
        },
        debit: {
          amount: totalDebits,
          count: transactions.filter(t => t.type === 'debit').length,
        },
      },
    },
    transactions,
    upcomingPayouts: upcomingPayouts.filter(p => p.userId === userId),
    insights: {
      averageTransactionSize: (totalCredits + totalDebits) / transactions.length,
      largestCredit: Math.max(...transactions.filter(t => t.type === 'credit').map(t => t.amount)),
      largestDebit: Math.max(...transactions.filter(t => t.type === 'debit').map(t => t.amount)),
      hedgingEfficiency: balance.hedgingPnL > 0 ? 'Positive' : 'Negative',
      recommendedAction: balance.availableBalance < balance.recommendedBuffer 
        ? 'Consider adding funds to maintain buffer'
        : 'Wallet balance is healthy',
    },
  };

  res.json(report);
});

export default router;
