import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNotifications } from '../contexts/NotificationContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

export default function AddContractModal({ visible, onClose, onContractAdded }) {
  const { addNotification } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    crop: 'soybean',
    quantity: '',
    lockedPrice: '',
    expiryDays: '60',
  });

  const crops = [
    { value: 'soybean', label: 'Soybean', icon: '🌱' },
    { value: 'mustard', label: 'Mustard', icon: '🌼' },
    { value: 'groundnut', label: 'Groundnut', icon: '🥜' },
    { value: 'sunflower', label: 'Sunflower', icon: '🌻' },
    { value: 'castor', label: 'Castor', icon: '🌿' },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.quantity || !formData.lockedPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    if (parseFloat(formData.lockedPrice) <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(formData.expiryDays));

      const response = await axios.post(`${API_URL}/contracts/create`, {
        userId: 1, // Demo user
        crop: formData.crop,
        quantity: parseFloat(formData.quantity),
        lockedPrice: parseFloat(formData.lockedPrice),
        expiryDate: expiryDate.toISOString(),
      });

      // Add notification
      addNotification({
        type: 'contract',
        title: '📄 Contract Created',
        message: `New ${formData.crop} contract for ${formData.quantity} qt at ₹${formData.lockedPrice}/qt`,
        showAlert: false,
      });
      
      Alert.alert('Success', 'Contract created successfully');
      
      // Reset form
      setFormData({
        crop: 'soybean',
        quantity: '',
        lockedPrice: '',
        expiryDays: '60',
      });
      
      onContractAdded();
      onClose();
    } catch (error) {
      console.error('Error creating contract:', error);
      Alert.alert('Error', 'Failed to create contract. Please try again.');
    } finally {
      setSaving(false);
    }
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
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Add New Contract</Text>
              <Text style={styles.headerSubtitle}>Create a new hedging contract</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Crop Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Crop *</Text>
              <View style={styles.cropGrid}>
                {crops.map((crop) => (
                  <TouchableOpacity
                    key={crop.value}
                    style={[
                      styles.cropCard,
                      formData.crop === crop.value && styles.cropCardActive
                    ]}
                    onPress={() => setFormData({ ...formData, crop: crop.value })}
                  >
                    <Text style={styles.cropIcon}>{crop.icon}</Text>
                    <Text style={[
                      styles.cropLabel,
                      formData.crop === crop.value && styles.cropLabelActive
                    ]}>
                      {crop.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity (Quintals) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="scale-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="Enter quantity"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.inputUnit}>q</Text>
              </View>
            </View>

            {/* Locked Price */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Locked Price (per Quintal) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={formData.lockedPrice}
                  onChangeText={(text) => setFormData({ ...formData, lockedPrice: text })}
                  placeholder="Enter price"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.inputUnit}>₹</Text>
              </View>
              <Text style={styles.helperText}>
                This is the price you want to lock in for your crop
              </Text>
            </View>

            {/* Expiry Period */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contract Duration</Text>
              <View style={styles.durationOptions}>
                {['30', '60', '90', '120'].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.durationOption,
                      formData.expiryDays === days && styles.durationOptionActive
                    ]}
                    onPress={() => setFormData({ ...formData, expiryDays: days })}
                  >
                    <Text style={[
                      styles.durationText,
                      formData.expiryDays === days && styles.durationTextActive
                    ]}>
                      {days} days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary */}
            {formData.quantity && formData.lockedPrice && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Contract Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Value</Text>
                  <Text style={styles.summaryValue}>
                    ₹{(parseFloat(formData.quantity) * parseFloat(formData.lockedPrice)).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Expiry Date</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(Date.now() + parseInt(formData.expiryDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                This contract will help you hedge against price fluctuations. You can settle it anytime before expiry.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Contract</Text>
              )}
            </TouchableOpacity>
          </View>
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
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cropCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  cropCardActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  cropIcon: {
    fontSize: 32,
  },
  cropLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  cropLabelActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  durationOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  durationTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#166534',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
