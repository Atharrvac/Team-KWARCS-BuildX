// Payment Routes - Razorpay Integration
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Razorpay credentials (set these in your .env file)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo123';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'demo_secret_key';

// In production, use the actual Razorpay SDK:
// import Razorpay from 'razorpay';
// const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

// Create order for payment
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, planId, userId, userEmail, userName } = req.body;

    if (!amount || !planId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: amount, planId, userId' 
      });
    }

    // In production, create actual Razorpay order:
    // const order = await razorpay.orders.create({
    //   amount: amount,
    //   currency: currency || 'INR',
    //   receipt: `order_${userId}_${Date.now()}`,
    //   notes: { planId, userId, userEmail }
    // });

    // For demo, generate mock order
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📦 Payment order created: ${orderId} for ₹${amount/100} (${planId})`);

    res.json({
      success: true,
      orderId: orderId,
      amount: amount,
      currency: currency || 'INR',
      keyId: RAZORPAY_KEY_ID,
      planId: planId,
      prefill: {
        email: userEmail,
        name: userName,
      },
      notes: {
        planId,
        userId,
      },
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment signature
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      userId 
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log(`✅ Payment verified: ${razorpay_payment_id}`);
      
      // In production, update database here
      // await supabase.from('payments').insert({ ... });
      // await supabase.from('subscriptions').insert({ ... });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.log(`❌ Payment verification failed: ${razorpay_payment_id}`);
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook for Razorpay events (subscription renewals, failures, etc.)
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`📨 Razorpay webhook: ${event}`);

    switch (event) {
      case 'payment.captured':
        // Payment successful
        console.log('💰 Payment captured:', payload.payment.entity.id);
        // Update subscription status in database
        break;

      case 'payment.failed':
        // Payment failed
        console.log('❌ Payment failed:', payload.payment.entity.id);
        // Notify user, update status
        break;

      case 'subscription.activated':
        // Subscription started
        console.log('🎉 Subscription activated:', payload.subscription.entity.id);
        break;

      case 'subscription.charged':
        // Recurring payment successful
        console.log('🔄 Subscription charged:', payload.subscription.entity.id);
        // Extend subscription period
        break;

      case 'subscription.cancelled':
        // Subscription cancelled
        console.log('🚫 Subscription cancelled:', payload.subscription.entity.id);
        // Update status to cancelled
        break;

      case 'subscription.halted':
        // Subscription halted due to payment failure
        console.log('⚠️ Subscription halted:', payload.subscription.entity.id);
        // Notify user, downgrade to free
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'INR',
      interval: 'forever',
      features: ['Basic DSS', '3 Alerts', '5 Contracts/month'],
    },
    {
      id: 'pro',
      name: 'Pro Farmer',
      price: 99,
      currency: 'INR',
      interval: 'month',
      features: ['Advanced HOLX™', 'Unlimited Alerts', 'Unlimited Contracts', 'Voice Alerts'],
    },
    {
      id: 'enterprise',
      name: 'FPO Enterprise',
      price: 999,
      currency: 'INR',
      interval: 'month',
      features: ['All Pro Features', 'Bulk Management', 'API Access', 'Dedicated Support'],
    },
  ];

  res.json({ success: true, plans });
});

// Get user's subscription status
router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In production, fetch from database
    // const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single();

    // For demo, return mock data
    res.json({
      success: true,
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: null,
      },
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
