import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config/api';
import AppHeader from '../components/AppHeader';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('faqs'); // faqs, experts, support
  const [faqs, setFaqs] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const userId = 1;

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'faqs') {
        const response = await axios.get(`${API_URL}/community/faqs`);
        setFaqs(response.data.faqs || []);
      } else if (activeTab === 'experts') {
        const response = await axios.get(`${API_URL}/community/experts`);
        setExperts(response.data.experts || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateTicket = () => {
    Alert.prompt(
      'Create Support Ticket',
      'Describe your issue:',
      async (text) => {
        if (text) {
          try {
            await axios.post(`${API_URL}/community/support`, {
              userId,
              userName: 'Demo User',
              subject: 'Support Request',
              description: text,
              category: 'general',
              priority: 'medium'
            });
            Alert.alert('Success', 'Support ticket created successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to create ticket');
          }
        }
      }
    );
  };

  const handleBookConsultation = (expert) => {
    Alert.alert(
      `Book Consultation with ${expert.name}`,
      `${expert.title}\n${expert.specialization}\n\nWould you like to schedule a consultation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => bookConsultation(expert) }
      ]
    );
  };

  const bookConsultation = async (expert) => {
    try {
      await axios.post(`${API_URL}/community/consultation`, {
        userId,
        expertId: expert.id,
        date: '2024-11-25',
        time: '10:00 AM',
        topic: 'Hedging Strategy'
      });
      Alert.alert('Success', 'Consultation scheduled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to book consultation');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community & Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faqs' && styles.tabActive]}
          onPress={() => setActiveTab('faqs')}
        >
          <Ionicons
            name="help-circle"
            size={20}
            color={activeTab === 'faqs' ? '#16a34a' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>
            FAQs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'experts' && styles.tabActive]}
          onPress={() => setActiveTab('experts')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'experts' ? '#16a34a' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'experts' && styles.tabTextActive]}>
            Experts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'support' && styles.tabActive]}
          onPress={() => setActiveTab('support')}
        >
          <Ionicons
            name="chatbox"
            size={20}
            color={activeTab === 'support' ? '#16a34a' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'support' && styles.tabTextActive]}>
            Support
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
            ) : (
              faqs.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqCategory}>
                      <Text style={styles.faqCategoryText}>{faq.category}</Text>
                    </View>
                    <Ionicons
                      name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#6b7280"
                    />
                  </View>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  {expandedFaq === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                  <View style={styles.faqFooter}>
                    <View style={styles.faqStat}>
                      <Ionicons name="thumbs-up-outline" size={14} color="#6b7280" />
                      <Text style={styles.faqStatText}>{faq.helpful} helpful</Text>
                    </View>
                    <View style={styles.faqStat}>
                      <Ionicons name="eye-outline" size={14} color="#6b7280" />
                      <Text style={styles.faqStatText}>{faq.views} views</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Experts Tab */}
        {activeTab === 'experts' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Agricultural Experts</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
            ) : (
              experts.map((expert) => (
                <View key={expert.id} style={styles.expertCard}>
                  <View style={styles.expertHeader}>
                    <View style={styles.expertAvatar}>
                      <Ionicons name="person" size={32} color="#16a34a" />
                    </View>
                    <View style={styles.expertInfo}>
                      <Text style={styles.expertName}>{expert.name}</Text>
                      <Text style={styles.expertTitle}>{expert.title}</Text>
                      <View style={styles.expertRating}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.expertRatingText}>{expert.rating}</Text>
                        <Text style={styles.expertConsultations}>
                          ({expert.consultations} consultations)
                        </Text>
                      </View>
                    </View>
                    {expert.available && (
                      <View style={styles.availableBadge}>
                        <View style={styles.availableDot} />
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.expertSpecialization}>{expert.specialization}</Text>
                  <Text style={styles.expertExperience}>Experience: {expert.experience}</Text>
                  <View style={styles.expertLanguages}>
                    {expert.languages.map((lang, index) => (
                      <View key={index} style={styles.languageTag}>
                        <Text style={styles.languageText}>{lang}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      !expert.available && styles.bookButtonDisabled
                    ]}
                    onPress={() => handleBookConsultation(expert)}
                    disabled={!expert.available}
                  >
                    <Text style={styles.bookButtonText}>
                      {expert.available ? 'Book Consultation' : 'Not Available'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Get Support</Text>
            
            <View style={styles.supportCard}>
              <Ionicons name="chatbox-ellipses" size={48} color="#3b82f6" />
              <Text style={styles.supportTitle}>Create Support Ticket</Text>
              <Text style={styles.supportText}>
                Our support team is here to help you with any issues or questions
              </Text>
              <TouchableOpacity style={styles.supportButton} onPress={handleCreateTicket}>
                <Text style={styles.supportButtonText}>Create Ticket</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
              
              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="mail" size={24} color="#3b82f6" />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>support@agrisure.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="call" size={24} color="#16a34a" />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>1800-XXX-XXXX (Toll Free)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="time" size={24} color="#f59e0b" />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Hours</Text>
                  <Text style={styles.contactValue}>Mon-Sat: 9 AM - 6 PM</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqCategory: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  faqCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  faqFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  faqStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faqStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  expertCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  expertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  expertAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  expertTitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  expertRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expertRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  expertConsultations: {
    fontSize: 12,
    color: '#6b7280',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  availableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  expertSpecialization: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 6,
  },
  expertExperience: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  expertLanguages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  languageTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 12,
    color: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  supportCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  supportButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  contactSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});
