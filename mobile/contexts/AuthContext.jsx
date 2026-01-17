import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { router } from 'expo-router';

const AuthContext = createContext();

// Check if Supabase is properly configured
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
  SUPABASE_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
  !SUPABASE_KEY.includes('sb_publishable'); // Check for incomplete key

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [mockMode, setMockMode] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (mockMode) {
      // Mock mode - check for existing mock session
      loadMockSession();
    } else {
      // Real Supabase mode
      initializeSupabase();
    }
  }, [mockMode]);

  const loadMockSession = async () => {
    try {
      const mockSession = await AsyncStorage.getItem('mockSession');
      const mockUser = await AsyncStorage.getItem('mockUser');
      
      if (mockSession && mockUser) {
        setSession(JSON.parse(mockSession));
        setUser(JSON.parse(mockUser));
      }
    } catch (error) {
      console.error('Error loading mock session:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const initializeSupabase = async () => {
    try {
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Supabase error, switching to mock mode:', error);
        setMockMode(true);
        return;
      }
      
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
        setInitializing(false);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Supabase initialization error, switching to mock mode:', error);
      setMockMode(true);
      loadMockSession();
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser(data);
      await AsyncStorage.setItem('userData', JSON.stringify(data));
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const signUp = async (email, password, fullName, phoneNumber) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            phone_number: phoneNumber,
            role: null, // Will be set in role selection
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) throw profileError;

      return authData;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userLanguage');
      await AsyncStorage.removeItem('hasSelectedLanguage');
      setUser(null);
      setSession(null);
      router.replace('/language-selection');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role) => {
    try {
      if (!session?.user) throw new Error('No user session');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', session.user.id);

      if (error) throw error;

      // Reload user profile
      await loadUserProfile(session.user.id);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!session?.user) throw new Error('No user session');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      // Reload user profile
      await loadUserProfile(session.user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
