import { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are a fast and accurate Hindi voice assistant.
Follow these instructions strictly:
1. User Hindi ya Hinglish me baat kare, to aap Hindi me hi reply dena.
2. Replies hamesha short, clear, and natural human tone me do.
3. Technical ya coding info ho to simple aur samajhne layak language me explain karo.
4. Har message conversation ko continue rakhne wale style me do.
5. Agar user audio input bheje to uska meaning samajh kar correct reply do.
6. Apna tone friendly, helpful aur youth-style casual rakho.
7. Kabhi unnecessary long paragraphs mat likho.
8. Bilkul chatbot jaisi line mat likhna—insaan jaisa normal bolna.
9. Sensitive, harmful, ya illegal cheezon ka jawab politely refuse karna.
10. Hamesha concise response output dena (max 1-2 lines).
11. Farming, crops, prices, weather ke baare me helpful info do.`;

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');
  const [textInput, setTextInput] = useState('');
  
  const recordingRef = useRef(null);
  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (recordingRef.current) {
        try { 
          await recordingRef.current.stopAndUnloadAsync(); 
        } catch (e) {
          console.log('Stop error:', e);
        }
        recordingRef.current = null;
      }

      setStatus('माइक शुरू...');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setStatus('❌ माइक अनुमति दें');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      setStatus('🎤 बोलें...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Recording error:', err);
      setStatus('❌ रिकॉर्डिंग फेल');
      recordingRef.current = null;
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !isListening) return;
    
    setIsListening(false);
    setIsProcessing(true);
    setStatus('⏳ प्रोसेस हो रहा...');

    try {
      const recording = recordingRef.current;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (uri) await processVoice(uri);
      else {
        setStatus('❌ रिकॉर्डिंग नहीं मिली');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Stop error:', err);
      setStatus('❌ कुछ गलत हुआ');
      setIsProcessing(false);
      recordingRef.current = null;
    }
  };

  const processVoice = async (uri) => {
    try {
      if (!GROQ_API_KEY) {
        setStatus('❌ API key नहीं मिली');
        setIsProcessing(false);
        return;
      }

      // Step 1: Transcribe with Groq Whisper (FREE!)
      setStatus('📝 समझ रहा हूं...');
      
      const formData = new FormData();
      formData.append('file', { uri, type: 'audio/m4a', name: 'audio.m4a' });
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'hi');

      const transRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      if (!transRes.ok) {
        const err = await transRes.json().catch(() => ({}));
        console.error('Transcription error:', err);
        setStatus('❌ आवाज़ समझ नहीं आई');
        setIsProcessing(false);
        return;
      }

      const { text } = await transRes.json();
      if (!text || text.trim().length < 2) {
        setStatus('❌ कुछ बोलें फिर कोशिश करें');
        setIsProcessing(false);
        return;
      }

      await getAIResponse(text);
    } catch (err) {
      console.error('Process error:', err);
      setStatus('❌ नेटवर्क एरर');
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (userText) => {
    try {
      addMessage('user', userText);
      setStatus('🤔 जवाब सोच रहा...');

      const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userText },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!chatRes.ok) {
        console.error('Chat error:', await chatRes.text());
        setStatus('❌ जवाब नहीं मिला');
        setIsProcessing(false);
        return;
      }

      const data = await chatRes.json();
      const reply = data.choices[0]?.message?.content || 'माफ करें, जवाब नहीं मिला';

      addMessage('assistant', reply);
      setStatus('');
      
      // Speak response
      const isHindi = /[\u0900-\u097F]/.test(reply);
      Speech.speak(reply, { language: isHindi ? 'hi-IN' : 'en-IN', rate: 0.9 });
    } catch (err) {
      console.error('AI error:', err);
      setStatus('❌ जवाब नहीं मिला');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim() || isProcessing) return;
    const msg = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    await getAIResponse(msg);
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, id: Date.now() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleMicPress = () => {
    if (isProcessing) return;
    if (isListening) stopRecording();
    else startRecording();
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)} activeOpacity={0.8}>
        <View style={styles.fabBtn}>
          <Ionicons name="mic" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>🌾 किसान सहायक</Text>
              <TouchableOpacity onPress={() => { setIsOpen(false); Speech.stop(); setStatus(''); }}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>

            {messages.length === 0 && !status && (
              <View style={styles.tips}>
                <Text style={styles.tipText}>💡 बोलें या टाइप करें: "सोयाबीन का भाव?" "मौसम कैसा?"</Text>
              </View>
            )}

            <ScrollView ref={scrollRef} style={styles.msgs} contentContainerStyle={{ padding: 12 }}>
              {messages.map(m => (
                <View key={m.id} style={[styles.msg, m.role === 'user' ? styles.userMsg : styles.aiMsg]}>
                  <Text style={[styles.msgText, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
                </View>
              ))}
            </ScrollView>

            {status ? (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
            ) : null}

            {/* Text Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="टाइप करें..."
                placeholderTextColor="#999"
                value={textInput}
                onChangeText={setTextInput}
                onSubmitEditing={sendTextMessage}
                editable={!isProcessing}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!textInput.trim() || isProcessing) && { opacity: 0.5 }]} 
                onPress={sendTextMessage}
                disabled={!textInput.trim() || isProcessing}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.micArea}>
              <TouchableOpacity onPress={handleMicPress} disabled={isProcessing} activeOpacity={0.7}>
                <Animated.View style={[
                  styles.micBtn,
                  isListening && styles.micActive,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="large" />
                  ) : (
                    <Ionicons name={isListening ? 'stop' : 'mic'} size={36} color="#fff" />
                  )}
                </Animated.View>
              </TouchableOpacity>
              
              <Text style={styles.hint}>
                {isListening ? '🔴 बोलें, फिर टैप करें' : isProcessing ? '⏳ रुकें...' : '👆 टैप करके बोलें'}
              </Text>

              {messages.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => { setMessages([]); Speech.stop(); }}>
                  <Ionicons name="refresh" size={18} color="#888" />
                  <Text style={styles.clearText}>नया चैट</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 90, right: 16, zIndex: 999 },
  fabBtn: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    minHeight: '60%', maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#2E7D32' },
  tips: { backgroundColor: '#E8F5E9', margin: 12, padding: 12, borderRadius: 10 },
  tipText: { fontSize: 14, color: '#333', textAlign: 'center' },
  msgs: { flex: 1 },
  msg: { maxWidth: '80%', padding: 10, borderRadius: 12, marginBottom: 8 },
  userMsg: { backgroundColor: '#4CAF50', alignSelf: 'flex-end' },
  aiMsg: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  msgText: { fontSize: 15, color: '#333', lineHeight: 20 },
  statusBox: { backgroundColor: '#FFF3E0', padding: 10, marginHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  statusText: { fontSize: 14, color: '#E65100', fontWeight: '500' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  textInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#333', marginRight: 8,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  micArea: { alignItems: 'center', paddingVertical: 12 },
  micBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  micActive: { backgroundColor: '#E53935' },
  hint: { marginTop: 8, fontSize: 13, color: '#666', fontWeight: '500' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 6 },
  clearText: { fontSize: 12, color: '#888', marginLeft: 4 },
});
