import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import AppHeader from '../../components/AppHeader';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// YouTube Video Learning Content
const LEARNING_VIDEOS = {
  hedging: [
    {
      id: 'v1',
      title: 'What is Hedging? Basics Explained',
      titleHi: 'हेजिंग क्या है? मूल बातें',
      description: 'Learn the fundamentals of hedging and why farmers need it',
      descriptionHi: 'हेजिंग की मूल बातें और किसानों को इसकी आवश्यकता क्यों है',
      youtubeId: 'EfmTWu2yn5Q', // Example - replace with actual video
      duration: '8:45',
      level: 'Beginner',
      views: '12.5K',
    },
    {
      id: 'v2',
      title: 'Futures Contracts for Farmers',
      titleHi: 'किसानों के लिए फ्यूचर्स कॉन्ट्रैक्ट',
      description: 'Understanding futures contracts in commodity trading',
      descriptionHi: 'कमोडिटी ट्रेडिंग में फ्यूचर्स कॉन्ट्रैक्ट को समझना',
      youtubeId: 'CC9VeHrI3Es',
      duration: '12:30',
      level: 'Beginner',
      views: '8.2K',
    },
    {
      id: 'v3',
      title: 'Options Trading Simplified',
      titleHi: 'ऑप्शन ट्रेडिंग सरल भाषा में',
      description: 'How options work and when to use them',
      descriptionHi: 'ऑप्शन कैसे काम करते हैं और कब उपयोग करें',
      youtubeId: 'VJgHkAqohbU',
      duration: '15:20',
      level: 'Intermediate',
      views: '6.8K',
    },
  ],
  oilseeds: [
    {
      id: 'v4',
      title: 'Soybean Market Analysis',
      titleHi: 'सोयाबीन बाजार विश्लेषण',
      description: 'Understanding soybean price movements and trends',
      descriptionHi: 'सोयाबीन की कीमतों में उतार-चढ़ाव को समझें',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '10:15',
      level: 'Intermediate',
      views: '5.4K',
    },
    {
      id: 'v5',
      title: 'Mustard Seed Trading Guide',
      titleHi: 'सरसों व्यापार गाइड',
      description: 'Complete guide to mustard seed trading in India',
      descriptionHi: 'भारत में सरसों व्यापार की पूरी गाइड',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '14:00',
      level: 'Beginner',
      views: '9.1K',
    },
  ],
  riskManagement: [
    {
      id: 'v6',
      title: 'Risk Management for Farmers',
      titleHi: 'किसानों के लिए जोखिम प्रबंधन',
      description: 'Protect your crops and income from market volatility',
      descriptionHi: 'बाजार की अस्थिरता से अपनी फसल और आय की रक्षा करें',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '11:30',
      level: 'Beginner',
      views: '15.2K',
    },
  ],
};

// Voice Learning Content (Text-to-Speech)
const VOICE_LESSONS = [
  {
    id: 'voice1',
    title: 'Introduction to Hedging',
    titleHi: 'हेजिंग का परिचय',
    content: `Hedging is a risk management strategy used to protect against price fluctuations. 
    For farmers, hedging means locking in a price for your crops before harvest. 
    This protects you from price drops and ensures stable income.
    There are two main types: futures contracts and options contracts.
    Futures lock you into a specific price, while options give you the right but not obligation to sell at a price.`,
    contentHi: `हेजिंग एक जोखिम प्रबंधन रणनीति है जो मूल्य उतार-चढ़ाव से बचाव के लिए उपयोग की जाती है।
    किसानों के लिए, हेजिंग का मतलब है फसल कटाई से पहले अपनी फसलों के लिए एक कीमत तय करना।
    यह आपको कीमतों में गिरावट से बचाता है और स्थिर आय सुनिश्चित करता है।
    दो मुख्य प्रकार हैं: फ्यूचर्स कॉन्ट्रैक्ट और ऑप्शन कॉन्ट्रैक्ट।`,
    duration: '2 min',
    icon: 'shield-checkmark',
    color: '#16a34a',
  },
  {
    id: 'voice2',
    title: 'Understanding Futures',
    titleHi: 'फ्यूचर्स को समझें',
    content: `A futures contract is an agreement to buy or sell a commodity at a predetermined price on a specific future date.
    For example, if soybean is trading at 4500 rupees per quintal today, you can lock in this price for delivery in 3 months.
    If the price drops to 4000 at harvest, you still get 4500. But if it rises to 5000, you must sell at 4500.
    This is the trade-off: protection from downside but limited upside.`,
    contentHi: `फ्यूचर्स कॉन्ट्रैक्ट एक समझौता है जिसमें भविष्य की एक निश्चित तारीख पर पूर्व निर्धारित कीमत पर कमोडिटी खरीदने या बेचने का वादा किया जाता है।
    उदाहरण के लिए, अगर आज सोयाबीन 4500 रुपये प्रति क्विंटल पर है, तो आप 3 महीने बाद डिलीवरी के लिए यह कीमत लॉक कर सकते हैं।`,
    duration: '3 min',
    icon: 'document-text',
    color: '#3b82f6',
  },
  {
    id: 'voice3',
    title: 'Options Basics',
    titleHi: 'ऑप्शन की मूल बातें',
    content: `Options give you the right, but not the obligation, to sell at a specific price.
    You pay a premium for this right. Think of it like insurance.
    If prices fall, you can exercise your option and sell at the higher locked price.
    If prices rise, you can let the option expire and sell at the higher market price.
    You only lose the premium you paid, which is like an insurance cost.`,
    contentHi: `ऑप्शन आपको एक विशिष्ट कीमत पर बेचने का अधिकार देता है, लेकिन बाध्यता नहीं।
    इस अधिकार के लिए आप एक प्रीमियम देते हैं। इसे बीमा की तरह समझें।
    अगर कीमतें गिरती हैं, तो आप अपना ऑप्शन इस्तेमाल कर सकते हैं।
    अगर कीमतें बढ़ती हैं, तो आप ऑप्शन को एक्सपायर होने दे सकते हैं।`,
    duration: '2.5 min',
    icon: 'options',
    color: '#8b5cf6',
  },
  {
    id: 'voice4',
    title: 'When to Hedge',
    titleHi: 'कब हेज करें',
    content: `The best time to hedge depends on market conditions and your risk tolerance.
    Generally, consider hedging when prices are favorable and above your cost of production.
    Monitor the HOLX score in the app - a score above 70 indicates good hedging conditions.
    Don't hedge 100% of your crop. Start with 30-50% and adjust based on market movements.
    Remember: hedging is about protection, not speculation.`,
    contentHi: `हेज करने का सबसे अच्छा समय बाजार की स्थितियों और आपकी जोखिम सहनशीलता पर निर्भर करता है।
    आमतौर पर, जब कीमतें अनुकूल हों और आपकी उत्पादन लागत से ऊपर हों तब हेजिंग पर विचार करें।
    ऐप में HOLX स्कोर देखें - 70 से ऊपर का स्कोर अच्छी हेजिंग स्थितियों को दर्शाता है।`,
    duration: '2 min',
    icon: 'time',
    color: '#f59e0b',
  },
];

export default function LearningHubScreen() {
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentVoiceLesson, setCurrentVoiceLesson] = useState(null);
  const [voiceLessonModalVisible, setVoiceLessonModalVisible] = useState(false);
  
  const isHindi = i18n.language === 'hi';

  const categories = [
    { id: 'all', label: 'All', labelHi: 'सभी', icon: 'grid' },
    { id: 'hedging', label: 'Hedging', labelHi: 'हेजिंग', icon: 'shield' },
    { id: 'oilseeds', label: 'Oilseeds', labelHi: 'तिलहन', icon: 'leaf' },
    { id: 'riskManagement', label: 'Risk', labelHi: 'जोखिम', icon: 'warning' },
  ];

  const getFilteredVideos = () => {
    if (activeCategory === 'all') {
      return [...LEARNING_VIDEOS.hedging, ...LEARNING_VIDEOS.oilseeds, ...LEARNING_VIDEOS.riskManagement];
    }
    return LEARNING_VIDEOS[activeCategory] || [];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openYouTubeVideo = (video) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  const openYouTubeExternal = (youtubeId) => {
    const url = `https://www.youtube.com/watch?v=${youtubeId}`;
    Linking.openURL(url);
  };

  const startVoiceLesson = async (lesson) => {
    setCurrentVoiceLesson(lesson);
    setVoiceLessonModalVisible(true);
    
    const content = isHindi ? lesson.contentHi : lesson.content;
    
    setIsSpeaking(true);
    Speech.speak(content, {
      language: isHindi ? 'hi-IN' : 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopVoiceLesson = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const closeVoiceLessonModal = () => {
    stopVoiceLesson();
    setVoiceLessonModalVisible(false);
    setCurrentVoiceLesson(null);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return '#16a34a';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            {isHindi ? '📚 सीखने का केंद्र' : '📚 Learning Hub'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isHindi ? 'वीडियो और आवाज से सीखें' : 'Learn with Videos & Voice'}
          </Text>
        </View>

        {/* Voice Learning Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="mic" size={22} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>
                {isHindi ? '🎧 आवाज से सीखें' : '🎧 Voice Learning'}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              {isHindi ? 'सुनें और समझें' : 'Listen & Learn'}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceLessonsScroll}>
            {VOICE_LESSONS.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.voiceLessonCard}
                onPress={() => startVoiceLesson(lesson)}
              >
                <View style={[styles.voiceLessonIcon, { backgroundColor: lesson.color + '20' }]}>
                  <Ionicons name={lesson.icon} size={28} color={lesson.color} />
                </View>
                <Text style={styles.voiceLessonTitle}>
                  {isHindi ? lesson.titleHi : lesson.title}
                </Text>
                <View style={styles.voiceLessonMeta}>
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text style={styles.voiceLessonDuration}>{lesson.duration}</Text>
                </View>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.playButtonText}>
                    {isHindi ? 'सुनें' : 'Listen'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Video Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id && styles.categoryChipActive
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={16} 
                  color={activeCategory === cat.id ? '#fff' : '#6b7280'} 
                />
                <Text style={[
                  styles.categoryChipText,
                  activeCategory === cat.id && styles.categoryChipTextActive
                ]}>
                  {isHindi ? cat.labelHi : cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Video Learning Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="play-circle" size={22} color="#ef4444" />
              <Text style={styles.sectionTitle}>
                {isHindi ? '🎬 वीडियो पाठ' : '🎬 Video Lessons'}
              </Text>
            </View>
          </View>

          {getFilteredVideos().map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => openYouTubeVideo(video)}
            >
              <View style={styles.videoThumbnail}>
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="play-circle" size={48} color="#fff" />
                </View>
                <View style={styles.videoDuration}>
                  <Text style={styles.videoDurationText}>{video.duration}</Text>
                </View>
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>
                  {isHindi ? video.titleHi : video.title}
                </Text>
                <Text style={styles.videoDescription} numberOfLines={2}>
                  {isHindi ? video.descriptionHi : video.description}
                </Text>
                <View style={styles.videoMeta}>
                  <View style={[styles.levelBadge, { backgroundColor: getLevelColor(video.level) + '20' }]}>
                    <Text style={[styles.levelText, { color: getLevelColor(video.level) }]}>
                      {video.level}
                    </Text>
                  </View>
                  <View style={styles.viewsContainer}>
                    <Ionicons name="eye-outline" size={14} color="#6b7280" />
                    <Text style={styles.viewsText}>{video.views}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.youtubeButton}
                onPress={() => openYouTubeExternal(video.youtubeId)}
              >
                <Ionicons name="logo-youtube" size={24} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            {isHindi ? '💡 त्वरित सुझाव' : '💡 Quick Tips'}
          </Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
            <Text style={styles.tipText}>
              {isHindi 
                ? 'हेजिंग शुरू करने से पहले, अपनी उत्पादन लागत जान लें।'
                : 'Before hedging, know your cost of production.'}
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="trending-up" size={24} color="#16a34a" />
            <Text style={styles.tipText}>
              {isHindi 
                ? 'HOLX स्कोर 70+ होने पर हेजिंग पर विचार करें।'
                : 'Consider hedging when HOLX score is above 70.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        onRequestClose={() => setVideoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedVideo && (isHindi ? selectedVideo.titleHi : selectedVideo.title)}
            </Text>
            <TouchableOpacity onPress={() => selectedVideo && openYouTubeExternal(selectedVideo.youtubeId)}>
              <Ionicons name="open-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          {selectedVideo && (
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1` }}
              style={styles.webview}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>
      </Modal>

      {/* Voice Lesson Modal */}
      <Modal
        visible={voiceLessonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeVoiceLessonModal}
      >
        <View style={styles.voiceModalOverlay}>
          <View style={styles.voiceModalContainer}>
            <TouchableOpacity style={styles.voiceModalClose} onPress={closeVoiceLessonModal}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            
            {currentVoiceLesson && (
              <>
                <View style={[styles.voiceModalIcon, { backgroundColor: currentVoiceLesson.color + '20' }]}>
                  <Ionicons name={currentVoiceLesson.icon} size={48} color={currentVoiceLesson.color} />
                </View>
                
                <Text style={styles.voiceModalTitle}>
                  {isHindi ? currentVoiceLesson.titleHi : currentVoiceLesson.title}
                </Text>
                
                <ScrollView style={styles.voiceModalContent}>
                  <Text style={styles.voiceModalText}>
                    {isHindi ? currentVoiceLesson.contentHi : currentVoiceLesson.content}
                  </Text>
                </ScrollView>
                
                <View style={styles.voiceControls}>
                  {isSpeaking ? (
                    <TouchableOpacity style={styles.stopButton} onPress={stopVoiceLesson}>
                      <Ionicons name="stop" size={32} color="#fff" />
                      <Text style={styles.controlButtonText}>
                        {isHindi ? 'रोकें' : 'Stop'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.playLargeButton} 
                      onPress={() => startVoiceLesson(currentVoiceLesson)}
                    >
                      <Ionicons name="play" size={32} color="#fff" />
                      <Text style={styles.controlButtonText}>
                        {isHindi ? 'फिर से सुनें' : 'Play Again'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
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
  content: {
    flex: 1,
  },
  headerSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionContainer: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 30,
  },
  
  // Voice Lessons
  voiceLessonsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  voiceLessonCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  voiceLessonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  voiceLessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  voiceLessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  voiceLessonDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#16a34a',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  
  // Video Cards
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 120,
    height: 90,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
    color: '#6b7280',
  },
  youtubeButton: {
    padding: 12,
    justifyContent: 'center',
  },
  
  // Tips Section
  tipsSection: {
    padding: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  
  // Video Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 16,
  },
  webview: {
    flex: 1,
  },
  
  // Voice Modal
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  voiceModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  voiceModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  voiceModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  voiceModalContent: {
    maxHeight: 200,
    marginBottom: 24,
  },
  voiceModalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  voiceControls: {
    alignItems: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  playLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
