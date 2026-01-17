import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OILSEEDS = [
  { id: 'soybean', name: 'Soybean', icon: '🌱' },
  { id: 'rapeseed', name: 'Rapeseed', icon: '🌾' },
  { id: 'mustard', name: 'Mustard', icon: '🌼' },
  { id: 'sunflower', name: 'Sunflower', icon: '🌻' },
  { id: 'groundnut', name: 'Groundnut', icon: '🥜' },
  { id: 'castor', name: 'Castor', icon: '🌿' },
];

export default function OilseedSelector({ selected, onSelect }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {OILSEEDS.map((oilseed) => (
        <TouchableOpacity
          key={oilseed.id}
          style={[
            styles.chip,
            selected === oilseed.id && styles.chipSelected
          ]}
          onPress={() => onSelect(oilseed.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{oilseed.icon}</Text>
          <Text style={[
            styles.chipText,
            selected === oilseed.id && styles.chipTextSelected
          ]}>
            {oilseed.name}
          </Text>
          {selected === oilseed.id && (
            <Ionicons name="checkmark-circle" size={16} color="#2d5f3f" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  content: {
    paddingHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#d1fae5',
    borderColor: '#2d5f3f',
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginRight: 6,
  },
  chipTextSelected: {
    color: '#2d5f3f',
  },
});
