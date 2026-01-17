# AgriSure Subscription System - Production Ready

## Overview

Complete subscription and payment system with:
- 3 pricing tiers (Free, Pro ₹99/mo, Enterprise ₹999/mo)
- Direct UPI payment (zero transaction fees)
- Feature gating for premium features
- Subscription expiry tracking
- Local + database storage with fallback

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User → Profile → "Upgrade" → SubscriptionModal             │
│                        ↓                                    │
│              Select Plan (Pro/Enterprise)                   │
│                        ↓                                    │
│              UPI Payment Options:                           │
│              • Pay via UPI App (deep link)                  │
│              • Copy UPI ID (manual)                         │
│                        ↓                                    │
│              User pays to: 8767040957@ptyes                 │
│                        ↓                                    │
│              User confirms payment                          │
│                        ↓                                    │
│              subscriptionService.createSubscription()       │
│                        ↓                                    │
│              Save to Supabase (or local fallback)           │
│                        ↓                                    │
│              useSubscription hook updates                   │
│                        ↓                                    │
│              Premium features unlocked!                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
mobile/
├── services/
│   └── subscriptionService.js    # Core subscription logic
├── hooks/
│   └── useSubscription.js        # React hook for subscription state
├── components/
│   ├── SubscriptionModal.jsx     # Payment UI modal
│   ├── PremiumFeatureGate.jsx    # Lock overlay for premium features
│   └── PremiumBadge.jsx          # Plan badge component
└── app/
    ├── (tabs)/profile.jsx        # Profile with subscription card
    └── dss.jsx                   # DSS with premium feature gating
```

## Usage

### 1. Check Subscription Status (Hook)

```javascript
import useSubscription from '../hooks/useSubscription';

function MyComponent() {
  const { 
    plan,           // 'free' | 'pro' | 'enterprise'
    isPro,          // boolean
    canUseFeature,  // (feature) => boolean
    checkLimit,     // (type, count) => { allowed, remaining }
    expiryDisplay,  // { date, daysRemaining, isExpiringSoon }
  } = useSubscription();

  if (isPro) {
    // Show premium content
  }
}
```

### 2. Gate Premium Features

```javascript
import { PremiumLock } from '../components/PremiumFeatureGate';
import useSubscription from '../hooks/useSubscription';

function MyScreen() {
  const { isPro } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <PremiumLock 
      feature="advanced_dss" 
      isPro={isPro} 
      onUpgrade={() => setShowUpgrade(true)}
    >
      <YourPremiumContent />
    </PremiumLock>
  );
}
```

### 3. Check Usage Limits

```javascript
const { checkLimit } = useSubscription();

// Before creating an alert
const alertCheck = checkLimit('alerts', currentAlertCount);
if (!alertCheck.allowed) {
  // Show upgrade prompt
  Alert.alert('Limit Reached', `You can only have ${alertCheck.limit} alerts on Free plan`);
}
```

## Feature Gating

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Price Alerts | 3 | ∞ | ∞ |
| Contracts | 5/mo | ∞ | ∞ |
| Listings | 3 | ∞ | ∞ |
| Advanced HOLX™ | ❌ | ✅ | ✅ |
| Voice Alerts | ❌ | ✅ | ✅ |
| Export Reports | ❌ | ✅ | ✅ |
| Bulk Operations | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

## Database Setup

Run `SETUP_SUBSCRIPTIONS.sql` in Supabase SQL Editor to create:
- `subscriptions` table
- `payments` table
- RLS policies
- Indexes
- Auto-expiry function

## Configuration

Update UPI ID in `mobile/components/SubscriptionModal.jsx`:

```javascript
const PAYMENT_CONFIG = {
  upiId: '8767040957@ptyes',  // Your UPI ID
  merchantName: 'AgriSure',
  demoMode: false,            // Set true for testing
};
```

## Testing

1. Set `demoMode: true` in PAYMENT_CONFIG
2. Go to Profile → Upgrade to Premium
3. Select Pro plan → Continue
4. Payment will be simulated
5. Subscription activates immediately

## Production Checklist

- [x] UPI ID configured
- [x] Subscription service with caching
- [x] Feature gating components
- [x] useSubscription hook
- [x] Profile subscription card
- [x] DSS premium feature lock
- [x] Expiry tracking & warnings
- [x] Local storage fallback
- [ ] Run SETUP_SUBSCRIPTIONS.sql in Supabase
- [ ] Test real UPI payment flow
- [ ] Monitor payments in Paytm app

## Revenue

| Plan | Price | Your Revenue |
|------|-------|--------------|
| Pro | ₹99/mo | ₹99 (0% fees) |
| Enterprise | ₹999/mo | ₹999 (0% fees) |

Direct UPI = Zero transaction fees! 🎉
