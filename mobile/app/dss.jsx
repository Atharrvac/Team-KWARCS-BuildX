import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import SimulateHedgeModal from '../components/SimulateHedgeModal';
import WeatherMapModal from '../components/WeatherMapModal';
import UpdateFarmDataModal from '../components/UpdateFarmDataModal';
import DSSReportModal from '../components/DSSReportModal';
import SatelliteMapModal from '../components/SatelliteMapModal';
import DSSInfoModal from '../components/DSSInfoModal';
import LiveWeatherCard from '../components/LiveWeatherCard';
import { PremiumLock, PremiumUpgradeModal } from '../components/PremiumFeatureGate';
import useSubscription from '../hooks/useSubscription';
import dssService from '../services/dssService';

const SCREEN_WIDTH = Dimensions.get('window').width;

// District coordinates for map markers - Extended list with villages
const DISTRICT_COORDS = {
  'Indore': { lat: 22.7196, lon: 75.8577, state: 'MP', type: 'district' },
  'Jaipur': { lat: 26.9124, lon: 75.7873, state: 'RJ', type: 'district' },
  'Latur': { lat: 18.4088, lon: 76.5604, state: 'MH', type: 'district' },
  'Nagpur': { lat: 21.1458, lon: 79.0882, state: 'MH', type: 'district' },
  'Akola': { lat: 20.7002, lon: 77.0082, state: 'MH', type: 'district' },
  'Kota': { lat: 25.2138, lon: 75.8648, state: 'RJ', type: 'district' },
  'Ujjain': { lat: 23.1765, lon: 75.7885, state: 'MP', type: 'district' },
  'Dewas': { lat: 22.9676, lon: 76.0534, state: 'MP', type: 'district' },
  'Rajkot': { lat: 22.3039, lon: 70.8022, state: 'GJ', type: 'district' },
  'Junagadh': { lat: 21.5222, lon: 70.4579, state: 'GJ', type: 'district' },
  // Additional villages/towns
  'Mhow': { lat: 22.5500, lon: 75.7600, state: 'MP', type: 'village', parent: 'Indore' },
  'Sanwer': { lat: 22.9700, lon: 75.8300, state: 'MP', type: 'village', parent: 'Indore' },
  'Depalpur': { lat: 22.8500, lon: 75.5400, state: 'MP', type: 'village', parent: 'Indore' },
  'Mandsaur': { lat: 24.0667, lon: 75.0700, state: 'MP', type: 'village', parent: 'Ujjain' },
  'Ratlam': { lat: 23.3300, lon: 75.0400, state: 'MP', type: 'village', parent: 'Ujjain' },
  'Neemuch': { lat: 24.4700, lon: 74.8700, state: 'MP', type: 'village', parent: 'Ujjain' },
  'Shajapur': { lat: 23.4300, lon: 76.2700, state: 'MP', type: 'village', parent: 'Dewas' },
  'Sehore': { lat: 23.2000, lon: 77.0800, state: 'MP', type: 'village', parent: 'Dewas' },
  'Wardha': { lat: 20.7500, lon: 78.6000, state: 'MH', type: 'village', parent: 'Nagpur' },
  'Amravati': { lat: 20.9300, lon: 77.7500, state: 'MH', type: 'village', parent: 'Akola' },
  'Yavatmal': { lat: 20.4000, lon: 78.1200, state: 'MH', type: 'village', parent: 'Akola' },
  'Osmanabad': { lat: 18.1800, lon: 76.0400, state: 'MH', type: 'village', parent: 'Latur' },
  'Beed': { lat: 18.9900, lon: 75.7600, state: 'MH', type: 'village', parent: 'Latur' },
  'Tonk': { lat: 26.1700, lon: 75.7900, state: 'RJ', type: 'village', parent: 'Jaipur' },
  'Dausa': { lat: 26.8800, lon: 76.3400, state: 'RJ', type: 'village', parent: 'Jaipur' },
  'Bundi': { lat: 25.4400, lon: 75.6400, state: 'RJ', type: 'village', parent: 'Kota' },
  'Jhalawar': { lat: 24.5900, lon: 76.1600, state: 'RJ', type: 'village', parent: 'Kota' },
  'Morbi': { lat: 22.8200, lon: 70.8400, state: 'GJ', type: 'village', parent: 'Rajkot' },
  'Gondal': { lat: 21.9600, lon: 70.8000, state: 'GJ', type: 'village', parent: 'Rajkot' },
  'Veraval': { lat: 20.9000, lon: 70.3700, state: 'GJ', type: 'village', parent: 'Junagadh' },
  'Porbandar': { lat: 21.6400, lon: 69.6000, state: 'GJ', type: 'village', parent: 'Junagadh' },
};

// Get all searchable locations
const ALL_LOCATIONS = Object.keys(DISTRICT_COORDS);

// Available crops for selection
const CROPS = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन', icon: '🫘' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों', icon: '🌻' },
  { id: 'groundnut', name: 'Groundnut', nameHi: 'मूंगफली', icon: '🥜' },
  { id: 'sunflower', name: 'Sunflower', nameHi: 'सूरजमुखी', icon: '🌻' },
];

export default function DSSScreen() {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';
  const mapRef = useRef(null);
  const { isPro, canUseFeature } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dssData, setDssData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('Indore');
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [mapType, setMapType] = useState('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [zoomedDistrict, setZoomedDistrict] = useState(null);
  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  const [updateFarmModalVisible, setUpdateFarmModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [satelliteModalVisible, setSatelliteModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadDSSData();
  }, [selectedDistrict, selectedCrop]);

  // Search functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      const filtered = ALL_LOCATIONS.filter(loc => 
        loc.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 6));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Select location from search and zoom to it
  const selectSearchLocation = (location) => {
    const coords = DISTRICT_COORDS[location];
    if (coords && mapRef.current) {
      // Zoom to the selected location
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lon,
        latitudeDelta: coords.type === 'village' ? 0.5 : 1.5,
        longitudeDelta: coords.type === 'village' ? 0.5 : 1.5,
      }, 1000);
      
      setZoomedDistrict(location);
      setSearchQuery(location);
      setShowSearchResults(false);
      Keyboard.dismiss();
      
      // If it's a main district, update selected district
      if (coords.type === 'district') {
        setSelectedDistrict(location);
      } else if (coords.parent) {
        setSelectedDistrict(coords.parent);
      }
    }
  };

  // Zoom to district when marker is pressed
  const zoomToDistrict = (district) => {
    const coords = DISTRICT_COORDS[district.name];
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lon,
        latitudeDelta: 1.0,
        longitudeDelta: 1.0,
      }, 800);
      setZoomedDistrict(district.name);
      setSelectedDistrict(district.name);
    }
  };

  // Reset map view
  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: 22.5,
        longitude: 75.5,
        latitudeDelta: 8,
        longitudeDelta: 8,
      }, 800);
      setZoomedDistrict(null);
    }
  };

  const loadDSSData = async () => {
    try {
      setLoading(true);
      console.log('Loading DSS data for:', selectedDistrict, selectedCrop);
      const analysis = await dssService.getFullAnalysis(selectedDistrict, selectedCrop);
      console.log('DSS Analysis loaded:', analysis.holxScore);
      setDssData(analysis);
    } catch (error) {
      console.error('Error loading DSS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDSSData();
    setRefreshing(false);
  };

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
  };

  if (loading && !dssData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>
          {isHindi ? 'DSS लोड हो रहा है...' : 'Loading Decision Support System...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {isHindi ? 'मौसम और बाजार डेटा प्राप्त कर रहे हैं' : 'Fetching weather and market data'}
        </Text>
      </View>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 70) return '#ef4444';
    if (score >= 50) return '#f59e0b';
    return '#16a34a';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return isHindi ? 'उच्च हेजिंग अवसर' : 'High Hedging Opportunity';
    if (score >= 50) return isHindi ? 'मध्यम अवसर' : 'Moderate Opportunity';
    return isHindi ? 'कम जोखिम - होल्ड करें' : 'Low Risk - Hold';
  };

  const getVolatilityColor = (volatility) => {
    if (volatility === 'High') return '#ef4444';
    if (volatility === 'Moderate') return '#f59e0b';
    return '#16a34a';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isHindi ? 'निर्णय सहायता प्रणाली' : 'Decision Support System'}
        </Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setInfoModalVisible(true)}
        >
          <Ionicons name="information-circle-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
        }
      >
        {/* Crop Selector */}
        <View style={styles.cropSelector}>
          <Text style={styles.cropSelectorLabel}>
            {isHindi ? 'फसल चुनें:' : 'Select Crop:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cropChips}>
              {CROPS.map(crop => (
                <TouchableOpacity
                  key={crop.id}
                  style={[styles.cropChip, selectedCrop === crop.id && styles.cropChipActive]}
                  onPress={() => setSelectedCrop(crop.id)}
                >
                  <Text style={styles.cropChipIcon}>{crop.icon}</Text>
                  <Text style={[styles.cropChipText, selectedCrop === crop.id && styles.cropChipTextActive]}>
                    {isHindi ? crop.nameHi : crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* HOLX Score Card - Now with REAL data */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="analytics" size={24} color="#111827" />
            <Text style={styles.scoreTitle}>HOLX™ - Sentiment Fusion Engine</Text>
            {dssData?.metadata?.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          
          <View style={styles.scoreCircleContainer}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(dssData?.holxScore || 50) }]}>
              <Text style={[styles.scoreValue, { color: getScoreColor(dssData?.holxScore || 50) }]}>
                {dssData?.holxScore || 50}
              </Text>
              <Text style={styles.scoreLabelText}>HOLX™</Text>
            </View>
            <Text style={[styles.scoreStatus, { color: getScoreColor(dssData?.holxScore || 50) }]}>
              {getScoreLabel(dssData?.holxScore || 50)}
            </Text>
            {dssData?.holxTrend && (
              <View style={styles.trendBadge}>
                <Ionicons 
                  name={dssData.holxTrend === 'rising' ? 'trending-up' : dssData.holxTrend === 'falling' ? 'trending-down' : 'remove'} 
                  size={14} 
                  color={dssData.holxTrend === 'rising' ? '#16a34a' : dssData.holxTrend === 'falling' ? '#ef4444' : '#64748b'} 
                />
                <Text style={styles.trendText}>
                  {dssData.holxTrend === 'rising' ? 'Rising' : dssData.holxTrend === 'falling' ? 'Falling' : 'Stable'}
                </Text>
              </View>
            )}
          </View>

          {/* Score Breakdown - Premium Feature */}
          {dssData?.holxBreakdown && (
            <PremiumLock 
              feature="advanced_dss" 
              isPro={isPro} 
              onUpgrade={() => setShowUpgradeModal(true)}
            >
              <View style={styles.breakdownSection}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownTitle}>
                    {isHindi ? 'स्कोर विश्लेषण' : 'Score Breakdown'}
                  </Text>
                  {isPro && (
                    <View style={styles.proBadgeSmall}>
                      <Ionicons name="star" size={10} color="#16a34a" />
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownItem}>
                    <Ionicons name="cloud" size={16} color="#3b82f6" />
                    <Text style={styles.breakdownLabel}>{isHindi ? 'मौसम' : 'Weather'}</Text>
                    <Text style={styles.breakdownValue}>{dssData.holxBreakdown.weather.score}</Text>
                    <View style={[styles.breakdownBar, { width: `${dssData.holxBreakdown.weather.score}%`, backgroundColor: '#3b82f6' }]} />
                  </View>
                  <View style={styles.breakdownItem}>
                    <Ionicons name="trending-up" size={16} color="#16a34a" />
                    <Text style={styles.breakdownLabel}>{isHindi ? 'बाजार' : 'Market'}</Text>
                    <Text style={styles.breakdownValue}>{dssData.holxBreakdown.market.score}</Text>
                    <View style={[styles.breakdownBar, { width: `${dssData.holxBreakdown.market.score}%`, backgroundColor: '#16a34a' }]} />
                  </View>
                  <View style={styles.breakdownItem}>
                    <Ionicons name="people" size={16} color="#8b5cf6" />
                    <Text style={styles.breakdownLabel}>{isHindi ? 'भावना' : 'Sentiment'}</Text>
                    <Text style={styles.breakdownValue}>{dssData.holxBreakdown.sentiment.score}</Text>
                    <View style={[styles.breakdownBar, { width: `${dssData.holxBreakdown.sentiment.score}%`, backgroundColor: '#8b5cf6' }]} />
                  </View>
                  <View style={styles.breakdownItem}>
                    <Ionicons name="document-text" size={16} color="#f59e0b" />
                    <Text style={styles.breakdownLabel}>{isHindi ? 'नीति' : 'Policy'}</Text>
                    <Text style={styles.breakdownValue}>{dssData.holxBreakdown.policy.score}</Text>
                    <View style={[styles.breakdownBar, { width: `${dssData.holxBreakdown.policy.score}%`, backgroundColor: '#f59e0b' }]} />
                  </View>
                </View>
              </View>
            </PremiumLock>
          )}

          {/* Real Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{isHindi ? 'मूल्य रुझान' : 'Price Trend'}</Text>
              <Text style={[styles.metricValue, { color: (dssData?.market?.priceChange7d || 0) >= 0 ? '#16a34a' : '#ef4444' }]}>
                {(dssData?.market?.priceChange7d || 0) >= 0 ? '+' : ''}{dssData?.market?.priceChange7d?.toFixed(1) || '0.0'}%
              </Text>
              <Text style={styles.metricSubtext}>7-day</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{isHindi ? 'बाजार भावना' : 'Sentiment'}</Text>
              <Text style={[styles.metricValue, { color: dssData?.sentiment?.label?.includes('Bullish') ? '#16a34a' : dssData?.sentiment?.label?.includes('Bearish') ? '#ef4444' : '#64748b' }]}>
                {dssData?.sentiment?.label || 'Neutral'}
              </Text>
              <Text style={styles.metricSubtext}>{dssData?.market?.volatility || 'Moderate'}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>{isHindi ? 'नीति' : 'Policy'}</Text>
              <Text style={styles.metricValue}>{dssData?.policy?.label || 'Neutral'}</Text>
              <Text style={styles.metricSubtext}>{isHindi ? 'स्थिर' : 'Stable'}</Text>
            </View>
          </View>

          {/* AI Recommendation Text */}
          <Text style={styles.analysisText}>
            {dssData?.recommendation?.aiText || '"Analyzing market conditions..."'}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.simulateButton}
              onPress={() => setSimulateModalVisible(true)}
            >
              <Text style={styles.simulateButtonText}>
                {isHindi ? 'हेज सिमुलेट करें' : 'Simulate Hedge'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/contracts')}
            >
              <Ionicons name="compass-outline" size={18} color="#16a34a" />
              <Text style={styles.exploreButtonText}>
                {isHindi ? 'अनुबंध' : 'Contracts'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Weather Card */}
        <View style={styles.weatherCardWrapper}>
          <LiveWeatherCard 
            district={selectedDistrict}
            onDistrictChange={handleDistrictChange}
            showForecast={true}
          />
        </View>

        {/* Market Data Card */}
        {dssData?.market && (
          <View style={styles.marketCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={20} color="#16a34a" />
              <Text style={styles.cardTitle}>
                {isHindi ? 'बाजार डेटा' : 'Market Data'} - {CROPS.find(c => c.id === selectedCrop)?.name || 'Soybean'}
              </Text>
            </View>
            
            <View style={styles.marketGrid}>
              <View style={styles.marketItem}>
                <Text style={styles.marketLabel}>{isHindi ? 'वर्तमान मूल्य' : 'Current Price'}</Text>
                <Text style={styles.marketValue}>₹{dssData.market.currentPrice?.toLocaleString()}/q</Text>
              </View>
              <View style={styles.marketItem}>
                <Text style={styles.marketLabel}>{isHindi ? 'MSP मूल्य' : 'MSP Price'}</Text>
                <Text style={styles.marketValue}>₹{dssData.market.mspPrice?.toLocaleString()}/q</Text>
              </View>
              <View style={styles.marketItem}>
                <Text style={styles.marketLabel}>{isHindi ? 'फ्यूचर्स' : 'Futures'}</Text>
                <Text style={styles.marketValue}>₹{dssData.market.futuresPrice?.toLocaleString()}/q</Text>
              </View>
              <View style={styles.marketItem}>
                <Text style={styles.marketLabel}>{isHindi ? '30-दिन बदलाव' : '30-Day Change'}</Text>
                <Text style={[styles.marketValue, { color: (dssData.market.priceChange30d || 0) >= 0 ? '#16a34a' : '#ef4444' }]}>
                  {(dssData.market.priceChange30d || 0) >= 0 ? '+' : ''}{dssData.market.priceChange30d?.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sentiment Factors */}
        {dssData?.sentiment?.factors?.length > 0 && (
          <View style={styles.sentimentCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="pulse" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>
                {isHindi ? 'भावना कारक' : 'Sentiment Factors'}
              </Text>
            </View>
            <View style={styles.factorsList}>
              {dssData.sentiment.factors.map((factor, idx) => (
                <View key={idx} style={[styles.factorItem, { backgroundColor: factor.positive ? '#f0fdf4' : '#fef2f2' }]}>
                  <Ionicons 
                    name={factor.positive ? 'arrow-up-circle' : 'arrow-down-circle'} 
                    size={18} 
                    color={factor.positive ? '#16a34a' : '#ef4444'} 
                  />
                  <Text style={styles.factorText}>{factor.factor}</Text>
                  <Text style={[styles.factorImpact, { color: factor.positive ? '#16a34a' : '#ef4444' }]}>
                    {factor.impact}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AgriVol Index + Geo-Spatial Hedging Map - REAL SATELLITE MAP */}
        <View style={styles.mapCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="map" size={20} color="#16a34a" />
            <Text style={styles.cardTitle}>
              {isHindi ? 'AgriVol सूचकांक - जिला जोखिम मानचित्र' : 'AgriVol Index - District Risk Map'}
            </Text>
            {dssData?.districts?.[0]?.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={18} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={isHindi ? "जिला या गांव खोजें..." : "Search district or village..."}
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearch}
                onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <View style={styles.searchResultsDropdown}>
                {searchResults.map((location, idx) => {
                  const locData = DISTRICT_COORDS[location];
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.searchResultItem}
                      onPress={() => selectSearchLocation(location)}
                    >
                      <Ionicons 
                        name={locData?.type === 'district' ? 'location' : 'pin'} 
                        size={16} 
                        color={locData?.type === 'district' ? '#16a34a' : '#64748b'} 
                      />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName}>{location}</Text>
                        <Text style={styles.searchResultState}>
                          {locData?.state} • {locData?.type === 'district' ? 'District' : 'Village'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Map Type Selector */}
          <View style={styles.mapTypeSelector}>
            <TouchableOpacity 
              style={[styles.mapTypeBtn, mapType === 'standard' && styles.mapTypeBtnActive]}
              onPress={() => setMapType('standard')}
            >
              <Text style={[styles.mapTypeBtnText, mapType === 'standard' && styles.mapTypeBtnTextActive]}>
                {isHindi ? 'मानक' : 'Standard'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapTypeBtn, mapType === 'satellite' && styles.mapTypeBtnActive]}
              onPress={() => setMapType('satellite')}
            >
              <Text style={[styles.mapTypeBtnText, mapType === 'satellite' && styles.mapTypeBtnTextActive]}>
                {isHindi ? 'उपग्रह' : 'Satellite'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mapTypeBtn, mapType === 'hybrid' && styles.mapTypeBtnActive]}
              onPress={() => setMapType('hybrid')}
            >
              <Text style={[styles.mapTypeBtnText, mapType === 'hybrid' && styles.mapTypeBtnTextActive]}>
                {isHindi ? 'हाइब्रिड' : 'Hybrid'}
              </Text>
            </TouchableOpacity>
            
            {/* Reset View Button */}
            {zoomedDistrict && (
              <TouchableOpacity 
                style={styles.resetViewBtn}
                onPress={resetMapView}
              >
                <Ionicons name="contract" size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Real Satellite Map with District Markers */}
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              mapType={mapType}
              initialRegion={{
                latitude: 22.5,
                longitude: 75.5,
                latitudeDelta: 8,
                longitudeDelta: 8,
              }}
              showsUserLocation={false}
              showsCompass={true}
              showsScale={true}
            >
              {dssData?.districts?.map((district, idx) => {
                const coords = DISTRICT_COORDS[district.name];
                if (!coords) return null;
                
                const isZoomed = zoomedDistrict === district.name;
                
                return (
                  <Marker
                    key={idx}
                    coordinate={{ latitude: coords.lat, longitude: coords.lon }}
                    onPress={() => zoomToDistrict(district)}
                  >
                    {/* Custom Marker View - Larger when zoomed */}
                    <View style={styles.customMarker}>
                      <View style={[
                        styles.markerBubble, 
                        { backgroundColor: getScoreColor(district.score) },
                        isZoomed && styles.markerBubbleZoomed
                      ]}>
                        <Text style={[styles.markerScore, isZoomed && styles.markerScoreZoomed]}>
                          {district.score}
                        </Text>
                      </View>
                      <View style={[
                        styles.markerArrow,
                        { borderTopColor: getScoreColor(district.score) }
                      ]} />
                      {/* District name label */}
                      <Text style={[
                        styles.markerLabel,
                        mapType === 'satellite' && styles.markerLabelSatellite
                      ]}>
                        {district.name}
                      </Text>
                    </View>
                    
                    {/* Callout with details */}
                    <Callout tooltip onPress={() => zoomToDistrict(district)}>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>{district.name}</Text>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>AgriVol Score:</Text>
                          <Text style={[styles.calloutValue, { color: getScoreColor(district.score) }]}>
                            {district.score}
                          </Text>
                        </View>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Temperature:</Text>
                          <Text style={styles.calloutValue}>{district.temperature}°C</Text>
                        </View>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Humidity:</Text>
                          <Text style={styles.calloutValue}>{district.humidity}%</Text>
                        </View>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Weather:</Text>
                          <Text style={styles.calloutValue}>{district.weather}</Text>
                        </View>
                        <View style={styles.calloutRow}>
                          <Text style={styles.calloutLabel}>Volatility:</Text>
                          <Text style={[styles.calloutValue, { color: getVolatilityColor(district.volatility) }]}>
                            {district.volatility}
                          </Text>
                        </View>
                        <View style={[
                          styles.calloutBadge,
                          { backgroundColor: district.recommendation === 'Hedge Now' ? '#fef2f2' : 
                                           district.recommendation === 'Watch' ? '#fef3c7' : '#f0fdf4' }
                        ]}>
                          <Text style={[styles.calloutRecommend, { 
                            color: district.recommendation === 'Hedge Now' ? '#dc2626' : 
                                   district.recommendation === 'Watch' ? '#d97706' : '#16a34a' 
                          }]}>
                            {district.recommendation}
                          </Text>
                        </View>
                        {district.isLive && (
                          <View style={styles.calloutLive}>
                            <View style={styles.calloutLiveDot} />
                            <Text style={styles.calloutLiveText}>Live Data</Text>
                          </View>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.legendText}>0-49 {isHindi ? 'स्थिर' : 'Stable'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>50-69 {isHindi ? 'अस्थिर' : 'Volatile'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>70+ {isHindi ? 'उच्च जोखिम' : 'High Risk'}</Text>
            </View>
          </View>

          {/* District Table with Real Data */}
          <View style={styles.districtTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>{isHindi ? 'जिला' : 'District'}</Text>
              <Text style={styles.tableHeaderText}>{isHindi ? 'स्कोर' : 'Score'}</Text>
              <Text style={styles.tableHeaderText}>{isHindi ? 'मौसम' : 'Weather'}</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>{isHindi ? 'सलाह' : 'Action'}</Text>
            </View>

            {dssData?.districts?.map((district, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tableRow,
                  selectedDistrict === district.name && styles.tableRowSelected,
                ]}
                onPress={() => handleDistrictChange(district.name)}
              >
                <View style={[styles.districtNameCell, { flex: 1.5 }]}>
                  <Text style={styles.districtName}>{district.name}</Text>
                  <Text style={styles.districtTemp}>
                    {district.temperature}°C • {district.humidity}%
                  </Text>
                </View>
                <View style={styles.scoreCell}>
                  <Text style={[styles.districtScore, { color: getScoreColor(district.score) }]}>
                    {district.score}
                  </Text>
                  <Text style={[styles.districtVolatility, { color: getVolatilityColor(district.volatility) }]}>
                    {district.volatility}
                  </Text>
                </View>
                <View style={styles.weatherCell}>
                  <Text style={styles.weatherCondition}>{district.weather}</Text>
                  {district.forecast?.rainAlert && (
                    <Text style={styles.rainAlert}>🌧️</Text>
                  )}
                </View>
                <View style={[
                  styles.recommendBadge,
                  { flex: 1.2, backgroundColor: district.recommendation === 'Hedge Now' ? '#fef2f2' : 
                                     district.recommendation === 'Watch' ? '#fef3c7' : '#f0fdf4' }
                ]}>
                  <Text style={[styles.districtRecommend, { 
                    color: district.recommendation === 'Hedge Now' ? '#dc2626' : 
                           district.recommendation === 'Watch' ? '#d97706' : '#16a34a' 
                  }]}>
                    {district.recommendation}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.mapActions}>
            <TouchableOpacity 
              style={styles.mapActionButton}
              onPress={() => setSatelliteModalVisible(true)}
            >
              <Ionicons name="globe-outline" size={18} color="#6b7280" />
              <Text style={styles.mapActionText}>{isHindi ? 'उपग्रह' : 'Satellite'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mapActionButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={18} color="#6b7280" />
              <Text style={styles.mapActionText}>{isHindi ? 'रिफ्रेश' : 'Refresh'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mapActionButton}
              onPress={() => setReportModalVisible(true)}
            >
              <Ionicons name="download" size={18} color="#6b7280" />
              <Text style={styles.mapActionText}>{isHindi ? 'रिपोर्ट' : 'Export'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendation - Now with REAL data */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={24} color="#16a34a" />
            <Text style={styles.aiTitle}>
              {isHindi ? 'AI सिफारिश' : 'AI Recommendation'}
            </Text>
          </View>

          {/* Action Badge */}
          <View style={[
            styles.actionBadge,
            { backgroundColor: dssData?.recommendation?.action === 'Hedge Now' ? '#fef2f2' :
                              dssData?.recommendation?.action === 'Hedge Partially' ? '#fef3c7' :
                              dssData?.recommendation?.action === 'Watch & Wait' ? '#f0f9ff' : '#f0fdf4' }
          ]}>
            <Ionicons 
              name={dssData?.recommendation?.action === 'Hedge Now' ? 'alert-circle' :
                    dssData?.recommendation?.action === 'Hedge Partially' ? 'time' :
                    dssData?.recommendation?.action === 'Watch & Wait' ? 'eye' : 'checkmark-circle'} 
              size={20} 
              color={dssData?.recommendation?.action === 'Hedge Now' ? '#dc2626' :
                     dssData?.recommendation?.action === 'Hedge Partially' ? '#d97706' :
                     dssData?.recommendation?.action === 'Watch & Wait' ? '#0284c7' : '#16a34a'} 
            />
            <Text style={[
              styles.actionBadgeText,
              { color: dssData?.recommendation?.action === 'Hedge Now' ? '#dc2626' :
                       dssData?.recommendation?.action === 'Hedge Partially' ? '#d97706' :
                       dssData?.recommendation?.action === 'Watch & Wait' ? '#0284c7' : '#16a34a' }
            ]}>
              {dssData?.recommendation?.action || 'Analyzing...'}
            </Text>
          </View>

          <Text style={styles.aiRecommendation}>
            {dssData?.recommendation?.aiText || '"Analyzing market conditions..."'}
          </Text>

          {/* Recommendation Details */}
          <View style={styles.recommendDetails}>
            <View style={styles.recommendDetailItem}>
              <Text style={styles.recommendDetailLabel}>
                {isHindi ? 'हेज प्रतिशत' : 'Hedge %'}
              </Text>
              <Text style={styles.recommendDetailValue}>
                {dssData?.recommendation?.percentage || 0}%
              </Text>
            </View>
            <View style={styles.recommendDetailItem}>
              <Text style={styles.recommendDetailLabel}>
                {isHindi ? 'समय सीमा' : 'Timeframe'}
              </Text>
              <Text style={styles.recommendDetailValue}>
                {dssData?.recommendation?.timeframe || '-'}
              </Text>
            </View>
            <View style={styles.recommendDetailItem}>
              <Text style={styles.recommendDetailLabel}>
                {isHindi ? 'विश्वास' : 'Confidence'}
              </Text>
              <Text style={styles.recommendDetailValue}>
                {dssData?.recommendation?.confidence || 0}%
              </Text>
            </View>
          </View>

          <View style={styles.confidenceBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
            <Text style={styles.confidenceText}>
              {isHindi ? 'जोखिम स्तर' : 'Risk Level'}: {dssData?.recommendation?.riskLevel || 'Moderate'}
            </Text>
          </View>

          <Text style={styles.aiReason}>
            <Text style={styles.aiReasonLabel}>{isHindi ? 'कारण: ' : 'Reason: '}</Text>
            {dssData?.recommendation?.reason || 'Analyzing multiple factors...'}
          </Text>

          <View style={styles.aiActions}>
            <TouchableOpacity 
              style={styles.simulateHedgeButton}
              onPress={() => setSimulateModalVisible(true)}
            >
              <Text style={styles.simulateHedgeButtonText}>
                {isHindi ? 'सिमुलेट करें' : 'Simulate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contractsButton}
              onPress={() => router.push('/(tabs)/contracts')}
            >
              <Ionicons name="document-text-outline" size={18} color="#6b7280" />
              <Text style={styles.contractsButtonText}>
                {isHindi ? 'अनुबंध' : 'Contracts'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertButton}>
              <Ionicons name="notifications-outline" size={18} color="#6b7280" />
              <Text style={styles.alertButtonText}>
                {isHindi ? 'अलर्ट' : 'Alert'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Source Footer */}
        <View style={styles.dataSourceFooter}>
          <Ionicons name="information-circle-outline" size={14} color="#64748b" />
          <Text style={styles.dataSourceText}>
            {dssData?.metadata?.isLive 
              ? (isHindi ? 'लाइव डेटा • Open-Meteo API' : 'Live data • Open-Meteo API')
              : (isHindi ? 'कैश्ड डेटा' : 'Cached data')}
          </Text>
          <Text style={styles.dataSourceTime}>
            {dssData?.metadata?.updatedAt 
              ? new Date(dssData.metadata.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      <SimulateHedgeModal
        visible={simulateModalVisible}
        onClose={() => setSimulateModalVisible(false)}
      />
      
      <WeatherMapModal
        visible={weatherModalVisible}
        onClose={() => setWeatherModalVisible(false)}
        location={selectedDistrict}
      />
      
      <UpdateFarmDataModal
        visible={updateFarmModalVisible}
        onClose={() => setUpdateFarmModalVisible(false)}
      />
      
      <DSSReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        dssData={dssData}
      />
      
      <SatelliteMapModal
        visible={satelliteModalVisible}
        onClose={() => setSatelliteModalVisible(false)}
        districts={dssData?.districts}
      />
      
      <DSSInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="advanced_dss"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  infoButton: {
    padding: 8,
    marginRight: -4,
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  scoreValue: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  scoreStatus: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  analysisText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  simulateButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  simulateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  exploreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  weatherCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  weatherCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  weatherGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  weatherItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  weatherLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  weatherValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  weatherSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  yieldGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  yieldItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  yieldLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  yieldSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  weatherNote: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  weatherActions: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherMapButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  weatherMapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  mapCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  // Search Bar Styles
  searchContainer: {
    marginBottom: 12,
    zIndex: 100,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  clearSearchBtn: {
    padding: 4,
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchResultState: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  resetViewBtn: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginLeft: 8,
  },
  mapContainer: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  map: {
    flex: 1,
    borderRadius: 12,
  },
  mapTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  },
  mapTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  mapTypeBtnActive: {
    backgroundColor: '#16a34a',
  },
  mapTypeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  mapTypeBtnTextActive: {
    color: '#fff',
  },
  customMarker: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  markerBubbleZoomed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
  },
  markerScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  markerScoreZoomed: {
    fontSize: 18,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  markerLabelSatellite: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  calloutContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calloutLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  calloutValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  calloutBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calloutRecommend: {
    fontSize: 12,
    fontWeight: '700',
  },
  calloutLive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  calloutLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  calloutLiveText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  mapPlaceholderSubtext: {
    fontSize: 11,
    color: '#16a34a',
    marginBottom: 16,
    fontWeight: '500',
  },
  mapMarkersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  mapMarkerItem: {
    alignItems: 'center',
    width: 70,
  },
  mapMarkerDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  mapMarkerText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  mapMarkerLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  districtTable: {
    marginBottom: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tableRowSelected: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  districtName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  districtScore: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  districtVolatility: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  districtRecommend: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  mapActions: {
    flexDirection: 'row',
    gap: 10,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mapActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  aiCard: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  aiRecommendation: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  aiReason: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 20,
  },
  aiReasonLabel: {
    fontWeight: '700',
    color: '#166534',
  },
  aiActions: {
    flexDirection: 'row',
    gap: 10,
  },
  simulateHedgeButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  simulateHedgeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  contractsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contractsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  alertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  bottomSpacer: {
    height: 24,
  },
  // New styles for enhanced DSS
  loadingSubtext: {
    marginTop: 6,
    fontSize: 13,
    color: '#94a3b8',
  },
  cropSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cropSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cropChips: {
    flexDirection: 'row',
    gap: 10,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cropChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  cropChipIcon: {
    fontSize: 18,
  },
  cropChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  cropChipTextActive: {
    color: '#fff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    marginLeft: 'auto',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  scoreLabelText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  breakdownSection: {
    marginTop: 18,
    marginBottom: 18,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
  },
  breakdownGrid: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748b',
    width: 75,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    width: 35,
    textAlign: 'right',
  },
  breakdownBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    maxWidth: '50%',
  },
  marketCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  marketItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  marketLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  marketValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sentimentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  factorsList: {
    gap: 10,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  factorText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  factorImpact: {
    fontSize: 13,
    fontWeight: '700',
  },
  mapMarkerLabelActive: {
    fontWeight: '700',
    color: '#16a34a',
  },
  mapMarkerWeather: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  miniLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginTop: 4,
  },
  districtNameCell: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
  },
  weatherCell: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  weatherCondition: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  rainAlert: {
    fontSize: 12,
  },
  districtTemp: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  recommendBadge: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 14,
  },
  actionBadgeText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recommendDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recommendDetailItem: {
    alignItems: 'center',
  },
  recommendDetailLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  recommendDetailValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  dataSourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dataSourceText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dataSourceTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
