import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const CROP_NAMES = {
  soybean: { en: 'Soybean', hi: 'सोयाबीन' },
  mustard: { en: 'Mustard', hi: 'सरसों' },
  groundnut: { en: 'Groundnut', hi: 'मूंगफली' },
  sunflower: { en: 'Sunflower', hi: 'सूरजमुखी' },
  rapeseed: { en: 'Rapeseed', hi: 'तोरिया' },
  castor: { en: 'Castor', hi: 'अरंडी' },
};

export default function PriceAlertSpeaker({ 
  crop, 
  price, 
  change, 
  compact = false 
}) {
  const { i18n } = useTranslation();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isHindi = i18n.language === 'hi';

  useEffect(() => {
    loadVoicePreference();
  }, []);

  const loadVoicePreference = async () => {
    try {
      const pref = await AsyncStorage.getItem('voice_alerts_enabled');
      setVoiceEnabled(pref === 'true');
    } catch (e) {}
  };

  const toggleVoice = async (value) => {
    setVoiceEnabled(value);
    await AsyncStorage.setItem('voice_alerts_enabled', value.toString());
    
    if (value) {
      // Announce that voice alerts are enabled
      Speech.speak(
        isHindi ? 'आवाज़ अलर्ट चालू है' : 'Voice alerts enabled',
        { language: isHindi ? 'hi-IN' : 'en-US', rate: 0.9 }
      );
    }
  };

  const speakPrice = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    
    const cropName = CROP_NAMES[crop]?.[isHindi ? 'hi' : 'en'] || crop;
    const changeText = change >= 0 
      ? (isHindi ? `${change} प्रतिशत ऊपर` : `up ${change} percent`)
      : (isHindi ? `${Math.abs(change)} प्रतिशत नीचे` : `down ${Math.abs(change)} percent`);
    
    const message = isHindi
      ? `${cropName} का भाव ${price} रुपये प्रति क्विंटल है, ${changeText}`
      : `${cropName} price is ${price} rupees per quintal, ${changeText}`;

    Speech.speak(message, {
      language: isHindi ? 'hi-IN' : 'en-US',
      rate: 0.85,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactBtn} 
        onPress={speakPrice}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isSpeaking ? 'volume-high' : 'volume-medium-outline'} 
          size={18} 
          color={isSpeaking ? '#16a34a' : '#64748b'} 
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="volume-high" size={20} color="#16a34a" />
          <Text style={styles.title}>
            {isHindi ? 'आवाज़ अलर्ट' : 'Voice Alerts'}
          </Text>
        </View>
        <Switch
          value={voiceEnabled}
          onValueChange={toggleVoice}
          trackColor={{ false: '#e2e8f0', true: '#bbf7d0' }}
          thumbColor={voiceEnabled ? '#16a34a' : '#94a3b8'}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.speakBtn, isSpeaking && styles.speakBtnActive]} 
        onPress={speakPrice}
      >
        <Ionicons 
          name={isSpeaking ? 'stop-circle' : 'play-circle'} 
          size={24} 
          color="#fff" 
        />
        <Text style={styles.speakBtnText}>
          {isSpeaking 
            ? (isHindi ? 'रुको' : 'Stop') 
            : (isHindi ? 'भाव सुनें' : 'Hear Price')}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.hint}>
        {isHindi 
          ? '🔊 टैप करें और भाव सुनें' 
          : '🔊 Tap to hear current price'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  speakBtnActive: {
    backgroundColor: '#dc2626',
  },
  speakBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  compactBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
});
