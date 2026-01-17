// useSubscription Hook - Production Ready
// Provides subscription status and feature access throughout the app

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import subscriptionService, { 
  FREE_LIMITS, 
  SUBSCRIPTION_PLANS 
} from '../services/subscriptionService';

export function useSubscription() {
  const { user } = useSupabaseAuth();
  const [subscription, setSubscription] = useState({
    plan: 'free',
    isActive: true,
    features: FREE_LIMITS,
    loading: true,
    expiresAt: null,
    daysRemaining: null,
    error: null,
  });

  // Load subscription on mount and when user changes
  useEffect(() => {
    let mounted = true;
    
    const loadSubscription = async () => {
      try {
        if (!user?.id) {
          if (mounted) {
            setSubscription({
              plan: 'free',
              isActive: true,
              features: FREE_LIMITS,
              loading: false,
              expiresAt: null,
              daysRemaining: null,
              error: null,
            });
          }
          return;
        }

        const status = await subscriptionService.getSubscriptionStatus(user.id);
        
        if (mounted) {
          setSubscription({
            ...status,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
        if (mounted) {
          setSubscription(prev => ({ 
            ...prev, 
            loading: false, 
            error: error.message 
          }));
        }
      }
    };

    loadSubscription();

    // Subscribe to subscription changes
    const unsubscribe = subscriptionService.addListener((newStatus) => {
      if (mounted) {
        setSubscription({
          ...newStatus,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [user?.id]);

  // Refresh subscription (call after payment)
  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return;
    
    setSubscription(prev => ({ ...prev, loading: true }));
    
    try {
      const status = await subscriptionService.refreshStatus(user.id);
      setSubscription({
        ...status,
        loading: false,
        error: null,
      });
      return status;
    } catch (error) {
      setSubscription(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      throw error;
    }
  }, [user?.id]);

  // Memoized plan checks
  const isPro = useMemo(() => {
    return subscription.plan === 'pro' || subscription.plan === 'enterprise';
  }, [subscription.plan]);

  const isEnterprise = useMemo(() => {
    return subscription.plan === 'enterprise';
  }, [subscription.plan]);

  const isFree = useMemo(() => {
    return subscription.plan === 'free';
  }, [subscription.plan]);

  // Check if user can use a specific feature
  const canUseFeature = useCallback((feature) => {
    return subscriptionService.canUseFeature(subscription, feature);
  }, [subscription]);

  // Check if user is within free limits
  const checkLimit = useCallback((limitType, currentCount) => {
    return subscriptionService.checkLimit(subscription, limitType, currentCount);
  }, [subscription]);

  // Get current plan details
  const getPlanDetails = useCallback(() => {
    return SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
  }, [subscription.plan]);

  // Get all available plans
  const getAvailablePlans = useCallback(() => {
    return Object.values(SUBSCRIPTION_PLANS);
  }, []);

  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = useMemo(() => {
    if (!subscription.daysRemaining) return false;
    return subscription.daysRemaining <= 7 && subscription.daysRemaining > 0;
  }, [subscription.daysRemaining]);

  // Check if subscription is expired
  const isExpired = useMemo(() => {
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt) < new Date();
  }, [subscription.expiresAt]);

  // Format expiry date for display
  const expiryDisplay = useMemo(() => {
    if (!subscription.expiresAt) return null;
    
    const date = new Date(subscription.expiresAt);
    return {
      date: date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      daysRemaining: subscription.daysRemaining,
      isExpiringSoon: subscription.daysRemaining <= 7,
    };
  }, [subscription.expiresAt, subscription.daysRemaining]);

  return {
    // State
    subscription,
    plan: subscription.plan,
    features: subscription.features,
    loading: subscription.loading,
    error: subscription.error,
    expiresAt: subscription.expiresAt,
    daysRemaining: subscription.daysRemaining,
    
    // Plan checks
    isPro,
    isEnterprise,
    isFree,
    isExpiringSoon,
    isExpired,
    
    // Methods
    canUseFeature,
    checkLimit,
    refreshSubscription,
    getPlanDetails,
    getAvailablePlans,
    
    // Display helpers
    expiryDisplay,
    planName: isPro 
      ? (isEnterprise ? 'Enterprise' : 'Pro') 
      : 'Free',
    planColor: SUBSCRIPTION_PLANS[subscription.plan]?.color || '#64748b',
  };
}

export default useSubscription;
