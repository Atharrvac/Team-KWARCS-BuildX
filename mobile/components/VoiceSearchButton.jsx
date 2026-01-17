import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

// Hindi crop name mappings for voice recognition
const HINDI_CROP_MAPPINGS = {
  // Hindi to English
  'सोयाबीन': 'soybean',
  'सोया': 'soybean',
  'सरसों': 'mustard',
  'मूंगफली': 'groundnut',
  'सूरजमुखी': 'sunflower',
  'तोरिया': 'rapeseed',
  'अरंडी': 'castor',
  // English variations
  'soybean': 'soybean',
  'soya': 'soybean',
  'mustard': 'mustard',
  'sarson': 'mustard',
  'groundnut': 'groundnut',
  'peanut': 'groundnut',
  'moongfali': 'groundnut',
  'sunflower': 'sunflower',
  'surajmukhi': 'sunflower',
  'rapeseed': 'rapeseed',
  'toria': 'rapeseed',
  'castor': 'castor',
  'arandi': 'castor',
};

// Common voice commands
const VOICE_COMMANDS = {
  // Search commands
  'search': 'search',
  'find': 'search',
  'show': 'search',
  'खोजो': 'search',
  'दिखाओ': 'search',
  // Sell commands
  'sell': 'sell',
  'बेचना': 'sell',
  'बेचो': 'sell',
  // Buy commands
  'buy': 'buy',
  'खरीदना': 'buy',
  'खरीदो': 'buy',
};

export default function VoiceSearchButton({ 
  onSearch, 
  onCommand,
  size = 'medium',
  style 
}) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, success, error
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const recording = useRef(null);
  const isHindi = i18n.language === 'hi';

  // Pulse animation for listening state
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const startListening = async () => {
    try {
      // Request permissions
      const { status: permStatus } = await Audio.requestPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert(
          isHindi ? 'अनुमति आवश्यक' : 'Permission Required',
          isHindi ? 'कृपया माइक्रोफोन की अनुमति दें' : 'Please allow microphone access for voice search'
        );
        return;
      }

      setModalVisible(true);
      setStatus('listening');
      setIsListening(true);
      setTranscript('');

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;

      // Speak prompt
      Speech.speak(
        isHindi ? 'बोलिए, मैं सुन रहा हूं' : 'Listening, please speak',
        { language: isHindi ? 'hi-IN' : 'en-US', rate: 0.9 }
      );

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (recording.current) {
          stopListening();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting voice:', error);
      setStatus('error');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setStatus('processing');

      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        const uri = recording.current.getURI();
        recording.current = null;

        // Process the audio (simulated speech-to-text for demo)
        await processAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping voice:', error);
      setStatus('error');
    }
  };

  // Simulated speech-to-text processing
  // In production, this would use Google Cloud Speech-to-Text or similar
  const processAudio = async (audioUri) => {
    try {
      // For demo: simulate processing with common crop searches
      // In production, send audioUri to speech-to-text API
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo: randomly select a crop for demonstration
      const demoCrops = ['soybean', 'mustard', 'groundnut', 'sunflower'];
      const randomCrop = demoCrops[Math.floor(Math.random() * demoCrops.length)];
      
      // Get Hindi name if in Hindi mode
      const cropNames = {
        soybean: { en: 'Soybean', hi: 'सोयाबीन' },
        mustard: { en: 'Mustard', hi: 'सरसों' },
        groundnut: { en: 'Groundnut', hi: 'मूंगफली' },
        sunflower: { en: 'Sunflower', hi: 'सूरजमुखी' },
      };

      const displayName = isHindi ? cropNames[randomCrop].hi : cropNames[randomCrop].en;
      setTranscript(displayName);
      setStatus('success');

      // Speak confirmation
      Speech.speak(
        isHindi ? `${displayName} खोज रहा हूं` : `Searching for ${displayName}`,
        { language: isHindi ? 'hi-IN' : 'en-US', rate: 0.9 }
      );

      // Trigger search callback
      if (onSearch) {
        onSearch(randomCrop, displayName);
      }

      // Close modal after delay
      setTimeout(() => {
        setModalVisible(false);
        setStatus('idle');
        setTranscript('');
      }, 2000);

    } catch (error) {
      console.error('Error processing audio:', error);
      setStatus('error');
      Speech.speak(
        isHindi ? 'माफ़ कीजिए, समझ नहीं आया' : 'Sorry, I did not understand',
        { language: isHindi ? 'hi-IN' : 'en-US' }
      );
    }
  };

  const cancelListening = async () => {
    if (recording.current) {
      try {
        await recording.current.stopAndUnloadAsync();
      } catch (e) {}
      recording.current = null;
    }
    setIsListening(false);
    setModalVisible(false);
    setStatus('idle');
    setTranscript('');
  };

  const buttonSize = size === 'large' ? 56 : size === 'small' ? 36 : 44;
  const iconSize = size === 'large' ? 28 : size === 'small' ? 18 : 22;

  return (
    <>
      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          style
        ]}
        onPress={startListening}
        activeOpacity={0.7}
      >
        <Ionicons name="mic" size={iconSize} color="#fff" />
      </TouchableOpacity>

      {/* Voice Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelListening}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={cancelListening}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            {/* Status Icon with Animation */}
            <View style={styles.iconContainer}>
              {/* Pulse rings */}
              {isListening && (
                <>
                  <Animated.View 
                    style={[
                      styles.pulseRing,
                      { 
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: [0.6, 0]
                        })
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.pulseRing,
                      styles.pulseRing2,
                      { 
                        transform: [{ scale: Animated.add(pulseAnim, 0.2) }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: [0.4, 0]
                        })
                      }
                    ]} 
                  />
                </>
              )}
              
              <Animated.View 
                style={[
                  styles.micCircle,
                  isListening && { transform: [{ scale: pulseAnim }] },
                  status === 'success' && styles.micCircleSuccess,
                  status === 'error' && styles.micCircleError,
                ]}
              >
                <Ionicons 
                  name={
                    status === 'success' ? 'checkmark' :
                    status === 'error' ? 'close' :
                    status === 'processing' ? 'hourglass' :
                    'mic'
                  } 
                  size={40} 
                  color="#fff" 
                />
              </Animated.View>
            </View>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {status === 'listening' && (isHindi ? '🎤 सुन रहा हूं...' : '🎤 Listening...')}
              {status === 'processing' && (isHindi ? '⏳ समझ रहा हूं...' : '⏳ Processing...')}
              {status === 'success' && (isHindi ? '✅ मिल गया!' : '✅ Found!')}
              {status === 'error' && (isHindi ? '❌ समझ नहीं आया' : '❌ Not understood')}
            </Text>

            {/* Transcript */}
            {transcript && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>
                  {isHindi ? 'आपने कहा:' : 'You said:'}
                </Text>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>
                {isHindi ? '💡 बोलने के उदाहरण:' : '💡 Try saying:'}
              </Text>
              <Text style={styles.instructionItem}>
                {isHindi ? '• "सोयाबीन दिखाओ"' : '• "Show soybean"'}
              </Text>
              <Text style={styles.instructionItem}>
                {isHindi ? '• "सरसों खोजो"' : '• "Find mustard"'}
              </Text>
              <Text style={styles.instructionItem}>
                {isHindi ? '• "मूंगफली बेचना है"' : '• "Sell groundnut"'}
              </Text>
            </View>

            {/* Stop Button */}
            {isListening && (
              <TouchableOpacity style={styles.stopBtn} onPress={stopListening}>
                <Ionicons name="stop-circle" size={24} color="#fff" />
                <Text style={styles.stopBtnText}>
                  {isHindi ? 'रुको' : 'Stop'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}


const styles = StyleSheet.create({
  voiceButton: {
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
  },
  pulseRing2: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micCircleSuccess: {
    backgroundColor: '#22c55e',
  },
  micCircleError: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  transcriptBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
  },
  instructionsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
