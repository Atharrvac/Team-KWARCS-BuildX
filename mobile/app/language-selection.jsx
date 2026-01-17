import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../config/i18n';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', icon: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🇮🇳' },
];

export default function LanguageSelectionScreen() {
  const routerNav = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [canGoBack, setCanGoBack] = useState(false);
  const [isFromProfile, setIsFromProfile] = useState(false);

  useEffect(() => {
    const fromProfile = params.fromProfile === 'true';
    setIsFromProfile(fromProfile);
    
    AsyncStorage.getItem('hasSelectedLanguage').then((value) => {
      setCanGoBack(value === 'true' || fromProfile);
    });

    AsyncStorage.getItem('userLanguage').then((lang) => {
      if (lang) setSelectedLanguage(lang);
    });
  }, [params.fromProfile]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      routerNav.back();
    } else if (canGoBack) {
      router.replace('/(tabs)');
    }
  };

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem('userLanguage', selectedLanguage);
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      i18n.changeLanguage(selectedLanguage);
      
      if (canGoBack || isFromProfile) {
        Alert.alert(t('success'), t('languageChanged'), [
          { text: t('ok'), onPress: () => {
            if (navigation.canGoBack()) {
              routerNav.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
        ]);
      } else {
        router.replace('/(auth)/sign-in');
      }
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(t('error'), 'Failed to save language preference');
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section with Farmer Illustration */}
      <LinearGradient 
        colors={['#16a34a', '#15803d', '#166534']} 
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {(canGoBack || isFromProfile) && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* Farmer Icon Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.farmerCircle}>
            <Text style={styles.farmerEmoji}>👨‍🌾</Text>
          </View>
          <View style={styles.cropIcons}>
            <Text style={styles.cropEmoji}>🌾</Text>
            <Text style={styles.cropEmoji}>🌻</Text>
            <Text style={styles.cropEmoji}>🥜</Text>
          </View>
        </View>

        {/* App Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={24} color="#16a34a" />
            </View>
            <Text style={styles.appName}>AgriSure</Text>
          </View>
          <Text style={styles.tagline}>Empowering Farmers with Smart Hedging</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isFromProfile ? '🌐 ' + t('changeLanguage') : '🌐 Choose Your Language'}
        </Text>
        <Text style={styles.subtitle}>
          Select your preferred language to continue
        </Text>
      </LinearGradient>

      {/* Language Selection */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageGrid}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                selectedLanguage === language.code && styles.selectedCard,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.languageIcon}>{language.icon}</Text>
              <Text style={[
                styles.languageName,
                selectedLanguage === language.code && styles.selectedText
              ]}>
                {language.nativeName}
              </Text>
              <Text style={styles.languageEnglish}>{language.name}</Text>
              {selectedLanguage === language.code && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#16a34a" />
          <Text style={styles.infoText}>
            You can change your language anytime from the Profile settings
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#16a34a', '#15803d']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>
              {isFromProfile ? t('saveLanguage') : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Smart India Hackathon Badge */}
        <View style={styles.sihBadge}>
          <Text style={styles.sihText}>Hedge Smart, Sell Better.</Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  farmerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  farmerEmoji: {
    fontSize: 40,
  },
  cropIcons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  cropEmoji: {
    fontSize: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
  },
  languageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  languageEnglish: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedText: {
    color: '#16a34a',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  sihBadge: {
    alignItems: 'center',
    marginTop: 16,
  },
  sihText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
