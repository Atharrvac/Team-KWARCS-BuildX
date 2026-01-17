import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabaseAuth as useAuth } from '../../contexts/SupabaseAuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../config/i18n';
import AppHeader from '../../components/AppHeader';

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

export default function FpoProfileScreen() {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('userLanguage').then((lang) => {
      if (lang) setSelectedLanguage(lang);
    });
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleMenuItemPress = (item) => {
    if (item.action === 'changeLanguage') {
      setLanguageModalVisible(true);
    }
    // Add other menu item actions here
  };

  const handleLanguageSelect = async (langCode) => {
    setSelectedLanguage(langCode);
    try {
      await AsyncStorage.setItem('userLanguage', langCode);
      await AsyncStorage.setItem('hasSelectedLanguage', 'true');
      i18n.changeLanguage(langCode);
      setLanguageModalVisible(false);
      
      const langName = LANGUAGES.find(l => l.code === langCode)?.nativeName || langCode;
      Alert.alert(t('success'), `${t('languageChanged')} (${langName})`);
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(t('error'), 'Failed to save language');
    }
  };

  const menuItems = [
    { icon: 'business', label: 'FPO Details', screen: 'fpo-details' },
    { icon: 'document-text', label: 'Documents', screen: 'documents' },
    { icon: 'language', label: 'Change Language', action: 'changeLanguage' },
    { icon: 'settings', label: 'Settings', screen: 'settings' },
    { icon: 'help-circle', label: 'Help & Support', screen: 'support' },
    { icon: 'information-circle', label: 'About', screen: 'about' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <View style={styles.profileHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="business" size={40} color="#2d5f3f" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile?.full_name || 'FPO Name'}</Text>
            <Text style={styles.email}>{profile?.email || 'fpo@example.com'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>FPO Admin</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Contracts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹45.2L</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#2d5f3f" />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('changeLanguage')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === language.code && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <Text style={styles.languageIcon}>{language.icon}</Text>
                  <View style={styles.languageTextContainer}>
                    <Text style={[
                      styles.languageName,
                      selectedLanguage === language.code && styles.languageNameSelected
                    ]}>
                      {language.name}
                    </Text>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#2d5f3f" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { 
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileSection: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 },
  email: { fontSize: 14, color: '#6b7280' },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#2d5f3f' },
  content: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  menuSection: { paddingHorizontal: 20, marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { fontSize: 16, color: '#1f2937' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  
  // Language Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  languageModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#2d5f3f',
  },
  languageIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#2d5f3f',
  },
  languageNative: {
    fontSize: 14,
    color: '#6b7280',
  },
});
