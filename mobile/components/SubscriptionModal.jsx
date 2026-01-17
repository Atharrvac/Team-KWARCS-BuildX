// Premium Subscription Modal - Production Ready UPI Payment
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import subscriptionService, { SUBSCRIPTION_PLANS } from '../services/subscriptionService';

// ============================================
// PAYMENT CONFIGURATION - Update these values
// ============================================
const PAYMENT_CONFIG = {
  upiId: '8767040957@ptyes',
  merchantName: 'AgriSure',
  // Set to true to enable demo mode (skips actual payment)
  demoMode: false,
};

export default function SubscriptionModal({ visible, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useSupabaseAuth();
  const { addNotification } = useNotifications();
  const isHindi = i18n.language === 'hi';
  
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState(null); // 'initiated', 'pending', 'confirming'

  // Load current subscription when modal opens
  useEffect(() => {
    if (visible && user?.id) {
      loadCurrentSubscription();
    }
  }, [visible, user?.id]);

  const loadCurrentSubscription = async () => {
    setLoading(true);
    try {
      const status = await subscriptionService.getSubscriptionStatus(user?.id);
      setCurrentPlan(status.plan);
    } catch (e) {
      console.error('Error loading subscription:', e);
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription button press
  const handleSubscribe = useCallback(async (planId) => {
    // Validation
    if (!user?.id) {
      Alert.alert(
        isHindi ? 'लॉगिन आवश्यक' : 'Login Required',
        isHindi ? 'सब्सक्रिप्शन के लिए पहले लॉगिन करें' : 'Please login to subscribe',
        [{ text: 'OK' }]
      );
      return;
    }

    if (planId === 'free') {
      return;
    }

    if (planId === currentPlan) {
      Alert.alert(
        isHindi ? 'पहले से एक्टिव' : 'Already Active',
        isHindi ? 'आप पहले से इस प्लान पर हैं' : 'You are already on this plan'
      );
      return;
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }

    // Demo mode - skip payment
    if (PAYMENT_CONFIG.demoMode) {
      Alert.alert(
        isHindi ? 'डेमो मोड' : 'Demo Mode',
        isHindi ? 'डेमो में भुगतान सिमुलेट किया जाएगा' : 'Payment will be simulated in demo mode',
        [
          { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
          { text: isHindi ? 'आगे बढ़ें' : 'Continue', onPress: () => simulatePayment(planId) },
        ]
      );
      return;
    }

    // Show payment options
    Alert.alert(
      isHindi ? `${plan.nameHi} प्लान` : `${plan.name} Plan`,
      isHindi 
        ? `₹${plan.price}/${plan.periodHi} का भुगतान करें\n\nUPI ID: ${PAYMENT_CONFIG.upiId}`
        : `Pay ₹${plan.price}/${plan.period}\n\nUPI ID: ${PAYMENT_CONFIG.upiId}`,
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        { 
          text: isHindi ? 'UPI ऐप से भुगतान' : 'Pay via UPI App',
          onPress: () => initiateUPIPayment(planId, plan.price)
        },
        {
          text: isHindi ? 'UPI ID कॉपी करें' : 'Copy UPI ID',
          onPress: () => copyUPIAndPay(planId)
        },
      ]
    );
  }, [user?.id, currentPlan, isHindi]);

  // Initiate UPI payment via deep link
  const initiateUPIPayment = async (planId, amount) => {
    const plan = SUBSCRIPTION_PLANS[planId];
    const transactionId = `AGRI${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const transactionNote = `AgriSure ${plan.name} - ${user?.email || user?.id}`;
    
    // UPI deep link format (works with GPay, PhonePe, Paytm, etc.)
    const upiParams = new URLSearchParams({
      pa: PAYMENT_CONFIG.upiId,
      pn: PAYMENT_CONFIG.merchantName,
      am: amount.toString(),
      cu: 'INR',
      tn: transactionNote,
      tr: transactionId,
    });
    
    const upiUrl = `upi://pay?${upiParams.toString()}`;
    
    setPaymentStep('initiated');
    setProcessingPayment(true);
    
    try {
      const canOpen = await Linking.canOpenURL(upiUrl);
      
      if (canOpen) {
        await Linking.openURL(upiUrl);
        
        // Wait for user to return from UPI app
        setTimeout(() => {
          if (processingPayment) {
            showPaymentConfirmation(planId, transactionId);
          }
        }, 3000);
      } else {
        // No UPI app found
        setProcessingPayment(false);
        setPaymentStep(null);
        showManualPaymentInstructions(planId, amount);
      }
    } catch (error) {
      console.error('UPI payment error:', error);
      setProcessingPayment(false);
      setPaymentStep(null);
      
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'UPI ऐप खोलने में समस्या। कृपया मैन्युअल भुगतान करें।' : 'Could not open UPI app. Please pay manually.',
        [
          { text: 'OK', onPress: () => showManualPaymentInstructions(planId, amount) }
        ]
      );
    }
  };

  // Copy UPI ID and show payment instructions
  const copyUPIAndPay = async (planId) => {
    try {
      await Clipboard.setStringAsync(PAYMENT_CONFIG.upiId);
      
      const plan = SUBSCRIPTION_PLANS[planId];
      
      Alert.alert(
        '✅ ' + (isHindi ? 'UPI ID कॉपी हो गया!' : 'UPI ID Copied!'),
        isHindi 
          ? `UPI ID: ${PAYMENT_CONFIG.upiId}\n\nकिसी भी UPI ऐप में ₹${plan.price} भुगतान करें और "भुगतान पूरा" पर टैप करें`
          : `UPI ID: ${PAYMENT_CONFIG.upiId}\n\nPay ₹${plan.price} using any UPI app and tap "Payment Done"`,
        [
          { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
          { 
            text: isHindi ? 'भुगतान पूरा' : 'Payment Done',
            onPress: () => showPaymentConfirmation(planId, `MANUAL${Date.now()}`)
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not copy UPI ID');
    }
  };

  // Show manual payment instructions
  const showManualPaymentInstructions = (planId, amount) => {
    Alert.alert(
      isHindi ? 'मैन्युअल भुगतान' : 'Manual Payment',
      isHindi
        ? `1. कोई भी UPI ऐप खोलें\n   (GPay, PhonePe, Paytm)\n\n2. "Pay" या "Send Money" पर टैप करें\n\n3. UPI ID डालें:\n   ${PAYMENT_CONFIG.upiId}\n\n4. राशि: ₹${amount}\n\n5. भुगतान करें\n\nभुगतान के बाद "पूरा हुआ" पर टैप करें`
        : `1. Open any UPI app\n   (GPay, PhonePe, Paytm)\n\n2. Tap "Pay" or "Send Money"\n\n3. Enter UPI ID:\n   ${PAYMENT_CONFIG.upiId}\n\n4. Amount: ₹${amount}\n\n5. Complete payment\n\nTap "Done" after payment`,
      [
        { text: isHindi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        { 
          text: isHindi ? 'पूरा हुआ' : 'Done',
          onPress: () => showPaymentConfirmation(planId, `MANUAL${Date.now()}`)
        },
      ]
    );
  };

  // Show payment confirmation dialog
  const showPaymentConfirmation = (planId, transactionId) => {
    setPaymentStep('pending');
    
    Alert.alert(
      isHindi ? 'भुगतान पूरा हुआ?' : 'Payment Complete?',
      isHindi 
        ? 'क्या आपने भुगतान सफलतापूर्वक किया?\n\nकृपया सुनिश्चित करें कि भुगतान पूरा हो गया है।'
        : 'Did you complete the payment successfully?\n\nPlease make sure the payment is complete.',
      [
        { 
          text: isHindi ? 'नहीं, रद्द करें' : 'No, Cancel', 
          style: 'cancel',
          onPress: () => {
            setProcessingPayment(false);
            setPaymentStep(null);
          }
        },
        { 
          text: isHindi ? 'हाँ, पूरा हुआ' : 'Yes, Completed',
          onPress: () => confirmAndActivateSubscription(planId, transactionId)
        },
      ],
      { cancelable: false }
    );
  };

  // Confirm payment and activate subscription
  const confirmAndActivateSubscription = async (planId, transactionId) => {
    setPaymentStep('confirming');
    
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      
      // Create payment data
      const paymentData = {
        razorpay_payment_id: `upi_${transactionId}`,
        razorpay_order_id: `order_${Date.now()}`,
        razorpay_signature: 'upi_manual',
        razorpay_subscription_id: `sub_${Date.now()}`,
      };

      // Create subscription
      const result = await subscriptionService.createSubscription(
        user.id,
        planId,
        paymentData
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }

      // Record payment
      await subscriptionService.recordPayment(user.id, {
        ...paymentData,
        amount: plan.price,
        plan_id: planId,
      });

      // Update local state
      setCurrentPlan(planId);
      
      // Show success
      Alert.alert(
        '🎉 ' + (isHindi ? 'सफल!' : 'Success!'),
        isHindi 
          ? `आपका ${plan.nameHi} प्लान एक्टिव हो गया!\n\nधन्यवाद! अब आप सभी प्रीमियम फीचर्स का उपयोग कर सकते हैं।`
          : `Your ${plan.name} plan is now active!\n\nThank you! You can now use all premium features.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            // Notify parent
            onSuccess && onSuccess(planId);
            
            // Add notification
            addNotification({
              type: 'success',
              title: '🎉 ' + (isHindi ? 'सब्सक्रिप्शन एक्टिव!' : 'Subscription Active!'),
              message: isHindi 
                ? `${plan.nameHi} प्लान सफलतापूर्वक एक्टिव हो गया`
                : `${plan.name} plan activated successfully`,
            });
            
            // Close modal
            onClose();
          }
        }]
      );

    } catch (error) {
      console.error('Subscription activation error:', error);
      
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi 
          ? 'सब्सक्रिप्शन एक्टिवेट करने में समस्या। कृपया सहायता से संपर्क करें।'
          : 'Could not activate subscription. Please contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessingPayment(false);
      setPaymentStep(null);
    }
  };

  // Simulate payment for demo mode
  const simulatePayment = async (planId) => {
    setProcessingPayment(true);
    setPaymentStep('confirming');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await confirmAndActivateSubscription(planId, `DEMO${Date.now()}`);
  };

  // Render plan card
  const renderPlanCard = (planKey) => {
    const plan = SUBSCRIPTION_PLANS[planKey];
    const isCurrentPlan = currentPlan === planKey;
    const isSelected = selectedPlan === planKey;
    
    return (
      <TouchableOpacity
        key={planKey}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isCurrentPlan && styles.planCardCurrent,
          { borderColor: isSelected ? plan.color : '#e2e8f0' }
        ]}
        onPress={() => setSelectedPlan(planKey)}
        disabled={isCurrentPlan || processingPayment}
        activeOpacity={0.7}
      >
        {plan.popular && !isCurrentPlan && (
          <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
            <Text style={styles.popularText}>
              {isHindi ? 'लोकप्रिय' : 'POPULAR'}
            </Text>
          </View>
        )}
        
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
            <Text style={styles.currentText}>
              {isHindi ? 'वर्तमान' : 'Current'}
            </Text>
          </View>
        )}

        <Text style={[styles.planName, { color: plan.color }]}>
          {isHindi ? plan.nameHi : plan.name}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>{plan.priceDisplay}</Text>
          {plan.price > 0 && (
            <Text style={styles.pricePeriod}>
              /{isHindi ? plan.periodHi : plan.period}
            </Text>
          )}
        </View>

        <View style={styles.featuresList}>
          {plan.featureList.slice(0, 6).map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Ionicons 
                name={feature.included ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={feature.included ? '#16a34a' : '#cbd5e1'} 
              />
              <Text style={[
                styles.featureText,
                !feature.included && styles.featureTextDisabled
              ]}>
                {isHindi ? feature.labelHi : feature.label}
              </Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && plan.price > 0 && (
          <TouchableOpacity
            style={[
              styles.subscribeBtn, 
              { backgroundColor: plan.color },
              processingPayment && styles.subscribeBtnDisabled
            ]}
            onPress={() => handleSubscribe(planKey)}
            disabled={processingPayment}
          >
            {processingPayment && selectedPlan === planKey ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.subscribeBtnText}>
                {isHindi ? 'सब्सक्राइब करें' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isHindi ? 'प्रीमियम प्लान' : 'Premium Plans'}
              </Text>
              <Text style={styles.subtitle}>
                {isHindi ? 'अधिक फीचर्स अनलॉक करें' : 'Unlock more features'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn}
              disabled={processingPayment}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>
                {isHindi ? 'लोड हो रहा है...' : 'Loading...'}
              </Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Plans */}
              <View style={styles.plansContainer}>
                {renderPlanCard('free')}
                {renderPlanCard('pro')}
                {renderPlanCard('enterprise')}
              </View>

              {/* Payment Info */}
              <View style={styles.paymentInfo}>
                <View style={styles.paymentInfoRow}>
                  <Ionicons name="logo-google" size={18} color="#16a34a" />
                  <Text style={styles.paymentInfoText}>
                    {isHindi ? 'GPay, PhonePe, Paytm से भुगतान' : 'Pay via GPay, PhonePe, Paytm'}
                  </Text>
                </View>
                <View style={styles.paymentInfoRow}>
                  <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
                  <Text style={styles.paymentInfoText}>
                    {isHindi ? 'सुरक्षित UPI भुगतान' : 'Secure UPI Payment'}
                  </Text>
                </View>
                <View style={styles.paymentInfoRow}>
                  <Ionicons name="flash" size={18} color="#16a34a" />
                  <Text style={styles.paymentInfoText}>
                    {isHindi ? 'तुरंत एक्टिवेशन' : 'Instant Activation'}
                  </Text>
                </View>
              </View>

              {/* UPI ID Display */}
              <View style={styles.upiIdBox}>
                <Text style={styles.upiIdLabel}>
                  {isHindi ? 'UPI ID:' : 'UPI ID:'}
                </Text>
                <Text style={styles.upiIdValue}>{PAYMENT_CONFIG.upiId}</Text>
              </View>

              {/* Terms */}
              <Text style={styles.terms}>
                {isHindi 
                  ? 'सब्सक्राइब करके आप हमारी सेवा की शर्तों से सहमत हैं। सब्सक्रिप्शन 30 दिनों के लिए वैध है।'
                  : 'By subscribing, you agree to our Terms of Service. Subscription is valid for 30 days.'}
              </Text>
            </ScrollView>
          )}

          {/* Processing Overlay */}
          {processingPayment && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.processingText}>
                  {paymentStep === 'initiated' && (isHindi ? 'UPI ऐप खोल रहे हैं...' : 'Opening UPI app...')}
                  {paymentStep === 'pending' && (isHindi ? 'भुगतान की पुष्टि करें...' : 'Confirm payment...')}
                  {paymentStep === 'confirming' && (isHindi ? 'सब्सक्रिप्शन एक्टिवेट हो रहा है...' : 'Activating subscription...')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  planCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardCurrent: {
    backgroundColor: '#f0fdf4',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  featuresList: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
  },
  featureTextDisabled: {
    color: '#cbd5e1',
  },
  subscribeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  paymentInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentInfoText: {
    fontSize: 13,
    color: '#475569',
  },
  upiIdBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
  },
  upiIdLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  upiIdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  terms: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
    lineHeight: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  processingBox: {
    alignItems: 'center',
    padding: 24,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
});
