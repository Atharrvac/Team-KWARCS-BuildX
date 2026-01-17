import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// In-memory storage
if (!global.communityData) {
  global.communityData = {
    posts: [],
    comments: [],
    supportTickets: [],
    faqs: [],
    experts: []
  };
}

// FAQs for oilseed hedging
const faqs = [
  {
    id: 1,
    category: 'Hedging Basics',
    question: 'What is hedging and how does it help farmers?',
    answer: 'Hedging is a risk management strategy that helps protect farmers from price fluctuations. By locking in prices through futures contracts or forward agreements, you can secure a guaranteed price for your crop, protecting your income from market volatility.',
    helpful: 245,
    views: 1520
  },
  {
    id: 2,
    category: 'Contracts',
    question: 'How do forward contracts work?',
    answer: 'Forward contracts are agreements to buy or sell a commodity at a predetermined price on a future date. As a farmer, you can lock in a selling price for your crop before harvest, ensuring price certainty regardless of market movements.',
    helpful: 198,
    views: 1340
  },
  {
    id: 3,
    category: 'Platform',
    question: 'Is my data and money safe on AgriSure?',
    answer: 'Yes, absolutely. AgriSure uses bank-grade encryption, secure blockchain technology for contracts, and complies with all financial regulations. Your funds are held in escrow accounts, and all transactions are fully audited.',
    helpful: 312,
    views: 2100
  },
  {
    id: 4,
    category: 'Pricing',
    question: 'What are the fees for using AgriSure?',
    answer: 'AgriSure charges a small transaction fee of 0.5-1% on executed contracts. There are no monthly fees, no hidden charges, and the first 3 contracts are completely free for new users.',
    helpful: 167,
    views: 980
  },
  {
    id: 5,
    category: 'Insurance',
    question: 'Can I combine insurance with hedging?',
    answer: 'Yes! Insurance and hedging work together. Insurance protects against crop failure or yield loss, while hedging protects against price drops. Using both provides comprehensive risk management for your farm.',
    helpful: 289,
    views: 1650
  }
];

// Agricultural experts
const experts = [
  {
    id: 1,
    name: 'Dr. Rajesh Kumar',
    title: 'Agricultural Economist',
    specialization: 'Oilseed Markets & Price Analysis',
    experience: '15+ years',
    rating: 4.8,
    consultations: 450,
    available: true,
    avatar: 'https://i.pravatar.cc/150?img=12',
    languages: ['Hindi', 'English', 'Marathi']
  },
  {
    id: 2,
    name: 'Priya Sharma',
    title: 'Risk Management Specialist',
    specialization: 'Hedging Strategies & Futures Trading',
    experience: '12+ years',
    rating: 4.9,
    consultations: 380,
    available: true,
    avatar: 'https://i.pravatar.cc/150?img=45',
    languages: ['Hindi', 'English', 'Punjabi']
  },
  {
    id: 3,
    name: 'Amit Patel',
    title: 'Crop Insurance Advisor',
    specialization: 'Insurance & Government Schemes',
    experience: '10+ years',
    rating: 4.7,
    consultations: 520,
    available: false,
    avatar: 'https://i.pravatar.cc/150?img=33',
    languages: ['Hindi', 'English', 'Gujarati']
  }
];

// Get community posts
router.get('/posts', (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    let posts = global.communityData.posts;
    
    if (category && category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    
    posts = posts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create community post
router.post('/posts', async (req, res) => {
  try {
    const { userId, userName, title, content, category } = req.body;
    
    const post = {
      id: Date.now(),
      userId: parseInt(userId),
      userName: userName || 'Anonymous',
      title,
      content,
      category: category || 'general',
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date()
    };
    
    global.communityData.posts.push(post);
    
    res.status(201).json({
      success: true,
      post,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get FAQs
router.get('/faqs', (req, res) => {
  try {
    const { category } = req.query;
    
    let filteredFaqs = faqs;
    if (category && category !== 'all') {
      filteredFaqs = faqs.filter(f => f.category === category);
    }
    
    res.json({
      success: true,
      faqs: filteredFaqs,
      count: filteredFaqs.length
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Get experts
router.get('/experts', (req, res) => {
  try {
    const { available } = req.query;
    
    let filteredExperts = experts;
    if (available === 'true') {
      filteredExperts = experts.filter(e => e.available);
    }
    
    res.json({
      success: true,
      experts: filteredExperts,
      count: filteredExperts.length
    });
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ error: 'Failed to fetch experts' });
  }
});

// Create support ticket
router.post('/support', async (req, res) => {
  try {
    const { userId, userName, subject, description, category, priority } = req.body;
    
    const ticket = {
      id: `TKT-${Date.now()}`,
      userId: parseInt(userId),
      userName: userName || 'User',
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: []
    };
    
    global.communityData.supportTickets.push(ticket);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Support Ticket Created',
      `Your support ticket #${ticket.id} has been created. Our team will respond within 24 hours.`,
      'system',
      { ticketId: ticket.id, subject }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      ticket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get user's support tickets
router.get('/support/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const userTickets = global.communityData.supportTickets
      .filter(t => t.userId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      tickets: userTickets,
      count: userTickets.length
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Book expert consultation
router.post('/consultation', async (req, res) => {
  try {
    const { userId, expertId, date, time, topic } = req.body;
    
    const expert = experts.find(e => e.id === parseInt(expertId));
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    
    const consultation = {
      id: Date.now(),
      userId: parseInt(userId),
      expertId: parseInt(expertId),
      expertName: expert.name,
      date,
      time,
      topic,
      status: 'scheduled',
      createdAt: new Date()
    };
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Consultation Scheduled',
      `Your consultation with ${expert.name} is scheduled for ${date} at ${time}.`,
      'system',
      { consultationId: consultation.id, expertName: expert.name }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      consultation,
      message: 'Consultation scheduled successfully'
    });
  } catch (error) {
    console.error('Error booking consultation:', error);
    res.status(500).json({ error: 'Failed to book consultation' });
  }
});

export default router;
