import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AutoHedgeEnrollScreen() {
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState('soybean');
  const [totalAcres, setTotalAcres] = useState('100');
  const [enrollPercent, setEnrollPercent] = useState(60);
  const [elevator, setElevator] = useState('');

  const handleEnroll = () => {
    Alert.alert(
      'Enrollment Successful!',
      `You've enrolled ${enrollPercent}% of your ${cropType} crop (${totalAcres} acres) in AutoHedge. Our team will contact you to confirm details.`,
      [
        {
          text: 'Got it',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Enroll in AutoHedge</Text>
          <Text style={styles.headerSubtitle}>Set it and forget it grain marketing</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
            <Text style={[styles.progressStepNumber, step >= 1 && styles.progressStepNumberActive]}>1</Text>
            <Text style={styles.progressStepLabel}>Crop Info</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
            <Text style={[styles.progressStepNumber, step >= 2 && styles.progressStepNumberActive]}>2</Text>
            <Text style={styles.progressStepLabel}>Enrollment</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]}>
            <Text style={[styles.progressStepNumber, step >= 3 && styles.progressStepNumberActive]}>3</Text>
            <Text style={styles.progressStepLabel}>Confirm</Text>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>✨ AutoHedge Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.benefitText}>Automatic daily pricing at market close</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.benefitText}>No margin calls or brokerage accounts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.benefitText}>Historically +₹0.25/qt vs harvest average</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <Text style={styles.benefitText}>Optional Boost feature for market rallies</Text>
            </View>
          </View>
        </View>

        {/* Step 1: Crop Information */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 1: Crop Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Crop Type</Text>
              <View style={styles.cropButtons}>
                <TouchableOpacity
                  style={[styles.cropButton, cropType === 'soybean' && styles.cropButtonActive]}
                  onPress={() => setCropType('soybean')}
                >
                  <Text style={[styles.cropButtonText, cropType === 'soybean' && styles.cropButtonTextActive]}>
                    Soybean
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cropButton, cropType === 'mustard' && styles.cropButtonActive]}
                  onPress={() => setCropType('mustard')}
                >
                  <Text style={[styles.cropButtonText, cropType === 'mustard' && styles.cropButtonTextActive]}>
                    Mustard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cropButton, cropType === 'groundnut' && styles.cropButtonActive]}
                  onPress={() => setCropType('groundnut')}
                >
                  <Text style={[styles.cropButtonText, cropType === 'groundnut' && styles.cropButtonTextActive]}>
                    Groundnut
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Acres</Text>
              <TextInput
                style={styles.input}
                value={totalAcres}
                onChangeText={setTotalAcres}
                keyboardType="numeric"
                placeholder="Enter total acres"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Elevator/Buyer</Text>
              <TextInput
                style={styles.input}
                value={elevator}
                onChangeText={setElevator}
                placeholder="e.g., Shakti Oil Mill, Indore"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enrollment Percentage */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 2: Enrollment Percentage</Text>
            <Text style={styles.stepSubtitle}>
              What percentage of your crop would you like to enroll in AutoHedge?
            </Text>

            <View style={styles.percentageDisplay}>
              <Text style={styles.percentageValue}>{enrollPercent}%</Text>
              <Text style={styles.percentageSubtext}>
                {Math.round((enrollPercent / 100) * parseInt(totalAcres || 0))} of {totalAcres} acres
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${enrollPercent}%` }]} />
              </View>
              <View style={styles.sliderButtons}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setEnrollPercent(Math.max(0, enrollPercent - 10))}
                >
                  <Ionicons name="remove" size={20} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setEnrollPercent(Math.min(100, enrollPercent + 10))}
                >
                  <Ionicons name="add" size={20} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quickSelectButtons}>
              {[25, 50, 75, 100].map((percent) => (
                <TouchableOpacity
                  key={percent}
                  style={[styles.quickSelectButton, enrollPercent === percent && styles.quickSelectButtonActive]}
                  onPress={() => setEnrollPercent(percent)}
                >
                  <Text style={[styles.quickSelectText, enrollPercent === percent && styles.quickSelectTextActive]}>
                    {percent}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#16a34a" />
              <Text style={styles.infoText}>
                We recommend enrolling 50-75% of your crop to balance risk and opportunity.
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButtonStep} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={20} color="#374151" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Step 3: Confirm Enrollment</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Crop Type</Text>
                <Text style={styles.summaryValue}>{cropType.charAt(0).toUpperCase() + cropType.slice(1)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Acres</Text>
                <Text style={styles.summaryValue}>{totalAcres} acres</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Enrolled</Text>
                <Text style={styles.summaryValue}>
                  {enrollPercent}% ({Math.round((enrollPercent / 100) * parseInt(totalAcres || 0))} acres)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Elevator</Text>
                <Text style={styles.summaryValue}>{elevator || 'To be confirmed'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pricing Window</Text>
                <Text style={styles.summaryValue}>Feb 28 - Jul 31</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee</Text>
                <Text style={styles.summaryValue}>
                  {cropType === 'soybean' ? '₹0.05' : '₹0.07'}/quintal
                </Text>
              </View>
            </View>

            <View style={styles.termsBox}>
              <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
              <View style={styles.termsContent}>
                <Text style={styles.termsTitle}>What happens next?</Text>
                <Text style={styles.termsText}>
                  1. Our team will contact you within 24 hours{'\n'}
                  2. We'll confirm your enrollment details{'\n'}
                  3. AutoHedge starts pricing your bushels daily{'\n'}
                  4. Track your progress in the app anytime
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButtonStep} onPress={() => setStep(2)}>
                <Ionicons name="arrow-back" size={20} color="#374151" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.enrollButton} onPress={handleEnroll}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.enrollButtonText}>Enroll Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16 },
  backButton: { marginBottom: 16 },
  headerContent: {},
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#dcfce7', marginTop: 4 },
  content: { flex: 1 },
  
  progressSteps: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  progressStep: { alignItems: 'center' },
  progressStepActive: {},
  progressStepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', color: '#9ca3af', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 32, marginBottom: 4 },
  progressStepNumberActive: { backgroundColor: '#16a34a', color: '#fff' },
  progressStepLabel: { fontSize: 11, color: '#6b7280' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  
  benefitsCard: { backgroundColor: '#f0fdf4', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  benefitsTitle: { fontSize: 16, fontWeight: '600', color: '#166534', marginBottom: 12 },
  benefitsList: { gap: 8 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { flex: 1, fontSize: 13, color: '#166534' },
  
  stepCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12 },
  stepTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  stepSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 14 },
  cropButtons: { flexDirection: 'row', gap: 8 },
  cropButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cropButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  cropButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  cropButtonTextActive: { color: '#fff' },
  
  percentageDisplay: { alignItems: 'center', marginBottom: 24 },
  percentageValue: { fontSize: 48, fontWeight: 'bold', color: '#16a34a' },
  percentageSubtext: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  
  sliderContainer: { marginBottom: 16 },
  sliderTrack: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  sliderFill: { height: '100%', backgroundColor: '#16a34a' },
  sliderButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  
  quickSelectButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickSelectButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  quickSelectButtonActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  quickSelectText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  quickSelectTextActive: { color: '#fff' },
  
  infoBox: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, gap: 8, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 16 },
  
  summaryCard: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  
  termsBox: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 16, borderRadius: 8, gap: 12, marginBottom: 20 },
  termsContent: { flex: 1 },
  termsTitle: { fontSize: 14, fontWeight: '600', color: '#166534', marginBottom: 8 },
  termsText: { fontSize: 12, color: '#166534', lineHeight: 18 },
  
  buttonRow: { flexDirection: 'row', gap: 8 },
  backButtonStep: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 8, gap: 6 },
  nextButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  enrollButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 8, gap: 6 },
  enrollButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
