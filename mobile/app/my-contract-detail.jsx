import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../config/supabase';

export default function MyContractDetailScreen() {
  const { id } = useLocalSearchParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const verifyStock = () => {
    router.push(`/contract-detail?id=${id}`);
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

  // Calculate profit/loss (simulated)
  const lockedPrice = contract.price;
  const currentPrice = Math.round(lockedPrice * (1 + (Math.random() * 0.1 - 0.05)));
  const profitLoss = (currentPrice - lockedPrice) * contract.quantity;
  const expiryDate = new Date(contract.created_at);
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#16a34a" />
          <Text style={s.backText}>Back to Portfolio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content}>
        {/* Main Contract Card */}
        <View style={s.mainCard}>
          <View style={s.titleRow}>
            <Text style={s.title}>{contract.crop.charAt(0).toUpperCase() + contract.crop.slice(1)} Hedge</Text>
            <Text style={[s.profitLoss, { color: profitLoss >= 0 ? '#16a34a' : '#ef4444' }]}>
              {profitLoss >= 0 ? '+' : ''}₹{profitLoss}
            </Text>
          </View>
          <View style={s.statusRow}>
            <Ionicons name="time" size={16} color="#16a34a" />
            <Text style={s.statusText}>Active</Text>
            <Text style={s.profitLabel}>Profit / Loss</Text>
          </View>

          <View style={s.infoGrid}>
            <View style={s.infoRow}>
              <View style={s.infoCol}>
                <Text style={s.infoLabel}>Quantity:</Text>
                <Text style={s.infoValue}>{contract.quantity} quintals</Text>
              </View>
              <View style={s.infoCol}>
                <Text style={s.infoLabel}>Hedge Type:</Text>
                <Text style={s.infoValue}>Long</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoCol}>
                <Text style={s.infoLabel}>Locked Price:</Text>
                <Text style={s.infoValue}>₹{lockedPrice}/q</Text>
              </View>
              <View style={s.infoCol}>
                <Text style={s.infoLabel}>Current Price:</Text>
                <Text style={s.infoValue}>₹{currentPrice}/q</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <View style={s.infoCol}>
                <Text style={s.infoLabel}>Expiry Date:</Text>
                <Text style={s.infoValue}>{expiryDate.toISOString().split('T')[0]}</Text>
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
              0xABCD123456789ABCDEF123456789ABCDEF1234
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.buttonContainer}>
          <TouchableOpacity style={s.verifyBtn} onPress={verifyStock}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.verifyBtnText}>Verify Stock (IoT)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={s.settleBtn} onPress={settleContract}>
            <Ionicons name="cash" size={20} color="#fff" />
            <Text style={s.settleBtnText}>Settle Contract</Text>
          </TouchableOpacity>
        </View>

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
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: '#16a34a', marginLeft: 4, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  mainCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 8
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', flex: 1 },
  profitLoss: { fontSize: 24, fontWeight: '800' },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 24,
    gap: 6
  },
  statusText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  profitLabel: { 
    fontSize: 13, 
    color: '#94a3b8', 
    marginLeft: 'auto' 
  },
  infoGrid: { gap: 16 },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 16
  },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  hashRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    gap: 8
  },
  hashText: { 
    fontSize: 13, 
    color: '#64748b',
    fontFamily: 'monospace',
    flex: 1
  },
  buttonContainer: { gap: 12 },
  verifyBtn: { 
    flexDirection: 'row',
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  settleBtn: { 
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
  settleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 100 }
});
