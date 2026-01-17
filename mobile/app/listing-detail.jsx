import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../config/supabase';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CROPS = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन', icon: '🫘' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों', icon: '🌻' },
  { id: 'groundnut', name: 'Groundnut', nameHi: 'मूंगफली', icon: '🥜' },
  { id: 'sunflower', name: 'Sunflower', nameHi: 'सूरजमुखी', icon: '🌻' },
  { id: 'rapeseed', name: 'Rapeseed', nameHi: 'तोरिया', icon: '🌱' },
  { id: 'castor', name: 'Castor', nameHi: 'अरंडी', icon: '🌿' },
];

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { i18n } = useTranslation();
  const { user } = useSupabaseAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const isHindi = i18n.language === 'hi';

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCropInfo = (cropId) => CROPS.find(c => c.id === cropId) || { name: cropId, nameHi: cropId, icon: '🌾' };

  const handleCall = () => {
    if (listing?.contact_phone) {
      Linking.openURL(`tel:${listing.contact_phone}`);
    } else {
      Alert.alert(isHindi ? 'संपर्क उपलब्ध नहीं' : 'No Contact', isHindi ? 'फोन नंबर नहीं दिया' : 'No phone number provided');
    }
  };

  const handleWhatsApp = () => {
    if (listing?.contact_phone) {
      const msg = isHindi ? `नमस्ते, AgriSure पर आपकी लिस्टिंग में रुचि है।` : `Hi, interested in your listing on AgriSure.`;
      const phone = listing.contact_phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(msg)}`);
    } else {
      Alert.alert(isHindi ? 'WhatsApp उपलब्ध नहीं' : 'No WhatsApp', isHindi ? 'फोन नंबर नहीं' : 'No phone number');
    }
  };

  const handleShare = async () => {
    try {
      const crop = getCropInfo(listing?.crop);
      await Share.share({
        message: `🌾 ${isHindi ? crop.nameHi : crop.name} - ₹${listing?.price}/qt, ${listing?.quantity} qt @ ${listing?.location || 'N/A'} - AgriSure`,
      });
    } catch (e) {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{isHindi ? 'लिस्टिंग नहीं मिली' : 'Listing not found'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{isHindi ? 'वापस' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const crop = getCropInfo(listing.crop);
  // Only hide buttons if user is logged in AND is the owner of this listing
  const isOwner = user?.id && listing.seller_id && listing.seller_id === user.id;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isHindi ? 'विवरण' : 'Details'}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Ionicons name="share-social-outline" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {listing.image_url ? (
            <Image source={{ uri: listing.image_url }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ fontSize: 60 }}>{crop.icon}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: listing.status === 'active' ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={styles.statusText}>{listing.status === 'active' ? '● Active' : '● Closed'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cropRow}>
            <Text style={{ fontSize: 36 }}>{crop.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cropName}>{isHindi ? crop.nameHi : crop.name}</Text>
              {listing.quality_grade && <Text style={styles.grade}>Grade {listing.quality_grade}</Text>}
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{isHindi ? 'कीमत' : 'Price'}</Text>
              <Text style={styles.priceValue}>₹{listing.price?.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>/qt</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{isHindi ? 'मात्रा' : 'Qty'}</Text>
              <Text style={styles.qtyValue}>{listing.quantity}</Text>
              <Text style={styles.priceUnit}>qt</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>{isHindi ? 'कुल' : 'Total'}</Text>
              <Text style={styles.totalValue}>₹{(listing.price * listing.quantity).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Ionicons name="location" size={20} color="#16a34a" />
          <Text style={styles.detailText}>{listing.location || 'Not specified'}</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{listing.seller_name?.charAt(0)?.toUpperCase() || 'S'}</Text>
          </View>
          <View>
            <Text style={styles.sellerLabel}>{isHindi ? 'विक्रेता' : 'Seller'}</Text>
            <Text style={styles.sellerName}>{listing.seller_name || 'Unknown'}</Text>
          </View>
        </View>

        {listing.description && (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>{isHindi ? 'विवरण' : 'Description'}</Text>
            <Text style={styles.descText}>{listing.description}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Always show contact buttons for non-owners (buyers) */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.btnText}>{isHindi ? 'कॉल' : 'Call'}</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Show owner badge if this is user's own listing */}
      {isOwner && (
        <View style={styles.ownerBar}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.ownerText}>{isHindi ? 'यह आपकी लिस्टिंग है' : 'This is your listing'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  errorText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  backBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  content: { flex: 1 },
  imageSection: { width: SCREEN_WIDTH, height: 220, backgroundColor: '#e5e7eb', position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' },
  statusBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#111' },
  infoCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: 16, padding: 16, elevation: 4 },
  cropRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cropName: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  grade: { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  priceRow: { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  priceBox: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#9ca3af' },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },
  qtyValue: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  priceUnit: { fontSize: 10, color: '#9ca3af' },
  detailCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, gap: 12 },
  detailText: { fontSize: 14, color: '#111', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  sellerLabel: { fontSize: 11, color: '#9ca3af' },
  sellerName: { fontSize: 14, fontWeight: '600', color: '#111' },
  descCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14 },
  descLabel: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 6 },
  descText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 30, gap: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  whatsappBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 12, gap: 8 },
  callBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  ownerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dcfce7', paddingVertical: 16, paddingBottom: 34, gap: 8, borderTopWidth: 1, borderTopColor: '#bbf7d0' },
  ownerText: { fontSize: 15, fontWeight: '600', color: '#16a34a' },
});
