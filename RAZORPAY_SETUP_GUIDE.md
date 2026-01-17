# Razorpay Payment Integration Setup Guide

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Click "Sign Up" and create a business account
3. Complete KYC verification (PAN, Bank Account, Business Details)
4. Once verified, you'll get access to the Dashboard

## Step 2: Get API Keys

1. Login to Razorpay Dashboard
2. Go to **Settings → API Keys**
3. Generate a new API Key pair:
   - **Key ID**: `rzp_live_xxxxxxxxxxxxx` (for production)
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`
4. For testing, use Test Mode keys:
   - **Test Key ID**: `rzp_test_xxxxxxxxxxxxx`
   - **Test Key Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Configure Backend

Add these to your `backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Step 4: Install Razorpay SDK (Backend)

```bash
cd backend
npm install razorpay
```

Then update `backend/src/routes/payments.js`:

```javascript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// In create-order route, replace mock with:
const order = await razorpay.orders.create({
  amount: amount,
  currency: currency || 'INR',
  receipt: `order_${userId}_${Date.now()}`,
  notes: { planId, userId, userEmail }
});
```

## Step 5: Setup Webhook (Important!)

1. In Razorpay Dashboard, go to **Settings → Webhooks**
2. Add a new webhook:
   - **URL**: `https://your-domain.com/api/payments/webhook`
   - **Secret**: Generate and save this
   - **Events**: Select:
     - `payment.captured`
     - `payment.failed`
     - `subscription.activated`
     - `subscription.charged`
     - `subscription.cancelled`

## Step 6: Run Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Run the contents of SETUP_SUBSCRIPTIONS.sql
```

## Step 7: Test Payment Flow

### Test Card Numbers (Test Mode Only):
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI:
- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

## Revenue Flow

```
User Pays ₹99 (Pro Plan)
    ↓
Razorpay processes payment
    ↓
Razorpay Fee: ~2% (₹1.98)
    ↓
Your Account: ₹97.02
    ↓
Settlement: T+2 days to your bank
```

## Pricing Tiers Implemented

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | 3 alerts, 5 contracts, Basic DSS |
| Pro | ₹99/mo | Unlimited alerts, Advanced HOLX™, Voice alerts |
| Enterprise | ₹999/mo | All Pro + API access, Bulk management |

## Mobile Integration (React Native)

For production, install:
```bash
cd mobile
npm install react-native-razorpay
```

Then use the native checkout:
```javascript
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  key: 'rzp_test_xxxxx',
  amount: 9900, // in paise
  currency: 'INR',
  name: 'AgriSure',
  description: 'Pro Subscription',
  order_id: orderData.orderId,
  prefill: {
    email: user.email,
    contact: profile.phone,
  },
  theme: { color: '#16a34a' }
};

RazorpayCheckout.open(options)
  .then((data) => {
    // Payment success
    verifyPayment(data);
  })
  .catch((error) => {
    // Payment failed
    console.log(error);
  });
```

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Integration Support: https://razorpay.com/support/
- Test Dashboard: https://dashboard.razorpay.com/app/dashboard (Test Mode)

## Checklist Before Going Live

- [ ] Complete KYC verification
- [ ] Switch from Test to Live API keys
- [ ] Update webhook URL to production domain
- [ ] Test with real payment (₹1 test)
- [ ] Setup GST invoicing if applicable
- [ ] Configure settlement schedule
