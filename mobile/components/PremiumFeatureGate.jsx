// Premium Feature Gate - Shows upgrade prompt for locked features
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SubscriptionModal from './SubscriptionModal';

// Feature definitions
export const PREMIUM_FEATURES = {
  unlimited_alerts: {
    name: 'Unlimited Price Alerts',
    nameHi: 'असीमित मूल्य अलर्ट',
    icon: 'notifications',
    freeLimit: 3,
  },
  unlimited_contracts: {
    name: 'Unlimited Contracts',
    nameHi: 'असीमित अनुबंध',
    icon: 'document-text',
    freeLimit: 5,
  },
  advanced_dss: {
    name: 'Advanced HOLX™ Analytics',
    nameHi: 'एडवांस्ड HOLX™ एनालिटिक्स',
    icon: 'analytics',
    freeLimit: 0,
  },
  voice_alerts: {
    name: 'Voice Price Alerts',
    nameHi: 'वॉइस मूल्य अलर्ट',
    icon: 'volume-high',
    freeLimit: 0,
  },
  satellite_map: {
    name: 'Satellite Map View',
    nameHi: 'सैटेलाइट मैप व्यू',
    icon: 'earth',
    freeLimit: 0,
  },
  export_reports: {
    name: 'Export Reports',
    nameHi: 'रिपोर्ट एक्सपोर्ट',
    icon: 'download',
    freeLimit: 0,
  },
};

// Lock overlay for premium features
export function PremiumLock({ feature, children, isPro, onUpgrade }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const featureInfo = PREMIUM_FEATURES[feature] || {};

  if (isPro) {
    return children;
  }

  return (
    <View style={styles.lockContainer}>
      {children}
      <TouchableOpacity style={styles.lockOverlay} onPress={onUpgrade}>
        <View style={styles.lockContent}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.lockTitle}>
            {isHindi ? 'प्रो फीचर' : 'Pro Feature'}
          </Text>
          <Text style={styles.lockText}>
            {isHindi ? featureInfo.nameHi : featureInfo.name}
          </Text>
          <View style={styles.unlockBtn}>
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={styles.unlockBtnText}>
              {isHindi ? 'अनलॉक करें' : 'Unlock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// Upgrade prompt button
export function UpgradePrompt({ feature, currentCount, onUpgrade, compact = false }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const featureInfo = PREMIUM_FEATURES[feature] || {};

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactPrompt} onPress={onUpgrade}>
        <Ionicons name="lock-closed" size={12} color="#f59e0b" />
        <Text style={styles.compactPromptText}>
          {isHindi 
            ? `${currentCount}/${featureInfo.freeLimit} - अपग्रेड करें`
            : `${currentCount}/${featureInfo.freeLimit} - Upgrade`
          }
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.upgradePrompt} onPress={onUpgrade}>
      <View style={styles.promptIcon}>
        <Ionicons name="star" size={20} color="#f59e0b" />
      </View>
      <View style={styles.promptContent}>
        <Text style={styles.promptTitle}>
          {isHindi ? 'लिमिट पहुंच गई!' : 'Limit Reached!'}
        </Text>
        <Text style={styles.promptText}>
          {isHindi 
            ? `आपने ${featureInfo.freeLimit} ${featureInfo.nameHi} का उपयोग कर लिया। असीमित के लिए अपग्रेड करें।`
            : `You've used ${featureInfo.freeLimit} ${featureInfo.name}. Upgrade for unlimited.`
          }
        </Text>
      </View>
      <View style={styles.promptBtn}>
        <Text style={styles.promptBtnText}>₹99</Text>
      </View>
    </TouchableOpacity>
  );
}

// Full screen upgrade modal
export function PremiumUpgradeModal({ visible, onClose, feature }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const featureInfo = PREMIUM_FEATURES[feature] || {};
  const [showSubscription, setShowSubscription] = useState(false);

  if (showSubscription) {
    return (
      <SubscriptionModal 
        visible={true} 
        onClose={() => {
          setShowSubscription(false);
          onClose();
        }}
        onSuccess={() => {
          setShowSubscription(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.modalIconContainer}>
            <Ionicons name={featureInfo.icon || 'star'} size={40} color="#f59e0b" />
          </View>

          <Text style={styles.modalTitle}>
            {isHindi ? 'प्रो फीचर' : 'Pro Feature'}
          </Text>

          <Text style={styles.modalFeatureName}>
            {isHindi ? featureInfo.nameHi : featureInfo.name}
          </Text>

          <Text style={styles.modalDescription}>
            {isHindi 
              ? 'इस फीचर को अनलॉक करने के लिए Pro प्लान में अपग्रेड करें और असीमित एक्सेस पाएं।'
              : 'Upgrade to Pro plan to unlock this feature and get unlimited access.'
            }
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.benefitText}>
                {isHindi ? 'असीमित अलर्ट' : 'Unlimited Alerts'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.benefitText}>
                {isHindi ? 'एडवांस्ड HOLX™' : 'Advanced HOLX™'}
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.benefitText}>
                {isHindi ? 'वॉइस अलर्ट' : 'Voice Alerts'}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.upgradeBtn}
            onPress={() => setShowSubscription(true)}
          >
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.upgradeBtnText}>
              {isHindi ? 'प्रो में अपग्रेड करें - ₹99/माह' : 'Upgrade to Pro - ₹99/mo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
            <Text style={styles.laterBtnText}>
              {isHindi ? 'बाद में' : 'Maybe Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Lock overlay
  lockContainer: {
    position: 'relative',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  lockContent: {
    alignItems: 'center',
    padding: 20,
  },
  lockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 4,
  },
  lockText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Compact prompt
  compactPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactPromptText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },

  // Upgrade prompt
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginVertical: 8,
  },
  promptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  promptContent: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  promptText: {
    fontSize: 12,
    color: '#a16207',
  },
  promptBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  modalFeatureName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsList: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#334155',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    marginTop: 12,
    padding: 8,
  },
  laterBtnText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default PremiumLock;
