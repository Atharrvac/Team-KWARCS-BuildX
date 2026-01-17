// Premium Badge Component - Shows user's subscription status
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function PremiumBadge({ plan, onPress, compact = false }) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const getPlanConfig = () => {
    switch (plan) {
      case 'pro':
        return {
          label: isHindi ? 'प्रो' : 'PRO',
          icon: 'star',
          color: '#16a34a',
          bgColor: '#dcfce7',
        };
      case 'enterprise':
        return {
          label: isHindi ? 'एंटरप्राइज' : 'ENTERPRISE',
          icon: 'diamond',
          color: '#8b5cf6',
          bgColor: '#ede9fe',
        };
      default:
        return {
          label: isHindi ? 'मुफ्त' : 'FREE',
          icon: 'person',
          color: '#64748b',
          bgColor: '#f1f5f9',
        };
    }
  };

  const config = getPlanConfig();

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactBadge, { backgroundColor: config.bgColor }]}
        onPress={onPress}
      >
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]}>
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.badge, { backgroundColor: config.bgColor, borderColor: config.color }]}
      onPress={onPress}
    >
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
      {plan === 'free' && (
        <View style={styles.upgradeHint}>
          <Text style={styles.upgradeText}>
            {isHindi ? 'अपग्रेड करें' : 'Upgrade'}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#16a34a" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactText: {
    fontSize: 10,
    fontWeight: '700',
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  upgradeText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
});
