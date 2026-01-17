import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth as useAuth } from '../contexts/SupabaseAuthContext';

const ROLES = [
  {
    id: 'buyer_seller',
    icon: 'person',
    emoji: '👨‍🌾',
    title: 'buyerSeller',
    description: 'buyerSellerDesc',
    color: '#16a34a',
    features: ['Buy & Sell Crops', 'Price Alerts', 'Hedging Tools'],
  },
  {
    id: 'fpo',
    icon: 'people',
    emoji: '🏢',
    title: 'fpo',
    description: 'fpoDesc',
    color: '#3b82f6',
    features: ['Manage Members', 'Bulk Trading', 'Analytics Dashboard'],
  },
];

export default function RoleSelectionScreen() {
  const { t } = useTranslation();
  const { updateUserRole, signOut } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    Alert.alert(
      t('goBack') || 'Go Back',
      t('goBackConfirm') || 'Going back will sign you out. Continue?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('yes') || 'Yes', 
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert(t('error') || 'Error', t('selectRoleFirst') || 'Please select a role');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating role to:', selectedRole);
      const result = await updateUserRole(selectedRole);
      console.log('Role update result:', result);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force navigation with setTimeout to ensure it happens after state updates
      setTimeout(() => {
        if (selectedRole === 'buyer_seller') {
          console.log('Navigating to tabs...');
          router.replace('/(tabs)');
        } else if (selectedRole === 'fpo') {
          console.log('Navigating to fpo-tabs...');
          router.replace('/(fpo-tabs)');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error updating role:', error);
      let errorMessage = 'Failed to update role. Please try again.';
      
      if (error.message) {
        if (error.message.includes('violates row-level security')) {
          errorMessage = 'Permission denied. Please sign out and sign in again.';
        } else if (error.message.includes('duplicate key')) {
          console.log('Profile exists, navigating...');
          setTimeout(() => {
            if (selectedRole === 'buyer_seller') {
              router.replace('/(tabs)');
            } else if (selectedRole === 'fpo') {
              router.replace('/(fpo-tabs)');
            }
          }, 100);
          return;
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(t('error') || 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <LinearGradient 
        colors={['#16a34a', '#15803d', '#166534']} 
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* Icon Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <View style={styles.roleIcons}>
            <Text style={styles.roleEmoji}>👨‍🌾</Text>
            <Text style={styles.roleEmoji}>🏢</Text>
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
        <Text style={styles.title}>🎭 {t('selectRole')}</Text>
        <Text style={styles.subtitle}>{t('selectRoleDesc')}</Text>
      </LinearGradient>

      {/* Role Selection */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedCard,
              selectedRole === role.id && { borderColor: role.color },
            ]}
            onPress={() => setSelectedRole(role.id)}
            activeOpacity={0.7}
          >
            <View style={styles.roleHeader}>
              <View style={[styles.roleIconContainer, { backgroundColor: role.color + '15' }]}>
                <Text style={styles.roleCardEmoji}>{role.emoji}</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={[
                  styles.roleTitle,
                  selectedRole === role.id && { color: role.color }
                ]}>
                  {t(role.title)}
                </Text>
                <Text style={styles.roleDescription}>{t(role.description)}</Text>
              </View>
              {selectedRole === role.id && (
                <View style={[styles.checkBadge, { backgroundColor: role.color }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </View>
            
            {/* Features */}
            <View style={styles.featuresContainer}>
              {role.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={role.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#16a34a" />
          <Text style={styles.infoText}>
            You can change your role anytime from Profile settings
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleContinue}
          disabled={loading || !selectedRole}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading || !selectedRole ? ['#9ca3af', '#6b7280'] : ['#16a34a', '#15803d']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>
              {loading ? t('loading') : t('continue')}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
        
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconEmoji: {
    fontSize: 40,
  },
  roleIcons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  roleEmoji: {
    fontSize: 28,
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
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#f0fdf4',
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleCardEmoji: {
    fontSize: 32,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
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
