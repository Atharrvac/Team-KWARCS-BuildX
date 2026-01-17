import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../config/supabase';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useSupabaseAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  
  // Verification inputs
  const [gpsLocation, setGpsLocation] = useState(null);
  const [weight, setWeight] = useState('');
  const [moisture, setMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  
  // IoT sensor data
  const [sensorData, setSensorData] = useState({
    deviceId: 'IOT-SILO-102',
    moistureSensor: '12.1',
    tempSensor: '29.2',
    timestamp: new Date().toLocaleString(),
    synced: true
  });
  
  // Verification result
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setContract(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setGpsLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      Alert.alert('Success', 'Location captured');
    } catch (e) {
      Alert.alert('Error', 'Could not get location');
    }
  };

  const uploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        Alert.alert('Success', 'Photo captured');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not capture photo');
    }
  };

  const refreshSensorData = () => {
    // Simulate IoT data refresh
    setSensorData({
      ...sensorData,
      moistureSensor: (Math.random() * 5 + 10).toFixed(1),
      tempSensor: (Math.random() * 5 + 27).toFixed(1),
      timestamp: new Date().toLocaleString(),
    });
  };

  const verifyStock = async () => {
    if (!gpsLocation || !weight || !moisture || !temperature || !photoUri) {
      Alert.alert('Missing Data', 'Please complete all verification inputs');
      return;
    }

    setVerifying(true);
    
    // Simulate verification logic
    setTimeout(() => {
      const checks = {
        quantityVerified: parseInt(weight) >= contract.quantity * 0.95,
        moistureOk: parseFloat(moisture) <= 14,
        locationMatched: Math.random() > 0.3,
        timestampVerified: true
      };
      
      const passedChecks = Object.values(checks).filter(v => v).length;
      const confidence = Math.round((passedChecks / 4) * 100);
      
      setVerificationResult({
        checks,
        confidence,
        summary: [
          { text: 'Stock quantity not verified', passed: checks.quantityVerified },
          { text: 'Moisture within safe limit', passed: checks.moistureOk },
          { text: 'Geo-location not matched', passed: checks.locationMatched },
          { text: 'Data timestamp verified', passed: checks.timestampVerified }
        ]
      });
      
      setVerifying(false);
    }, 2000);
  };

  const confirmDelivery = async () => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'delivered' })
        .eq('id', id);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Delivery confirmed!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const settleContract = () => {
    Alert.alert('Settle Contract', 'Process blockchain settlement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settle', onPress: () => {
        Alert.alert('Success', 'Contract settled on blockchain');
        router.back();
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={s.container}>
        <Text style={s.errorText}>Contract not found</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#16a34a" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>IoT Stock Verification</Text>
        <View style={s.iotBadge}>
          <Ionicons name="wifi" size={14} color="#16a34a" />
          <Text style={s.iotText}>IoT Connected</Text>
        </View>
      </View>

      <ScrollView style={s.content}>
        {/* Crop & Contract Info */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Crop & Contract Info</Text>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Crop:</Text>
              <Text style={s.infoValue}>{contract.crop}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Contract ID:</Text>
              <Text style={s.infoValue}>C{String(contract.id).padStart(3, '0')}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Type:</Text>
              <Text style={[s.infoValue, { color: '#16a34a' }]}>Long Hedge</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Quantity:</Text>
              <Text style={s.infoValue}>{contract.quantity} quintals</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Status:</Text>
              <Text style={[s.infoValue, { color: '#f59e0b' }]}>Pending Verification</Text>
            </View>
          </View>
        </View>

        {/* Stock Verification Inputs */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Stock Verification Inputs</Text>
          
          <View style={s.inputRow}>
            <Ionicons name="location" size={20} color="#16a34a" />
            <Text style={s.inputLabel}>GPS Location</Text>
            <TouchableOpacity style={s.blueBtn} onPress={getLocation}>
              <Text style={s.blueBtnText}>Get Location</Text>
            </TouchableOpacity>
          </View>
          {gpsLocation && (
            <Text style={s.capturedText}>✓ Location captured</Text>
          )}

          <View style={s.inputRow}>
            <Ionicons name="scale" size={20} color="#16a34a" />
            <Text style={s.inputLabel}>Weight Measurement (kg)</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="e.g., 500"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />

          <View style={s.inputRow}>
            <Ionicons name="water" size={20} color="#16a34a" />
            <Text style={s.inputLabel}>Moisture Level (%)</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="12"
            value={moisture}
            onChangeText={setMoisture}
            keyboardType="numeric"
          />

          <View style={s.inputRow}>
            <Ionicons name="thermometer" size={20} color="#16a34a" />
            <Text style={s.inputLabel}>Storage Temperature (°C)</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="29"
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="numeric"
          />

          <View style={s.inputRow}>
            <Ionicons name="camera" size={20} color="#16a34a" />
            <Text style={s.inputLabel}>Upload Photo of Stock</Text>
            <TouchableOpacity style={s.blueBtn} onPress={uploadPhoto}>
              <Text style={s.blueBtnText}>Upload</Text>
            </TouchableOpacity>
          </View>
          {photoUri && (
            <Text style={s.capturedText}>✓ Photo captured</Text>
          )}
        </View>

        {/* Sensor Data Summary */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Sensor Data Summary</Text>
            <TouchableOpacity onPress={refreshSensorData} style={s.refreshBtn}>
              <Ionicons name="refresh" size={16} color="#64748b" />
              <Text style={s.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          <View style={s.sensorData}>
            <Text style={s.sensorRow}><Text style={s.sensorLabel}>Device ID:</Text> {sensorData.deviceId}</Text>
            <Text style={s.sensorRow}><Text style={s.sensorLabel}>Moisture Sensor:</Text> {sensorData.moistureSensor}%</Text>
            <Text style={s.sensorRow}><Text style={s.sensorLabel}>Temp Sensor:</Text> {sensorData.tempSensor}°C</Text>
            <Text style={s.sensorRow}><Text style={s.sensorLabel}>Timestamp:</Text> {sensorData.timestamp}</Text>
            <View style={s.syncedRow}>
              <Text style={s.sensorLabel}>Data Status:</Text>
              <View style={s.syncedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={s.syncedText}>Synced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verify Button */}
        {!verificationResult && (
          <TouchableOpacity 
            style={[s.verifyBtn, verifying && s.btnDisabled]} 
            onPress={verifyStock}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={s.verifyBtnText}>Verify Stock (IoT)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <View style={s.card}>
            <View style={s.resultHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
              <Text style={s.resultTitle}>Verification Summary:</Text>
            </View>
            
            {verificationResult.summary.map((item, idx) => (
              <View key={idx} style={s.checkRow}>
                <Ionicons 
                  name={item.passed ? "checkmark-circle" : "alert-circle"} 
                  size={18} 
                  color={item.passed ? "#16a34a" : "#ef4444"} 
                />
                <Text style={s.checkText}>{item.text}</Text>
              </View>
            ))}

            <View style={s.confidenceBox}>
              <Text style={s.confidenceLabel}>Confidence Score:</Text>
              <Text style={[s.confidenceScore, { color: verificationResult.confidence >= 70 ? '#16a34a' : '#f59e0b' }]}>
                {verificationResult.confidence}%
              </Text>
            </View>

            <TouchableOpacity style={s.confirmBtn} onPress={confirmDelivery}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={s.confirmBtnText}>Confirm Delivery</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#fff', 
    padding: 16, 
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { fontSize: 16, color: '#16a34a', marginLeft: 4, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  iotBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  iotText: { fontSize: 12, color: '#16a34a', marginLeft: 4, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoGrid: { gap: 12 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16, 
    marginBottom: 8,
    justifyContent: 'space-between'
  },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginLeft: 8, flex: 1 },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 15,
    color: '#0f172a'
  },
  blueBtn: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  blueBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  capturedText: { fontSize: 13, color: '#16a34a', marginTop: 4, marginLeft: 28 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: 13, color: '#64748b' },
  sensorData: { gap: 10 },
  sensorRow: { fontSize: 14, color: '#334155' },
  sensorLabel: { fontWeight: '600', color: '#0f172a' },
  syncedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncedText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  verifyBtn: { 
    flexDirection: 'row',
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  resultTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  checkText: { fontSize: 14, color: '#334155' },
  confidenceBox: { 
    backgroundColor: '#f8fafc', 
    padding: 16, 
    borderRadius: 10, 
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  confidenceLabel: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  confidenceScore: { fontSize: 32, fontWeight: '800' },
  confirmBtn: { 
    flexDirection: 'row',
    backgroundColor: '#16a34a', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 100 }
});
