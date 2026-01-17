import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable toggle component for switching between Basic and Pro chart views
 * Can be used in other parts of the app for consistent UX
 */
export default function ChartViewToggle({ isProView, onToggle, style }) {
  return (
    <TouchableOpacity 
      onPress={onToggle} 
      style={[styles.toggleButton, isProView && styles.toggleButtonActive, style]}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isProView ? "bar-chart" : "analytics"} 
        size={20} 
        color={isProView ? "#fff" : "#16a34a"} 
      />
      <Text style={[styles.toggleButtonText, isProView && styles.toggleButtonTextActive]}>
        {isProView ? "Basic View" : "Pro View"}
      </Text>
      <View style={[styles.badge, isProView && styles.badgeActive]}>
        <Ionicons 
          name={isProView ? "arrow-back" : "star"} 
          size={10} 
          color={isProView ? "#16a34a" : "#f59e0b"} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  toggleButtonActive: {
    backgroundColor: '#16a34a',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
});
