import axios from 'axios';
import { API_URL } from '../config/api';

class LearningService {
  constructor() {
    this.baseURL = `${API_URL}/learning`;
  }

  // Get all modules with user progress
  async getModules(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/modules`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  }

  // Get single module details
  async getModule(moduleId, userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/module/${moduleId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  }

  // Get lesson content
  async getLesson(lessonId) {
    try {
      const response = await axios.get(`${this.baseURL}/lesson/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  // Complete a lesson
  async completeLesson(userId, moduleId, lessonId, timeSpent = 0) {
    try {
      const response = await axios.post(`${this.baseURL}/lesson/complete`, {
        userId,
        moduleId,
        lessonId,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  // Get quiz for a lesson
  async getQuiz(lessonId) {
    try {
      const response = await axios.get(`${this.baseURL}/quiz/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  // Submit quiz answers
  async submitQuiz(userId, lessonId, answers) {
    try {
      const response = await axios.post(`${this.baseURL}/quiz/submit`, {
        userId,
        lessonId,
        answers
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  // Get user progress
  async getProgress(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/progress/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  }

  // Get learning journey/dashboard
  async getJourney(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/journey/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey:', error);
      throw error;
    }
  }

  // Get certificates
  async getCertificates(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/certificates/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  }

  // Get achievements
  async getAchievements(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/achievements/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  // Get learning statistics
  async getStats(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Bookmark a lesson
  async bookmarkLesson(userId, lessonId, note = '') {
    try {
      const response = await axios.post(`${this.baseURL}/bookmark`, {
        userId,
        lessonId,
        note
      });
      return response.data;
    } catch (error) {
      console.error('Error bookmarking lesson:', error);
      throw error;
    }
  }

  // Get user bookmarks
  async getBookmarks(userId = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/bookmarks/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  }

  // Get learning resources
  async getResources() {
    try {
      const response = await axios.get(`${this.baseURL}/resources`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }
}

export default new LearningService();
