import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

export default function SimulateHedgeModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [formData, setFormData] = useState({
    crop: 'soybean',
    quantity: '',
    percentage: '60',
    targetPrice: '',
  });

  const crops = ['soybean', 'mustard', 'groundnut', 'sunflower'];
  const percentages = ['40', '60', '80', '100'];

  const handleSimulate = async () => {
    if (!formData.quantity) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/dss/simulate-hedge`, {
        crop: formData.crop,
        quantity: parseFloat(formData.quantity),
        percentage: parseInt(formData.percentage),
        targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : null,
      });
      
      setSimulation(response.data);
    } catch (error) {
      console.error('Error simulating hedge:', error);
      Alert.alert('Error', 'Failed to simulate hedge');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    Alert.alert(
      'Execute Hedge',
      'This will create a new hedging contract. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Execute',
          onPress: () => {
            Alert.alert('Success', 'Hedge contract created successfully');
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Simulate Hedge</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Crop Selection */}
            <Text style={styles.label}>Select Crop</Text>
            <View style={styles.cropGrid}>
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[
                    styles.cropButton,
                    formData.crop === crop && styles.cropButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, crop })}
                >
                  <Text style={[
                    styles.cropButtonText,
                    formData.crop === crop && styles.cropButtonTextActive
                  ]}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity */}
            <Text style={styles.label}>Quantity (Quintals)</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="Enter quantity"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            {/* Hedge Percentage */}
            <Text style={styles.label}>Hedge Percentage</Text>
            <View style={styles.percentageGrid}>
              {percentages.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.percentageButton,
                    formData.percentage === pct && styles.percentageButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, percentage: pct })}
                >
                  <Text style={[
                    styles.percentageButtonText,
                    formData.percentage === pct && styles.percentageButtonTextActive
                  ]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Target Price (Optional) */}
            <Text style={styles.label}>Target Price (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.targetPrice}
              onChangeText={(text) => setFormData({ ...formData, targetPrice: text })}
              placeholder="Enter target price"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            {/* Simulate Button */}
            <TouchableOpacity
              style={styles.simulateButton}
              onPress={handleSimulate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.simulateButtonText}>Simulate Hedge</Text>
              )}
            </TouchableOpacity>

            {/* Simulation Results */}
            {simulation && (
              <View style={styles.resultsCard}>
                <Text style={styles.resultsTitle}>Simulation Results</Text>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Current Price</Text>
                  <Text style={styles.resultValue}>₹{simulation.currentPrice}</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Projected Price</Text>
                  <Text style={[styles.resultValue, { color: '#16a34a' }]}>
                    ₹{simulation.projectedPrice}
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Hedge Quantity</Text>
                  <Text style={styles.resultValue}>
                    {Math.floor(parseFloat(formData.quantity) * (parseInt(formData.percentage) / 100))} quintals
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Potential Gain</Text>
                  <Text style={[styles.resultValue, { color: '#16a34a', fontWeight: 'bold' }]}>
                    +₹{Math.round(simulation.potentialGain).toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Risk Reduction</Text>
                  <Text style={styles.resultValue}>{simulation.riskReduction}%</Text>
                </View>

                {/* Recommended Contracts */}
                <View style={styles.contractsSection}>
                  <Text style={styles.contractsTitle}>Recommended Contracts</Text>
                  {simulation.recommendedContracts.map((contract, index) => (
                    <View key={index} style={styles.contractCard}>
                      <View style={styles.contractHeader}>
                        <Text style={styles.contractType}>{contract.type}</Text>
                        <Text style={styles.contractPrice}>₹{contract.price}</Text>
                      </View>
                      <Text style={styles.contractName}>{contract.contract}</Text>
                      <Text style={styles.contractQuantity}>
                        Quantity: {contract.quantity} quintals
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Timeline */}
                <View style={styles.timelineCard}>
                  <Ionicons name="time" size={20} color="#f59e0b" />
                  <View style={styles.timelineText}>
                    <Text style={styles.timelineLabel}>Optimal Window</Text>
                    <Text style={styles.timelineValue}>{simulation.timeline.optimal}</Text>
                  </View>
                </View>

                {/* Execute Button */}
                <TouchableOpacity
                  style={styles.executeButton}
                  onPress={handleExecute}
                >
                  <Text style={styles.executeButtonText}>Execute Hedge Strategy</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cropButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  cropButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  cropButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  percentageGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  percentageButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  percentageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  percentageButtonTextActive: {
    color: '#fff',
  },
  simulateButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  simulateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultsCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#166534',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  contractsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#86efac',
  },
  contractsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 12,
  },
  contractCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contractType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  contractPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  contractName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  contractQuantity: {
    fontSize: 12,
    color: '#9ca3af',
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  timelineText: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  executeButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  executeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
