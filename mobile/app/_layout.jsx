import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseAuthProvider, useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { UserProvider } from '../contexts/UserContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import VoiceAssistant from '../components/VoiceAssistant';
import '../config/i18n';

function useProtectedRoute() {
  const auth = useSupabaseAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (auth.initializing) {
        console.log('Auth initialization timed out, proceeding anyway');
        setTimedOut(true);
      }
    }, 5000); // 5 second timeout
    return () => clearTimeout(timeout);
  }, [auth.initializing]);

  useEffect(() => {
    AsyncStorage.getItem('hasSelectedLanguage')
      .then(value => setHasSelectedLanguage(value === 'true'))
      .catch(() => setHasSelectedLanguage(false));
  }, []);

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;
    if (auth.initializing && !timedOut) return;
    if (hasSelectedLanguage === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inFpoTabsGroup = segments[0] === '(fpo-tabs)';
    const onLanguageSelection = segments[0] === 'language-selection';
    const onRoleSelection = segments[0] === 'role-selection';
    
    // Allow navigation to these screens without redirecting
    const allowedScreens = ['dss', 'hedging', 'autohedge-enroll', 'simulation-mode', 'feedback', 'insurance', 'community', 'fpo-integration', 'listing-detail', 'buyer-contract-detail', 'my-contract-detail', 'contract-detail'];
    const onAllowedScreen = allowedScreens.includes(segments[0]);

    const profile = auth.profile;
    const session = auth.session;

    // Debug only when needed
    // console.log('Navigation check:', { hasSession: !!session, hasProfile: !!profile, profileRole: profile?.role, currentSegment: segments[0] });

    // Language not selected
    if (!hasSelectedLanguage && !onLanguageSelection) {
      router.replace('/language-selection');
      return;
    }

    // Not authenticated
    if (!session && hasSelectedLanguage && !inAuthGroup && !onLanguageSelection) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // Authenticated but no profile yet or no role - go to role selection
    // But don't redirect if already on role selection or navigating to tabs
    if (session && (!profile || !profile.role) && !onRoleSelection && !inAuthGroup && !onAllowedScreen && !inTabsGroup && !inFpoTabsGroup) {
      router.replace('/role-selection');
      return;
    }

    // Authenticated with role - go to dashboard (redirect from role-selection or auth screens)
    if (session && profile?.role) {
      // If on role-selection, auth, or language-selection, redirect to appropriate dashboard
      if (onRoleSelection || inAuthGroup || onLanguageSelection) {
        if (profile.role === 'buyer_seller') {
          router.replace('/(tabs)');
        } else if (profile.role === 'fpo') {
          router.replace('/(fpo-tabs)');
        }
        return;
      }
      
      // If not in any valid location, redirect to dashboard
      if (!inTabsGroup && !inFpoTabsGroup && !onAllowedScreen) {
        if (profile.role === 'buyer_seller') {
          router.replace('/(tabs)');
        } else if (profile.role === 'fpo') {
          router.replace('/(fpo-tabs)');
        }
      }
    }
  }, [auth.session, auth.profile, auth.initializing, auth.loading, segments, hasSelectedLanguage, navigationState?.key]);

  return { isLoading: (auth.initializing && !timedOut) || hasSelectedLanguage === null };
}

function RootLayoutNav() {
  const { isLoading } = useProtectedRoute();
  const auth = useSupabaseAuth();
  const segments = useSegments();

  // Screens where voice assistant should NOT appear
  const hideVoiceOnScreens = ['(auth)', 'language-selection', 'role-selection'];
  const currentSegment = segments[0];
  const shouldShowVoice = auth.session && auth.profile?.role && !hideVoiceOnScreens.includes(currentSegment);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#2d5f3f" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="language-selection" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="role-selection" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(fpo-tabs)" />
        <Stack.Screen name="dss" />
        <Stack.Screen name="hedging" />
        <Stack.Screen name="autohedge-enroll" />
        <Stack.Screen name="simulation-mode" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="insurance" />
        <Stack.Screen name="community" />
        <Stack.Screen name="fpo-integration" />
        <Stack.Screen name="listing-detail" />
        <Stack.Screen name="buyer-contract-detail" />
        <Stack.Screen name="my-contract-detail" />
        <Stack.Screen name="contract-detail" />
      </Stack>
      {/* Voice Assistant - only show on main app screens, not auth/setup screens */}
      {shouldShowVoice && <VoiceAssistant />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SupabaseAuthProvider>
      <UserProvider>
        <NotificationProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </NotificationProvider>
      </UserProvider>
    </SupabaseAuthProvider>
  );
}
