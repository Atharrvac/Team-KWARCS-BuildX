import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SatelliteMapModal({ visible, onClose, districts }) {
  const [selectedLayer, setSelectedLayer] = useState('satellite');
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const layers = [
    { id: 'satellite', name: 'Satellite', icon: 'globe' },
    { id: 'ndvi', name: 'NDVI', icon: 'leaf' },
    { id: 'rainfall', name: 'Rainfall', icon: 'rainy' },
    { id: 'temperature', name: 'Temperature', icon: 'thermometer' },
  ];

  const getLayerDescription = () => {
    switch (selectedLayer) {
      case 'satellite':
        return 'High-resolution satellite imagery showing current ground conditions';
      case 'ndvi':
        return 'Normalized Difference Vegetation Index - Crop health indicator';
      case 'rainfall':
        return 'Rainfall distribution and intensity across regions';
      case 'temperature':
        return 'Temperature variations affecting crop growth';
      default:
        return '';
    }
  };

  const getLayerColor = () => {
    switch (selectedLayer) {
      case 'satellite': return '#3b82f6';
      case 'ndvi': return '#16a34a';
      case 'rainfall': return '#06b6d4';
      case 'temperature': return '#ef4444';
      default: return '#6b7280';
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
            <Text style={styles.headerTitle}>Satellite Intelligence</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Layer Selector */}
          <View style={styles.layerSelector}>
            {layers.map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  selectedLayer === layer.id && styles.layerButtonActive,
                  selectedLayer === layer.id && { borderColor: getLayerColor() }
                ]}
                onPress={() => setSelectedLayer(layer.id)}
              >
                <Ionicons 
                  name={layer.icon} 
                  size={20} 
                  color={selectedLayer === layer.id ? getLayerColor() : '#6b7280'} 
                />
                <Text style={[
                  styles.layerButtonText,
                  selectedLayer === layer.id && styles.layerButtonTextActive,
                  selectedLayer === layer.id && { color: getLayerColor() }
                ]}>
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Layer Description */}
            <View style={[styles.descriptionCard, { borderColor: getLayerColor() }]}>
              <Ionicons name="information-circle" size={20} color={getLayerColor()} />
              <Text style={styles.descriptionText}>{getLayerDescription()}</Text>
            </View>

            {/* Satellite Map View */}
            <View style={styles.mapContainer}>
              <View style={[styles.mapView, { borderColor: getLayerColor() }]}>
                {/* Simulated Satellite Imagery */}
                <View style={styles.satelliteOverlay}>
                  <Ionicons name="globe" size={64} color={getLayerColor()} />
                  <Text style={styles.mapTitle}>{selectedLayer.toUpperCase()} View</Text>
                  <Text style={styles.mapSubtitle}>Central India - Oilseed Belt</Text>
                  
                  {/* District Markers */}
                  <View style={styles.markersContainer}>
                    {districts?.map((district, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.districtMarker,
                          { 
                            backgroundColor: district.score >= 71 ? '#ef4444' : 
                                           district.score >= 41 ? '#f59e0b' : '#16a34a',
                            top: `${20 + index * 25}%`,
                            left: `${30 + index * 15}%`,
                          }
                        ]}
                        onPress={() => setSelectedDistrict(district)}
                      >
                        <Text style={styles.markerText}>{district.score}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Layer-specific overlays */}
                {selectedLayer === 'ndvi' && (
                  <View style={styles.ndviOverlay}>
                    <View style={styles.ndviGradient}>
                      <View style={[styles.ndviZone, { backgroundColor: '#16a34a', opacity: 0.3 }]} />
                      <View style={[styles.ndviZone, { backgroundColor: '#f59e0b', opacity: 0.2 }]} />
                      <View style={[styles.ndviZone, { backgroundColor: '#ef4444', opacity: 0.1 }]} />
                    </View>
                  </View>
                )}

                {selectedLayer === 'rainfall' && (
                  <View style={styles.rainfallOverlay}>
                    <View style={styles.rainfallPattern}>
                      {[...Array(5)].map((_, i) => (
                        <View 
                          key={i} 
                          style={[
                            styles.rainfallZone, 
                            { 
                              backgroundColor: '#06b6d4', 
                              opacity: 0.1 + (i * 0.1),
                              top: `${i * 20}%`
                            }
                          ]} 
                        />
                      ))}
                    </View>
                  </View>
                )}

                {selectedLayer === 'temperature' && (
                  <View style={styles.temperatureOverlay}>
                    <View style={styles.temperatureGradient}>
                      <View style={[styles.tempZone, { backgroundColor: '#ef4444', opacity: 0.3 }]} />
                      <View style={[styles.tempZone, { backgroundColor: '#f59e0b', opacity: 0.2 }]} />
                      <View style={[styles.tempZone, { backgroundColor: '#3b82f6', opacity: 0.1 }]} />
                    </View>
                  </View>
                )}
              </View>

              {/* Map Controls */}
              <View style={styles.mapControls}>
                <TouchableOpacity style={styles.controlButton}>
                  <Ionicons name="add" size={20} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton}>
                  <Ionicons name="remove" size={20} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton}>
                  <Ionicons name="locate" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected District Info */}
            {selectedDistrict && (
              <View style={styles.districtInfo}>
                <View style={styles.districtHeader}>
                  <Text style={styles.districtName}>{selectedDistrict.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedDistrict(null)}>
                    <Ionicons name="close-circle" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.districtStats}>
                  <View style={styles.districtStat}>
                    <Text style={styles.statLabel}>AgriVol Score</Text>
                    <Text style={[
                      styles.statValue,
                      { color: selectedDistrict.score >= 71 ? '#ef4444' : 
                               selectedDistrict.score >= 41 ? '#f59e0b' : '#16a34a' }
                    ]}>
                      {selectedDistrict.score}
                    </Text>
                  </View>
                  <View style={styles.districtStat}>
                    <Text style={styles.statLabel}>Volatility</Text>
                    <Text style={styles.statValue}>{selectedDistrict.volatility}</Text>
                  </View>
                  <View style={styles.districtStat}>
                    <Text style={styles.statLabel}>Action</Text>
                    <Text style={[
                      styles.statValue,
                      { color: selectedDistrict.recommendation === 'Hedge Now' ? '#ef4444' : 
                               selectedDistrict.recommendation === 'Watch' ? '#f59e0b' : '#16a34a' }
                    ]}>
                      {selectedDistrict.recommendation}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legendCard}>
              <Text style={styles.legendTitle}>Risk Zones</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
                  <Text style={styles.legendText}>Low Risk (0-40)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>Moderate (41-70)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>High Risk (71-100)</Text>
                </View>
              </View>
            </View>

            {/* Satellite Data Info */}
            <View style={styles.dataInfo}>
              <View style={styles.dataInfoRow}>
                <Ionicons name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dataInfoText}>
                  Last Updated: {new Date().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.dataInfoRow}>
                <Ionicons name="globe-outline" size={16} color="#6b7280" />
                <Text style={styles.dataInfoText}>Source: Sentinel-2 / Landsat-8</Text>
              </View>
              <View style={styles.dataInfoRow}>
                <Ionicons name="resize" size={16} color="#6b7280" />
                <Text style={styles.dataInfoText}>Resolution: 10m per pixel</Text>
              </View>
            </View>
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
    maxHeight: '95%',
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
  layerSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  layerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  layerButtonActive: {
    backgroundColor: '#f9fafb',
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  layerButtonTextActive: {
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  mapContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  mapView: {
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    borderWidth: 2,
  },
  satelliteOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  mapSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  markersContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  districtMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  ndviOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  ndviGradient: {
    flex: 1,
  },
  ndviZone: {
    flex: 1,
  },
  rainfallOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  rainfallPattern: {
    flex: 1,
  },
  rainfallZone: {
    position: 'absolute',
    width: '100%',
    height: '20%',
  },
  temperatureOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  temperatureGradient: {
    flex: 1,
  },
  tempZone: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  districtInfo: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  districtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  districtName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  districtStats: {
    flexDirection: 'row',
    gap: 12,
  },
  districtStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  legendCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
  },
  dataInfo: {
    gap: 8,
  },
  dataInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
