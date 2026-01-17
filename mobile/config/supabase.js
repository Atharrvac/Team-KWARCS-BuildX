import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qjnsqquapcxmzjwmdfaw.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbnNxcXVhcGN4bXpqd21kZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjgyNTUsImV4cCI6MjA4MDQ0NDI1NX0.qGfCQ1UJAWbqSi6aYF49H43FAqs2lOmzuv6wkrAshic';

// Use appropriate storage based on platform
const getStorage = () => {
  try {
    if (Platform.OS === 'web') {
      return undefined; // Use default localStorage for web
    }
    return AsyncStorage; // Use AsyncStorage for native
  } catch {
    return undefined;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
