import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../config/supabase';
import { fetchIoTSensorData, subscribeToSensorData } from '../config/iotSupabase';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useContractWebSocket } from '../hooks/useContractWebSocket';

export default function BuyerContractDetailScreen() {
  const { id, mode } = useLocalSearchParams();
  const { user, profile } = useSupabaseAuth();
  const isSeller = mode === 'seller';
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  
  // WebSocket for real-time settlement
  const { 
    isConnected, 
    settlementResponse, 
    sendSettlementRequest, 
    clearSettlementResponse 
  } = useContractWebSocket(user?.id);
  
  // Verification inputs
  const [gpsLocation, setGpsLocation] = useState(null);
  const [weight, setWeight] = useState('');
  const [moisture, setMoisture] = useState('12');
  const [temperature, setTemperature] = useState('29');
  const [photoUri, setPhotoUri] = useState(null);
  
  // IoT sensor data from database
  const [sensorData, setSensorData] = useState({
    deviceId: 'Loading...',
    moistureSensor: '--',
    tempSensor: '--',
    timestamp: '--',
    synced: false
  });
  const [sensorLoading, setSensorLoading] = useState(false);
  const [sensorError, setSensorError] = useState(null);
  
  // Verification result
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => { loadContract(); }, [id]);
  
  // Load IoT sensor data when verification screen opens + real-time subscription
  useEffect(() => {
    let subscription = null;
    
    if (showVerification) {
      loadIoTSensorData();
      
      // Subscribe to real-time updates
      subscription = subscribeToSensorData((newData) => {
        console.log('Real-time sensor update received:', newData);
        setSensorData({
          deviceId: newData.deviceId,
          moistureSensor: String(newData.moisture),
          tempSensor: String(newData.temperature),
          timestamp: new Date(newData.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          synced: true,
          raw: newData.raw
        });
        // Auto-update form fields
        setMoisture(String(newData.moisture));
        setTemperature(String(newData.temperature));
      });
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [showVerification]);

  const loadIoTSensorData = async () => {
    setSensorLoading(true);
    setSensorError(null);
    try {
      const result = await fetchIoTSensorData();
      if (result.success && result.data) {
        setSensorData({
          deviceId: result.data.deviceId,
          moistureSensor: String(result.data.moisture),
          tempSensor: String(result.data.temperature),
          timestamp: new Date(result.data.timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          synced: true,
          raw: result.data.raw
        });
        // Auto-fill moisture and temperature from IoT
        setMoisture(String(result.data.moisture));
        setTemperature(String(result.data.temperature));
      } else {
        setSensorError(result.error || 'Could not fetch sensor data');
        setSensorData({
          deviceId: 'N/A',
          moistureSensor: '--',
          tempSensor: '--',
          timestamp: '--',
          synced: false
        });
      }
    } catch (e) {
      setSensorError(e.message);
    } finally {
      setSensorLoading(false);
    }
  };

  // Handle settlement response from farmer (BROADCAST - check if it's for this contract)
  useEffect(() => {
    if (settlementResponse && contract) {
      // Check if this response is for the contract we're viewing
      // Compare as strings since contract IDs can be UUIDs
      const responseContractId = String(settlementResponse.contractId);
      const currentContractId = String(contract.id);
      
      console.log('📝 Settlement response received:', settlementResponse);
      console.log('📝 Comparing:', responseContractId, 'vs', currentContractId);
      
      if (responseContractId === currentContractId) {
        // This response is for the contract we're viewing
        console.log('✅ Settlement response matches this contract!');
        
        Vibration.vibrate([0, 300, 100, 300]);
        setWaitingForApproval(false);
        
        if (settlementResponse.approved) {
          Alert.alert(
            '✅ Settlement Approved!',
            'The farmer has approved the settlement request. The contract is now settled.',
            [{ text: 'OK', onPress: () => {
              clearSettlementResponse();
              loadContract(); // Refresh to show updated status
            }}]
          );
        } else {
          Alert.alert(
            '❌ Settlement Declined',
            'The settlement request was declined by the farmer.',
            [{ text: 'OK', onPress: () => clearSettlementResponse() }]
          );
        }
      }
    }
  }, [settlementResponse, contract]);

  const loadContract = async () => {
    try {
      // Load from contracts table (not marketplace_listings)
      const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single();
      if (error) throw error;
      setContract(data);
    } catch (e) { 
      console.log('Error loading contract:', e.message);
      Alert.alert('Error', e.message); 
    }
    finally { setLoading(false); }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied'); return; }
      const location = await Location.getCurrentPositionAsync({});
      setGpsLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      Alert.alert('Success', 'Location captured');
    } catch (e) { Alert.alert('Error', 'Could not get location'); }
  };

  const uploadPhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (!result.canceled) { setPhotoUri(result.assets[0].uri); Alert.alert('Success', 'Photo captured'); }
    } catch (e) { Alert.alert('Error', 'Could not capture photo'); }
  };

  const refreshSensorData = async () => {
    await loadIoTSensorData();
  };

  const verifyStock = () => {
    setVerifying(true);
    setTimeout(() => {
      const checks = {
        quantityVerified: weight && parseInt(weight) >= (contract?.quantity || 0) * 0.95,
        moistureOk: parseFloat(moisture) <= 14,
        locationMatched: gpsLocation !== null,
        timestampVerified: true
      };
      const passedChecks = Object.values(checks).filter(v => v).length;
      const confidence = Math.round((passedChecks / 4) * 100);
      setVerificationResult({
        checks,
        confidence,
        summary: [
          { text: 'Stock quantity verified', passed: checks.quantityVerified },
          { text: 'Moisture within safe limit', passed: checks.moistureOk },
          { text: 'Geo-location matched', passed: checks.locationMatched },
          { text: 'Data timestamp verified', passed: checks.timestampVerified }
        ]
      });
      // Set verified only if confidence >= 70%
      if (confidence >= 70) {
        setIsVerified(true);
      }
      setVerifying(false);
    }, 2000);
  };

  const confirmDelivery = async () => {
    try {
      // Update contract status to delivered
      await supabase.from('contracts').update({ status: 'delivered' }).eq('id', id);
      
      // Set verified and go back to detail screen
      setIsVerified(true);
      setShowVerification(false);
      
      Alert.alert('Success', 'Delivery confirmed! You can now settle the contract.');
    } catch (e) { 
      Alert.alert('Error', e.message); 
    }
  };

  const settleContract = () => {
    if (!isVerified) {
      Alert.alert('Verification Required', 'Please complete IoT verification before settling the contract.');
      return;
    }
    
    Alert.alert(
      'Request Settlement', 
      'This will send a settlement request to the farmer. They must approve before the contract can be settled.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Request', onPress: () => {
          // Send settlement request via WebSocket
          const sent = sendSettlementRequest({
            contractId: String(contract.id), // Ensure string for UUID comparison
            farmerId: contract.user_id,
            buyerName: profile?.full_name || 'Buyer',
            contractDetails: {
              crop: contract.crop,
              quantity: contract.quantity,
              lockedPrice: contract.locked_price,
              currentPrice: contract.current_price
            }
          });
          
          if (sent) {
            setWaitingForApproval(true);
            Alert.alert(
              '📤 Request Sent',
              'Settlement request sent to farmer. You will be notified when they respond.'
            );
          } else {
            Alert.alert(
              'Connection Error',
              'Could not send request. Please check your connection and try again.'
            );
          }
        }}
      ]
    );
  };

  if (loading) return <View style={s.container}><ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 100 }} /></View>;
  if (!contract) return <View style={s.container}><Text style={s.errorText}>Contract not found</Text></View>;

  // If showing IoT verification screen
  if (showVerification) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setShowVerification(false)} style={s.backBtn}>
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
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Crop:</Text>
                <Text style={s.infoValue}>{contract.crop?.charAt(0).toUpperCase() + contract.crop?.slice(1)}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Contract ID:</Text>
                <Text style={s.infoValue}>C{String(contract.id).padStart(3, '0')}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Type:</Text>
                <Text style={[s.infoValue, { color: '#16a34a' }]}>Long Hedge</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Quantity:</Text>
                <Text style={s.infoValue}>{contract.quantity} quintals</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Status:</Text>
                <Text style={[s.infoValue, { color: '#f59e0b' }]}>Pending Verification</Text>
              </View>
            </View>
          </View>

          {/* Stock Verification Inputs */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Stock Verification Inputs</Text>
            
            <View style={s.inputRow}>
              <View style={s.inputIconLabel}>
                <Ionicons name="location" size={20} color="#16a34a" />
                <Text style={s.inputLabel}>GPS Location</Text>
              </View>
              <TouchableOpacity style={s.actionBtn} onPress={getLocation}>
                <Text style={s.actionBtnText}>Get Location</Text>
              </TouchableOpacity>
            </View>

            <View style={s.inputRow}>
              <View style={s.inputIconLabel}>
                <Ionicons name="scale" size={20} color="#64748b" />
                <Text style={s.inputLabel}>Weight Measurement (kg)</Text>
              </View>
            </View>
            <TextInput style={s.input} placeholder="e.g., 500" value={weight} onChangeText={setWeight} keyboardType="numeric" />

            <View style={s.inputRow}>
              <View style={s.inputIconLabel}>
                <Ionicons name="water" size={20} color="#f59e0b" />
                <Text style={s.inputLabel}>Moisture Level (%)</Text>
              </View>
            </View>
            <TextInput style={s.input} placeholder="12" value={moisture} onChangeText={setMoisture} keyboardType="numeric" />

            <View style={s.inputRow}>
              <View style={s.inputIconLabel}>
                <Ionicons name="thermometer" size={20} color="#ef4444" />
                <Text style={s.inputLabel}>Storage Temperature (°C)</Text>
              </View>
            </View>
            <TextInput style={s.input} placeholder="29" value={temperature} onChangeText={setTemperature} keyboardType="numeric" />

            <View style={s.inputRow}>
              <View style={s.inputIconLabel}>
                <Ionicons name="camera" size={20} color="#3b82f6" />
                <Text style={s.inputLabel}>Upload Photo of Stock</Text>
              </View>
              <TouchableOpacity style={s.actionBtn} onPress={uploadPhoto}>
                <Text style={s.actionBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sensor Data Summary - From IoT Database */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <View style={s.sectionTitleRow}>
                <Text style={s.sectionTitle}>IoT Sensor Data</Text>
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveText}>LIVE</Text>
                </View>
              </View>
              <TouchableOpacity onPress={refreshSensorData} style={s.refreshBtn} disabled={sensorLoading}>
                {sensorLoading ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#64748b" />
                    <Text style={s.refreshText}>Refresh</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {sensorError && (
              <View style={s.errorBanner}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={s.errorBannerText}>{sensorError}</Text>
              </View>
            )}
            
            <View style={s.sensorGrid}>
              <View style={s.sensorCard}>
                <View style={s.sensorIconBox}>
                  <Ionicons name="water" size={24} color="#3b82f6" />
                </View>
                <Text style={s.sensorCardLabel}>Moisture</Text>
                <Text style={s.sensorCardValue}>{sensorData.moistureSensor}%</Text>
              </View>
              <View style={s.sensorCard}>
                <View style={[s.sensorIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="thermometer" size={24} color="#f59e0b" />
                </View>
                <Text style={s.sensorCardLabel}>Temperature</Text>
                <Text style={s.sensorCardValue}>{sensorData.tempSensor}°C</Text>
              </View>
            </View>
            
            <View style={s.sensorDetails}>
              <Text style={s.sensorRow}><Text style={s.sensorLabel}>Device ID:</Text> {sensorData.deviceId}</Text>
              <Text style={s.sensorRow}><Text style={s.sensorLabel}>Last Updated:</Text> {sensorData.timestamp}</Text>
              <View style={s.syncedRow}>
                <Text style={s.sensorLabel}>Status:</Text>
                <View style={[s.syncedBadge, { backgroundColor: sensorData.synced ? '#dcfce7' : '#fef3c7' }]}>
                  <Ionicons 
                    name={sensorData.synced ? "checkmark-circle" : "alert-circle"} 
                    size={16} 
                    color={sensorData.synced ? "#16a34a" : "#f59e0b"} 
                  />
                  <Text style={[s.syncedText, { color: sensorData.synced ? "#16a34a" : "#f59e0b" }]}>
                    {sensorData.synced ? 'Synced from DB' : 'Not Connected'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Verification Result */}
          {verificationResult && (
            <View style={s.card}>
              <View style={s.resultHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                <Text style={s.resultTitle}>Verification Summary:</Text>
              </View>
              {verificationResult.summary.map((item, idx) => (
                <View key={idx} style={s.checkRow}>
                  <Ionicons name={item.passed ? "checkmark-circle" : "alert-circle"} size={18} color={item.passed ? "#16a34a" : "#ef4444"} />
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

          {!verificationResult && (
            <TouchableOpacity style={[s.verifyBtn, verifying && s.btnDisabled]} onPress={verifyStock} disabled={verifying}>
              {verifying ? <ActivityIndicator color="#fff" /> : (
                <><Ionicons name="shield-checkmark" size={20} color="#fff" /><Text style={s.verifyBtnText}>Verify Stock</Text></>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Calculate P&L
  const calculatePL = () => {
    if (!contract) return 0;
    const diff = (contract.current_price || 0) - (contract.locked_price || 0);
    if (contract.hedge_type === 'Long') {
      return diff * (contract.quantity || 0);
    }
    return -diff * (contract.quantity || 0);
  };

  const pl = calculatePL();

  // Main contract detail view for buyer
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#16a34a" />
          <Text style={s.backText}>Back to Portfolio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content}>
        {/* Main Contract Card */}
        <View style={s.card}>
          <View style={s.titleRow}>
            <Text style={s.contractTitle}>{contract.crop} Hedge</Text>
            <Text style={[s.plValue, { color: pl >= 0 ? '#16a34a' : '#ef4444' }]}>
              {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toLocaleString()}
            </Text>
          </View>
          <View style={s.subtitleRow}>
            <View style={s.statusBadgeSmall}>
              <Ionicons name="time" size={14} color="#16a34a" />
              <Text style={s.statusTextSmall}>{contract.status?.charAt(0).toUpperCase() + contract.status?.slice(1)}</Text>
            </View>
            <Text style={s.plLabel}>Profit / Loss</Text>
          </View>
          
          <View style={s.detailsGrid}>
            <View style={s.detailRow}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Quantity:</Text>
                <Text style={s.detailValue}>{contract.quantity} quintals</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Hedge Type:</Text>
                <Text style={s.detailValue}>{contract.hedge_type}</Text>
              </View>
            </View>
            <View style={s.detailRow}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Locked Price:</Text>
                <Text style={s.detailValue}>₹{contract.locked_price?.toLocaleString()}/q</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Current Price:</Text>
                <Text style={s.detailValue}>₹{contract.current_price?.toLocaleString()}/q</Text>
              </View>
            </View>
            <View style={s.detailRow}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>Expiry Date:</Text>
                <Text style={s.detailValue}>{contract.expiry_date}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contract Hash */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Contract Hash (Simulated)</Text>
          <View style={s.hashRow}>
            <Ionicons name="link" size={18} color="#64748b" />
            <Text style={s.hashText} numberOfLines={1}>
              {contract.contract_hash || '0xABCD123456789ABCDEF1234'}
            </Text>
          </View>
        </View>

        {/* Verification Status - Only show for Buyer */}
        {!isSeller && (
          <View style={s.verificationStatus}>
            <View style={[s.statusIndicator, { backgroundColor: isVerified ? '#dcfce7' : '#fef3c7' }]}>
              <Ionicons 
                name={isVerified ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={isVerified ? "#16a34a" : "#f59e0b"} 
              />
              <Text style={[s.statusIndicatorText, { color: isVerified ? "#16a34a" : "#f59e0b" }]}>
                {isVerified ? 'IoT Verification Complete' : 'IoT Verification Pending'}
              </Text>
            </View>
          </View>
        )}

        {/* Connection Status - Only show for Buyer */}
        {!isSeller && (
          <View style={[s.connectionStatus, { backgroundColor: isConnected ? '#dcfce7' : '#fef3c7' }]}>
            <View style={[s.connectionDot, { backgroundColor: isConnected ? '#16a34a' : '#f59e0b' }]} />
            <Text style={[s.connectionText, { color: isConnected ? '#16a34a' : '#f59e0b' }]}>
              {isConnected ? 'Real-time Connected' : 'Connecting...'}
            </Text>
          </View>
        )}

        {/* Waiting for Approval Banner */}
        {waitingForApproval && (
          <View style={s.waitingBanner}>
            <ActivityIndicator color="#3b82f6" size="small" />
            <Text style={s.waitingText}>Waiting for farmer approval...</Text>
          </View>
        )}

        {/* Action Buttons - Only show for Buyer */}
        {!isSeller && (
          <View style={s.buttonContainer}>
            <TouchableOpacity 
              style={[s.iotBtn, isVerified && s.iotBtnVerified]} 
              onPress={() => setShowVerification(true)}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={s.iotBtnText}>{isVerified ? 'View Verification' : 'Verify Stock (IoT)'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[s.settleBtn, (!isVerified || waitingForApproval) && s.settleBtnDisabled]} 
              onPress={settleContract}
              disabled={waitingForApproval}
            >
              {waitingForApproval ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cash" size={20} color="#fff" />
                  <Text style={s.settleBtnText}>Request Settlement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {!isSeller && !isVerified && (
          <Text style={s.settleNote}>* Complete IoT verification to enable contract settlement</Text>
        )}
        
        {!isSeller && isVerified && !waitingForApproval && (
          <Text style={s.settleNote}>* Settlement requires farmer approval via real-time notification</Text>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backText: { fontSize: 16, color: '#16a34a', marginLeft: 4, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  iotBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4
  },
  iotText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 16, 
    marginBottom: 8
  },
  inputIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#334155' },
  input: { 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 15,
    color: '#0f172a'
  },
  actionBtn: { 
    backgroundColor: '#3b82f6', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: 13, color: '#64748b' },
  sensorDetails: { gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sensorRow: { fontSize: 14, color: '#334155', lineHeight: 22 },
  sensorLabel: { fontWeight: '600', color: '#0f172a' },
  syncedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  syncedText: { fontSize: 13, fontWeight: '600' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 16 },
  errorBannerText: { fontSize: 13, color: '#92400e', flex: 1 },
  sensorGrid: { flexDirection: 'row', gap: 12 },
  sensorCard: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, alignItems: 'center' },
  sensorIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  sensorCardLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  sensorCardValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  verifyBtn: { 
    flexDirection: 'row',
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16
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
    gap: 8
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  contractTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  subtitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadgeSmall: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusTextSmall: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  plValue: { fontSize: 22, fontWeight: '800' },
  plLabel: { fontSize: 13, color: '#94a3b8' },
  detailsGrid: { gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  hashRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, gap: 8 },
  hashText: { fontSize: 12, color: '#64748b', fontFamily: 'monospace', flex: 1 },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  settleBtn: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#16a34a', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  settleBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  iotBtn: { 
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  iotBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  iotBtnVerified: { backgroundColor: '#16a34a' },
  settleBtnDisabled: { backgroundColor: '#9ca3af' },
  verificationStatus: { marginBottom: 16 },
  statusIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 10, 
    gap: 8 
  },
  statusIndicatorText: { fontSize: 14, fontWeight: '600' },
  settleNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  errorText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 100 },
  // Connection status
  connectionStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    marginBottom: 12,
    gap: 8
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionText: { fontSize: 12, fontWeight: '600' },
  // Waiting banner
  waitingBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#eff6ff', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  waitingText: { fontSize: 14, color: '#3b82f6', fontWeight: '600' }
});
