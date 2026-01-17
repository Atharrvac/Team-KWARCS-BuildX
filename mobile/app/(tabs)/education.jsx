import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import axios from 'axios';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function EducationScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [learningModules, setLearningModules] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [selectedModule, setSelectedModule] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(0);

  const categories = ['All', 'Basics', 'Hedging', 'Trading', 'Risk Management', 'Contracts', 'Technology'];

  useEffect(() => {
    loadEducationData();
  }, []);

  const loadEducationData = async () => {
    try {
      const userId = 1; // Demo user
      const [modulesRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/learning/modules`),
        axios.get(`${API_URL}/learning/progress/${userId}`)
      ]);

      setLearningModules(modulesRes.data);
      
      // Process progress data
      const progressMap = {};
      progressRes.data.forEach(p => {
        progressMap[p.moduleId] = p;
      });
      setUserProgress(progressMap);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading education data:', error);
      // Set mock data
      setLearningModules(getMockModules());
      setUserProgress(getMockProgress());
      setLoading(false);
    }
  };

  const getMockModules = () => [
    {
      id: 1,
      title: 'Introduction to Commodity Trading',
      description: 'Learn the basics of commodity markets and how they work',
      category: 'Basics',
      difficulty: 'Beginner',
      duration: '30 min',
      lessons: 8,
      icon: 'school-outline',
      color: '#3b82f6',
      content: [
        {
          title: 'What are Commodities?',
          type: 'video',
          duration: '5 min',
          content: 'Understanding basic concepts of commodity trading...'
        },
        {
          title: 'Types of Oilseeds',
          type: 'text',
          duration: '3 min',
          content: 'Soybean, mustard, groundnut, sunflower - characteristics and uses...'
        },
        {
          title: 'Market Participants',
          type: 'interactive',
          duration: '4 min',
          content: 'Farmers, traders, processors, and their roles...'
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
      content: [
        {
          title: 'What is Price Risk?',
          type: 'video',
          duration: '4 min',
          content: 'Understanding how price changes affect farmer income...'
        },
        {
          title: 'Historical Price Patterns',
          type: 'chart',
          duration: '5 min',
          content: 'Analyzing 10-year price trends for major oilseeds...'
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
      content: [
        {
          title: 'What is Hedging?',
          type: 'video',
          duration: '6 min',
          content: 'Basic concepts of hedging and risk transfer...'
        },
        {
          title: 'Forward Contracts',
          type: 'interactive',
          duration: '8 min',
          content: 'How forward contracts work and their benefits...'
        },
        {
          title: 'Futures Trading Basics',
          type: 'simulation',
          duration: '10 min',
          content: 'Hands-on futures trading simulation...'
        }
      ]
    },
    {
      id: 4,
      title: 'NCDEX Trading Platform',
      description: 'Complete guide to trading on NCDEX',
      category: 'Trading',
      difficulty: 'Intermediate',
      duration: '40 min',
      lessons: 10,
      icon: 'bar-chart-outline',
      color: '#f59e0b',
      content: [
        {
          title: 'NCDEX Overview',
          type: 'video',
          duration: '5 min',
          content: 'Introduction to National Commodity & Derivatives Exchange...'
        },
        {
          title: 'Contract Specifications',
          type: 'text',
          duration: '6 min',
          content: 'Understanding futures contract details...'
        }
      ]
    },
    {
      id: 5,
      title: 'Digital Contracts & Blockchain',
      description: 'Understanding e-contracts and blockchain technology',
      category: 'Technology',
      difficulty: 'Advanced',
      duration: '35 min',
      lessons: 9,
      icon: 'link-outline',
      color: '#7c3aed',
      content: [
        {
          title: 'What is Blockchain?',
          type: 'video',
          duration: '7 min',
          content: 'Understanding blockchain technology in simple terms...'
        },
        {
          title: 'Smart Contracts',
          type: 'interactive',
          duration: '8 min',
          content: 'How smart contracts automate agreements...'
        }
      ]
    },
    {
      id: 6,
      title: 'FPO Benefits & Collective Trading',
      description: 'How Farmer Producer Organizations help in marketing',
      category: 'Basics',
      difficulty: 'Beginner',
      duration: '20 min',
      lessons: 5,
      icon: 'people-outline',
      color: '#06b6d4',
      content: [
        {
          title: 'What are FPOs?',
          type: 'video',
          duration: '4 min',
          content: 'Understanding Farmer Producer Organizations...'
        },
        {
          title: 'Collective Bargaining Power',
          type: 'text',
          duration: '3 min',
          content: 'How FPOs help get better prices...'
        }
      ]
    }
  ];

  const getMockProgress = () => ({
    1: { moduleId: 1, progress: 75, completed: false, lastAccessed: new Date() },
    2: { moduleId: 2, progress: 100, completed: true, lastAccessed: new Date() },
    3: { moduleId: 3, progress: 30, completed: false, lastAccessed: new Date() },
    4: { moduleId: 4, progress: 0, completed: false, lastAccessed: null },
    5: { moduleId: 5, progress: 0, completed: false, lastAccessed: null },
    6: { moduleId: 6, progress: 50, completed: false, lastAccessed: new Date() }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEducationData();
    setRefreshing(false);
  };

  const filteredModules = selectedCategory === 'All' 
    ? learningModules 
    : learningModules.filter(module => module.category === selectedCategory);

  const startModule = (module) => {
    setSelectedModule(module);
    setCurrentLesson(0);
    setShowModuleModal(true);
  };

  const completeLesson = async () => {
    if (!selectedModule) return;
    
    const progress = userProgress[selectedModule.id] || { progress: 0 };
    const newProgress = Math.min(100, progress.progress + (100 / selectedModule.lessons));
    
    try {
      await axios.post(`${API_URL}/learning/progress`, {
        userId: 1,
        moduleId: selectedModule.id,
        progress: newProgress,
        completed: newProgress >= 100
      });
      
      // Update local state
      setUserProgress(prev => ({
        ...prev,
        [selectedModule.id]: {
          ...progress,
          progress: newProgress,
          completed: newProgress >= 100
        }
      }));
      
      if (currentLesson < selectedModule.content.length - 1) {
        setCurrentLesson(currentLesson + 1);
      } else {
        Alert.alert('Congratulations!', 'You have completed this module!');
        setShowModuleModal(false);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#16a34a';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading education modules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Education</Text>
            <Text style={styles.headerSubtitle}>Learn risk management & trading</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="trophy-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="bookmark-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressOverview}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Completed</Text>
            <Text style={styles.progressValue}>
              {Object.values(userProgress).filter(p => p.completed).length}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>In Progress</Text>
            <Text style={styles.progressValue}>
              {Object.values(userProgress).filter(p => p.progress > 0 && !p.completed).length}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Total Modules</Text>
            <Text style={styles.progressValue}>{learningModules.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Learning Path */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Learning Path</Text>
          <Text style={styles.sectionSubtitle}>Start with basics and progress to advanced topics</Text>
          
          {filteredModules.map((module, index) => {
            const progress = userProgress[module.id] || { progress: 0, completed: false };
            
            return (
              <TouchableOpacity
                key={module.id}
                style={styles.moduleCard}
                onPress={() => startModule(module)}
              >
                <View style={styles.moduleHeader}>
                  <View style={[styles.moduleIcon, { backgroundColor: module.color }]}>
                    <Ionicons name={module.icon} size={24} color="#fff" />
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleDescription}>{module.description}</Text>
                    <View style={styles.moduleMetrics}>
                      <View style={styles.metricItem}>
                        <Ionicons name="time-outline" size={14} color="#6b7280" />
                        <Text style={styles.metricText}>{module.duration}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <Ionicons name="book-outline" size={14} color="#6b7280" />
                        <Text style={styles.metricText}>{module.lessons} lessons</Text>
                      </View>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(module.difficulty) }]}>
                        <Text style={styles.difficultyText}>{module.difficulty}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.moduleProgress}>
                    {progress.completed ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                      </View>
                    ) : (
                      <View style={styles.progressCircle}>
                        <Text style={styles.progressText}>{Math.round(progress.progress)}%</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {progress.progress > 0 && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressBarFill, { width: `${progress.progress}%` }]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Resources</Text>
          
          <View style={styles.resourcesGrid}>
            <TouchableOpacity style={styles.resourceCard}>
              <Ionicons name="calculator-outline" size={32} color="#3b82f6" />
              <Text style={styles.resourceTitle}>Risk Calculator</Text>
              <Text style={styles.resourceDescription}>Calculate your price risk exposure</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceCard}>
              <Ionicons name="library-outline" size={32} color="#f59e0b" />
              <Text style={styles.resourceTitle}>Glossary</Text>
              <Text style={styles.resourceDescription}>Trading terms explained</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceCard}>
              <Ionicons name="help-circle-outline" size={32} color="#16a34a" />
              <Text style={styles.resourceTitle}>FAQ</Text>
              <Text style={styles.resourceDescription}>Common questions answered</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceCard}>
              <Ionicons name="call-outline" size={32} color="#ef4444" />
              <Text style={styles.resourceTitle}>Support</Text>
              <Text style={styles.resourceDescription}>Get help from experts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Module Modal */}
      <Modal
        visible={showModuleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModuleModal(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedModule?.title}</Text>
            <TouchableOpacity>
              <Ionicons name="bookmark-outline" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          
          {selectedModule && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonTitle}>
                  Lesson {currentLesson + 1}: {selectedModule.content[currentLesson]?.title}
                </Text>
                <Text style={styles.lessonDuration}>
                  {selectedModule.content[currentLesson]?.duration}
                </Text>
              </View>
              
              <View style={styles.lessonContent}>
                <Text style={styles.lessonText}>
                  {selectedModule.content[currentLesson]?.content}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.completeButton} onPress={completeLesson}>
                <Text style={styles.completeButtonText}>
                  {currentLesson < selectedModule.content.length - 1 ? 'Next Lesson' : 'Complete Module'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#dcfce7',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Category Filter
  categoryFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonActive: {
    backgroundColor: '#16a34a',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  
  // Module Card
  moduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  moduleMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  moduleProgress: {
    alignItems: 'center',
  },
  completedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  
  // Resources
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  lessonHeader: {
    marginBottom: 20,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  lessonDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  lessonContent: {
    marginBottom: 30,
  },
  lessonText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  completeButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});