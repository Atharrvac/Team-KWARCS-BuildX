# Simple UPI Payment Setup (MVP)

## ✅ Already Configured!

Your UPI ID `8767040957@ptyes` is already set up in the app.

## How Payment Works

```
┌─────────────────────────────────────────────────────────┐
│  USER FLOW                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User opens Profile → taps "Upgrade to Premium"      │
│                    ↓                                    │
│  2. Selects Pro (₹99) or Enterprise (₹999)              │
│                    ↓                                    │
│  3. Taps "Pay via UPI App"                              │
│                    ↓                                    │
│  4. GPay/PhonePe/Paytm opens with amount pre-filled     │
│                    ↓                                    │
│  5. User pays to: 8767040957@ptyes                      │
│                    ↓                                    │
│  6. Money goes to YOUR Paytm account (instant!)         │
│                    ↓                                    │
│  7. User taps "Yes, Completed" in app                   │
│                    ↓                                    │
│  8. Subscription activates → User gets PRO features     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## What PRO Users Get (Locked for Free Users)

| Feature | Free | Pro (₹99) |
|---------|------|-----------|
| Price Alerts | 3 max | Unlimited |
| Contracts | 5/month | Unlimited |
| HOLX™ Score Breakdown | 🔒 Locked | ✅ Unlocked |
| Voice Alerts | 🔒 Locked | ✅ Unlocked |
| Advanced Analytics | 🔒 Locked | ✅ Unlocked |
| Export Reports | 🔒 Locked | ✅ Unlocked |

## Revenue (Zero Fees!)

| Plan | Price | You Receive |
|------|-------|-------------|
| Pro | ₹99/mo | ₹99 |
| Enterprise | ₹999/mo | ₹999 |

Direct UPI = No transaction fees! 🎉

## Testing the Flow

1. Open app → Go to Profile tab
2. Tap the "Upgrade to Premium" card
3. Select "Pro Farmer" plan
4. Tap "Pay via UPI App"
5. Your UPI app will open
6. Complete payment (or cancel for testing)
7. Tap "Yes, Completed" to activate

## Tracking Payments

Check your Paytm app for incoming payments. Match with:
- Supabase `subscriptions` table (user_id, plan_id, created_at)
- Supabase `payments` table (amount, created_at)

## Feature Gating in Code

The app now locks premium features for free users:

```javascript
// In any screen, use the hook:
import useSubscription from '../hooks/useSubscription';

const { isPro, canUseFeature } = useSubscription();

// Check if user is Pro
if (isPro) {
  // Show full feature
} else {
  // Show upgrade prompt
}

// Or use the PremiumLock component:
<PremiumLock feature="advanced_dss" isPro={isPro} onUpgrade={showUpgrade}>
  <YourPremiumContent />
</PremiumLock>
```
