// Subscription Service - Production Ready
// Handles premium subscriptions, feature gating, and payment tracking

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// Cache duration - 5 minutes for balance between freshness and performance
const CACHE_DURATION = 5 * 60 * 1000;

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    nameHi: 'मुफ्त',
    price: 0,
    priceDisplay: '₹0',
    period: 'forever',
    periodHi: 'हमेशा के लिए',
    durationDays: null, // Never expires
    features: {
      maxAlerts: 3,
      maxContracts: 5,
      maxListings: 3,
      advancedDSS: false,
      voiceAlerts: false,
      exportReports: false,
      prioritySupport: false,
      bulkOperations: false,
      apiAccess: false,
    },
    featureList: [
      { key: 'dss_basic', label: 'Basic DSS Score', labelHi: 'बेसिक DSS स्कोर', included: true },
      { key: 'alerts_3', label: '3 Price Alerts', labelHi: '3 मूल्य अलर्ट', included: true },
      { key: 'marketplace', label: 'Marketplace Access', labelHi: 'मार्केटप्लेस एक्सेस', included: true },
      { key: 'contracts_5', label: '5 Contracts/month', labelHi: '5 अनुबंध/माह', included: true },
      { key: 'weather', label: 'Weather Updates', labelHi: 'मौसम अपडेट', included: true },
      { key: 'holx_advanced', label: 'Advanced HOLX™ Analytics', labelHi: 'एडवांस्ड HOLX™', included: false },
      { key: 'alerts_unlimited', label: 'Unlimited Alerts', labelHi: 'असीमित अलर्ट', included: false },
      { key: 'voice_alerts', label: 'Voice Alerts', labelHi: 'वॉइस अलर्ट', included: false },
    ],
    color: '#64748b',
  },
  pro: {
    id: 'pro',
    name: 'Pro Farmer',
    nameHi: 'प्रो किसान',
    price: 99,
    priceDisplay: '₹99',
    period: 'month',
    periodHi: 'महीना',
    durationDays: 30,
    features: {
      maxAlerts: Infinity,
      maxContracts: Infinity,
      maxListings: Infinity,
      advancedDSS: true,
      voiceAlerts: true,
      exportReports: true,
      prioritySupport: false,
      bulkOperations: false,
      apiAccess: false,
    },
    featureList: [
      { key: 'all_free', label: 'All Free Features', labelHi: 'सभी मुफ्त फीचर्स', included: true },
      { key: 'contracts_unlimited', label: 'Unlimited Contracts', labelHi: 'असीमित अनुबंध', included: true },
      { key: 'holx_advanced', label: 'Advanced HOLX™ Analytics', labelHi: 'एडवांस्ड HOLX™', included: true },
      { key: 'alerts_unlimited', label: 'Unlimited Alerts', labelHi: 'असीमित अलर्ट', included: true },
      { key: 'voice_alerts', label: 'Voice Alerts', labelHi: 'वॉइस अलर्ट', included: true },
      { key: 'export_reports', label: 'Export Reports', labelHi: 'रिपोर्ट एक्सपोर्ट', included: true },
      { key: 'priority_support', label: 'Priority Support', labelHi: 'प्राथमिकता सहायता', included: false },
    ],
    color: '#16a34a',
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'FPO Enterprise',
    nameHi: 'FPO एंटरप्राइज',
    price: 999,
    priceDisplay: '₹999',
    period: 'month',
    periodHi: 'महीना',
    durationDays: 30,
    features: {
      maxAlerts: Infinity,
      maxContracts: Infinity,
      maxListings: Infinity,
      advancedDSS: true,
      voiceAlerts: true,
      exportReports: true,
      prioritySupport: true,
      bulkOperations: true,
      apiAccess: true,
    },
    featureList: [
      { key: 'all_pro', label: 'All Pro Features', labelHi: 'सभी प्रो फीचर्स', included: true },
      { key: 'bulk_contracts', label: 'Bulk Contract Management', labelHi: 'बल्क अनुबंध प्रबंधन', included: true },
      { key: 'api_access', label: 'API Access', labelHi: 'API एक्सेस', included: true },
      { key: 'custom_analytics', label: 'Custom Analytics Dashboard', labelHi: 'कस्टम एनालिटिक्स', included: true },
      { key: 'dedicated_support', label: 'Dedicated Support', labelHi: 'समर्पित सहायता', included: true },
      { key: 'white_label', label: 'White Label Options', labelHi: 'व्हाइट लेबल', included: true },
    ],
    color: '#8b5cf6',
  },
};

// Free tier limits (used as fallback)
export const FREE_LIMITS = SUBSCRIPTION_PLANS.free.features;

class SubscriptionService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Set();
  }

  // Subscribe to subscription changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of changes
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (e) {
        console.error('Subscription listener error:', e);
      }
    });
  }

  // Get current user's subscription status
  async getSubscriptionStatus(userId) {
    // Return free plan for unauthenticated users
    if (!userId) {
      return this.createFreeStatus();
    }

    try {
      // Check memory cache first (fastest)
      const memoryCached = this.cache.get(userId);
      if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
        return memoryCached.data;
      }

      // Check AsyncStorage cache (persists across app restarts)
      const storageCached = await this.getFromStorage(userId);
      if (storageCached) {
        this.cache.set(userId, { data: storageCached, timestamp: Date.now() });
        return storageCached;
      }

      // Fetch from database
      const status = await this.fetchFromDatabase(userId);
      
      // Cache the result
      await this.cacheStatus(userId, status);
      
      return status;

    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Return free plan on error to not block user
      return this.createFreeStatus();
    }
  }

  // Fetch subscription from Supabase
  async fetchFromDatabase(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        // Table might not exist yet - return free plan
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Subscriptions table not found - using free plan');
          return this.createFreeStatus();
        }
        throw error;
      }

      if (!data) {
        return this.createFreeStatus();
      }

      // Check if subscription is expired
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        
        if (expiresAt < now) {
          // Subscription expired - update status in background
          this.markAsExpired(data.id).catch(console.error);
          return this.createFreeStatus();
        }
      }

      // Valid subscription found
      const plan = SUBSCRIPTION_PLANS[data.plan_id] || SUBSCRIPTION_PLANS.free;
      
      return {
        plan: data.plan_id,
        isActive: true,
        subscriptionId: data.id,
        paymentId: data.razorpay_payment_id,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        features: plan.features,
        daysRemaining: this.calculateDaysRemaining(data.expires_at),
      };

    } catch (error) {
      console.error('Database fetch error:', error);
      return this.createFreeStatus();
    }
  }

  // Create free plan status object
  createFreeStatus() {
    return {
      plan: 'free',
      isActive: true,
      subscriptionId: null,
      paymentId: null,
      expiresAt: null,
      createdAt: null,
      features: FREE_LIMITS,
      daysRemaining: null,
    };
  }

  // Calculate days remaining in subscription
  calculateDaysRemaining(expiresAt) {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Mark subscription as expired
  async markAsExpired(subscriptionId) {
    try {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscriptionId);
    } catch (error) {
      console.error('Error marking subscription as expired:', error);
    }
  }

  // Create new subscription after payment
  async createSubscription(userId, planId, paymentData) {
    if (!userId) {
      return { success: false, error: 'User ID required' };
    }

    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return { success: false, error: 'Invalid plan' };
    }

    if (planId === 'free') {
      return { success: false, error: 'Cannot subscribe to free plan' };
    }

    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      
      // Calculate expiry date
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (plan.durationDays || 30));

      // First, deactivate any existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({ status: 'superseded' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Create new subscription
      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        status: 'active',
        amount: plan.price,
        currency: 'INR',
        payment_method: 'upi',
        razorpay_payment_id: paymentData.razorpay_payment_id || `upi_${Date.now()}`,
        razorpay_order_id: paymentData.razorpay_order_id || null,
        razorpay_subscription_id: paymentData.razorpay_subscription_id || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        // Handle table not existing
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // Store locally as fallback
          await this.storeLocalSubscription(userId, planId, expiresAt);
          return { 
            success: true, 
            subscription: { plan_id: planId, expires_at: expiresAt.toISOString() },
            isLocal: true,
          };
        }
        throw error;
      }

      // Clear cache to force refresh
      await this.clearCache(userId);

      // Notify listeners
      const newStatus = await this.getSubscriptionStatus(userId);
      this.notifyListeners(newStatus);

      return { success: true, subscription: data };

    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Store subscription locally (fallback when DB not available)
  async storeLocalSubscription(userId, planId, expiresAt) {
    try {
      const localSub = {
        plan: planId,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        isLocal: true,
      };
      await AsyncStorage.setItem(`local_subscription_${userId}`, JSON.stringify(localSub));
      
      // Also update cache
      const plan = SUBSCRIPTION_PLANS[planId];
      const status = {
        plan: planId,
        isActive: true,
        subscriptionId: `local_${Date.now()}`,
        expiresAt: expiresAt.toISOString(),
        features: plan.features,
        daysRemaining: this.calculateDaysRemaining(expiresAt),
        isLocal: true,
      };
      await this.cacheStatus(userId, status);
    } catch (e) {
      console.error('Error storing local subscription:', e);
    }
  }

  // Record payment transaction
  async recordPayment(userId, paymentData) {
    if (!userId || !paymentData) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_signature: paymentData.razorpay_signature,
          amount: paymentData.amount,
          currency: 'INR',
          status: 'captured',
          plan_id: paymentData.plan_id,
          payment_method: 'upi',
        })
        .select()
        .single();

      if (error) {
        // Ignore if table doesn't exist
        if (error.code === '42P01') {
          console.log('Payments table not found - skipping payment record');
          return { success: true, isLocal: true };
        }
        throw error;
      }

      return { success: true, payment: data };

    } catch (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId, subscriptionId) {
    if (!userId || !subscriptionId) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString() 
        })
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear cache
      await this.clearCache(userId);

      // Notify listeners
      const newStatus = await this.getSubscriptionStatus(userId);
      this.notifyListeners(newStatus);

      return { success: true };

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user can use a specific feature
  canUseFeature(status, feature) {
    if (!status || !status.features) {
      return false;
    }

    switch (feature) {
      case 'advanced_dss':
        return status.features.advancedDSS === true;
      case 'voice_alerts':
        return status.features.voiceAlerts === true;
      case 'export_reports':
        return status.features.exportReports === true;
      case 'bulk_operations':
        return status.features.bulkOperations === true;
      case 'api_access':
        return status.features.apiAccess === true;
      case 'priority_support':
        return status.features.prioritySupport === true;
      default:
        return true;
    }
  }

  // Check if user is within usage limits
  checkLimit(status, limitType, currentCount) {
    if (!status || !status.features) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    let limit;
    switch (limitType) {
      case 'alerts':
        limit = status.features.maxAlerts;
        break;
      case 'contracts':
        limit = status.features.maxContracts;
        break;
      case 'listings':
        limit = status.features.maxListings;
        break;
      default:
        limit = Infinity;
    }

    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);
    
    return {
      allowed: currentCount < limit,
      remaining,
      limit,
      currentCount,
      isUnlimited: limit === Infinity,
    };
  }

  // Cache helpers
  async getFromStorage(userId) {
    try {
      const key = `subscription_${userId}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      
      // Also check for local subscription
      const localSub = await AsyncStorage.getItem(`local_subscription_${userId}`);
      if (localSub) {
        const parsed = JSON.parse(localSub);
        const expiresAt = new Date(parsed.expiresAt);
        
        if (expiresAt > new Date()) {
          const plan = SUBSCRIPTION_PLANS[parsed.plan];
          return {
            plan: parsed.plan,
            isActive: true,
            subscriptionId: `local_${userId}`,
            expiresAt: parsed.expiresAt,
            features: plan?.features || FREE_LIMITS,
            daysRemaining: this.calculateDaysRemaining(parsed.expiresAt),
            isLocal: true,
          };
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  async cacheStatus(userId, status) {
    try {
      const key = `subscription_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        data: status,
        timestamp: Date.now(),
      }));
      this.cache.set(userId, { data: status, timestamp: Date.now() });
    } catch (e) {
      console.error('Cache error:', e);
    }
  }

  async clearCache(userId) {
    try {
      this.cache.delete(userId);
      await AsyncStorage.removeItem(`subscription_${userId}`);
    } catch (e) {
      console.error('Clear cache error:', e);
    }
  }

  // Force refresh subscription status
  async refreshStatus(userId) {
    await this.clearCache(userId);
    return this.getSubscriptionStatus(userId);
  }
}

// Singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
