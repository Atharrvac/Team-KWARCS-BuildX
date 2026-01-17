import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const MockAuthContext = createContext();

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'auth_session',
  USER: 'auth_user',
  LANGUAGE: 'userLanguage',
  HAS_SELECTED_LANGUAGE: 'hasSelectedLanguage',
};

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Persist user changes to storage
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }, [user]);

  const loadSession = async () => {
    try {
      const [savedSession, savedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSION),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);
      
      if (savedSession && savedUser) {
        const parsedSession = JSON.parse(savedSession);
        const parsedUser = JSON.parse(savedUser);
        
        // Validate session (check if not expired)
        if (parsedSession.expires_at && new Date(parsedSession.expires_at) < new Date()) {
          // Session expired, clear it
          await clearSession();
        } else {
          setSession(parsedSession);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const clearSession = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SESSION,
      STORAGE_KEYS.USER,
    ]);
    setSession(null);
    setUser(null);
  };

  const signUp = async (email, password, fullName, phoneNumber) => {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('Email, password, and name are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if user already exists
      const existingUsers = await AsyncStorage.getItem('all_users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      
      if (users[email]) {
        throw new Error('An account with this email already exists');
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        phone_number: phoneNumber?.trim() || '',
        role: null, // Will be set in role selection
        avatar_url: null,
        location: '',
        farm_size: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newSession = {
        user: { id: userId, email: newUser.email },
        access_token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        refresh_token: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      // Save user to "database"
      users[email.toLowerCase()] = { ...newUser, password_hash: btoa(password) };
      await AsyncStorage.setItem('all_users', JSON.stringify(users));

      // Save current session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));

      setUser(newUser);
      setSession(newSession);

      return { data: { user: newUser, session: newSession }, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if user exists
      const existingUsers = await AsyncStorage.getItem('all_users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      
      const normalizedEmail = email.toLowerCase().trim();
      const userData = users[normalizedEmail];
      
      if (!userData) {
        throw new Error('No account found with this email');
      }

      // Verify password
      if (userData.password_hash !== btoa(password)) {
        throw new Error('Incorrect password');
      }

      // Create new session
      const newSession = {
        user: { id: userData.id, email: userData.email },
        access_token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        refresh_token: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      // Remove password_hash from user object
      const { password_hash, ...safeUser } = userData;
      safeUser.updated_at = new Date().toISOString();

      // Save session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));

      setUser(safeUser);
      setSession(newSession);

      return { data: { user: safeUser, session: newSession }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear session but keep user in "database" for future logins
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.LANGUAGE,
        STORAGE_KEYS.HAS_SELECTED_LANGUAGE,
      ]);
      
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
      if (!user) throw new Error('No user session');
      if (!['buyer_seller', 'fpo'].includes(role)) {
        throw new Error('Invalid role');
      }

      const updatedUser = { 
        ...user, 
        role,
        updated_at: new Date().toISOString(),
      };
      
      // Update in "database"
      const existingUsers = await AsyncStorage.getItem('all_users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], role, updated_at: updatedUser.updated_at };
        await AsyncStorage.setItem('all_users', JSON.stringify(users));
      }

      // Update current session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const updateUserProfile = useCallback(async (updates) => {
    try {
      if (!user) throw new Error('No user session');

      // Sanitize updates
      const allowedFields = ['full_name', 'phone_number', 'location', 'farm_size', 'avatar_url'];
      const sanitizedUpdates = {};
      
      for (const key of allowedFields) {
        if (updates[key] !== undefined) {
          sanitizedUpdates[key] = typeof updates[key] === 'string' 
            ? updates[key].trim() 
            : updates[key];
        }
      }

      const updatedUser = { 
        ...user, 
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
      };
      
      // Update in "database"
      const existingUsers = await AsyncStorage.getItem('all_users');
      const users = existingUsers ? JSON.parse(existingUsers) : {};
      if (users[user.email]) {
        users[user.email] = { 
          ...users[user.email], 
          ...sanitizedUpdates, 
          updated_at: updatedUser.updated_at 
        };
        await AsyncStorage.setItem('all_users', JSON.stringify(users));
      }

      // Update current session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [user]);

  // Refresh user data from storage
  const refreshUser = useCallback(async () => {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = !!session && !!user;

  // Check if user has completed onboarding
  const hasCompletedOnboarding = !!user?.role;

  const value = {
    user,
    session,
    loading,
    initializing,
    isAuthenticated,
    hasCompletedOnboarding,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    updateUserProfile,
    refreshUser,
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
};
