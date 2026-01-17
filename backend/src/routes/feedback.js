import express from 'express';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// In-memory storage
if (!global.feedbackData) {
  global.feedbackData = {
    feedback: [],
    ratings: [],
    suggestions: [],
    bugs: []
  };
}

// Submit feedback
router.post('/submit', async (req, res) => {
  try {
    const { userId, userName, type, category, rating, title, description, email } = req.body;
    
    const feedback = {
      id: Date.now(),
      userId: parseInt(userId),
      userName: userName || 'Anonymous',
      type: type || 'general', // general, bug, feature, improvement
      category: category || 'platform',
      rating: rating || null,
      title,
      description,
      email: email || null,
      status: 'submitted',
      priority: 'medium',
      createdAt: new Date(),
      responses: []
    };
    
    global.feedbackData.feedback.push(feedback);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Feedback Received',
      `Thank you for your feedback! We've received your ${type} and will review it shortly.`,
      'system',
      { feedbackId: feedback.id, type }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get user's feedback
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const userFeedback = global.feedbackData.feedback
      .filter(f => f.userId === parseInt(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      feedback: userFeedback,
      count: userFeedback.length
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Submit app rating
router.post('/rating', async (req, res) => {
  try {
    const { userId, rating, review, features } = req.body;
    
    const ratingData = {
      id: Date.now(),
      userId: parseInt(userId),
      rating: parseInt(rating),
      review: review || '',
      features: features || {},
      createdAt: new Date()
    };
    
    global.feedbackData.ratings.push(ratingData);
    
    // Send thank you notification
    notificationService.createNotification(
      userId,
      'Thank You for Rating!',
      `We appreciate your ${rating}-star rating. Your feedback helps us improve AgriSure.`,
      'system',
      { rating }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      rating: ratingData,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Report a bug
router.post('/bug', async (req, res) => {
  try {
    const { userId, userName, title, description, severity, steps, device } = req.body;
    
    const bug = {
      id: `BUG-${Date.now()}`,
      userId: parseInt(userId),
      userName: userName || 'Anonymous',
      title,
      description,
      severity: severity || 'medium',
      steps: steps || [],
      device: device || {},
      status: 'reported',
      createdAt: new Date()
    };
    
    global.feedbackData.bugs.push(bug);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Bug Report Received',
      `Thank you for reporting the bug. Our team will investigate and fix it soon. Bug ID: ${bug.id}`,
      'system',
      { bugId: bug.id }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      bug,
      message: 'Bug report submitted successfully'
    });
  } catch (error) {
    console.error('Error reporting bug:', error);
    res.status(500).json({ error: 'Failed to report bug' });
  }
});

// Submit feature suggestion
router.post('/suggestion', async (req, res) => {
  try {
    const { userId, userName, title, description, category, priority } = req.body;
    
    const suggestion = {
      id: Date.now(),
      userId: parseInt(userId),
      userName: userName || 'Anonymous',
      title,
      description,
      category: category || 'feature',
      priority: priority || 'medium',
      votes: 0,
      status: 'submitted',
      createdAt: new Date()
    };
    
    global.feedbackData.suggestions.push(suggestion);
    
    // Send notification
    notificationService.createNotification(
      userId,
      'Suggestion Received',
      `Thank you for your suggestion! We'll review it and consider it for future updates.`,
      'system',
      { suggestionId: suggestion.id }
    ).catch(err => console.error('Notification error:', err));
    
    res.status(201).json({
      success: true,
      suggestion,
      message: 'Suggestion submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

// Get feedback statistics
router.get('/stats', (req, res) => {
  try {
    const totalFeedback = global.feedbackData.feedback.length;
    const totalRatings = global.feedbackData.ratings.length;
    const totalBugs = global.feedbackData.bugs.length;
    const totalSuggestions = global.feedbackData.suggestions.length;
    
    const averageRating = totalRatings > 0
      ? (global.feedbackData.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;
    
    const stats = {
      totalFeedback,
      totalRatings,
      totalBugs,
      totalSuggestions,
      averageRating,
      responseRate: '95%',
      averageResponseTime: '24 hours'
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
