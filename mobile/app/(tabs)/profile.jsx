import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import WalletReportModal from '../../components/WalletReportModal';
import SubscriptionModal from '../../components/SubscriptionModal';
import PremiumBadge from '../../components/PremiumBadge';
import { useUser } from '../../contexts/UserContext';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import useSubscription from '../../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../../services/subscriptionService';
import i18n from '../../config/i18n';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { plan: currentPlan, isPro, refreshSubscription, expiryDisplay } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [walletReportVisible, setWalletReportVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { user, updateUserProfile: updateLocalProfile, fetchUserProfile } = useUser();
  const { signOut, profile: authUser, updateUserProfile: updateAuthProfile, refreshProfile, user: supabaseUser } = useSupabaseAuth();

  // Load current language on mount
  useEffect(() => {
    AsyncStorage.getItem('userLanguage').then((lang) => {
      if (lang) setSelectedLanguage(lang);
    });
  }, []);
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    location: '',
    farm_size: '',
  });

  // Sync edit form with auth user data
  useEffect(() => {
    if (authUser) {
      setEditForm({
        full_name: authUser.full_name || '',
        phone_number: authUser.phone_number || '',
        location: authUser.location || '',
        farm_size: authUser.farm_size || '',
      });
    }
  }, [authUser]);

  const profileData = {
    name: authUser?.full_name || user?.name || 'Guest User',
    phone: authUser?.phone_number || user?.phone || 'Not set',
    email: authUser?.email || user?.email || 'Not set',
    farmSize: authUser?.farm_size || user?.farmSize || 'Not set',
    location: authUser?.location || user?.location || 'Not set',
    memberSince: authUser?.created_at 
      ? new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
      : user?.createdAt 
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
        : 'Dec 2024',
    role: authUser?.role === 'buyer_seller' ? 'Buyer/Seller' : authUser?.role === 'fpo' ? 'FPO' : 'Farmer',
    lastUpdated: authUser?.updated_at 
      ? new Date(authUser.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null,
  };

  const walletData = {
    availableBalance: 32450,
    marginBlocked: 12000,
    pendingSettlements: 8600,
    hedgingPnL: 1820,
  };

  const menuItems = [
    {
      id: 1,
      title: t('editProfile'),
      subtitle: '',
      icon: 'person-outline',
      iconColor: '#3b82f6',
    },
    {
      id: 2,
      title: 'Farm Details',
      subtitle: '',
      icon: 'leaf-outline',
      iconColor: '#16a34a',
    },
    {
      id: 3,
      title: t('language'),
      subtitle: LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName || '',
      icon: 'language-outline',
      iconColor: '#ec4899',
      action: 'changeLanguage',
    },
    {
      id: 4,
      title: 'Wallet',
      subtitle: '',
      icon: 'wallet-outline',
      iconColor: '#f59e0b',
    },
    {
      id: 5,
      title: t('notifications'),
      subtitle: '',
      icon: 'notifications-outline',
      iconColor: '#8b5cf6',
    },
    {
      id: 6,
      title: t('settings'),
      subtitle: '',
      icon: 'shield-checkmark-outline',
      iconColor: '#ef4444',
    },
    {
      id: 7,
      title: t('helpSupport'),
      subtitle: '',
      icon: 'help-circle-outline',
      iconColor: '#06b6d4',
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await fetchUserProfile();
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  const handleEditPress = () => {
    // Reset form with current values
    setEditForm({
      full_name: authUser?.full_name || '',
      phone_number: authUser?.phone_number || '',
      location: authUser?.location || '',
      farm_size: authUser?.farm_size || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!editForm.full_name.trim()) {
        Alert.alert('Error', 'Name is required');
        setSaving(false);
        return;
      }

      // Update auth profile (this persists to storage)
      await updateAuthProfile(editForm);
      
      // Also update local user context for compatibility
      await updateLocalProfile({
        name: editForm.full_name,
        phone: editForm.phone_number,
        location: editForm.location,
        farmSize: editForm.farm_size,
      });

      setEditModalVisible(false);
      addNotification({
        type: 'profile',
        title: '✅ Profile Updated',
        message: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
      addNotification({
        type: 'system',
        title: '🌐 ' + t('languageChanged'),
        message: langName,
      });
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert(t('error'), 'Failed to save language');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert(t('error'), t('tryAgain'));
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will clear all app data and start fresh from language selection. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.clear();
              // Sign out from Supabase
              await signOut();
              // The app will automatically redirect to language selection
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Slide Menu */}
      <AppHeader />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#16a34a" />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <PremiumBadge 
                  plan={currentPlan} 
                  compact 
                  onPress={() => setSubscriptionModalVisible(true)} 
                />
              </View>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{profileData.role}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
              <Ionicons name="pencil" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{profileData.farmSize}</Text>
              <Text style={styles.profileStatLabel}>Farm Size</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{profileData.memberSince}</Text>
              <Text style={styles.profileStatLabel}>Member Since</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: '#16a34a' }]}>Active</Text>
              <Text style={styles.profileStatLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* Premium Subscription Card */}
        <TouchableOpacity 
          style={styles.subscriptionCard}
          onPress={() => setSubscriptionModalVisible(true)}
        >
          <View style={styles.subscriptionHeader}>
            <View style={[
              styles.subscriptionIconContainer,
              isPro && { backgroundColor: '#dcfce7' }
            ]}>
              <Ionicons 
                name={currentPlan === 'free' ? 'star-outline' : 'star'} 
                size={24} 
                color={currentPlan === 'free' ? '#f59e0b' : '#16a34a'} 
              />
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>
                {currentPlan === 'free' 
                  ? (i18n.language === 'hi' ? 'प्रीमियम में अपग्रेड करें' : 'Upgrade to Premium')
                  : (i18n.language === 'hi' ? SUBSCRIPTION_PLANS[currentPlan]?.nameHi : SUBSCRIPTION_PLANS[currentPlan]?.name)
                }
              </Text>
              <Text style={styles.subscriptionSubtitle}>
                {currentPlan === 'free'
                  ? (i18n.language === 'hi' ? 'असीमित अलर्ट, एडवांस्ड HOLX™ और अधिक' : 'Unlimited alerts, Advanced HOLX™ & more')
                  : expiryDisplay 
                    ? (i18n.language === 'hi' 
                        ? `${expiryDisplay.daysRemaining} दिन बाकी • ${expiryDisplay.date}` 
                        : `${expiryDisplay.daysRemaining} days left • ${expiryDisplay.date}`)
                    : (i18n.language === 'hi' ? 'आपका प्लान एक्टिव है' : 'Your plan is active')
                }
              </Text>
            </View>
            <View style={styles.subscriptionAction}>
              {currentPlan === 'free' ? (
                <View style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>
                    {i18n.language === 'hi' ? '₹99/माह' : '₹99/mo'}
                  </Text>
                </View>
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
              )}
            </View>
          </View>
          
          {currentPlan === 'free' && (
            <View style={styles.subscriptionFeatures}>
              <View style={styles.featureChip}>
                <Ionicons name="notifications" size={12} color="#16a34a" />
                <Text style={styles.featureChipText}>
                  {i18n.language === 'hi' ? 'असीमित अलर्ट' : 'Unlimited Alerts'}
                </Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="analytics" size={12} color="#16a34a" />
                <Text style={styles.featureChipText}>
                  {i18n.language === 'hi' ? 'एडवांस्ड HOLX™' : 'Advanced HOLX™'}
                </Text>
              </View>
              <View style={styles.featureChip}>
                <Ionicons name="volume-high" size={12} color="#16a34a" />
                <Text style={styles.featureChipText}>
                  {i18n.language === 'hi' ? 'वॉइस अलर्ट' : 'Voice Alerts'}
                </Text>
              </View>
            </View>
          )}

          {/* Show expiry warning for Pro users */}
          {isPro && expiryDisplay?.isExpiringSoon && (
            <View style={styles.expiryWarning}>
              <Ionicons name="warning" size={14} color="#f59e0b" />
              <Text style={styles.expiryWarningText}>
                {i18n.language === 'hi' 
                  ? `${expiryDisplay.daysRemaining} दिन में समाप्त - नवीनीकरण करें`
                  : `Expires in ${expiryDisplay.daysRemaining} days - Renew now`
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Wallet Summary */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>Wallet Summary</Text>
            <TouchableOpacity onPress={() => setWalletReportVisible(true)}>
              <Text style={styles.viewAllLink}>View Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.walletGrid}>
            <View style={styles.walletItem}>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={[styles.walletValue, { color: '#16a34a' }]}>
                ₹{walletData.availableBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.walletItem}>
              <Text style={styles.walletLabel}>Margin Blocked</Text>
              <Text style={styles.walletValue}>
                ₹{walletData.marginBlocked.toLocaleString()}
              </Text>
            </View>
            <View style={styles.walletItem}>
              <Text style={styles.walletLabel}>Pending Settlements</Text>
              <Text style={styles.walletValue}>
                ₹{walletData.pendingSettlements.toLocaleString()}
              </Text>
            </View>
            <View style={styles.walletItem}>
              <Text style={styles.walletLabel}>Hedging P&L</Text>
              <Text style={[styles.walletValue, { color: walletData.hedgingPnL >= 0 ? '#16a34a' : '#ef4444' }]}>
                {walletData.hedgingPnL >= 0 ? '+' : ''}₹{Math.abs(walletData.hedgingPnL).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Settings</Text>
          
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>App Information</Text>
          
          <View style={styles.appInfoGrid}>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Build</Text>
              <Text style={styles.appInfoValue}>2024.1</Text>
            </View>
            <View style={styles.appInfoItem}>
              <Text style={styles.appInfoLabel}>Last Updated</Text>
              <Text style={styles.appInfoValue}>Nov 2024</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Reset App Button - For Testing */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#fef2f2', marginTop: 8 }]} 
          onPress={handleResetApp}
        >
          <Ionicons name="refresh-outline" size={20} color="#dc2626" />
          <Text style={[styles.logoutText, { color: '#dc2626' }]}>Reset App (Start Fresh)</Text>
        </TouchableOpacity>
        
        <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
          Reset clears all data and starts from language selection
        </Text>
      </ScrollView>

      {/* Wallet Report Modal */}
      <WalletReportModal
        visible={walletReportVisible}
        onClose={() => setWalletReportVisible(false)}
        userId={user?.id || 'demo-user'}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.phone_number}
                  onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })}
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={authUser?.email || ''}
                  editable={false}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.inputHint}>Email cannot be changed</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                  placeholder="City, State"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Farm Size</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.farm_size}
                  onChangeText={(text) => setEditForm({ ...editForm, farm_size: text })}
                  placeholder="e.g., 25 acres"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                    <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSuccess={async (plan) => {
          // Refresh subscription status from hook
          await refreshSubscription();
        }}
      />
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
  
  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subscriptionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  subscriptionAction: {
    marginLeft: 8,
  },
  upgradeBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  subscriptionFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  featureChipText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  expiryWarningText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  
  // Wallet Card
  walletCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  walletItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 72) / 2,
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  walletValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  
  // Menu Section
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 20,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // App Info
  appInfoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  appInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appInfoItem: {
    alignItems: 'center',
  },
  appInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Language Modal Styles
  languageModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    borderColor: '#16a34a',
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
    color: '#16a34a',
  },
  languageNative: {
    fontSize: 14,
    color: '#6b7280',
  },
});