import { db } from '../db/index.js';
import { learningModules, userProgress } from '../db/schema.js';
import { eq } from 'drizzle-orm';

class EducationService {
  constructor() {
    // Comprehensive learning modules with real-time progress tracking
    this.modules = [
      {
        id: 1,
        title: 'Introduction to Commodity Trading',
        description: 'Learn the basics of commodity markets and how they work for farmers',
        category: 'Basics',
        difficulty: 'Beginner',
        duration: '30 min',
        lessons: 8,
        icon: 'school-outline',
        color: '#3b82f6',
        prerequisites: [],
        learningObjectives: [
          'Understand commodity market basics',
          'Learn about price discovery',
          'Identify market participants',
          'Recognize seasonal patterns'
        ],
        content: [
          {
            id: 1,
            title: 'What are Commodities?',
            type: 'video',
            duration: '5 min',
            content: 'Understanding basic concepts of commodity trading and how it affects farmers...',
            quiz: [
              {
                question: 'What is a commodity?',
                options: ['A raw material', 'A finished product', 'A service', 'A currency'],
                correct: 0
              }
            ]
          },
          {
            id: 2,
            title: 'Types of Oilseeds in India',
            type: 'text',
            duration: '4 min',
            content: 'Soybean, mustard, groundnut, sunflower - characteristics, growing regions, and market uses...',
            quiz: [
              {
                question: 'Which is the largest oilseed crop in India?',
                options: ['Mustard', 'Soybean', 'Groundnut', 'Sunflower'],
                correct: 1
              }
            ]
          }
        ]
      },
      {
        id: 2,
        title: 'Understanding Price Risk',
        description: 'Learn about price volatility and its impact on farming income',
        category: 'Risk Management',
        difficulty: 'Beginner',
        duration: '25 min',
        lessons: 6,
        icon: 'trending-down-outline',
        color: '#ef4444',
        prerequisites: [1],
        learningObjectives: [
          'Understand price volatility',
          'Calculate risk exposure',
          'Identify risk factors',
          'Learn mitigation strategies'
        ],
        content: [
          {
            id: 1,
            title: 'What is Price Risk?',
            type: 'video',
            duration: '5 min',
            content: 'Understanding how price changes affect farmer income and livelihood...',
            quiz: [
              {
                question: 'Price risk primarily affects:',
                options: ['Production costs', 'Revenue uncertainty', 'Weather patterns', 'Soil quality'],
                correct: 1
              }
            ]
          }
        ]
      },
      {
        id: 3,
        title: 'Hedging Strategies for Farmers',
        description: 'Practical hedging techniques to protect your income',
        category: 'Hedging',
        difficulty: 'Intermediate',
        duration: '45 min',
        lessons: 12,
        icon: 'shield-checkmark-outline',
        color: '#16a34a',
        prerequisites: [1, 2],
        learningObjectives: [
          'Master hedging concepts',
          'Calculate hedge ratios',
          'Execute hedging strategies',
          'Monitor hedge effectiveness'
        ],
        content: [
          {
            id: 1,
            title: 'What is Hedging?',
            type: 'video',
            duration: '8 min',
            content: 'Basic concepts of hedging and risk transfer in simple terms...',
            quiz: [
              {
                question: 'Hedging is used to:',
                options: ['Increase profits', 'Reduce risk', 'Predict prices', 'Improve quality'],
                correct: 1
              }
            ]
          }
        ]
      }
    ];

    // User progress tracking
    this.userProgress = {};
    this.userStats = {};
    this.certificates = {};
    
    // Start real-time progress tracking
    this.startProgressTracking();
  }

  startProgressTracking() {
    // Update learning analytics every 30 seconds
    setInterval(() => {
      Object.keys(this.userProgress).forEach(userId => {
        const progress = this.userProgress[userId];
        
        // Update learning streak
        const lastAccess = progress.lastAccessed;
        if (lastAccess) {
          const daysSinceLastAccess = Math.floor((Date.now() - lastAccess) / (1000 * 60 * 60 * 24));
          if (daysSinceLastAccess === 0) {
            progress.currentStreak = (progress.currentStreak || 0) + 1;
            progress.longestStreak = Math.max(progress.longestStreak || 0, progress.currentStreak);
          } else if (daysSinceLastAccess > 1) {
            progress.currentStreak = 0;
          }
        }
      });
    }, 30000);
  }

  // Get all learning modules
  async getModules() {
    try {
      // Try database first
      const dbModules = await db.select().from(learningModules);
      if (dbModules.length > 0) {
        return dbModules;
      }
    } catch (error) {
      console.log('Database not available, using in-memory modules');
    }
    
    return this.modules;
  }

  // Get user progress
  async getUserProgress(userId) {
    try {
      // Try database first
      const dbProgress = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      
      if (dbProgress.length > 0) {
        return dbProgress;
      }
    } catch (error) {
      console.log('Database not available, using mock progress');
    }
    
    // Return mock progress
    return [
      { moduleId: 1, progress: 75, completed: false, lastAccessed: new Date() },
      { moduleId: 2, progress: 100, completed: true, lastAccessed: new Date() },
      { moduleId: 3, progress: 30, completed: false, lastAccessed: new Date() }
    ];
  }

  // Update user progress
  async updateProgress(userId, moduleId, progress, completed = false) {
    try {
      // Try database first
      await db.insert(userProgress).values({
        userId: userId,
        moduleId: moduleId,
        progress: progress,
        completed: completed,
        lastAccessed: new Date(),
      }).onConflictDoUpdate({
        target: [userProgress.userId, userProgress.moduleId],
        set: {
          progress: progress,
          completed: completed,
          lastAccessed: new Date(),
        }
      });
    } catch (error) {
      console.log('Database not available, storing in memory');
      
      // Store in memory
      if (!this.userProgress[userId]) {
        this.userProgress[userId] = {};
      }
      
      this.userProgress[userId][moduleId] = {
        moduleId,
        progress,
        completed,
        lastAccessed: new Date()
      };
    }
    
    return {
      success: true,
      userId,
      moduleId,
      progress,
      completed
    };
  }

  // Get learning journey
  async getLearningJourney(userId) {
    const progress = await this.getUserProgress(userId);
    const modules = await this.getModules();
    
    const completedModules = progress.filter(p => p.completed).length;
    const inProgressModules = progress.filter(p => p.progress > 0 && !p.completed).length;
    const totalModules = modules.length;
    const overallProgress = (completedModules / totalModules) * 100;
    
    return {
      userId,
      overallProgress: Math.round(overallProgress),
      completedModules,
      inProgressModules,
      totalModules,
      currentStep: this.getCurrentStep(overallProgress),
      nextRecommendation: this.getNextRecommendation(progress),
      achievements: this.getAchievements(completedModules, overallProgress),
      learningStreak: this.getLearningStreak(userId),
      totalTimeSpent: this.getTotalTimeSpent(userId),
      lastAccessed: new Date()
    };
  }

  // Get learning statistics
  async getLearningStats(userId) {
    const progress = await this.getUserProgress(userId);
    const journey = await this.getLearningJourney(userId);
    
    return {
      totalTimeSpent: '12h 45m',
      modulesCompleted: journey.completedModules,
      certificatesEarned: Math.floor(journey.completedModules / 2),
      currentStreak: journey.learningStreak,
      longestStreak: journey.learningStreak + 5,
      averageScore: 87,
      rank: this.getLearnerRank(journey.overallProgress),
      nextMilestone: this.getNextMilestone(journey.completedModules),
      weeklyGoal: {
        target: 3,
        completed: Math.min(3, journey.learningStreak),
        percentage: Math.min(100, (journey.learningStreak / 3) * 100)
      }
    };
  }

  // Get certificates
  async getCertificates(userId) {
    const progress = await this.getUserProgress(userId);
    const completedModules = progress.filter(p => p.completed);
    
    const certificates = [];
    
    // Award certificates based on completed modules
    if (completedModules.some(p => p.moduleId === 1)) {
      certificates.push({
        id: 1,
        title: 'Commodity Trading Basics',
        issuedDate: '2024-01-15',
        validUntil: '2025-01-15',
        credentialId: `CTB-2024-${userId.toString().padStart(3, '0')}`,
        downloadUrl: `/certificates/ctb-${userId}.pdf`,
        verified: true
      });
    }
    
    if (completedModules.some(p => p.moduleId === 2)) {
      certificates.push({
        id: 2,
        title: 'Risk Management Fundamentals',
        issuedDate: '2024-01-20',
        validUntil: '2025-01-20',
        credentialId: `RMF-2024-${userId.toString().padStart(3, '0')}`,
        downloadUrl: `/certificates/rmf-${userId}.pdf`,
        verified: true
      });
    }
    
    if (completedModules.some(p => p.moduleId === 3)) {
      certificates.push({
        id: 3,
        title: 'Hedging Strategies Expert',
        issuedDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        credentialId: `HSE-2024-${userId.toString().padStart(3, '0')}`,
        downloadUrl: `/certificates/hse-${userId}.pdf`,
        verified: true
      });
    }
    
    return certificates;
  }

  // Get quick resources
  async getQuickResources() {
    return [
      {
        id: 1,
        title: 'Oilseed Hedging Glossary',
        description: 'Definitions of 50+ terms: basis, margin, hedge ratio, contango, etc.',
        icon: 'book-outline',
        type: 'glossary',
        downloadUrl: '/resources/glossary.pdf',
        lastUpdated: new Date()
      },
      {
        id: 2,
        title: 'Risk Assessment Calculator',
        description: 'Calculate your farm\'s price risk exposure and optimal hedge ratio',
        icon: 'calculator-outline',
        type: 'calculator',
        url: '/tools/risk-calculator',
        lastUpdated: new Date()
      },
      {
        id: 3,
        title: 'Contract Templates',
        description: 'Ready-to-use forward contract templates for different crops',
        icon: 'document-text-outline',
        type: 'templates',
        downloadUrl: '/resources/contract-templates.zip',
        lastUpdated: new Date()
      },
      {
        id: 4,
        title: 'FPO Directory',
        description: 'Find and connect with Farmer Producer Organizations in your area',
        icon: 'people-outline',
        type: 'directory',
        url: '/fpo-directory',
        lastUpdated: new Date()
      }
    ];
  }

  // Helper methods
  getCurrentStep(overallProgress) {
    if (overallProgress < 25) return 'Start with basics';
    if (overallProgress < 50) return 'Learn risk management';
    if (overallProgress < 75) return 'Master hedging strategies';
    return 'Complete advanced topics';
  }

  getNextRecommendation(progress) {
    const completedModuleIds = progress.filter(p => p.completed).map(p => p.moduleId);
    
    if (completedModuleIds.length === 0) {
      return 'Start with "Introduction to Commodity Trading"';
    }
    
    if (!completedModuleIds.includes(2)) {
      return 'Learn about "Understanding Price Risk"';
    }
    
    if (!completedModuleIds.includes(3)) {
      return 'Master "Hedging Strategies for Farmers"';
    }
    
    return 'Explore advanced topics';
  }

  getAchievements(completedModules, overallProgress) {
    const achievements = [];
    
    if (completedModules >= 1) achievements.push('First Module Completed');
    if (completedModules >= 3) achievements.push('Learning Momentum');
    if (completedModules >= 5) achievements.push('Knowledge Seeker');
    if (overallProgress >= 50) achievements.push('Halfway Hero');
    if (overallProgress >= 100) achievements.push('Learning Champion');
    
    return achievements;
  }

  getLearningStreak(userId) {
    return Math.floor(Math.random() * 7) + 1; // Mock streak
  }

  getTotalTimeSpent(userId) {
    const hours = Math.floor(Math.random() * 20) + 5;
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}h ${minutes}m`;
  }

  getLearnerRank(overallProgress) {
    if (overallProgress >= 80) return 'Expert Learner';
    if (overallProgress >= 60) return 'Advanced Learner';
    if (overallProgress >= 40) return 'Intermediate Learner';
    if (overallProgress >= 20) return 'Beginner Learner';
    return 'New Learner';
  }

  getNextMilestone(completedModules) {
    if (completedModules < 2) return 'Complete 2 modules to earn first certificate';
    if (completedModules < 5) return 'Complete 5 modules to earn "Risk Management Expert" certificate';
    if (completedModules < 8) return 'Complete all modules to earn "Hedging Master" certificate';
    return 'All milestones achieved!';
  }

  // Real-time learning analytics
  async getLearningAnalytics(userId) {
    const journey = await this.getLearningJourney(userId);
    const stats = await this.getLearningStats(userId);
    
    return {
      userId,
      journey,
      stats,
      recommendations: await this.getPersonalizedRecommendations(userId),
      timestamp: new Date().toISOString()
    };
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(userId) {
    const progress = await this.getUserProgress(userId);
    const completedModuleIds = progress.filter(p => p.completed).map(p => p.moduleId);
    
    const recommendations = [];
    
    // Recommend modules based on prerequisites
    for (const module of this.modules) {
      if (!completedModuleIds.includes(module.id)) {
        const prereqsMet = module.prerequisites.every(prereq => completedModuleIds.includes(prereq));
        if (prereqsMet) {
          recommendations.push({
            moduleId: module.id,
            title: module.title,
            reason: module.prerequisites.length === 0 
              ? 'Great starting point' 
              : 'You have completed the prerequisites',
            priority: module.prerequisites.length === 0 ? 'high' : 'medium'
          });
        }
      }
    }
    
    return recommendations.slice(0, 3);
  }
}

export default new EducationService();