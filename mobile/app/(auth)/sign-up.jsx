import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth as useAuth } from '../../contexts/SupabaseAuthContext';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    
    setLoading(true);
    try {
      await signUp(email, password, name, phone);
      Alert.alert(t('success'), t('accountCreated'), [
        { text: t('ok'), onPress: () => {} }
      ]);
    } catch (error) {
      Alert.alert(t('error'), error.message || 'Failed to create account');
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
            <Text style={styles.iconEmoji}>🌱</Text>
          </View>
          <View style={styles.roleIcons}>
            <Text style={styles.roleEmoji}>📝</Text>
            <Text style={styles.roleEmoji}>🚀</Text>
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
        <Text style={styles.title}>✨ {t('createAccount')}</Text>
        <Text style={styles.subtitle}>{t('joinPlatform')}</Text>
      </LinearGradient>

      {/* Form Cards */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIconContainer, { backgroundColor: '#16a34a15' }]}>
              <Ionicons name="person" size={24} color="#16a34a" />
            </View>
            <View style={styles.inputInfo}>
              <Text style={styles.inputTitle}>{t('fullName')}</Text>
              <Text style={styles.inputDescription}>Enter your full name</Text>
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>
        </View>

        {/* Email Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIconContainer, { backgroundColor: '#3b82f615' }]}>
              <Ionicons name="mail" size={24} color="#3b82f6" />
            </View>
            <View style={styles.inputInfo}>
              <Text style={styles.inputTitle}>{t('email')}</Text>
              <Text style={styles.inputDescription}>We'll send verification here</Text>
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
        </View>

        {/* Phone Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIconContainer, { backgroundColor: '#f59e0b15' }]}>
              <Ionicons name="call" size={24} color="#f59e0b" />
            </View>
            <View style={styles.inputInfo}>
              <Text style={styles.inputTitle}>{t('phoneNumber')}</Text>
              <Text style={styles.inputDescription}>For account recovery</Text>
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>

        {/* Password Card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <View style={[styles.inputIconContainer, { backgroundColor: '#8b5cf615' }]}>
              <Ionicons name="lock-closed" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.inputInfo}>
              <Text style={styles.inputTitle}>{t('password')}</Text>
              <Text style={styles.inputDescription}>Min 6 characters</Text>
            </View>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#16a34a" />
          <Text style={styles.infoText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#6b7280'] : ['#16a34a', '#15803d']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>{t('signUp')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => router.back()} 
          disabled={loading}
        >
          <Text style={styles.linkText}>{t('alreadyHaveAccount')}</Text>
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
    paddingBottom: 24,
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
    marginBottom: 12,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconEmoji: {
    fontSize: 36,
  },
  roleIcons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 14,
  },
  roleEmoji: {
    fontSize: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
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
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputInfo: {
    flex: 1,
  },
  inputTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  inputDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
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
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#16a34a',
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
