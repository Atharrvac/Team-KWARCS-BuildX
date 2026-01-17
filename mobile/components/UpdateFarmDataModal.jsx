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

export default function UpdateFarmDataModal({ visible, onClose }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    farmSize: '',
    cropType: 'soybean',
    sowingDate: '',
    expectedHarvest: '',
    location: '',
    soilType: 'loamy',
  });

  const crops = ['soybean', 'mustard', 'groundnut', 'sunflower', 'castor'];
  const soilTypes = ['loamy', 'clay', 'sandy', 'black'];

  const handleSave = async () => {
    if (!formData.farmSize || !formData.location) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Farm data updated successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update farm data');
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Update Farm Data</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Farm Size (Acres) *</Text>
            <TextInput
              style={styles.input}
              value={formData.farmSize}
              onChangeText={(text) => setFormData({ ...formData, farmSize: text })}
              placeholder="Enter farm size"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Primary Crop *</Text>
            <View style={styles.cropGrid}>
              {crops.map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[
                    styles.cropButton,
                    formData.cropType === crop && styles.cropButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, cropType: crop })}
                >
                  <Text style={[
                    styles.cropButtonText,
                    formData.cropType === crop && styles.cropButtonTextActive
                  ]}>
                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Enter location (e.g., Indore, MP)"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Sowing Date</Text>
            <TextInput
              style={styles.input}
              value={formData.sowingDate}
              onChangeText={(text) => setFormData({ ...formData, sowingDate: text })}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Expected Harvest Date</Text>
            <TextInput
              style={styles.input}
              value={formData.expectedHarvest}
              onChangeText={(text) => setFormData({ ...formData, expectedHarvest: text })}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Soil Type</Text>
            <View style={styles.soilGrid}>
              {soilTypes.map((soil) => (
                <TouchableOpacity
                  key={soil}
                  style={[
                    styles.soilButton,
                    formData.soilType === soil && styles.soilButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, soilType: soil })}
                >
                  <Text style={[
                    styles.soilButtonText,
                    formData.soilType === soil && styles.soilButtonTextActive
                  ]}>
                    {soil.charAt(0).toUpperCase() + soil.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Accurate farm data helps us provide better recommendations and risk analysis.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropButton: {
    flex: 1,
    minWidth: '30%',
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
  soilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  soilButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  soilButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  soilButtonTextActive: {
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
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
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
