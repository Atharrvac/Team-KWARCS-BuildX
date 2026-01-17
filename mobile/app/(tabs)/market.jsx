import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
  Animated,
  Modal,
  Alert,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AppHeader from '../../components/AppHeader';
import TradingViewCandlestickChart from '../../components/TradingViewCandlestickChart';
import { fetchRealCommodityData, updatePricesRealtime } from '../../services/commodityApi';
import { supabase } from '../../config/supabase';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

// Initial data - will be replaced with real data
const MOCK_CONTRACTS = [];

// Oilseed crops for Options
const OPTIONS_CROPS = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन', icon: '🫘', basePrice: 4500 },
  { id: 'groundnut', name: 'Groundnut', nameHi: 'मूंगफली', icon: '🥜', basePrice: 6200 },
  { id: 'rapeseed', name: 'Rapeseed', nameHi: 'तोरिया', icon: '🌱', basePrice: 5400 },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों', icon: '🌻', basePrice: 5800 },
  { id: 'sunflower', name: 'Sunflower', nameHi: 'सूरजमुखी', icon: '🌻', basePrice: 5200 },
  { id: 'sesamum', name: 'Sesamum (Sesame)', nameHi: 'तिल', icon: '🌾', basePrice: 7500 },
  { id: 'safflower', name: 'Safflower', nameHi: 'कुसुम', icon: '🌸', basePrice: 5600 },
  { id: 'niger', name: 'Niger Seed', nameHi: 'रामतिल', icon: '🌿', basePrice: 6800 },
  { id: 'castor', name: 'Castor Seed', nameHi: 'अरंडी', icon: '🌿', basePrice: 5900 },
  { id: 'linseed', name: 'Linseed', nameHi: 'अलसी', icon: '🌱', basePrice: 6100 },
];

const OPTIONS_DURATIONS = [
  { id: '15', label: '15 Days', days: 15 },
  { id: '30', label: '30 Days', days: 30 },
  { id: '45', label: '45 Days', days: 45 },
  { id: '60', label: '60 Days', days: 60 },
];

export default function MarketScreen() {
  const { user, profile } = useSupabaseAuth();
  const [mode, setMode] = useState('buyer');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('FUTURES');
  const [searchQuery, setSearchQuery] = useState('');
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [priceFlash, setPriceFlash] = useState({}); // Track which prices just changed
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Available Options from other users (real-time)
  const [availableOptions, setAvailableOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const optionsSubscription = useRef(null);
  
  // PUT Options Trading State (Farmer/Seller)
  const [optSelectedCrop, setOptSelectedCrop] = useState(null);
  const [optShowCropDropdown, setOptShowCropDropdown] = useState(false);
  const [optSelectedDuration, setOptSelectedDuration] = useState(null);
  const [optSelectedStrike, setOptSelectedStrike] = useState(null);
  const [optQuantity, setOptQuantity] = useState('');
  const [optShowConfirmModal, setOptShowConfirmModal] = useState(false);
  const [optShowSuccess, setOptShowSuccess] = useState(false);
  const optSuccessScale = useRef(new Animated.Value(0)).current;
  const optSuccessOpacity = useRef(new Animated.Value(0)).current;
  
  // CALL Options Trading State (Buyer)
  const [callSelectedCrop, setCallSelectedCrop] = useState(null);
  const [callShowCropDropdown, setCallShowCropDropdown] = useState(false);
  const [callSelectedDuration, setCallSelectedDuration] = useState(null);
  const [callSelectedStrike, setCallSelectedStrike] = useState(null);
  const [callQuantity, setCallQuantity] = useState('');
  const [callShowConfirmModal, setCallShowConfirmModal] = useState(false);
  const [callShowSuccess, setCallShowSuccess] = useState(false);
  const callSuccessScale = useRef(new Animated.Value(0)).current;
  const callSuccessOpacity = useRef(new Animated.Value(0)).current;
  
  // PUT Options calculated values
  const optCurrentPrice = optSelectedCrop?.basePrice || 0;
  const optPredictedPrice = Math.round(optCurrentPrice * 1.06);
  const optHoixScore = 72;
  const optStrikeOptions = optSelectedCrop ? [
    { price: Math.round(optCurrentPrice * 0.95), label: 'Conservative' },
    { price: Math.round(optCurrentPrice * 1.02), label: 'Recommended', recommended: true },
    { price: Math.round(optCurrentPrice * 1.05), label: 'Aggressive' },
  ] : [];
  const optPremiumPerQt = optSelectedStrike && optSelectedDuration 
    ? Math.round(50 + (optSelectedDuration.days * 1.5) + (Math.abs(optSelectedStrike - optCurrentPrice) * 0.1))
    : 0;
  const optTotalPremium = optPremiumPerQt * (parseInt(optQuantity) || 0);
  const optIsFormComplete = optSelectedCrop && optSelectedDuration && optSelectedStrike && optQuantity && parseInt(optQuantity) > 0;
  
  // CALL Options calculated values
  const callCurrentPrice = callSelectedCrop?.basePrice || 0;
  const callPredictedPrice = Math.round(callCurrentPrice * 0.94); // Prediction: price may fall
  const callHoixScore = 68;
  const callStrikeOptions = callSelectedCrop ? [
    { price: Math.round(callCurrentPrice * 0.98), label: 'Aggressive' },
    { price: Math.round(callCurrentPrice * 1.0), label: 'Recommended', recommended: true },
    { price: Math.round(callCurrentPrice * 1.03), label: 'Conservative' },
  ] : [];
  const callPremiumPerQt = callSelectedStrike && callSelectedDuration 
    ? Math.round(45 + (callSelectedDuration.days * 1.3) + (Math.abs(callSelectedStrike - callCurrentPrice) * 0.12))
    : 0;
  const callTotalPremium = callPremiumPerQt * (parseInt(callQuantity) || 0);
  const callIsFormComplete = callSelectedCrop && callSelectedDuration && callSelectedStrike && callQuantity && parseInt(callQuantity) > 0;
  
  // Handle PUT options confirm (Farmer) - Save to database
  const handleOptConfirm = async () => {
    setOptShowConfirmModal(false);
    
    // Save to Supabase
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + optSelectedDuration.days);
    
    const optionData = {
      creator_id: user?.id || 'anonymous',
      creator_name: profile?.full_name || 'Farmer',
      creator_type: 'farmer',
      option_type: 'PUT',
      crop: optSelectedCrop.name,
      crop_icon: optSelectedCrop.icon,
      current_price: optCurrentPrice,
      strike_price: optSelectedStrike,
      premium_per_qt: optPremiumPerQt,
      total_premium: optTotalPremium,
      quantity: parseInt(optQuantity),
      duration_days: optSelectedDuration.days,
      expiry_date: expiryDate.toISOString().split('T')[0],
      status: 'available',
    };
    
    try {
      const { error } = await supabase.from('options_contracts').insert(optionData);
      if (error) {
        console.log('Options save error:', error.message);
        // Still show success for demo
      }
    } catch (e) {
      console.log('Error saving option:', e);
    }
    
    setOptShowSuccess(true);
    Animated.parallel([
      Animated.spring(optSuccessScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
      Animated.timing(optSuccessOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setOptShowSuccess(false);
      optSuccessScale.setValue(0);
      optSuccessOpacity.setValue(0);
      setOptSelectedCrop(null);
      setOptSelectedDuration(null);
      setOptSelectedStrike(null);
      setOptQuantity('');
      setActiveTab('FUTURES');
    }, 2000);
  };
  
  // Handle CALL options confirm (Buyer) - Save to database
  const handleCallConfirm = async () => {
    setCallShowConfirmModal(false);
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + callSelectedDuration.days);
    
    const optionData = {
      creator_id: user?.id || 'anonymous',
      creator_name: profile?.full_name || 'Buyer',
      creator_type: 'buyer',
      option_type: 'CALL',
      crop: callSelectedCrop.name,
      crop_icon: callSelectedCrop.icon,
      current_price: callCurrentPrice,
      strike_price: callSelectedStrike,
      premium_per_qt: callPremiumPerQt,
      total_premium: callTotalPremium,
      quantity: parseInt(callQuantity),
      duration_days: callSelectedDuration.days,
      expiry_date: expiryDate.toISOString().split('T')[0],
      status: 'available',
    };
    
    try {
      const { error } = await supabase.from('options_contracts').insert(optionData);
      if (error) console.log('Options save error:', error.message);
    } catch (e) {
      console.log('Error saving option:', e);
    }
    
    setCallShowSuccess(true);
    Animated.parallel([
      Animated.spring(callSuccessScale, { toValue: 1, friction: 3, tension: 100, useNativeDriver: true }),
      Animated.timing(callSuccessOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setCallShowSuccess(false);
      callSuccessScale.setValue(0);
      callSuccessOpacity.setValue(0);
      setCallSelectedCrop(null);
      setCallSelectedDuration(null);
      setCallSelectedStrike(null);
      setCallQuantity('');
      setActiveTab('FUTURES');
    }, 2000);
  };
  
  // Load available options from database
  const loadAvailableOptions = async () => {
    setLoadingOptions(true);
    try {
      const { data, error } = await supabase
        .from('options_contracts')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setAvailableOptions(data);
      }
    } catch (e) {
      console.log('Error loading options:', e);
    } finally {
      setLoadingOptions(false);
    }
  };
  
  // Subscribe to real-time options updates
  const setupOptionsSubscription = () => {
    const channel = supabase
      .channel('options-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options_contracts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAvailableOptions(prev => [payload.new, ...prev]);
          Vibration.vibrate(200);
        } else if (payload.eventType === 'UPDATE') {
          setAvailableOptions(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setAvailableOptions(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();
    
    optionsSubscription.current = channel;
  };

  useEffect(() => {
    loadMarketData();
    loadAvailableOptions();
    setupOptionsSubscription();
    
    // Fast real-time updates every 2 seconds
    const interval = setInterval(updatePricesRealtimeLocal, 2000);
    
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -SCREEN_WIDTH * 3,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();
    
    return () => {
      clearInterval(interval);
      if (optionsSubscription.current) {
        supabase.removeChannel(optionsSubscription.current);
      }
    };
  }, []);

  const loadMarketData = async () => {
    try {
      // First try backend API
      const res = await axios.get(`${API_URL}/market/contracts`, { timeout: 3000 });
      if (res.data?.length > 0) {
        setContracts(res.data);
        return;
      }
    } catch (error) {
      console.log('Backend unavailable, fetching from commodity API');
    }
    
    // Fallback to commodity API service
    try {
      const data = await fetchRealCommodityData();
      if (data?.length > 0) {
        setContracts(data);
      }
    } catch (error) {
      console.log('Using default data');
    }
  };

  // Real-time price simulation - updates every 2 seconds
  const updatePricesRealtimeLocal = () => {
    const newFlash = {};
    
    setContracts(prev => {
      if (prev.length === 0) return prev;
      
      const updated = updatePricesRealtime(prev);
      
      // Track flash effects
      updated.forEach(c => {
        if (c.prevLtp) {
          newFlash[c.symbol] = c.ltp > c.prevLtp ? 'up' : 'down';
        }
      });
      
      return updated;
    });
    
    // Set flash effect
    setPriceFlash(newFlash);
    setLastUpdate(new Date());
    
    // Clear flash after 500ms
    setTimeout(() => setPriceFlash({}), 500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  const openChartModal = (contract) => {
    setSelectedContract(contract);
    setChartModalVisible(true);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'FUTURES' ? c.type === 'FUTURES' : c.type === 'OPTIONS';
    return matchesSearch && matchesTab;
  });

  const tickerItems = contracts.slice(0, 8);

  return (
    <View style={styles.container}>
      <AppHeader showToggle={true} mode={mode} onModeChange={() => setMode(mode === 'buyer' ? 'seller' : 'buyer')} />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search commodity..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor="#9ca3af" />
        </View>
        <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>

      {/* Ticker */}
      <View style={styles.ticker}>
        <Animated.View style={[styles.tickerRow, { transform: [{ translateX: scrollX }] }]}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <View key={i} style={styles.tickerItem}>
              <Text style={styles.tickerSymbol}>{item.symbol}</Text>
              <Text style={styles.tickerPrice}>₹{item.ltp?.toFixed(0)}</Text>
              <Text style={[styles.tickerChange, { color: item.change >= 0 ? '#16a34a' : '#ef4444' }]}>
                {item.change >= 0 ? '+' : ''}{item.change?.toFixed(2)}%
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'FUTURES' && styles.tabActive]} onPress={() => setActiveTab('FUTURES')}>
          <Ionicons name="trending-up" size={14} color={activeTab === 'FUTURES' ? '#fff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'FUTURES' && styles.tabTextActive]}>FUTURES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'OPTIONS' && styles.tabActive]} onPress={() => setActiveTab('OPTIONS')}>
          <Ionicons name="options" size={14} color={activeTab === 'OPTIONS' ? '#fff' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'OPTIONS' && styles.tabTextActive]}>OPTIONS</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header - Only show for FUTURES tab */}
      {activeTab === 'FUTURES' && (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { width: 100 }]}>COMMODITY</Text>
            <Text style={[styles.headerText, { width: 65, textAlign: 'right' }]}>LTP</Text>
            <Text style={[styles.headerText, { width: 55, textAlign: 'center' }]}>CHG%</Text>
            <Text style={[styles.headerText, { width: 70, textAlign: 'center' }]}>HIGH/LOW</Text>
            <Text style={[styles.headerText, { width: 36, textAlign: 'center' }]}>📊</Text>
          </View>

          {/* Last Update Time */}
          <View style={styles.updateRow}>
            <Ionicons name="time-outline" size={12} color="#6b7280" />
            <Text style={styles.updateText}>Updated: {lastUpdate.toLocaleTimeString()}</Text>
          </View>
        </>
      )}

      {/* Contracts List */}
      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
        {activeTab === 'OPTIONS' ? (
          /* OPTIONS Tab - Different UI based on mode */
          mode === 'seller' ? (
            /* FARMER/SELLER MODE - Put Options (Price Protection) */
            <View style={styles.optionsContainer}>
              {/* Farmer Header - PUT OPTION */}
              <View style={styles.farmerHeader}>
                <View style={styles.farmerHeaderLeft}>
                  <Ionicons name="shield-checkmark" size={28} color="#16a34a" />
                  <View>
                    <Text style={styles.farmerHeaderTitle}>PUT OPTION</Text>
                    <Text style={styles.farmerHeaderSubtitle}>Price Protection for Farmers</Text>
                  </View>
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.farmerInfoBox}>
                <Ionicons name="information-circle" size={18} color="#16a34a" />
                <Text style={styles.farmerInfoText}>
                  Put Option = Agar daam gir gaya, toh bhi aapko locked price milega
                </Text>
              </View>

              {/* 🔵 Available Buyer Options (Real-time) */}
              <View style={styles.optSection}>
                <View style={styles.availableHeader}>
                  <Text style={styles.optSectionTitle}>🛒 Available from Buyers</Text>
                  <View style={styles.liveBadgeSmall}><View style={styles.liveDotSmall} /><Text style={styles.liveTextSmall}>LIVE</Text></View>
                </View>
                {availableOptions.filter(o => o.option_type === 'CALL' && o.status === 'available').length === 0 ? (
                  <View style={styles.noOptionsCard}>
                    <Ionicons name="hourglass-outline" size={32} color="#9ca3af" />
                    <Text style={styles.noOptionsText}>No buyer options available yet</Text>
                    <Text style={styles.noOptionsSubtext}>When buyers create Call options, they'll appear here as Put options for you</Text>
                  </View>
                ) : (
                  availableOptions.filter(o => o.option_type === 'CALL' && o.status === 'available').map((opt) => (
                    <TouchableOpacity key={opt.id} style={[styles.availableOptionCard, { borderColor: '#16a34a' }]}>
                      <View style={styles.availableOptionHeader}>
                        <Text style={styles.availableOptionCrop}>{opt.crop_icon} {opt.crop}</Text>
                        <View style={[styles.availableOptionBadge, { backgroundColor: '#dcfce7' }]}><Text style={[styles.availableOptionBadgeText, { color: '#16a34a' }]}>PUT</Text></View>
                      </View>
                      <View style={styles.availableOptionDetails}>
                        <View style={styles.availableOptionRow}><Text style={styles.availableOptionLabel}>Strike:</Text><Text style={styles.availableOptionValue}>₹{opt.strike_price?.toLocaleString()}/qt</Text></View>
                        <View style={styles.availableOptionRow}><Text style={styles.availableOptionLabel}>Qty:</Text><Text style={styles.availableOptionValue}>{opt.quantity} qt</Text></View>
                        <View style={styles.availableOptionRow}><Text style={styles.availableOptionLabel}>Premium:</Text><Text style={[styles.availableOptionValue, {color:'#16a34a'}]}>₹{opt.premium_per_qt}/qt</Text></View>
                        <View style={styles.availableOptionRow}><Text style={styles.availableOptionLabel}>Expires:</Text><Text style={styles.availableOptionValue}>{opt.duration_days} days</Text></View>
                      </View>
                      <View style={styles.availableOptionFooter}>
                        <Text style={styles.availableOptionSeller}>By: {opt.creator_name}</Text>
                        <TouchableOpacity style={[styles.buyOptionBtn, { backgroundColor: '#16a34a' }]} onPress={() => Alert.alert('Sell Option', `Sell this Put option for ₹${opt.total_premium}?`, [{text:'Cancel'}, {text:'Sell', onPress: () => {}}])}>
                          <Text style={styles.buyOptionBtnText}>Sell Put</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <View style={styles.dividerLine}><Text style={[styles.dividerText, { color: '#16a34a' }]}>OR CREATE YOUR OWN</Text></View>

              {/* 1️⃣ Commodity Dropdown */}
              <View style={styles.optSection}>
                <Text style={styles.optSectionTitle}>Select Crop</Text>
                <TouchableOpacity style={styles.optDropdown} onPress={() => setOptShowCropDropdown(!optShowCropDropdown)}>
                  {optSelectedCrop ? (
                    <View style={styles.optSelectedCropRow}>
                      <Text style={styles.optCropIcon}>{optSelectedCrop.icon}</Text>
                      <Text style={styles.optSelectedCropText}>{optSelectedCrop.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.optDropdownPlaceholder}>-- Select Crop --</Text>
                  )}
                  <Ionicons name={optShowCropDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                </TouchableOpacity>
                {optShowCropDropdown && (
                  <View style={styles.optDropdownList}>
                    {OPTIONS_CROPS.map((crop) => (
                      <TouchableOpacity key={crop.id} style={styles.optDropdownItem} onPress={() => { setOptSelectedCrop(crop); setOptShowCropDropdown(false); setOptSelectedStrike(null); }}>
                        <Text style={styles.optCropIcon}>{crop.icon}</Text>
                        <Text style={styles.optDropdownItemText}>{crop.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={styles.optInfoText}>💡 Yeh vikalp aapko girti keemat se bachata hai (Put Option)</Text>
              </View>

              {/* 2️⃣ Market Info */}
            {optSelectedCrop && (
              <View style={styles.optSection}>
                <Text style={styles.optSectionTitle}>📊 Market Info</Text>
                <View style={styles.optMarketCard}>
                  <View style={styles.optMarketRow}><Text style={styles.optMarketLabel}>Current Price:</Text><Text style={styles.optMarketValue}>₹{optCurrentPrice.toLocaleString()} / quintal</Text></View>
                  <View style={styles.optMarketRow}><Text style={styles.optMarketLabel}>15-Day Prediction:</Text><Text style={[styles.optMarketValue, {color:'#16a34a'}]}>₹{optPredictedPrice.toLocaleString()} / quintal</Text></View>
                  <View style={styles.optMarketRow}><Text style={styles.optMarketLabel}>HOI-X™ Score:</Text><View style={styles.optHoixBadge}><Text style={styles.optHoixScore}>{optHoixScore}/100</Text><Text style={styles.optHoixLabel}>(Hedge)</Text></View></View>
                </View>
                <Text style={styles.optPredictionText}>🔮 Model kehta hai: Aane wale dino me daam badh sakta hai, aaj se price lock kar sakte ho.</Text>
              </View>
            )}

            {/* 3️⃣ Option Type */}
            {optSelectedCrop && (
              <View style={styles.optSection}>
                <Text style={styles.optSectionTitle}>Option Type</Text>
                <View style={styles.optTypeCard}>
                  <View style={styles.optTypeHeader}><Ionicons name="shield-checkmark" size={24} color="#16a34a" /><Text style={styles.optTypeText}>Put Option (Price Protection)</Text></View>
                  <View style={styles.optTypeInfo}><Ionicons name="information-circle" size={16} color="#6b7280" /><Text style={styles.optTypeInfoText}>Put Option ka matlab: Agar daam gir gaya, toh bhi aapko yeh fixed price mil sakta hai.</Text></View>
                </View>
              </View>
            )}

            {/* 4️⃣ Duration & Strike */}
            {optSelectedCrop && (
              <>
                <View style={styles.optSection}>
                  <Text style={styles.optSectionTitle}>Duration</Text>
                  <View style={styles.optDurationRow}>
                    {OPTIONS_DURATIONS.map((dur) => (
                      <TouchableOpacity key={dur.id} style={[styles.optDurationBtn, optSelectedDuration?.id === dur.id && styles.optDurationBtnActive]} onPress={() => setOptSelectedDuration(dur)}>
                        <Text style={[styles.optDurationBtnText, optSelectedDuration?.id === dur.id && styles.optDurationBtnTextActive]}>{dur.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.optSection}>
                  <Text style={styles.optSectionTitle}>Strike Price (Lock Price)</Text>
                  <View style={styles.optStrikeRow}>
                    {optStrikeOptions.map((strike, idx) => (
                      <TouchableOpacity key={idx} style={[styles.optStrikeBtn, optSelectedStrike === strike.price && styles.optStrikeBtnActive, strike.recommended && styles.optStrikeBtnRec]} onPress={() => setOptSelectedStrike(strike.price)}>
                        {strike.recommended && <View style={styles.optRecBadge}><Text style={styles.optRecText}>✓ Recommended</Text></View>}
                        <Text style={[styles.optStrikePrice, optSelectedStrike === strike.price && styles.optStrikePriceActive]}>₹{strike.price.toLocaleString()}</Text>
                        <Text style={[styles.optStrikeLabel, optSelectedStrike === strike.price && styles.optStrikeLabelActive]}>{strike.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* 5️⃣ Quantity */}
            {optSelectedCrop && optSelectedDuration && optSelectedStrike && (
              <View style={styles.optSection}>
                <Text style={styles.optSectionTitle}>Kitni matra surakshit karni hai?</Text>
                <View style={styles.optQtyRow}>
                  <TextInput style={styles.optQtyInput} value={optQuantity} onChangeText={setOptQuantity} keyboardType="numeric" placeholder="Enter quantity" placeholderTextColor="#9ca3af" />
                  <Text style={styles.optQtyUnit}>quintals</Text>
                </View>
              </View>
            )}

            {/* 6️⃣ Premium */}
            {optIsFormComplete && (
              <View style={styles.optSection}>
                <Text style={styles.optSectionTitle}>💰 Premium (Protection Cost)</Text>
                <View style={styles.optPremiumCard}>
                  <View style={styles.optPremiumRow}><Text style={styles.optPremiumLabel}>Estimated Premium:</Text><Text style={styles.optPremiumValue}>₹{optTotalPremium.toLocaleString()} (₹{optPremiumPerQt}/qt)</Text></View>
                  <View style={styles.optPremiumExplain}><Text style={styles.optPremiumExplainText}>💡 Aap ₹{optTotalPremium.toLocaleString()} dekar price lock kar rahe ho.{'\n'}Agar daam gir gaya toh bhi aapko ₹{optSelectedStrike?.toLocaleString()} / q mil sakta hai.</Text></View>
                  <View style={styles.optExampleBox}><Ionicons name="shield" size={18} color="#16a34a" /><Text style={styles.optExampleText}>Agar mandi ₹{Math.round(optCurrentPrice * 0.85).toLocaleString()} par girti hai toh bhi aapko ₹{optSelectedStrike?.toLocaleString()} mil sakta hai — nuksaan se bachav.</Text></View>
                </View>
              </View>
            )}

            {/* 7️⃣ Confirm Button */}
            {optIsFormComplete && (
              <TouchableOpacity style={styles.optConfirmBtn} onPress={() => setOptShowConfirmModal(true)}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.optConfirmBtnText}>Review & Confirm</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </View>
          ) : (
            /* BUYER MODE - Call Options Full Form */
            <View style={styles.optionsContainer}>
              {/* Buyer Header */}
              <View style={styles.buyerHeader}>
                <View style={styles.buyerHeaderLeft}>
                  <Ionicons name="cart" size={24} color="#16a34a" />
                  <View>
                    <Text style={styles.buyerHeaderTitle}>Buy Call Options</Text>
                    <Text style={styles.buyerHeaderSubtitle}>Lock maximum purchase price</Text>
                  </View>
                </View>
                <View style={styles.buyerLiveBadge}>
                  <View style={styles.buyerLiveDot} />
                  <Text style={styles.buyerLiveText}>LIVE</Text>
                </View>
              </View>

              {/* Available Farmer Options */}
              <Text style={styles.buyerSectionTitle}>🌾 Available from Farmers</Text>
              
              {availableOptions.filter(o => o.option_type === 'PUT' && o.status === 'available').length === 0 ? (
                <View style={styles.buyerEmptyCard}>
                  <Ionicons name="leaf-outline" size={40} color="#d1d5db" />
                  <Text style={styles.buyerEmptyTitle}>No options available</Text>
                  <Text style={styles.buyerEmptyText}>Farmer options will appear here in real-time</Text>
                </View>
              ) : (
                availableOptions.filter(o => o.option_type === 'PUT' && o.status === 'available').map((opt) => (
                  <View key={opt.id} style={styles.buyerOptionCard}>
                    <View style={styles.buyerOptionTop}>
                      <View style={styles.buyerOptionCropRow}>
                        <Text style={styles.buyerOptionIcon}>{opt.crop_icon}</Text>
                        <Text style={styles.buyerOptionCrop}>{opt.crop}</Text>
                      </View>
                      <View style={styles.buyerCallBadge}>
                        <Ionicons name="trending-up" size={12} color="#fff" />
                        <Text style={styles.buyerCallBadgeText}>CALL</Text>
                      </View>
                    </View>
                    
                    <View style={styles.buyerOptionGrid}>
                      <View style={styles.buyerOptionGridItem}>
                        <Text style={styles.buyerOptionGridLabel}>Strike Price</Text>
                        <Text style={styles.buyerOptionGridValue}>₹{opt.strike_price?.toLocaleString()}</Text>
                        <Text style={styles.buyerOptionGridUnit}>per quintal</Text>
                      </View>
                      <View style={styles.buyerOptionGridItem}>
                        <Text style={styles.buyerOptionGridLabel}>Quantity</Text>
                        <Text style={styles.buyerOptionGridValue}>{opt.quantity}</Text>
                        <Text style={styles.buyerOptionGridUnit}>quintals</Text>
                      </View>
                      <View style={styles.buyerOptionGridItem}>
                        <Text style={styles.buyerOptionGridLabel}>Duration</Text>
                        <Text style={styles.buyerOptionGridValue}>{opt.duration_days}</Text>
                        <Text style={styles.buyerOptionGridUnit}>days</Text>
                      </View>
                    </View>
                    
                    <View style={styles.buyerOptionPremiumRow}>
                      <View>
                        <Text style={styles.buyerOptionPremiumLabel}>Premium</Text>
                        <Text style={styles.buyerOptionPremiumValue}>₹{opt.premium_per_qt}/qt • Total: ₹{opt.total_premium?.toLocaleString()}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.buyerOptionBottom}>
                      <View style={styles.buyerOptionSellerRow}>
                        <Ionicons name="person-circle" size={16} color="#6b7280" />
                        <Text style={styles.buyerOptionSeller}>{opt.creator_name || 'Farmer'}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.buyerBuyBtn}
                        onPress={() => Alert.alert(
                          '🛒 Buy Call Option',
                          `Crop: ${opt.crop}\nStrike: ₹${opt.strike_price}/qt\nQuantity: ${opt.quantity} qt\nPremium: ₹${opt.total_premium}\n\nYou'll be able to buy at ₹${opt.strike_price}/qt even if price goes higher.`,
                          [{text:'Cancel', style:'cancel'}, {text:'Confirm Buy', onPress: () => Alert.alert('Success!', 'Call option purchased successfully!')}]
                        )}
                      >
                        <Ionicons name="cart" size={16} color="#fff" />
                        <Text style={styles.buyerBuyBtnText}>Buy Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Info Card */}
              <View style={styles.buyerInfoCard}>
                <Ionicons name="information-circle" size={20} color="#16a34a" />
                <Text style={styles.buyerInfoText}>
                  Call Option = Agar daam badh gaya, toh bhi aap locked price par kharid sakte ho
                </Text>
              </View>
              
              <View style={{ height: 40 }} />
            </View>
          )
        ) : (
          /* FUTURES Tab - Show contracts */
          filteredContracts.map((c, i) => {
            const isFlashUp = priceFlash[c.symbol] === 'up';
            const isFlashDown = priceFlash[c.symbol] === 'down';
            const flashBg = isFlashUp ? '#bbf7d0' : isFlashDown ? '#fecaca' : (c.change >= 0 ? '#f0fdf4' : '#fef2f2');
            
            return (
              <View key={i} style={[styles.row, { backgroundColor: flashBg }]}>
                {/* Commodity Name */}
                <View style={styles.colCommodity}>
                  <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.date}>{c.date}</Text>
                </View>
                {/* LTP */}
                <View style={styles.colLtp}>
                  <View style={styles.ltpRow}>
                    <Text style={[styles.ltp, { color: isFlashUp ? '#16a34a' : isFlashDown ? '#ef4444' : '#111' }]}>
                      ₹{c.ltp?.toFixed(0)}
                    </Text>
                    {priceFlash[c.symbol] && (
                      <Ionicons 
                        name={isFlashUp ? 'arrow-up' : 'arrow-down'} 
                        size={10} 
                        color={isFlashUp ? '#16a34a' : '#ef4444'} 
                      />
                    )}
                  </View>
                </View>
                {/* Change % */}
                <View style={styles.colChange}>
                  <View style={[styles.changeBadge, { backgroundColor: c.change >= 0 ? '#16a34a' : '#ef4444' }]}>
                    <Text style={styles.changeText}>{c.change >= 0 ? '+' : ''}{c.change?.toFixed(1)}%</Text>
                  </View>
                </View>
                {/* High/Low */}
                <View style={styles.colHL}>
                  <Text style={[styles.hl, { color: '#16a34a' }]}>H: ₹{c.high?.toFixed(0)}</Text>
                  <Text style={[styles.hl, { color: '#ef4444' }]}>L: ₹{c.low?.toFixed(0)}</Text>
                </View>
                {/* Eye Button */}
                <TouchableOpacity style={styles.eyeBtn} onPress={() => openChartModal(c)}>
                  <Ionicons name="eye" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Chart Modal */}
      <Modal visible={chartModalVisible} animationType="slide" transparent onRequestClose={() => setChartModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedContract?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedContract?.symbol} • {selectedContract?.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setChartModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Main Price Display */}
              <View style={styles.mainPriceCard}>
                <View style={styles.mainPriceRow}>
                  <Text style={styles.mainPrice}>₹{selectedContract?.ltp?.toFixed(2)}</Text>
                  <View style={[styles.mainChangeBadge, { backgroundColor: selectedContract?.change >= 0 ? '#dcfce7' : '#fee2e2' }]}>
                    <Ionicons name={selectedContract?.change >= 0 ? 'trending-up' : 'trending-down'} size={16} color={selectedContract?.change >= 0 ? '#16a34a' : '#ef4444'} />
                    <Text style={[styles.mainChangeText, { color: selectedContract?.change >= 0 ? '#16a34a' : '#ef4444' }]}>
                      {selectedContract?.change >= 0 ? '+' : ''}{selectedContract?.change?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.mainPriceLabel}>Last Traded Price</Text>
              </View>

              {/* Price Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}><Text style={styles.statLabel}>Open</Text><Text style={styles.statValue}>₹{selectedContract?.open?.toFixed(0)}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>High</Text><Text style={[styles.statValue, { color: '#16a34a' }]}>₹{selectedContract?.high?.toFixed(0)}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>Low</Text><Text style={[styles.statValue, { color: '#ef4444' }]}>₹{selectedContract?.low?.toFixed(0)}</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>Volume</Text><Text style={styles.statValue}>{(selectedContract?.volume / 1000).toFixed(1)}K</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>OI</Text><Text style={styles.statValue}>{(selectedContract?.oi / 1000).toFixed(1)}K</Text></View>
                <View style={styles.statItem}><Text style={styles.statLabel}>ATP</Text><Text style={styles.statValue}>₹{selectedContract?.atp?.toFixed(0)}</Text></View>
              </View>

              {/* TradingView Chart */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>📊 Live Chart</Text>
                  <View style={styles.chartLiveBadge}><View style={styles.chartLiveDot} /><Text style={styles.chartLiveText}>LIVE</Text></View>
                </View>
                {selectedContract && (
                  <TradingViewCandlestickChart commodityName={selectedContract.name} symbol={selectedContract.symbol} interval="D" height={350} />
                )}
                <View style={styles.chartFeatures}>
                  <View style={styles.featureItem}><Ionicons name="pulse" size={14} color="#16a34a" /><Text style={styles.featureText}>Real-time</Text></View>
                  <View style={styles.featureItem}><Ionicons name="analytics" size={14} color="#3b82f6" /><Text style={styles.featureText}>Indicators</Text></View>
                  <View style={styles.featureItem}><Ionicons name="time" size={14} color="#f59e0b" /><Text style={styles.featureText}>Timeframes</Text></View>
                </View>
              </View>

              {/* Market Details */}
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>📈 Market Details</Text>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Contract Type</Text><Text style={styles.infoValue}>{selectedContract?.type}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Expiry Date</Text><Text style={styles.infoValue}>{selectedContract?.date}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Spot Price</Text><Text style={styles.infoValue}>₹{selectedContract?.spotPrice?.toFixed(2)}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Basis (Futures - Spot)</Text><Text style={[styles.infoValue, { color: (selectedContract?.ltp - selectedContract?.spotPrice) >= 0 ? '#16a34a' : '#ef4444' }]}>₹{(selectedContract?.ltp - selectedContract?.spotPrice)?.toFixed(2)}</Text></View>
                <View style={styles.infoRow}><Text style={styles.infoLabel}>Day Range</Text><Text style={styles.infoValue}>₹{selectedContract?.low?.toFixed(0)} - ₹{selectedContract?.high?.toFixed(0)}</Text></View>
              </View>

              {/* Trading Insights */}
              <View style={styles.insightSection}>
                <Text style={styles.infoTitle}>💡 Trading Insights</Text>
                <View style={styles.insightCard}>
                  <Ionicons name={selectedContract?.change >= 0 ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={selectedContract?.change >= 0 ? '#16a34a' : '#ef4444'} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.insightTitle}>{selectedContract?.change >= 0 ? 'Bullish Trend' : 'Bearish Trend'}</Text>
                    <Text style={styles.insightText}>
                      {selectedContract?.change >= 0 
                        ? 'Price is trending upward. Consider hedging to lock in profits.'
                        : 'Price is trending downward. Good time to buy or wait for reversal.'}
                    </Text>
                  </View>
                </View>
                <View style={styles.insightCard}>
                  <Ionicons name="bar-chart" size={24} color="#3b82f6" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.insightTitle}>Volume Analysis</Text>
                    <Text style={styles.insightText}>
                      {selectedContract?.volume > 15000 ? 'High trading activity indicates strong market interest.' : 'Moderate volume. Watch for breakout signals.'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Farmer Recommendation */}
              <View style={styles.farmerSection}>
                <Text style={styles.infoTitle}>🌾 Farmer Recommendation</Text>
                <View style={styles.farmerCard}>
                  <View style={styles.farmerRow}>
                    <Text style={styles.farmerLabel}>MSP Reference</Text>
                    <Text style={styles.farmerValue}>₹{(selectedContract?.ltp * 0.85)?.toFixed(0)}</Text>
                  </View>
                  <View style={styles.farmerRow}>
                    <Text style={styles.farmerLabel}>Profit vs MSP</Text>
                    <Text style={[styles.farmerValue, { color: '#16a34a' }]}>+{((selectedContract?.ltp / (selectedContract?.ltp * 0.85) - 1) * 100)?.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.farmerRow}>
                    <Text style={styles.farmerLabel}>Recommended Hedge</Text>
                    <Text style={[styles.farmerValue, { color: '#3b82f6' }]}>{selectedContract?.change > 1 ? '60-70%' : selectedContract?.change > 0 ? '40-50%' : '20-30%'}</Text>
                  </View>
                </View>
              </View>

              {/* Options Greeks - Only for OPTIONS */}
              {selectedContract?.type === 'OPTIONS' && (
                <View style={styles.greeksSection}>
                  <Text style={styles.infoTitle}>📊 Option Greeks</Text>
                  <View style={styles.greeksGrid}>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>Delta (Δ)</Text>
                      <Text style={styles.greekValue}>{(selectedContract?.delta || 0.45).toFixed(3)}</Text>
                    </View>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>Theta (Θ)</Text>
                      <Text style={[styles.greekValue, { color: '#ef4444' }]}>{(selectedContract?.theta || -2.5).toFixed(2)}</Text>
                    </View>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>Gamma (Γ)</Text>
                      <Text style={styles.greekValue}>{(selectedContract?.gamma || 0.002).toFixed(4)}</Text>
                    </View>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>Vega (ν)</Text>
                      <Text style={styles.greekValue}>{(selectedContract?.vega || 8.5).toFixed(2)}</Text>
                    </View>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>IV</Text>
                      <Text style={[styles.greekValue, { color: '#3b82f6' }]}>{selectedContract?.iv || 25}%</Text>
                    </View>
                    <View style={styles.greekBox}>
                      <Text style={styles.greekLabel}>Strike</Text>
                      <Text style={styles.greekValue}>₹{selectedContract?.strikePrice || selectedContract?.spotPrice}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Trade Buttons */}
              <View style={styles.tradeSection}>
                {selectedContract?.type === 'OPTIONS' ? (
                  <>
                    {/* Options Trading Buttons */}
                    <View style={styles.optionsBtnRow}>
                      <TouchableOpacity 
                        style={styles.buyCallBtn}
                        onPress={() => {
                          Alert.alert(
                            'BUY CALL',
                            `Buy ${selectedContract?.name}\n\nPremium: ₹${selectedContract?.ltp}\nLot Size: 100\nTotal: ₹${(selectedContract?.ltp * 100).toLocaleString()}`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Confirm BUY', onPress: () => {
                                Alert.alert('Order Placed', 'Your CALL option buy order has been placed!');
                                setChartModalVisible(false);
                              }}
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trending-up" size={20} color="#fff" />
                        <Text style={styles.optionBtnText}>BUY CALL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.buyPutBtn}
                        onPress={() => {
                          Alert.alert(
                            'BUY PUT',
                            `Buy PUT for ${selectedContract?.name?.split(' ')[0]}\n\nPremium: ₹${Math.round(selectedContract?.ltp * 0.8)}\nLot Size: 100\nTotal: ₹${(Math.round(selectedContract?.ltp * 0.8) * 100).toLocaleString()}`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Confirm BUY', onPress: () => {
                                Alert.alert('Order Placed', 'Your PUT option buy order has been placed!');
                                setChartModalVisible(false);
                              }}
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trending-down" size={20} color="#fff" />
                        <Text style={styles.optionBtnText}>BUY PUT</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.optionsBtnRow}>
                      <TouchableOpacity 
                        style={styles.sellCallBtn}
                        onPress={() => {
                          Alert.alert(
                            'SELL CALL (Write)',
                            `Sell/Write CALL for ${selectedContract?.name}\n\nPremium Received: ₹${selectedContract?.ltp}\nMargin Required: ₹${(selectedContract?.spotPrice * 0.15 * 100).toLocaleString()}`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Confirm SELL', onPress: () => {
                                Alert.alert('Order Placed', 'Your CALL option sell order has been placed!');
                                setChartModalVisible(false);
                              }}
                            ]
                          );
                        }}
                      >
                        <Ionicons name="remove-circle" size={18} color="#16a34a" />
                        <Text style={styles.sellBtnText}>SELL CALL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.sellPutBtn}
                        onPress={() => {
                          Alert.alert(
                            'SELL PUT (Write)',
                            `Sell/Write PUT for ${selectedContract?.name?.split(' ')[0]}\n\nPremium Received: ₹${Math.round(selectedContract?.ltp * 0.8)}\nMargin Required: ₹${(selectedContract?.spotPrice * 0.15 * 100).toLocaleString()}`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Confirm SELL', onPress: () => {
                                Alert.alert('Order Placed', 'Your PUT option sell order has been placed!');
                                setChartModalVisible(false);
                              }}
                            ]
                          );
                        }}
                      >
                        <Ionicons name="remove-circle" size={18} color="#ef4444" />
                        <Text style={styles.sellBtnText}>SELL PUT</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Options Info */}
                    <View style={styles.optionsInfo}>
                      <Text style={styles.optionsInfoText}>💡 Lot Size: 100 | Expiry: {selectedContract?.date}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Futures Trading Buttons */}
                    <TouchableOpacity 
                      style={styles.tradeBtn} 
                      onPress={() => {
                        setChartModalVisible(false);
                        Alert.alert(
                          'Trade ' + selectedContract?.name,
                          'Choose your action:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Hedge (Sell Futures)', onPress: () => router.push('/hedging') },
                            { text: 'Simulate Trade', onPress: () => router.push('/simulation-mode') },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={20} color="#fff" />
                      <Text style={styles.tradeBtnText}>Trade {selectedContract?.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.tradeBtnRow}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setChartModalVisible(false); router.push('/hedging'); }}>
                        <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
                        <Text style={styles.secondaryBtnText}>Hedge</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setChartModalVisible(false); router.push('/simulation-mode'); }}>
                        <Ionicons name="game-controller" size={18} color="#7c3aed" />
                        <Text style={styles.secondaryBtnText}>Simulate</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Options Confirmation Modal */}
      <Modal visible={optShowConfirmModal} transparent animationType="slide">
        <View style={styles.optModalOverlay}>
          <View style={styles.optModalContent}>
            <Text style={styles.optModalTitle}>🛡️ Your Protection Order</Text>
            <View style={styles.optSummaryCard}>
              <View style={styles.optSummaryRow}><Text style={styles.optSummaryLabel}>Crop:</Text><Text style={styles.optSummaryValue}>{optSelectedCrop?.icon} {optSelectedCrop?.name}</Text></View>
              <View style={styles.optSummaryRow}><Text style={styles.optSummaryLabel}>Option:</Text><Text style={styles.optSummaryValue}>Put (Price Protection)</Text></View>
              <View style={styles.optSummaryRow}><Text style={styles.optSummaryLabel}>Strike Price:</Text><Text style={styles.optSummaryValue}>₹{optSelectedStrike?.toLocaleString()}/q</Text></View>
              <View style={styles.optSummaryRow}><Text style={styles.optSummaryLabel}>Duration:</Text><Text style={styles.optSummaryValue}>{optSelectedDuration?.label}</Text></View>
              <View style={styles.optSummaryRow}><Text style={styles.optSummaryLabel}>Quantity:</Text><Text style={styles.optSummaryValue}>{optQuantity} quintals</Text></View>
              <View style={[styles.optSummaryRow, styles.optSummaryHighlight]}><Text style={styles.optSummaryLabelBold}>Premium:</Text><Text style={styles.optSummaryValueBold}>₹{optTotalPremium.toLocaleString()} (one time)</Text></View>
            </View>
            <View style={styles.optModalButtons}>
              <TouchableOpacity style={styles.optBackBtn} onPress={() => setOptShowConfirmModal(false)}><Ionicons name="arrow-back" size={18} color="#6b7280" /><Text style={styles.optBackBtnText}>Back</Text></TouchableOpacity>
              <TouchableOpacity style={styles.optCreateBtn} onPress={handleOptConfirm}><Ionicons name="checkmark" size={18} color="#fff" /><Text style={styles.optCreateBtnText}>Confirm & Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Put Options Success Animation */}
      {optShowSuccess && (
        <View style={styles.optSuccessOverlay}>
          <Animated.View style={[styles.optSuccessCircle, { transform: [{ scale: optSuccessScale }], opacity: optSuccessOpacity }]}>
            <Ionicons name="checkmark" size={80} color="#fff" />
          </Animated.View>
          <Animated.Text style={[styles.optSuccessText, { opacity: optSuccessOpacity }]}>Contract Created Successfully!</Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 10, height: 38 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  ticker: { backgroundColor: '#111827', height: 36, overflow: 'hidden' },
  tickerRow: { flexDirection: 'row', alignItems: 'center', height: 36 },
  tickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  tickerSymbol: { fontSize: 11, fontWeight: '600', color: '#fff' },
  tickerPrice: { fontSize: 11, color: '#d1d5db' },
  tickerChange: { fontSize: 10, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', gap: 4 },
  tabActive: { backgroundColor: '#16a34a' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 10 },
  headerText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  updateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', paddingVertical: 4, gap: 4 },
  updateText: { fontSize: 10, color: '#6b7280' },
  list: { flex: 1 },
  
  // Options Trading Styles
  optionsContainer: { padding: 16 },
  
  // Farmer PUT Option Header
  farmerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dcfce7', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#16a34a' },
  farmerHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  farmerHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
  farmerHeaderSubtitle: { fontSize: 11, color: '#166534' },
  farmerPutBadge: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  farmerPutBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  farmerInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  farmerInfoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 18 },
  
  optModeIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: '#16a34a', borderRadius: 10, padding: 10, marginBottom: 16, gap: 8 },
  optModeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  
  // Available Options Styles
  availableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  liveBadgeSmall: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 3 },
  liveDotSmall: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#16a34a' },
  liveTextSmall: { fontSize: 9, fontWeight: '700', color: '#16a34a' },
  noOptionsCard: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  noOptionsText: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 10 },
  noOptionsSubtext: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 },
  availableOptionCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1.5, borderColor: '#3b82f6' },
  availableOptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  availableOptionCrop: { fontSize: 16, fontWeight: '700', color: '#111827' },
  availableOptionBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  availableOptionBadgeText: { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
  availableOptionDetails: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 10 },
  availableOptionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  availableOptionLabel: { fontSize: 12, color: '#6b7280' },
  availableOptionValue: { fontSize: 12, fontWeight: '600', color: '#111827' },
  availableOptionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availableOptionSeller: { fontSize: 11, color: '#6b7280' },
  buyOptionBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  buyOptionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  dividerLine: { alignItems: 'center', marginVertical: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 },
  dividerText: { fontSize: 11, fontWeight: '600', color: '#3b82f6', backgroundColor: '#f9fafb', paddingHorizontal: 10 },
  
  // New Buyer UI Styles
  buyerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dcfce7', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#16a34a' },
  buyerHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buyerHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  buyerHeaderSubtitle: { fontSize: 11, color: '#16a34a' },
  buyerLiveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  buyerLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  buyerLiveText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  buyerSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  buyerEmptyCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  buyerEmptyTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  buyerEmptyText: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  buyerOptionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#16a34a', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buyerOptionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  buyerOptionCropRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buyerOptionIcon: { fontSize: 28 },
  buyerOptionCrop: { fontSize: 18, fontWeight: '700', color: '#111827' },
  buyerCallBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  buyerCallBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  buyerOptionGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12 },
  buyerOptionGridItem: { flex: 1, alignItems: 'center' },
  buyerOptionGridLabel: { fontSize: 10, color: '#6b7280', marginBottom: 4 },
  buyerOptionGridValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  buyerOptionGridUnit: { fontSize: 10, color: '#9ca3af' },
  buyerOptionPremiumRow: { backgroundColor: '#dcfce7', borderRadius: 8, padding: 10, marginBottom: 12 },
  buyerOptionPremiumLabel: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  buyerOptionPremiumValue: { fontSize: 14, fontWeight: '700', color: '#166534', marginTop: 2 },
  buyerOptionBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  buyerOptionSellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  buyerOptionSeller: { fontSize: 12, color: '#6b7280' },
  buyerBuyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
  buyerBuyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  buyerInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginTop: 8, gap: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  buyerInfoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 18 },
  
  buyerOptionsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  buyerOptionsTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  buyerOptionsText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  switchModeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 20, gap: 8 },
  switchModeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  optSection: { marginBottom: 18 },
  optSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  optDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12 },
  optDropdownPlaceholder: { fontSize: 14, color: '#9ca3af' },
  optSelectedCropRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optCropIcon: { fontSize: 20 },
  optSelectedCropText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  optDropdownList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginTop: 6, maxHeight: 200 },
  optDropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 8 },
  optDropdownItemText: { fontSize: 13, color: '#374151' },
  optInfoText: { fontSize: 11, color: '#6b7280', marginTop: 8, fontStyle: 'italic', backgroundColor: '#fef3c7', padding: 8, borderRadius: 6 },
  optMarketCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  optMarketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  optMarketLabel: { fontSize: 12, color: '#6b7280' },
  optMarketValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  optHoixBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optHoixScore: { fontSize: 15, fontWeight: '800', color: '#ea580c' },
  optHoixLabel: { fontSize: 11, color: '#6b7280' },
  optPredictionText: { fontSize: 11, color: '#16a34a', marginTop: 8, backgroundColor: '#dcfce7', padding: 8, borderRadius: 6 },
  optTypeCard: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: '#16a34a' },
  optTypeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optTypeText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  optTypeInfo: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 4 },
  optTypeInfoText: { flex: 1, fontSize: 11, color: '#6b7280', lineHeight: 16 },
  optDurationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optDurationBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  optDurationBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  optDurationBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  optDurationBtnTextActive: { color: '#fff' },
  optStrikeRow: { flexDirection: 'row', gap: 8 },
  optStrikeBtn: { flex: 1, padding: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  optStrikeBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  optStrikeBtnRec: { borderColor: '#f59e0b', borderWidth: 2 },
  optRecBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  optRecText: { fontSize: 8, fontWeight: '700', color: '#d97706' },
  optStrikePrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  optStrikePriceActive: { color: '#fff' },
  optStrikeLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  optStrikeLabelActive: { color: '#dcfce7' },
  optQtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  optQtyInput: { flex: 1, padding: 12, fontSize: 15, color: '#111827' },
  optQtyUnit: { paddingHorizontal: 14, fontSize: 13, color: '#6b7280', backgroundColor: '#f3f4f6', paddingVertical: 12 },
  optPremiumCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  optPremiumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  optPremiumLabel: { fontSize: 12, color: '#6b7280' },
  optPremiumValue: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  optPremiumExplain: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 6, marginBottom: 10 },
  optPremiumExplainText: { fontSize: 12, color: '#166534', lineHeight: 18 },
  optExampleBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#dcfce7', padding: 10, borderRadius: 6, gap: 6 },
  optExampleText: { flex: 1, fontSize: 11, color: '#166534', lineHeight: 16 },
  optConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 14, borderRadius: 10, gap: 6 },
  optConfirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  optModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  optModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 30 },
  optModalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 16 },
  optSummaryCard: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 16 },
  optSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  optSummaryHighlight: { backgroundColor: '#dcfce7', marginTop: 8, marginHorizontal: -14, paddingHorizontal: 14, borderRadius: 6, borderBottomWidth: 0 },
  optSummaryLabel: { fontSize: 13, color: '#6b7280' },
  optSummaryValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  optSummaryLabelBold: { fontSize: 13, fontWeight: '700', color: '#166534' },
  optSummaryValueBold: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  optModalButtons: { flexDirection: 'row', gap: 10 },
  optBackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, gap: 4 },
  optBackBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  optCreateBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', padding: 12, borderRadius: 10, gap: 4 },
  optCreateBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  optSuccessOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 163, 74, 0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  optSuccessCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  optSuccessText: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  
  // Empty Options State (legacy)
  emptyOptionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyOptionsTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptyOptionsText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  openOptionsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, marginTop: 20, gap: 8 },
  openOptionsBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  
  // Column styles - fixed widths to prevent overlap
  colCommodity: { width: 100 },
  colLtp: { width: 65, alignItems: 'flex-end' },
  colChange: { width: 55, alignItems: 'center' },
  colHL: { width: 70, alignItems: 'center' },
  
  name: { fontSize: 12, fontWeight: '600', color: '#111' },
  date: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  ltp: { fontSize: 13, fontWeight: '700', color: '#111' },
  ltpRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignItems: 'center' },
  changeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  hl: { fontSize: 9, fontWeight: '500' },
  eyeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  closeBtn: { padding: 8 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  statItem: { width: (SCREEN_WIDTH - 48) / 3, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#6b7280' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#111', marginTop: 2 },
  
  chartContainer: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  chartLiveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  chartLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  chartLiveText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
  chartFeatures: { flexDirection: 'row', justifyContent: 'center', padding: 10, gap: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featureText: { fontSize: 11, color: '#6b7280' },
  
  // Main Price Card
  mainPriceCard: { margin: 16, marginBottom: 8, backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, alignItems: 'center' },
  mainPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainPrice: { fontSize: 32, fontWeight: '700', color: '#111' },
  mainChangeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  mainChangeText: { fontSize: 14, fontWeight: '700' },
  mainPriceLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },

  // Info Section
  infoSection: { margin: 16, backgroundColor: '#f9fafb', padding: 14, borderRadius: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111' },

  // Insight Section
  insightSection: { margin: 16, marginTop: 0 },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f9fafb', padding: 14, borderRadius: 12, marginBottom: 10 },
  insightTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  insightText: { fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 18 },

  // Farmer Section
  farmerSection: { margin: 16, marginTop: 0 },
  farmerCard: { backgroundColor: '#fef3c7', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fcd34d' },
  farmerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  farmerLabel: { fontSize: 13, color: '#92400e' },
  farmerValue: { fontSize: 13, fontWeight: '700', color: '#92400e' },

  // Trade Section
  tradeSection: { margin: 16, marginTop: 8 },
  tradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, gap: 8 },
  tradeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  tradeBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 10, gap: 6 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
