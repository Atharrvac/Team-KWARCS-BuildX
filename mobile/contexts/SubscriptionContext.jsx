// Subscription Context - Global subscription state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import subscriptionService, { FREE_LIMITS } from '../services/subscriptionService';
import { useSupabaseAuth } from './SupabaseAuthContext';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user } = useSupabaseAuth();
  const [subscription, setSubscription] = useState({
    plan: 'free',
    isActive: true,
    features: FREE_LIMITS,
    loading: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
    } else {
      setSubscription({
        plan: 'free',
        isActive: true,
        features: FREE_LIMITS,
        loading: false,
      });
    }
  }, [user?.id]);

  const loadSubscription = async () => {
    try {
      const status = await subscriptionService.getSubscriptionStatus(user?.id);
      setSubscription({
        ...status,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshSubscription = async () => {
    setSubscription(prev => ({ ...prev, loading: true }));
    await loadSubscription();
  };

  const isPro = subscription.plan === 'pro' || subscription.plan === 'enterprise';
  const isEnterprise = subscription.plan === 'enterprise';

  const canUseFeature = (feature) => {
    switch (feature) {
      case 'unlimited_alerts':
        return subscription.features.maxAlerts === Infinity;
      case 'unlimited_contracts':
        return subscription.features.maxContracts === Infinity;
      case 'advanced_dss':
        return subscription.features.advancedDSS;
      case 'voice_alerts':
        return subscription.features.voiceAlerts;
      case 'bulk_operations':
        return subscription.features.bulkOperations;
      default:
        return true;
    }
  };

  const checkLimit = (limitType, currentCount) => {
    switch (limitType) {
      case 'alerts':
        return currentCount < subscription.features.maxAlerts;
      case 'contracts':
        return currentCount < subscription.features.maxContracts;
      case 'listings':
        return currentCount < subscription.features.maxListings;
      default:
        return true;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isPro,
      isEnterprise,
      canUseFeature,
      checkLimit,
      refreshSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
