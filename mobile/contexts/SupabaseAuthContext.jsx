import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const SupabaseAuthContext = createContext();

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let subscription = null;
    let timeoutId = null;

    const initAuth = async () => {
      // Set a timeout to ensure we don't get stuck
      timeoutId = setTimeout(() => {
        console.log('Auth init timeout - proceeding without session');
        setLoading(false);
        setInitializing(false);
      }, 8000);

      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setInitializing(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
          setInitializing(false);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error initializing auth:', error);
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch user profile from database
  const fetchProfile = async (userId) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile fetch error:', error.code, error.message);
        
        // PGRST116 means no rows found - profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...');
          // Try to create the profile
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                email: userData.user.email,
                full_name: userData.user.user_metadata?.full_name || '',
                phone_number: userData.user.user_metadata?.phone_number || '',
                role: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating profile:', createError);
              // Set profile to null but still allow navigation to role selection
              setProfile({ id: userId, email: userData.user.email, role: null });
            } else {
              console.log('Profile created:', newProfile);
              setProfile(newProfile);
            }
            return;
          }
        } else {
          console.error('Error fetching profile:', error);
          // Set a minimal profile to allow navigation
          setProfile({ id: userId, role: null });
        }
      } else {
        console.log('Profile fetched:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Set a minimal profile to allow navigation
      setProfile({ id: userId, role: null });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, fullName, phoneNumber) => {
    try {
      setLoading(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
          },
        },
      });

      if (authError) throw authError;

      // Check if user was created successfully
      if (authData.user) {
        console.log('Auth user created:', authData.user.id);
        
        // Check if email confirmation is required
        if (authData.session) {
          // Session exists - user is auto-confirmed, try to create profile
          console.log('Session exists, creating profile...');
          
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: email.toLowerCase().trim(),
              full_name: fullName,
              phone_number: phoneNumber,
              role: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Profile might be created by trigger, continue anyway
          } else {
            console.log('Profile created successfully');
          }
        } else {
          // No session - email confirmation required
          console.log('Email confirmation required. Profile will be created after confirmation.');
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      // Don't set loading here - let the auth state change handler manage it
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) throw error;

      // The onAuthStateChange listener will handle setting session/user/profile
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user data but keep language preference
      await AsyncStorage.removeItem('userData');

      setUser(null);
      setSession(null);
      setProfile(null);

      // Navigate to sign-in (not language selection - keep language preference)
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (role) => {
    try {
      if (!user) throw new Error('No user session');

      console.log('Updating role for user:', user.id, 'to:', role);

      // First try to update
      let { data, error } = await supabase
        .from('profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      // If update fails (no rows), try upsert to create the profile
      if (error || !data) {
        console.log('Update failed, trying upsert...', error);
        const { data: upsertData, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            phone_number: user.user_metadata?.phone_number || '',
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Upsert error:', upsertError);
          throw upsertError;
        }
        data = upsertData;
      }

      console.log('Role updated successfully:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!user) throw new Error('No user session');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user]);

  // Check authentication status
  const isAuthenticated = !!session && !!user;
  const hasCompletedOnboarding = !!profile?.role;

  const value = {
    user,
    session,
    profile,
    loading,
    initializing,
    isAuthenticated,
    hasCompletedOnboarding,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    updateUserProfile,
    refreshProfile,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};
