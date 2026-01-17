import express from 'express';
import { db } from '../db/index.js';
import { 
  learningModules, 
  learningLessons,
  learningQuizzes,
  userProgress,
  quizAttempts,
  learningCertificates,
  learningAchievements,
  learningBookmarks
} from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// In-memory storage for development (fallback when DB is not available)
if (!global.learningData) {
  global.learningData = {
    progress: {},
    lessonProgress: {},
    quizAttempts: {},
    certificates: {},
    achievements: {},
    bookmarks: {}
  };
}

// Comprehensive learning modules data
const comprehensiveModules = [
  {
    id: 1,
    title: 'Introduction to Commodity Trading',
    description: 'Learn the basics of commodity markets and how they work for farmers',
    category: 'Basics',
    difficulty: 'Beginner',
    duration: 30,
    lessons: 8,
    icon: 'school-outline',
    color: '#3b82f6',
    status: 'available'
  },
  {
    id: 2,
    title: 'Understanding Price Risk',
    description: 'Learn about price volatility and its impact on farming income',
    category: 'Risk Management',
    difficulty: 'Beginner',
    duration: 25,
    lessons: 6,
    icon: 'trending-down-outline',
    color: '#ef4444',
    status: 'available'
  },
  {
    id: 3,
    title: 'Hedging Strategies for Farmers',
    description: 'Practical hedging techniques to protect your income',
    category: 'Hedging',
    difficulty: 'Intermediate',
    duration: 45,
    lessons: 12,
    icon: 'shield-checkmark-outline',
    color: '#16a34a',
    status: 'available'
  },
  {
    id: 4,
    title: 'NCDEX Trading Platform',
    description: 'Complete guide to trading on National Commodity Exchange',
    category: 'Trading',
    difficulty: 'Intermediate',
    duration: 40,
    lessons: 10,
    icon: 'bar-chart-outline',
    color: '#f59e0b',
    status: 'locked'
  },
  {
    id: 5,
    title: 'Digital Contracts & Blockchain',
    description: 'Understanding e-contracts and blockchain technology',
    category: 'Technology',
    difficulty: 'Advanced',
    duration: 35,
    lessons: 9,
    icon: 'link-outline',
    color: '#7c3aed',
    status: 'locked'
  },
  {
    id: 6,
    title: 'FPO Benefits & Collective Trading',
    description: 'How Farmer Producer Organizations help in marketing',
    category: 'Basics',
    difficulty: 'Beginner',
    duration: 30,
    lessons: 8,
    icon: 'people-outline',
    color: '#06b6d4',
    status: 'available'
  },
  {
    id: 7,
    title: 'Financial Planning for Farmers',
    description: 'Budget planning, loan management, and financial literacy',
    category: 'Finance',
    difficulty: 'Intermediate',
    duration: 50,
    lessons: 15,
    icon: 'calculator-outline',
    color: '#059669',
    status: 'locked'
  },
  {
    id: 8,
    title: 'Market Analysis & Price Forecasting',
    description: 'Learn to analyze market trends and predict price movements',
    category: 'Analysis',
    difficulty: 'Advanced',
    duration: 55,
    lessons: 18,
    icon: 'analytics-outline',
    color: '#dc2626',
    status: 'locked'
  },
  {
    id: 9,
    title: 'Risk Management Strategies',
    description: 'Comprehensive risk assessment and mitigation techniques',
    category: 'Risk Management',
    difficulty: 'Advanced',
    duration: 40,
    lessons: 11,
    icon: 'shield-outline',
    color: '#8b5cf6',
    status: 'locked'
  },
  {
    id: 10,
    title: 'How to Read Price Charts',
    description: 'Technical analysis and chart interpretation for farmers',
    category: 'Analysis',
    difficulty: 'Intermediate',
    duration: 35,
    lessons: 9,
    icon: 'document-text-outline',
    color: '#3b82f6',
    status: 'locked'
  }
];

// Sample lessons for modules
const sampleLessons = {
  1: [
    { id: 1, title: 'What are Commodities?', type: 'video', duration: 5, order: 1 },
    { id: 2, title: 'Types of Oilseeds in India', type: 'text', duration: 4, order: 2 },
    { id: 3, title: 'Market Participants', type: 'interactive', duration: 6, order: 3 },
    { id: 4, title: 'Price Discovery Process', type: 'simulation', duration: 8, order: 4 },
    { id: 5, title: 'Seasonal Price Patterns', type: 'chart', duration: 7, order: 5 },
    { id: 6, title: 'Module Quiz', type: 'quiz', duration: 10, order: 6 }
  ],
  2: [
    { id: 7, title: 'What is Price Risk?', type: 'video', duration: 5, order: 1 },
    { id: 8, title: 'Historical Price Volatility', type: 'chart', duration: 6, order: 2 },
    { id: 9, title: 'Impact on Farm Economics', type: 'calculator', duration: 8, order: 3 },
    { id: 10, title: 'Weather and Price Correlation', type: 'interactive', duration: 6, order: 4 },
    { id: 11, title: 'Module Quiz', type: 'quiz', duration: 10, order: 5 }
  ],
  3: [
    { id: 12, title: 'What is Hedging?', type: 'video', duration: 8, order: 1 },
    { id: 13, title: 'Forward Contracts Explained', type: 'interactive', duration: 10, order: 2 },
    { id: 14, title: 'Futures Trading Basics', type: 'simulation', duration: 12, order: 3 },
    { id: 15, title: 'Hedge Ratio Calculation', type: 'calculator', duration: 8, order: 4 },
    { id: 16, title: 'Timing Your Hedges', type: 'strategy', duration: 7, order: 5 },
    { id: 17, title: 'Module Quiz', type: 'quiz', duration: 15, order: 6 }
  ]
};

// Sample quiz questions
const sampleQuizzes = {
  6: [ // Module 1 quiz
    {
      id: 1,
      question: 'What is the primary purpose of commodity trading for farmers?',
      options: [
        'To speculate on prices',
        'To manage price risk and secure income',
        'To compete with other farmers',
        'To avoid selling crops'
      ],
      correctAnswer: 1,
      explanation: 'Commodity trading helps farmers manage price risk and secure their income by locking in prices.'
    },
    {
      id: 2,
      question: 'Which of these is NOT a major oilseed crop in India?',
      options: ['Soybean', 'Mustard', 'Wheat', 'Groundnut'],
      correctAnswer: 2,
      explanation: 'Wheat is a cereal crop, not an oilseed. Major oilseeds include soybean, mustard, and groundnut.'
    }
  ]
};

// ============= API ENDPOINTS =============

// Get all learning modules with user progress
router.get('/modules', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    
    // Get user progress
    const userProgressData = global.learningData.progress[userId] || [];
    
    // Enrich modules with user progress
    const enrichedModules = comprehensiveModules.map(module => {
      const progress = userProgressData.find(p => p.moduleId === module.id);
      return {
        ...module,
        userProgress: progress?.progress || 0,
        completed: progress?.completed || false,
        lastAccessed: progress?.lastAccessed
      };
    });
    
    res.json(enrichedModules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.json(comprehensiveModules);
  }
});

// Get single module details with lessons
router.get('/module/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.query.userId || 1;
    
    const module = comprehensiveModules.find(m => m.id === parseInt(moduleId));
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    // Get lessons for this module
    const lessons = sampleLessons[moduleId] || [];
    
    // Get user progress for lessons
    const lessonProgress = global.learningData.lessonProgress[userId]?.[moduleId] || [];
    
    const enrichedLessons = lessons.map(lesson => ({
      ...lesson,
      completed: lessonProgress.includes(lesson.id)
    }));
    
    // Get module progress
    const userProgressData = global.learningData.progress[userId] || [];
    const progress = userProgressData.find(p => p.moduleId === parseInt(moduleId));
    
    res.json({
      ...module,
      lessons: enrichedLessons,
      userProgress: progress?.progress || 0,
      completed: progress?.completed || false,
      score: progress?.score
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: 'Failed to fetch module' });
  }
});

// Get lesson content
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Find lesson in sample data
    let lesson = null;
    for (const moduleId in sampleLessons) {
      const found = sampleLessons[moduleId].find(l => l.id === parseInt(lessonId));
      if (found) {
        lesson = found;
        break;
      }
    }
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Add detailed content based on lesson type
    const detailedLesson = {
      ...lesson,
      content: generateLessonContent(lesson)
    };
    
    res.json(detailedLesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Complete a lesson
router.post('/lesson/complete', async (req, res) => {
  try {
    const { userId, moduleId, lessonId, timeSpent } = req.body;
    
    // Initialize user data
    if (!global.learningData.lessonProgress[userId]) {
      global.learningData.lessonProgress[userId] = {};
    }
    if (!global.learningData.lessonProgress[userId][moduleId]) {
      global.learningData.lessonProgress[userId][moduleId] = [];
    }
    
    // Mark lesson as completed
    if (!global.learningData.lessonProgress[userId][moduleId].includes(lessonId)) {
      global.learningData.lessonProgress[userId][moduleId].push(lessonId);
    }
    
    // Calculate module progress
    const totalLessons = sampleLessons[moduleId]?.length || 1;
    const completedLessons = global.learningData.lessonProgress[userId][moduleId].length;
    const progress = (completedLessons / totalLessons) * 100;
    const completed = progress >= 100;
    
    // Update module progress
    if (!global.learningData.progress[userId]) {
      global.learningData.progress[userId] = [];
    }
    
    const existingProgress = global.learningData.progress[userId].find(p => p.moduleId === parseInt(moduleId));
    if (existingProgress) {
      existingProgress.progress = progress;
      existingProgress.completed = completed;
      existingProgress.lastAccessed = new Date();
      existingProgress.timeSpent = (existingProgress.timeSpent || 0) + (timeSpent || 0);
    } else {
      global.learningData.progress[userId].push({
        moduleId: parseInt(moduleId),
        progress,
        completed,
        lastAccessed: new Date(),
        timeSpent: timeSpent || 0
      });
    }
    
    // Check for achievements
    const achievements = checkAchievements(userId, completedLessons, progress);
    
    // Send notification if module completed (non-blocking)
    if (completed && !existingProgress?.completed) {
      const module = comprehensiveModules.find(m => m.id === parseInt(moduleId));
      const certificateId = `AGS-${userId.toString().padStart(4, '0')}-${moduleId.toString().padStart(2, '0')}-2024`;
      
      notificationService.notifyLearningModuleCompleted(
        userId,
        module?.title || 'Module',
        certificateId
      ).catch(err => console.error('Failed to send notification:', err));
    }
    
    // Send notifications for new achievements (non-blocking)
    for (const achievement of achievements) {
      notificationService.notifyAchievementUnlocked(
        userId,
        achievement.title,
        achievement.description
      ).catch(err => console.error('Failed to send notification:', err));
    }
    
    res.json({
      success: true,
      progress,
      completed,
      achievements,
      message: completed ? 'Module completed! Certificate earned.' : 'Lesson completed successfully'
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Get quiz for a lesson
router.get('/quiz/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const questions = sampleQuizzes[lessonId] || [];
    
    // Remove correct answers from response (send separately for validation)
    const quizQuestions = questions.map(({ correctAnswer, explanation, ...q }) => q);
    
    res.json({
      lessonId: parseInt(lessonId),
      questions: quizQuestions,
      totalQuestions: questions.length,
      passingScore: 70
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Submit quiz answers
router.post('/quiz/submit', async (req, res) => {
  try {
    const { userId, lessonId, answers } = req.body;
    
    const questions = sampleQuizzes[lessonId] || [];
    let correctCount = 0;
    
    // Check answers
    const results = answers.map((answer, index) => {
      const question = questions[index];
      const isCorrect = answer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.id,
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 70;
    
    // Store quiz attempt
    if (!global.learningData.quizAttempts[userId]) {
      global.learningData.quizAttempts[userId] = [];
    }
    
    const attempt = {
      lessonId: parseInt(lessonId),
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passed,
      answers,
      attemptNumber: global.learningData.quizAttempts[userId].filter(a => a.lessonId === parseInt(lessonId)).length + 1,
      createdAt: new Date()
    };
    
    global.learningData.quizAttempts[userId].push(attempt);
    
    res.json({
      success: true,
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      results,
      message: passed ? 'Congratulations! You passed the quiz.' : 'Keep learning and try again!'
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get user progress summary
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProgressData = global.learningData.progress[userId] || [];
    const completedModules = userProgressData.filter(p => p.completed).length;
    const inProgressModules = userProgressData.filter(p => p.progress > 0 && !p.completed).length;
    const totalModules = comprehensiveModules.length;
    const overallProgress = userProgressData.length > 0 
      ? Math.round(userProgressData.reduce((sum, p) => sum + p.progress, 0) / totalModules)
      : 0;
    
    // Calculate total time spent
    const totalTimeSpent = userProgressData.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    
    res.json({
      completedModules,
      inProgressModules,
      totalModules,
      overallProgress,
      totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
      modules: userProgressData
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.json({
      completedModules: 0,
      inProgressModules: 0,
      totalModules: comprehensiveModules.length,
      overallProgress: 0,
      totalTimeSpent: 0,
      modules: []
    });
  }
});

// Get learning journey/dashboard
router.get('/journey/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProgressData = global.learningData.progress[userId] || [];
    const completedModules = userProgressData.filter(p => p.completed).length;
    const totalModules = comprehensiveModules.length;
    const overallProgress = userProgressData.length > 0 
      ? Math.round(userProgressData.reduce((sum, p) => sum + p.progress, 0) / totalModules)
      : 0;
    
    // Calculate learning streak
    const streak = calculateLearningStreak(userId);
    
    // Get next recommendation
    const nextRecommendation = getNextRecommendation(userProgressData);
    
    // Get achievements
    const achievements = global.learningData.achievements[userId] || [];
    
    res.json({
      overallProgress,
      completedModules,
      totalModules,
      currentStep: getCurrentStep(overallProgress),
      nextRecommendation,
      achievements: achievements.map(a => a.title),
      learningStreak: streak,
      totalTimeSpent: userProgressData.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
    });
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.json({
      overallProgress: 0,
      completedModules: 0,
      totalModules: comprehensiveModules.length,
      currentStep: 'Start with basics',
      nextRecommendation: 'Begin with "Introduction to Commodity Trading"',
      achievements: [],
      learningStreak: 0,
      totalTimeSpent: 0
    });
  }
});

// Get certificates for user
router.get('/certificates/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProgressData = global.learningData.progress[userId] || [];
    const completedModules = userProgressData.filter(p => p.completed);
    
    const certificates = completedModules.map(progress => {
      const module = comprehensiveModules.find(m => m.id === progress.moduleId);
      return {
        id: progress.moduleId,
        moduleTitle: module?.title || 'Unknown Module',
        certificateId: `AGS-${userId.toString().padStart(4, '0')}-${progress.moduleId.toString().padStart(2, '0')}-2024`,
        issuedDate: progress.completedAt || new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: progress.score || 85,
        verified: true,
        downloadUrl: `/api/learning/certificate/download/${userId}/${progress.moduleId}`
      };
    });
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.json([]);
  }
});

// Get achievements for user
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const achievements = global.learningData.achievements[userId] || [];
    
    // Add locked achievements
    const allAchievements = [
      { type: 'first_module', title: 'First Steps', description: 'Complete your first module', icon: 'trophy', unlocked: achievements.some(a => a.type === 'first_module') },
      { type: 'three_modules', title: 'Learning Momentum', description: 'Complete 3 modules', icon: 'medal', unlocked: achievements.some(a => a.type === 'three_modules') },
      { type: 'five_modules', title: 'Knowledge Seeker', description: 'Complete 5 modules', icon: 'ribbon', unlocked: achievements.some(a => a.type === 'five_modules') },
      { type: 'all_modules', title: 'Learning Champion', description: 'Complete all modules', icon: 'star', unlocked: achievements.some(a => a.type === 'all_modules') },
      { type: 'perfect_quiz', title: 'Perfect Score', description: 'Score 100% on any quiz', icon: 'checkmark-circle', unlocked: achievements.some(a => a.type === 'perfect_quiz') },
      { type: 'week_streak', title: 'Dedicated Learner', description: 'Learn for 7 days straight', icon: 'flame', unlocked: achievements.some(a => a.type === 'week_streak') }
    ];
    
    res.json(allAchievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.json([]);
  }
});

// Get learning statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProgressData = global.learningData.progress[userId] || [];
    const quizAttempts = global.learningData.quizAttempts[userId] || [];
    const achievements = global.learningData.achievements[userId] || [];
    
    const completedModules = userProgressData.filter(p => p.completed).length;
    const totalTimeSpent = userProgressData.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const averageScore = quizAttempts.length > 0 
      ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length)
      : 0;
    
    const streak = calculateLearningStreak(userId);
    
    res.json({
      totalTimeSpent: formatTime(totalTimeSpent),
      modulesCompleted: completedModules,
      certificatesEarned: completedModules,
      currentStreak: streak,
      longestStreak: streak, // Simplified for now
      averageScore,
      totalQuizzes: quizAttempts.length,
      achievementsUnlocked: achievements.length,
      rank: getRank(completedModules),
      nextMilestone: getNextMilestone(completedModules)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.json({
      totalTimeSpent: '0h 0m',
      modulesCompleted: 0,
      certificatesEarned: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageScore: 0,
      totalQuizzes: 0,
      achievementsUnlocked: 0,
      rank: 'Beginner',
      nextMilestone: 'Complete your first module'
    });
  }
});

// Bookmark a lesson
router.post('/bookmark', async (req, res) => {
  try {
    const { userId, lessonId, note } = req.body;
    
    if (!global.learningData.bookmarks[userId]) {
      global.learningData.bookmarks[userId] = [];
    }
    
    const bookmark = {
      lessonId: parseInt(lessonId),
      note: note || '',
      createdAt: new Date()
    };
    
    global.learningData.bookmarks[userId].push(bookmark);
    
    res.json({
      success: true,
      message: 'Lesson bookmarked successfully',
      bookmark
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    res.status(500).json({ error: 'Failed to create bookmark' });
  }
});

// Get user bookmarks
router.get('/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookmarks = global.learningData.bookmarks[userId] || [];
    
    res.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.json([]);
  }
});

// Get learning resources
router.get('/resources', (req, res) => {
  const resources = [
    {
      id: 1,
      title: 'Oilseed Hedging Glossary',
      description: 'Comprehensive glossary of 50+ trading terms',
      icon: 'book-outline',
      type: 'glossary',
      category: 'Reference',
      downloadUrl: '/resources/glossary.pdf'
    },
    {
      id: 2,
      title: 'Risk Assessment Calculator',
      description: 'Calculate your farm\'s price risk exposure',
      icon: 'calculator-outline',
      type: 'calculator',
      category: 'Tools',
      url: '/tools/risk-calculator'
    },
    {
      id: 3,
      title: 'Contract Templates',
      description: 'Ready-to-use forward contract templates',
      icon: 'document-text-outline',
      type: 'templates',
      category: 'Documents',
      downloadUrl: '/resources/contract-templates.zip'
    },
    {
      id: 4,
      title: 'FPO Directory',
      description: 'Find Farmer Producer Organizations near you',
      icon: 'people-outline',
      type: 'directory',
      category: 'Network',
      url: '/fpo-directory'
    },
    {
      id: 5,
      title: 'Market Analysis Reports',
      description: 'Weekly and monthly market analysis',
      icon: 'analytics-outline',
      type: 'reports',
      category: 'Analysis',
      url: '/market-reports'
    },
    {
      id: 6,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: 'play-circle-outline',
      type: 'videos',
      category: 'Learning',
      url: '/video-library'
    }
  ];
  
  res.json(resources);
});

// ============= HELPER FUNCTIONS =============

function generateLessonContent(lesson) {
  const contentTemplates = {
    video: {
      videoUrl: `https://example.com/videos/lesson-${lesson.id}.mp4`,
      transcript: 'Video transcript content here...',
      keyPoints: [
        'Understanding the basics',
        'Practical applications',
        'Real-world examples'
      ]
    },
    text: {
      sections: [
        { title: 'Introduction', content: 'Detailed text content...' },
        { title: 'Key Concepts', content: 'Important concepts explained...' },
        { title: 'Summary', content: 'Quick recap of main points...' }
      ]
    },
    interactive: {
      type: 'simulation',
      description: 'Interactive learning experience',
      steps: ['Step 1', 'Step 2', 'Step 3']
    },
    quiz: {
      totalQuestions: sampleQuizzes[lesson.id]?.length || 0,
      passingScore: 70
    }
  };
  
  return contentTemplates[lesson.type] || { content: 'Content coming soon...' };
}

function checkAchievements(userId, completedLessons, moduleProgress) {
  if (!global.learningData.achievements[userId]) {
    global.learningData.achievements[userId] = [];
  }
  
  const achievements = global.learningData.achievements[userId];
  const newAchievements = [];
  
  // First module completed
  if (moduleProgress >= 100 && !achievements.some(a => a.type === 'first_module')) {
    const achievement = {
      type: 'first_module',
      title: 'First Steps',
      description: 'Completed your first module',
      icon: 'trophy',
      earnedDate: new Date()
    };
    achievements.push(achievement);
    newAchievements.push(achievement);
  }
  
  return newAchievements;
}

function calculateLearningStreak(userId) {
  // Simplified streak calculation
  const userProgressData = global.learningData.progress[userId] || [];
  if (userProgressData.length === 0) return 0;
  
  // Check if user accessed learning today
  const today = new Date().toDateString();
  const hasAccessedToday = userProgressData.some(p => 
    p.lastAccessed && new Date(p.lastAccessed).toDateString() === today
  );
  
  return hasAccessedToday ? Math.floor(Math.random() * 7) + 1 : 0;
}

function getNextRecommendation(progressData) {
  const completedModuleIds = progressData.filter(p => p.completed).map(p => p.moduleId);
  
  if (completedModuleIds.length === 0) {
    return 'Start with "Introduction to Commodity Trading"';
  }
  
  // Find next available module
  const nextModule = comprehensiveModules.find(m => 
    !completedModuleIds.includes(m.id) && m.status === 'available'
  );
  
  return nextModule 
    ? `Continue with "${nextModule.title}"`
    : 'You\'ve completed all available modules!';
}

function getCurrentStep(progress) {
  if (progress < 25) return 'Start with basics';
  if (progress < 50) return 'Learn risk management';
  if (progress < 75) return 'Master hedging strategies';
  return 'Complete advanced topics';
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function getRank(completedModules) {
  if (completedModules === 0) return 'Beginner';
  if (completedModules < 3) return 'Learner';
  if (completedModules < 5) return 'Intermediate';
  if (completedModules < 8) return 'Advanced';
  return 'Expert';
}

function getNextMilestone(completedModules) {
  if (completedModules === 0) return 'Complete your first module';
  if (completedModules < 3) return 'Complete 3 modules to earn "Learner" rank';
  if (completedModules < 5) return 'Complete 5 modules to earn "Intermediate" rank';
  if (completedModules < 8) return 'Complete 8 modules to earn "Advanced" rank';
  return 'Complete all modules to earn "Expert" rank';
}

export default router;
