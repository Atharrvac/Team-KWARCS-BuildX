import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AppHeader from '../../components/AppHeader';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../config/supabase';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

// Crop options
const CROPS = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन', icon: '🫘' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों', icon: '🌻' },
  { id: 'groundnut', name: 'Groundnut', nameHi: 'मूंगफली', icon: '🥜' },
  { id: 'sunflower', name: 'Sunflower', nameHi: 'सूरजमुखी', icon: '🌻' },
  { id: 'rapeseed', name: 'Rapeseed', nameHi: 'तोरिया', icon: '🌱' },
  { id: 'castor', name: 'Castor', nameHi: 'अरंडी', icon: '🌿' },
];

// NCDEX Oilseeds Data
const NCDEX_DATA = {
  gainers: [
    { name: 'Soybean Dec25', contract: 'NCDEX:SOYBEAN', price: '4395.00', change: '+2.34', volume: '12.5K' },
    { name: 'Rapeseed Jan26', contract: 'NCDEX:RAPESEED', price: '5980.00', change: '+1.51', volume: '8.3K' },
    { name: 'Mustard Seed Dec25', contract: 'NCDEX:MUSTARD', price: '5854.00', change: '+0.77', volume: '15.2K' },
  ],
  losers: [
    { name: 'Castor Seed Jan26', contract: 'NCDEX:CASTOR', price: '5245.00', change: '-1.82', volume: '4.2K' },
    { name: 'Soybean Oil Dec25', contract: 'NCDEX:SOYOIL', price: '1124.50', change: '-1.23', volume: '9.7K' },
  ],
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { profile, user } = useSupabaseAuth();
  const { addNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState('buyer'); // 'buyer' or 'seller'
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [marketData, setMarketData] = useState({
    soybean: { price: 4250, change: 1.2 },
    mustard: { price: 5800, change: -0.6 },
  });
  const [activeTab, setActiveTab] = useState('gainers');
  const [dssScore] = useState(82);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Real-time oilseed news headlines for continuous ticker
  const tickerNews = '📈 Soybean +2.3% China demand   ●   🌧️ IMD: Good monsoon Kharif   ●   📊 NCDEX mustard futures Jan26   ●   🚜 MSP hike ₹150/qt oilseeds   ●   🌍 Palm oil -5%   ●   💰 FPOs +20% hedging income   ●   📱 AgriSure 10K+ farmers   ●   🏆 Groundnut exports high   ●   ';
  const TICKER_SEGMENT_WIDTH = SCREEN_WIDTH * 3; // Each segment is 3 screen widths
  
  const [sellForm, setSellForm] = useState({
    crop: '',
    quantity: '',
    price: '',
    location: '',
    description: '',
    quality_grade: 'A',
    contact_phone: '',
    image_url: '',
    images: [], // Array for multiple images (1-5)
    video_url: '', // Video URL
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('');

  const isHindi = i18n.language === 'hi';

  useEffect(() => {
    loadMarketData();
    loadListings();
    setupRealtimeSubscription();
    
    // Infinite seamless ticker - loops forever without gaps
    scrollX.setValue(0);
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -TICKER_SEGMENT_WIDTH,
        duration: 20000, // 20 seconds per cycle
        useNativeDriver: true,
      })
    ).start();
    
    const interval = setInterval(loadMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('marketplace-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, (payload) => {
        handleRealtimeUpdate(payload);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleRealtimeUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      setListings(prev => [payload.new, ...prev]);
      if (payload.new.seller_id === user?.id) {
        setMyListings(prev => [payload.new, ...prev]);
      }
    } else if (payload.eventType === 'DELETE') {
      setListings(prev => prev.filter(item => item.id !== payload.old.id));
      setMyListings(prev => prev.filter(item => item.id !== payload.old.id));
    }
  };

  const loadListings = async () => {
    try {
      setLoadingListings(true);
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (!error) {
        setListings(data || []);
        if (user?.id) setMyListings((data || []).filter(l => l.seller_id === user.id));
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await axios.get(`${API_URL}/market/prices`);
      const prices = response.data;
      const newMarketData = {};
      prices.forEach(item => {
        if (item.crop === 'soybean' || item.crop === 'mustard') {
          newMarketData[item.crop] = { price: item.price, change: item.change };
        }
      });
      setMarketData(prev => ({ ...prev, ...newMarketData }));
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMarketData(), loadListings()]);
    setRefreshing(false);
  };

  const handleSellSubmit = async () => {
    // Validate required fields
    if (!sellForm.crop) {
      Alert.alert('Error', 'Please select a crop');
      return;
    }
    if (!sellForm.quantity || isNaN(parseFloat(sellForm.quantity))) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!sellForm.price || isNaN(parseFloat(sellForm.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a listing. Please sign in first.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Build listing data - only include fields that exist in the table
      const listingData = {
        seller_id: user.id,
        seller_name: profile?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        crop: sellForm.crop,
        quantity: parseFloat(sellForm.quantity),
        price: parseFloat(sellForm.price),
        location: sellForm.location || '',
        description: sellForm.description || '',
        status: 'active',
      };
      
      // Only add optional fields if they have values
      if (sellForm.quality_grade) listingData.quality_grade = sellForm.quality_grade;
      if (sellForm.contact_phone) listingData.contact_phone = sellForm.contact_phone;
      
      // Handle images - use first image as main image_url, store all in images array
      if (sellForm.images.length > 0) {
        listingData.image_url = sellForm.images[0];
        listingData.images = sellForm.images; // Array of image URLs
      } else if (sellForm.image_url) {
        listingData.image_url = sellForm.image_url;
      }
      
      // Add video URL if present
      if (sellForm.video_url) {
        listingData.video_url = sellForm.video_url;
      }
      
      console.log('Creating listing with data:', JSON.stringify(listingData, null, 2));
      
      let { data, error } = await supabase
        .from('marketplace_listings')
        .insert(listingData)
        .select();
      
      // If error due to missing columns, try without images/video_url columns
      if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.log('Retrying without new columns...');
        
        // Remove potentially missing columns
        const fallbackData = { ...listingData };
        delete fallbackData.images;
        delete fallbackData.video_url;
        
        const retryResult = await supabase
          .from('marketplace_listings')
          .insert(fallbackData)
          .select();
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = null;
          console.log('Listing created with fallback (without images/video columns)');
          Alert.alert(
            'Note',
            'Listing created! To enable multiple images and video, run FIX_MARKETPLACE_COLUMNS.sql in Supabase.',
            [{ text: 'OK' }]
          );
        } else {
          error = retryResult.error;
        }
      }
      
      if (error) {
        console.error('Supabase insert error:', error);
        
        // Provide helpful error messages
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          Alert.alert(
            'Database Setup Required',
            'Some columns are missing. Run FIX_MARKETPLACE_COLUMNS.sql in Supabase SQL Editor.',
            [{ text: 'OK' }]
          );
        } else if (error.message?.includes('permission denied')) {
          Alert.alert(
            'Permission Error',
            'You do not have permission to create listings. Please check RLS policies.',
            [{ text: 'OK' }]
          );
        } else {
          throw error;
        }
        return;
      }
      
      console.log('Listing created successfully:', data);
      
      // Add notification for listing created (shows toast)
      addNotification({
        type: 'success',
        title: '✅ Listing Created!',
        message: `Your ${sellForm.crop} listing (${sellForm.quantity} qt at ₹${sellForm.price}/qt) is now live!`,
      });
      setSellModalVisible(false);
      setSellForm({ 
        crop: '', 
        quantity: '', 
        price: '', 
        location: '', 
        description: '', 
        quality_grade: 'A', 
        contact_phone: '', 
        image_url: '',
        images: [],
        video_url: '',
      });
      
      // Reload listings to show the new one
      await loadListings();
      
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(
        'Error', 
        `Failed to create listing: ${error.message || 'Please check your connection and try again.'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (id) => {
    Alert.alert('Delete', 'Delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
        if (!error) {
          addNotification({
            type: 'error',
            title: '🗑️ Listing Deleted',
            message: 'Your listing has been removed from the marketplace',
          });
          loadListings();
        }
      }},
    ]);
  };

  const pickImage = async (useCamera = false) => {
    try {
      // Request permissions
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required', 
          `Please allow ${useCamera ? 'camera' : 'photo library'} access to upload images`
        );
        return;
      }

      setUploadingImage(true);
      
      const pickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      };
      
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        const base64Data = asset.base64;
        
        console.log('Image selected, uploading to Supabase...');
        
        // Generate unique filename
        const fileName = `listing_${user?.id || 'anon'}_${Date.now()}.jpg`;
        
        try {
          // Convert base64 to Uint8Array for upload
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('marketplace-images')
            .upload(fileName, bytes.buffer, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Show error but still allow using local preview
            Alert.alert(
              'Upload Issue',
              'Image saved locally. To share with buyers, please set up Supabase Storage.',
              [{ text: 'OK' }]
            );
            setSellForm(prev => ({ ...prev, image_url: imageUri }));
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('marketplace-images')
              .getPublicUrl(fileName);
            
            const publicUrl = urlData.publicUrl;
            console.log('Image uploaded successfully:', publicUrl);
            
            setSellForm(prev => ({ ...prev, image_url: publicUrl }));
            Alert.alert('Success', 'Image uploaded! Buyers will be able to see it.');
          }
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr);
          // Fallback to local URI for preview
          setSellForm(prev => ({ ...prev, image_url: imageUri }));
          Alert.alert(
            'Upload Failed',
            'Using local image. To share with buyers, set up Supabase Storage bucket.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    if (sellForm.images.length >= 5) {
      Alert.alert(t('error'), t('maxImages'));
      return;
    }
    Alert.alert(
      t('addPhoto'),
      '',
      [
        { text: t('takePhoto'), onPress: () => pickMultipleImages(true) },
        { text: t('chooseFromGallery'), onPress: () => pickMultipleImages(false) },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  // Pick multiple images (up to 5)
  const pickMultipleImages = async (useCamera = false) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', `Please allow ${useCamera ? 'camera' : 'photo library'} access`);
        return;
      }

      setUploadingImage(true);
      
      const pickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: !useCamera,
        allowsMultipleSelection: !useCamera,
        selectionLimit: 5 - sellForm.images.length,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      };
      
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ ...pickerOptions, allowsMultipleSelection: false })
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets?.length > 0) {
        const newImages = [];
        
        for (const asset of result.assets) {
          if (sellForm.images.length + newImages.length >= 5) break;
          
          const fileName = `listing_${user?.id || 'anon'}_${Date.now()}_${newImages.length}.jpg`;
          
          try {
            // Convert base64 to Uint8Array
            const binaryString = atob(asset.base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('marketplace-images')
              .upload(fileName, bytes.buffer, { contentType: 'image/jpeg', upsert: true });

            if (!uploadError) {
              const { data: urlData } = supabase.storage.from('marketplace-images').getPublicUrl(fileName);
              newImages.push(urlData.publicUrl);
            } else {
              newImages.push(asset.uri); // Fallback to local URI
            }
          } catch (err) {
            newImages.push(asset.uri);
          }
        }
        
        setSellForm(prev => ({ 
          ...prev, 
          images: [...prev.images, ...newImages],
          image_url: prev.images.length === 0 ? newImages[0] : prev.image_url 
        }));
        
        Alert.alert('Success', `${newImages.length} image(s) added!`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image from array
  const removeImage = (index) => {
    setSellForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return { 
        ...prev, 
        images: newImages,
        image_url: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  // Pick video (max 20 sec, < 10 MB)
  const pickVideo = async (useCamera = false) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to record/select video');
        return;
      }

      setUploadingVideo(true);
      setUploadProgress(0);
      
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            videoMaxDuration: 20, // Max 20 seconds
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true,
            videoMaxDuration: 20,
            quality: 0.5,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check video duration (if available)
        if (asset.duration && asset.duration > 20000) {
          Alert.alert('Video Too Long', 'Please select a video under 20 seconds');
          setUploadingVideo(false);
          return;
        }

        // Check file size (estimate ~10MB limit)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert('Video Too Large', 'Please select a video under 10 MB');
          setUploadingVideo(false);
          return;
        }

        const fileName = `video_${user?.id || 'anon'}_${Date.now()}.mp4`;
        
        try {
          // Fetch video as blob
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          
          // Convert blob to array buffer
          const arrayBuffer = await new Response(blob).arrayBuffer();
          
          setUploadProgress(30);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('marketplace-videos')
            .upload(fileName, arrayBuffer, {
              contentType: 'video/mp4',
              upsert: true,
            });

          setUploadProgress(80);

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('marketplace-videos').getPublicUrl(fileName);
            setSellForm(prev => ({ ...prev, video_url: urlData.publicUrl }));
            setUploadProgress(100);
            Alert.alert('Success', 'Video uploaded successfully!');
          } else {
            console.error('Video upload error:', uploadError);
            setSellForm(prev => ({ ...prev, video_url: asset.uri }));
            Alert.alert('Upload Issue', 'Video saved locally. Set up Supabase Storage for sharing.');
          }
        } catch (err) {
          console.error('Video upload failed:', err);
          setSellForm(prev => ({ ...prev, video_url: asset.uri }));
          Alert.alert('Upload Failed', 'Using local video preview.');
        }
      }
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Error', 'Failed to pick video');
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const showVideoOptions = () => {
    if (sellForm.video_url) {
      Alert.alert('Replace Video?', 'Do you want to replace the current video?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace', onPress: () => showVideoPickerOptions() },
      ]);
    } else {
      showVideoPickerOptions();
    }
  };

  const showVideoPickerOptions = () => {
    Alert.alert(
      t('addVideo'),
      t('maxVideoLength'),
      [
        { text: t('recordVideo'), onPress: () => pickVideo(true) },
        { text: t('chooseFromGallery'), onPress: () => pickVideo(false) },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const getCropInfo = (cropId) => CROPS.find(c => c.id === cropId) || { name: cropId, icon: '🌾' };
  
  // Filter listings based on search query and selected crop
  const getFilteredListings = () => {
    const baseList = mode === 'seller' ? myListings : listings;
    
    if (!selectedCropFilter && !searchQuery) {
      return baseList;
    }
    
    return baseList.filter(listing => {
      // Filter by selected crop
      if (selectedCropFilter && listing.crop !== selectedCropFilter) {
        return false;
      }
      
      // Filter by search query (search in crop name, location, description)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const cropInfo = getCropInfo(listing.crop);
        const searchableText = [
          listing.crop,
          cropInfo.name,
          cropInfo.nameHi,
          listing.location,
          listing.description,
          listing.seller_name
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
      }
      
      return true;
    });
  };
  
  const formatTimeAgo = (dateString) => {
    const diffMins = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffMins < 1440) return t('hoursAgo', { count: Math.floor(diffMins / 60) });
    return t('daysAgo', { count: Math.floor(diffMins / 1440) });
  };

  return (
    <View style={styles.container}>
      {/* AppHeader with Sellers/Buyers Toggle */}
      <AppHeader 
        showToggle={true}
        mode={mode}
        onModeChange={(newMode) => setMode(newMode)}
      />

      {/* Real-time Oilseed News Ticker - Continuous Marquee */}
      <View style={styles.newsTickerContainer}>
        <View style={styles.newsTickerBadge}>
          <View style={styles.newsLiveDot} />
          <Text style={styles.newsLiveText}>LIVE</Text>
        </View>
        <View style={styles.newsTickerContent}>
          <Animated.View 
            style={[
              styles.newsTextContainer,
              { transform: [{ translateX: scrollX }] }
            ]}
          >
            <View style={{ width: TICKER_SEGMENT_WIDTH, flexDirection: 'row' }}>
              <Text style={styles.newsTickerText}>{tickerNews}{tickerNews}</Text>
            </View>
            <View style={{ width: TICKER_SEGMENT_WIDTH, flexDirection: 'row' }}>
              <Text style={styles.newsTickerText}>{tickerNews}{tickerNews}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Search Bar with Voice */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isHindi ? 'फसल खोजें...' : 'Search crops...'}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <VoiceSearchButton 
          size="medium"
          onSearch={(cropId, displayName) => {
            setSelectedCropFilter(cropId);
            setSearchQuery(displayName);
            // Announce the search
            Speech.speak(
              isHindi ? `${displayName} की लिस्टिंग दिखा रहा हूं` : `Showing ${displayName} listings`,
              { language: isHindi ? 'hi-IN' : 'en-US', rate: 0.9 }
            );
          }}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop Filter Chips - Horizontal Scroll */}
        <View style={styles.cropChipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropChipsContainer}>
            {/* All crops chip */}
            <TouchableOpacity 
              style={[styles.cropChip, selectedCropFilter === '' && styles.cropChipActive]}
              onPress={() => {
                setSelectedCropFilter('');
                setSearchQuery('');
              }}
            >
              <Text style={styles.cropChipIcon}>🌾</Text>
              <Text style={[styles.cropChipText, selectedCropFilter === '' && styles.cropChipTextActive]}>
                {isHindi ? 'सभी' : 'All'}
              </Text>
            </TouchableOpacity>
            {CROPS.map((crop) => (
              <TouchableOpacity 
                key={crop.id} 
                style={[styles.cropChip, selectedCropFilter === crop.id && styles.cropChipActive]}
                onPress={() => {
                  const newFilter = selectedCropFilter === crop.id ? '' : crop.id;
                  setSelectedCropFilter(newFilter);
                  setSearchQuery(newFilter ? (isHindi ? crop.nameHi : crop.name) : '');
                }}
              >
                <Text style={styles.cropChipIcon}>{crop.icon}</Text>
                <Text style={[styles.cropChipText, selectedCropFilter === crop.id && styles.cropChipTextActive]}>
                  {isHindi ? crop.nameHi : crop.name}
                </Text>
              </TouchableOpacity>
            ))}
            {mode === 'seller' && (
              <TouchableOpacity style={styles.addCropChip} onPress={() => setSellModalVisible(true)}>
                <Ionicons name="add" size={18} color="#16a34a" />
                <Text style={styles.addCropText}>{t('newListing')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* AgriSure DSS Card - Above Marketplace */}
        <View style={styles.dssCard}>
          <View style={styles.dssHeader}>
            <Ionicons name="analytics" size={24} color="#111827" />
            <Text style={styles.dssTitle}>AgriSure DSS</Text>
          </View>
          <Text style={styles.dssSubtitle}>"India's first Hedging Decision Engine"</Text>
          <View style={styles.dssScoreSection}>
            <View>
              <Text style={styles.scoreLabel}>HOLX™ Score</Text>
              <Text style={styles.scoreValue}>{dssScore}</Text>
            </View>
            <TouchableOpacity style={styles.dssButton} onPress={() => router.push('/dss')}>
              <Text style={styles.dssButtonText}>Open DSS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {mode === 'seller' 
              ? `🏪 ${t('myListings')}` 
              : `🛒 ${t('marketplace')}`}
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Product Listings - Horizontal Scroll Cards */}
        <View style={styles.listingsSection}>
          {loadingListings ? (
            <ActivityIndicator size="large" color="#16a34a" style={{ marginVertical: 40 }} />
          ) : getFilteredListings().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>
                {selectedCropFilter || searchQuery
                  ? (isHindi ? 'कोई परिणाम नहीं मिला' : 'No results found')
                  : mode === 'seller' 
                    ? `${t('noListings')}\n${t('addFirstListing')}`
                    : t('noProductsAvailable')}
              </Text>
              {(selectedCropFilter || searchQuery) && (
                <TouchableOpacity 
                  style={styles.clearFilterBtn} 
                  onPress={() => {
                    setSelectedCropFilter('');
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#16a34a" />
                  <Text style={styles.clearFilterText}>{isHindi ? 'फ़िल्टर हटाएं' : 'Clear filters'}</Text>
                </TouchableOpacity>
              )}
              {mode === 'seller' && !selectedCropFilter && !searchQuery && (
                <TouchableOpacity style={styles.addFirstBtn} onPress={() => setSellModalVisible(true)}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addFirstBtnText}>{t('addListing')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.listingsScroll}
              pagingEnabled
              snapToInterval={SCREEN_WIDTH - 40}
              decelerationRate="fast"
            >
              {getFilteredListings().map((listing) => {
                const crop = getCropInfo(listing.crop);
                const isOwn = listing.seller_id === user?.id;
                const formattedDate = new Date(listing.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                
                return (
                  <TouchableOpacity 
                    key={listing.id} 
                    style={styles.productCard}
                    onPress={() => router.push({ pathname: '/listing-detail', params: { id: listing.id } })}
                    activeOpacity={0.9}
                  >
                    {/* Date Badge */}
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateText}>{t('date')}: {formattedDate}</Text>
                    </View>
                    
                    {/* Product Image/Gallery */}
                    <View style={styles.productImageContainer}>
                      {listing.image_url || (listing.images && listing.images.length > 0) ? (
                        <>
                          <Image 
                            source={{ uri: listing.images?.[0] || listing.image_url }} 
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                          
                          {/* Image Count Badge */}
                          {listing.images && listing.images.length > 1 && (
                            <View style={styles.imageCountBadge}>
                              <Ionicons name="images" size={12} color="#fff" />
                              <Text style={styles.imageCountText}>{listing.images.length}</Text>
                            </View>
                          )}
                          
                          {/* Video Badge */}
                          {listing.video_url && (
                            <View style={styles.videoBadge}>
                              <Ionicons name="videocam" size={14} color="#fff" />
                              <Text style={styles.videoBadgeText}>Video</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Text style={styles.productImageEmoji}>{crop.icon}</Text>
                          <Text style={styles.noImageText}>{t('addPhoto')}</Text>
                        </View>
                      )}
                      
                      {/* Share Button */}
                      <TouchableOpacity style={styles.shareBtn}>
                        <Ionicons name="share-social" size={16} color="#16a34a" />
                        <Text style={styles.shareBtnText}>Share</Text>
                      </TouchableOpacity>
                      
                      {/* Delete Button for Seller */}
                      {mode === 'seller' && isOwn && (
                        <TouchableOpacity 
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteListing(listing.id)}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Product Info */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {t(crop.id)} {listing.location ? `- ${listing.location}` : ''}
                      </Text>
                      
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={14} color="#16a34a" />
                        <Text style={styles.locationValue}>{listing.location || 'Location not specified'}</Text>
                      </View>
                      
                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.priceLabel}>{t('price')}</Text>
                          <Text style={styles.priceValue}>₹{listing.price?.toLocaleString()}/qt</Text>
                        </View>
                        <View>
                          <Text style={styles.priceLabel}>{t('quantity')}</Text>
                          <Text style={styles.quantityValue}>{listing.quantity} Qt</Text>
                        </View>
                      </View>
                      
                      {/* Quality Badge */}
                      {listing.quality_grade && (
                        <View style={styles.qualityRow}>
                          <View style={styles.qualityBadge2}>
                            <Ionicons name="star" size={12} color="#f59e0b" />
                            <Text style={styles.qualityText}>Grade {listing.quality_grade}</Text>
                          </View>
                        </View>
                      )}
                      
                      {/* Contact Button */}
                      {mode === 'buyer' && (
                        <TouchableOpacity 
                          style={styles.contactBtn}
                          onPress={() => Alert.alert(
                            t('contactSeller'),
                            `${listing.seller_name}\n${t('phoneNumber')}: ${listing.contact_phone || 'N/A'}`,
                            [
                              { text: t('close') },
                              { text: 'Call', onPress: () => {} }
                            ]
                          )}
                        >
                          <Ionicons name="call" size={16} color="#fff" />
                          <Text style={styles.contactBtnText}>{t('contactSeller')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Market Snapshot */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <Ionicons name="bar-chart" size={18} color="#6b7280" />
            <Text style={styles.marketTitle}>Market Snapshot</Text>
          </View>
          
          <View style={styles.pricesList}>
            <View style={styles.priceItem}>
              <Text style={styles.cropName}>Soybean</Text>
              <View style={styles.priceRight}>
                <Text style={styles.priceValue}>₹{marketData.soybean.price.toLocaleString()}</Text>
                <Text style={[styles.priceChange, { color: marketData.soybean.change > 0 ? '#16a34a' : '#ef4444' }]}>
                  {marketData.soybean.change > 0 ? '↗' : '↘'}{Math.abs(marketData.soybean.change)}%
                </Text>
              </View>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.cropName}>Mustard Seed</Text>
              <View style={styles.priceRight}>
                <Text style={styles.priceValue}>₹{marketData.mustard.price.toLocaleString()}</Text>
                <Text style={[styles.priceChange, { color: marketData.mustard.change > 0 ? '#16a34a' : '#ef4444' }]}>
                  {marketData.mustard.change > 0 ? '↗' : '↘'}{Math.abs(marketData.mustard.change)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Gainers/Losers Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'gainers' && styles.tabActive]}
              onPress={() => setActiveTab('gainers')}
            >
              <Text style={[styles.tabText, activeTab === 'gainers' && styles.tabTextActive]}>Top Gainers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'losers' && styles.tabActive]}
              onPress={() => setActiveTab('losers')}
            >
              <Text style={[styles.tabText, activeTab === 'losers' && styles.tabTextActive]}>Top Losers</Text>
            </TouchableOpacity>
          </View>

          {(activeTab === 'gainers' ? NCDEX_DATA.gainers : NCDEX_DATA.losers).map((item, index) => (
            <View key={index} style={styles.contractRow}>
              <View style={styles.contractInfo}>
                <Text style={styles.contractName}>{item.name}</Text>
                <Text style={styles.contractCode}>{item.contract}</Text>
              </View>
              <Text style={styles.contractPrice}>₹{item.price}</Text>
              <Text style={[styles.contractChange, { color: item.change.startsWith('+') ? '#16a34a' : '#ef4444' }]}>
                {item.change}%
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.viewChartsButton} onPress={() => router.push('/(tabs)/market')}>
            <Text style={styles.viewChartsText}>View Charts</Text>
            <Ionicons name="chevron-forward-circle" size={18} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.hedgeButton} onPress={() => router.push('/contracts')}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
            <Text style={styles.hedgeButtonText}>Place Hedge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.learningButton} onPress={() => router.push('/education-simple')}>
            <Ionicons name="school" size={24} color="#fff" />
            <Text style={styles.learningButtonText}>Learning Hub</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sell Modal */}
      <Modal visible={sellModalVisible} animationType="slide" transparent onRequestClose={() => setSellModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('newListing')}</Text>
              <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>{t('selectCrop')} *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CROPS.map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[styles.cropOption, sellForm.crop === crop.id && styles.cropOptionSelected]}
                    onPress={() => setSellForm({ ...sellForm, crop: crop.id })}
                  >
                    <Text style={styles.cropOptionIcon}>{crop.icon}</Text>
                    <Text style={[styles.cropOptionText, sellForm.crop === crop.id && styles.cropOptionTextSelected]}>
                      {isHindi ? crop.nameHi : crop.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.inputLabel}>{t('quantityQt')} *</Text>
              <TextInput style={styles.input} value={sellForm.quantity} onChangeText={(t) => setSellForm({ ...sellForm, quantity: t })} placeholder="50" keyboardType="numeric" />
              
              <Text style={styles.inputLabel}>{t('pricePerQt')} *</Text>
              <TextInput style={styles.input} value={sellForm.price} onChangeText={(t) => setSellForm({ ...sellForm, price: t })} placeholder="4500" keyboardType="numeric" />
              
              <Text style={styles.inputLabel}>{t('qualityGrade')}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['A', 'B', 'C'].map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.gradeButton, sellForm.quality_grade === grade && styles.gradeButtonSelected]}
                    onPress={() => setSellForm({ ...sellForm, quality_grade: grade })}
                  >
                    <Text style={[styles.gradeButtonText, sellForm.quality_grade === grade && styles.gradeButtonTextSelected]}>
                      Grade {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.inputLabel}>{t('location')}</Text>
              <TextInput style={styles.input} value={sellForm.location} onChangeText={(t) => setSellForm({ ...sellForm, location: t })} placeholder="City, State" />
              
              <Text style={styles.inputLabel}>{t('contactPhone')}</Text>
              <TextInput style={styles.input} value={sellForm.contact_phone} onChangeText={(t) => setSellForm({ ...sellForm, contact_phone: t })} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              
              <Text style={styles.inputLabel}>{t('description')}</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={sellForm.description} onChangeText={(text) => setSellForm({ ...sellForm, description: text })} placeholder="..." multiline />
              
              {/* Multiple Images Section (1-5) */}
              <Text style={styles.inputLabel}>
                {t('addPhoto')} (1-5) 
                <Text style={{ color: '#6b7280', fontWeight: 'normal' }}> ({sellForm.images.length}/5)</Text>
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Existing Images */}
                  {sellForm.images.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewSmall}>
                      <Image source={{ uri }} style={styles.imagePreviewImg} />
                      <TouchableOpacity 
                        style={styles.removeImageBtnSmall}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                      </TouchableOpacity>
                      {index === 0 && (
                        <View style={styles.mainImageBadge}>
                          <Text style={styles.mainImageText}>Main</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  
                  {/* Add Image Button */}
                  {sellForm.images.length < 5 && (
                    <TouchableOpacity 
                      style={styles.addImageBtn} 
                      onPress={showImageOptions}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator color="#16a34a" />
                      ) : (
                        <>
                          <Ionicons name="camera" size={28} color="#16a34a" />
                          <Text style={styles.addImageText}>
                            {sellForm.images.length === 0 ? t('addPhoto') : '+'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              {/* Video Section (max 20 sec, 10 MB) */}
              <Text style={styles.inputLabel}>
                {t('addVideo')}
                <Text style={{ color: '#6b7280', fontWeight: 'normal' }}> - {t('maxVideoLength')}</Text>
              </Text>
              
              {sellForm.video_url ? (
                <View style={styles.videoPreviewContainer}>
                  <View style={styles.videoPreview}>
                    <Ionicons name="videocam" size={32} color="#16a34a" />
                    <Text style={styles.videoAddedText}>{t('videoUploaded')}</Text>
                    <Text style={styles.videoHint}>✓ Ready to upload</Text>
                  </View>
                  <View style={styles.videoActions}>
                    <TouchableOpacity 
                      style={styles.videoActionBtn}
                      onPress={showVideoOptions}
                    >
                      <Ionicons name="refresh" size={18} color="#3b82f6" />
                      <Text style={styles.videoActionText}>{t('edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.videoActionBtn, { borderColor: '#ef4444' }]}
                      onPress={() => setSellForm(prev => ({ ...prev, video_url: '' }))}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                      <Text style={[styles.videoActionText, { color: '#ef4444' }]}>{t('delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadVideoButton} 
                  onPress={showVideoOptions}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? (
                    <View style={{ alignItems: 'center' }}>
                      <ActivityIndicator color="#16a34a" />
                      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        Uploading... {uploadProgress}%
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="videocam" size={28} color="#16a34a" />
                      <Text style={styles.uploadButtonText}>
                        {t('addVideo')}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                        {t('maxVideoLength')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 16 }}>
                📷 📹
              </Text>
            </ScrollView>
            <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSellSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('createListing')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  // Main Container
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  content: { 
    flex: 1,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  clearBtn: {
    padding: 4,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  
  // News Ticker - Clean & Compact
  newsTickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  newsTickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  newsLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  newsLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  newsTickerContent: {
    flex: 1,
    overflow: 'hidden',
    height: 18,
    justifyContent: 'center',
  },
  newsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsTickerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  
  // Crop Filter Chips - Compact
  cropChipsWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cropChipsContainer: { 
    paddingHorizontal: 16,
    gap: 8,
  },
  cropChip: { 
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 6,
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    marginRight: 8,
  },
  cropChipActive: { 
    backgroundColor: '#dcfce7', 
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  cropChipIcon: { fontSize: 16 },
  cropChipText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  cropChipTextActive: { color: '#15803d', fontWeight: '600' },
  addCropChip: { 
    flexDirection: 'row',
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#f0fdf4', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
  },
  addCropText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  
  // Section Title - Clean
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  liveBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#15803d', letterSpacing: 0.3 },
  
  // Add Listing Banner
  addListingBanner: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerContent: { flex: 1, padding: 16 },
  trustedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  trustedText: { fontSize: 10, fontWeight: '600', color: '#16a34a' },
  bannerTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 },
  upgradeBtn: { 
    backgroundColor: '#16a34a', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradeBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  bannerImage: { width: 100, height: 120 },
  
  // Listings Section
  listingsSection: { minHeight: 280 },
  listingsScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  
  // Product Card - Modern Clean Design
  productCard: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  dateBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dateText: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  productImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  productImageEmoji: { fontSize: 56 },
  noImageText: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  imageCountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  videoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  shareBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shareBtnText: { fontSize: 11, fontWeight: '600', color: '#16a34a' },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: { padding: 14 },
  productTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 8, lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationValue: { fontSize: 12, color: '#64748b' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2, fontWeight: '500' },
  priceValue: { fontSize: 17, fontWeight: '800', color: '#16a34a' },
  quantityValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  qualityRow: { marginBottom: 10 },
  qualityBadge2: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  qualityText: { fontSize: 11, fontWeight: '600', color: '#b45309' },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  contactBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  
  // Quick Help
  quickHelpBtn: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  quickHelpIcon: {
    backgroundColor: '#16a34a',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickHelpText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
  
  // Empty State
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 12, textAlign: 'center' },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  addFirstBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  
  // Legacy styles (keep for compatibility)
  gradeButton: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  gradeButtonSelected: { backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#16a34a' },
  gradeButtonText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  gradeButtonTextSelected: { color: '#16a34a', fontWeight: '600' },
  
  // DSS Card - Premium Look
  dssCard: { 
    backgroundColor: '#fff', 
    margin: 16, 
    marginTop: 12,
    padding: 16, 
    borderRadius: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dssHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  dssTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  dssSubtitle: { fontSize: 11, fontStyle: 'italic', color: '#64748b', marginBottom: 14 },
  dssScoreSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  scoreValue: { fontSize: 36, fontWeight: '800', color: '#ea580c' },
  dssButton: { 
    backgroundColor: '#16a34a', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dssButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  
  // Market Card - Clean Design
  marketCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  marketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  marketTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  pricesList: { marginBottom: 14 },
  priceItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
  },
  cropName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceChange: { fontSize: 13, fontWeight: '700' },
  tabsContainer: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 8, 
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { 
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#16a34a' },
  contractRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
  },
  contractInfo: { flex: 1 },
  contractName: { fontSize: 13, fontWeight: '600', color: '#334155' },
  contractCode: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  contractPrice: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginRight: 12 },
  contractChange: { fontSize: 12, fontWeight: '700', width: 55, textAlign: 'right' },
  viewChartsButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 12, 
    marginTop: 10, 
    backgroundColor: '#f0fdf4', 
    borderRadius: 10,
  },
  viewChartsText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  
  // Action Buttons - Modern
  actionButtonsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    gap: 12, 
    marginBottom: 16,
  },
  hedgeButton: { 
    flex: 1, 
    backgroundColor: '#16a34a', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    borderRadius: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  hedgeButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  learningButton: { 
    flex: 1, 
    backgroundColor: '#ea580c', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14, 
    borderRadius: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  learningButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalContent: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 15 },
  cropOption: { alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f3f4f6', marginRight: 8, minWidth: 70 },
  cropOptionSelected: { backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#16a34a' },
  cropOptionIcon: { fontSize: 24, marginBottom: 4 },
  cropOptionText: { fontSize: 11, fontWeight: '500', color: '#6b7280' },
  cropOptionTextSelected: { color: '#16a34a', fontWeight: '600' },
  uploadButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    backgroundColor: '#dcfce7', 
    borderWidth: 2, 
    borderColor: '#16a34a', 
    borderStyle: 'dashed', 
    borderRadius: 10, 
    padding: 20,
    marginBottom: 8,
  },
  uploadButtonText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  imagePreviewContainer: { position: 'relative', marginBottom: 8 },
  imagePreview: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#f3f4f6' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 12 },
  
  // Multiple Images Styles
  imagePreviewSmall: {
    width: 90,
    height: 90,
    borderRadius: 10,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageBtnSmall: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  addImageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 4,
  },
  
  // Video Styles
  uploadVideoButton: {
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 8,
    backgroundColor: '#f0fdf4',
  },
  videoPreviewContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  videoPreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  videoAddedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 8,
  },
  videoHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  videoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  videoActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b82f6',
  },
  
  submitButton: { backgroundColor: '#16a34a', margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
