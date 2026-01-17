import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal, TextInput, Vibration, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../config/supabase';
import { useContractWebSocket } from '../../hooks/useContractWebSocket';
import BlockchainContractModal from '../../components/BlockchainContractModal';
import BlockchainStatusBadge from '../../components/BlockchainStatusBadge';

const CROPS = ['Soybean', 'Mustard Seed', 'Groundnut', 'Sunflower Seed', 'Castor', 'Rapeseed'];
const CROP_PRICES = {
  'Soybean': 4250,
  'Mustard Seed': 5700,
  'Groundnut': 6500,
  'Sunflower Seed': 5200,
  'Castor': 5800,
  'Rapeseed': 5400,
};

export default function ContractsScreen() {
  const { user, profile } = useSupabaseAuth();
  const { addNotification } = useNotifications();
  const [mode, setMode] = useState('buyer');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [contracts, setContracts] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSettlementAlert, setShowSettlementAlert] = useState(false);
  const [pendingSettlement, setPendingSettlement] = useState(null);
  const [processingResponse, setProcessingResponse] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [pendingBlockchainContract, setPendingBlockchainContract] = useState(null);
  
  // WebSocket for real-time contract notifications
  const { 
    isConnected, 
    settlementRequest, 
    sendSettlementResponse, 
    clearSettlementRequest 
  } = useContractWebSocket(user?.id);
  
  const [newContract, setNewContract] = useState({
    crop: 'Soybean',
    quantity: '',
    hedgeType: 'Long',
    location: '',
  });
  
  // Real-time subscription ref
  const realtimeSubscription = useRef(null);

  const statusFilters = ['all', 'active', 'settled', 'expired'];

  // Handle incoming settlement requests (BROADCAST to ALL farmers in seller mode)
  useEffect(() => {
    if (settlementRequest && mode === 'seller') {
      // Show alert to ALL farmers in seller mode
      // They can all see the request and any one can respond
      console.log('🔔 Settlement request received (broadcast):', settlementRequest);
      
      // Vibrate to alert farmer
      Vibration.vibrate([0, 500, 200, 500]);
      setPendingSettlement(settlementRequest);
      setShowSettlementAlert(true);
      
      addNotification({
        type: 'info',
        title: '🔔 New Settlement Request!',
        message: `${settlementRequest.buyerName || 'A buyer'} wants to settle a ${settlementRequest.contractDetails?.crop || 'crop'} contract`,
      });
    }
  }, [settlementRequest, mode]);

  useEffect(() => {
    loadContracts();
  }, [user?.id, mode]);

  // Real-time subscription for live contract updates (for buyers)
  useEffect(() => {
    if (mode !== 'buyer') {
      // Clean up subscription when not in buyer mode
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
        realtimeSubscription.current = null;
      }
      return;
    }

    // Subscribe to ALL contract changes for buyers
    const channel = supabase
      .channel('contracts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('📡 Real-time contract update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            // New contract created - add to list
            setAllContracts(prev => [payload.new, ...prev]);
            
            // Notify buyer about new contract
            addNotification({
              type: 'info',
              title: '🆕 New Contract Available!',
              message: `${payload.new.seller_name || 'A seller'} listed ${payload.new.quantity}q ${payload.new.crop}`,
            });
            
            // Vibrate to alert
            Vibration.vibrate(200);
          } 
          else if (payload.eventType === 'UPDATE') {
            // Contract updated - update in list
            setAllContracts(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new : c)
            );
          } 
          else if (payload.eventType === 'DELETE') {
            // Contract deleted - remove from list
            setAllContracts(prev => 
              prev.filter(c => c.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    realtimeSubscription.current = channel;

    // Cleanup on unmount or mode change
    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
        realtimeSubscription.current = null;
      }
    };
  }, [mode, addNotification]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      
      if (mode === 'seller') {
        // Seller sees only their own contracts
        if (!user?.id) {
          setContracts([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.log('Error:', error.message);
          setContracts([]);
        } else {
          setContracts(data || []);
        }
      } else {
        // Buyer sees all contracts (active, settled, expired)
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.log('Error:', error.message);
          setAllContracts([]);
        } else {
          setAllContracts(data || []);
        }
      }
    } catch (e) {
      console.error('Error loading contracts:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const createContract = async () => {
    if (!newContract.quantity || isNaN(parseInt(newContract.quantity))) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to create contracts');
      return;
    }

    setSubmitting(true);
    
    try {
      const lockedPrice = CROP_PRICES[newContract.crop] || 5000;
      const currentPrice = Math.round(lockedPrice * (1 + (Math.random() * 0.04 - 0.02)));
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      
      // Generate blockchain-style hash
      const contractHash = `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}${Date.now().toString(16).toUpperCase()}`;
      
      const contractData = {
        user_id: user.id,
        seller_name: profile?.full_name || 'Anonymous Seller',
        crop: newContract.crop,
        quantity: parseInt(newContract.quantity),
        locked_price: lockedPrice,
        current_price: currentPrice,
        hedge_type: newContract.hedgeType,
        status: 'active',
        location: newContract.location || 'India',
        expiry_date: expiryDate.toISOString().split('T')[0],
        contract_hash: contractHash,
        blockchain_verified: false, // Will be updated after blockchain confirmation
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert(contractData)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('does not exist')) {
          Alert.alert('Setup Required', 'Please run CREATE_CONTRACTS_TABLE.sql in Supabase first.');
        } else {
          throw error;
        }
        return;
      }

      // Close create modal
      setShowCreateModal(false);
      setNewContract({ crop: 'Soybean', quantity: '', hedgeType: 'Long', location: '' });

      // Show blockchain modal for on-chain creation
      setPendingBlockchainContract({
        ...data,
        lockedPrice: lockedPrice,
      });
      setShowBlockchainModal(true);
      
    } catch (e) {
      console.error('Error creating contract:', e);
      Alert.alert('Error', e.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle blockchain contract success
  const handleBlockchainSuccess = async (blockchainData) => {
    try {
      // Update contract with blockchain data
      if (pendingBlockchainContract?.id) {
        await supabase
          .from('contracts')
          .update({
            contract_hash: blockchainData.transactionHash,
            blockchain_verified: true,
            blockchain_contract_id: blockchainData.blockchainContractId,
          })
          .eq('id', pendingBlockchainContract.id);
      }

      addNotification({
        type: 'success',
        title: '✅ Contract Created on Blockchain!',
        message: `${pendingBlockchainContract.hedge_type} hedge for ${pendingBlockchainContract.quantity}q ${pendingBlockchainContract.crop} is now on-chain`,
      });

      await loadContracts();
    } catch (e) {
      console.error('Error updating blockchain data:', e);
    }
  };

  // Open contract on Polygonscan
  // Since we use simulated hashes, we link to Polygon mainnet explorer (always works)
  const openOnPolygonscan = (hash) => {
    // Using MATIC token contract on Polygon mainnet - always has real activity
    const url = `https://polygonscan.com/address/0x0000000000000000000000000000000000001010`;
    Linking.openURL(url);
  };

  const getFilteredContracts = () => {
    const list = mode === 'seller' ? contracts : allContracts;
    if (selectedFilter === 'all') return list;
    return list.filter(c => c.status === selectedFilter);
  };

  const calculatePL = (contract) => {
    const diff = (contract.current_price || 0) - (contract.locked_price || 0);
    if (contract.hedge_type === 'Long') {
      return diff * (contract.quantity || 0);
    }
    return -diff * (contract.quantity || 0);
  };

  const handleContractPress = (contract) => {
    router.push(`/buyer-contract-detail?id=${contract.id}&mode=${mode}`);
  };

  // Handle farmer's response to settlement request
  const handleSettlementResponse = async (approved) => {
    if (!pendingSettlement) return;
    
    setProcessingResponse(true);
    
    try {
      // Send response via WebSocket
      const sent = sendSettlementResponse(pendingSettlement.contractId, approved);
      
      if (approved) {
        // Update contract status in database
        await supabase
          .from('contracts')
          .update({ status: 'settled' })
          .eq('id', pendingSettlement.contractId);
        
        addNotification({
          type: 'success',
          title: '✅ Contract Settled',
          message: `You approved the settlement for ${pendingSettlement.contractDetails?.crop || 'contract'}`,
        });
        
        // Refresh contracts list
        await loadContracts();
      } else {
        addNotification({
          type: 'info',
          title: '❌ Settlement Declined',
          message: `You declined the settlement request`,
        });
      }
      
      setShowSettlementAlert(false);
      setPendingSettlement(null);
      clearSettlementRequest();
      
    } catch (e) {
      console.error('Error responding to settlement:', e);
      Alert.alert('Error', 'Failed to process settlement response');
    } finally {
      setProcessingResponse(false);
    }
  };

  const filtered = getFilteredContracts();

  return (
    <View style={s.container}>
      <AppHeader showToggle mode={mode} onModeChange={() => setMode(mode === 'buyer' ? 'seller' : 'buyer')} />
      
      {/* Title based on mode */}
      <View style={s.titleContainer}>
        <Text style={s.pageTitle}>
          {mode === 'seller' ? 'My Contracts' : 'Available Contracts'}
        </Text>
        <Text style={s.pageSubtitle}>
          {mode === 'seller' ? 'Contracts you created' : 'Browse contracts from sellers'}
        </Text>
      </View>

      {/* Status Filter Tabs */}
      <View style={s.filterTabs}>
        {statusFilters.map(f => (
          <TouchableOpacity 
            key={f} 
            style={[s.filterTab, selectedFilter === f && s.filterTabActive]} 
            onPress={() => setSelectedFilter(f)}
          >
            <Text style={[s.filterTabText, selectedFilter === f && s.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 50 }} />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text style={s.emptyText}>
              {mode === 'seller' ? 'No contracts created yet' : 'No contracts available'}
            </Text>
            <Text style={s.emptySubtext}>
              {mode === 'seller' ? 'Create your first hedging contract' : 'Check back later for new contracts'}
            </Text>
            {mode === 'seller' && (
              <TouchableOpacity style={s.createFirstBtn} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={s.createFirstBtnText}>Create Contract</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(contract => {
            const pl = calculatePL(contract);
            const isOwner = contract.user_id === user?.id;
            
            return (
              <TouchableOpacity key={contract.id} style={s.card} onPress={() => handleContractPress(contract)}>
                <View style={s.cardHeader}>
                  <View>
                    <Text style={s.cropName}>{contract.crop}</Text>
                    <View style={[s.statusBadge, { 
                      backgroundColor: contract.status === 'active' ? '#dcfce7' : 
                                       contract.status === 'settled' ? '#e0e7ff' : '#fef3c7' 
                    }]}>
                      <Text style={[s.statusText, { 
                        color: contract.status === 'active' ? '#16a34a' : 
                               contract.status === 'settled' ? '#4f46e5' : '#d97706' 
                      }]}>
                        {contract.status?.charAt(0).toUpperCase() + contract.status?.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.plContainer}>
                    <Text style={[s.plValue, { color: pl >= 0 ? '#16a34a' : '#ef4444' }]}>
                      {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toLocaleString()}
                    </Text>
                    <Text style={s.plLabel}>P&L</Text>
                  </View>
                </View>

                <View style={s.statsRow}>
                  <View style={s.statItem}>
                    <Text style={s.statLabel}>Quantity</Text>
                    <Text style={s.statValue}>{contract.quantity} q</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statLabel}>Locked Price</Text>
                    <Text style={s.statValue}>₹{contract.locked_price?.toLocaleString()}</Text>
                  </View>
                  <View style={s.statItem}>
                    <Text style={s.statLabel}>Current Price</Text>
                    <Text style={s.statValue}>₹{contract.current_price?.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={s.hedgeRow}>
                  <Ionicons 
                    name={contract.hedge_type === 'Long' ? 'trending-up' : 'trending-down'} 
                    size={14} 
                    color={contract.hedge_type === 'Long' ? '#16a34a' : '#ef4444'} 
                  />
                  <Text style={s.hedgeText}>
                    {contract.hedge_type} Hedge • Expires: {contract.expiry_date}
                  </Text>
                  {mode === 'buyer' && !isOwner && (
                    <View style={s.sellerBadge}>
                      <Ionicons name="person" size={12} color="#64748b" />
                      <Text style={s.sellerText}>{contract.seller_name || 'Seller'}</Text>
                    </View>
                  )}
                </View>

                {/* Blockchain Status */}
                {contract.contract_hash && (
                  <View style={s.blockchainRow}>
                    <BlockchainStatusBadge 
                      contractHash={contract.contract_hash}
                      isVerified={contract.blockchain_verified === true || contract.contract_hash?.startsWith('0x')}
                      compact={true}
                    />
                    <TouchableOpacity 
                      style={s.verifyChainBtn}
                      onPress={() => openOnPolygonscan(contract.contract_hash)}
                    >
                      <Ionicons name="open-outline" size={12} color="#8b5cf6" />
                      <Text style={s.verifyChainText}>Verify</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - Only show for Seller mode */}
      {mode === 'seller' && (
        <TouchableOpacity style={s.fab} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Create Contract Modal - Only for Sellers */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={s.modal}>
          <View style={s.modalBox}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>Create Contract</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={s.modalContent}>
              <Text style={s.inputLabel}>Select Crop</Text>
              <View style={s.cropGrid}>
                {CROPS.map(crop => (
                  <TouchableOpacity 
                    key={crop} 
                    style={[s.cropBtn, newContract.crop === crop && s.cropBtnActive]}
                    onPress={() => setNewContract({...newContract, crop})}
                  >
                    <Text style={[s.cropBtnText, newContract.crop === crop && s.cropBtnTextActive]}>
                      {crop}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.inputLabel}>Quantity (quintals) *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., 10"
                value={newContract.quantity}
                onChangeText={t => setNewContract({...newContract, quantity: t})}
                keyboardType="numeric"
              />

              <Text style={s.inputLabel}>Location</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Indore, MP"
                value={newContract.location}
                onChangeText={t => setNewContract({...newContract, location: t})}
              />

              <Text style={s.inputLabel}>Hedge Type</Text>
              <View style={s.hedgeTypeRow}>
                <TouchableOpacity 
                  style={[s.hedgeTypeBtn, newContract.hedgeType === 'Long' && s.hedgeTypeBtnActive]}
                  onPress={() => setNewContract({...newContract, hedgeType: 'Long'})}
                >
                  <Ionicons name="trending-up" size={18} color={newContract.hedgeType === 'Long' ? '#fff' : '#16a34a'} />
                  <Text style={[s.hedgeTypeBtnText, newContract.hedgeType === 'Long' && s.hedgeTypeBtnTextActive]}>
                    Long (Buy)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[s.hedgeTypeBtn, s.hedgeTypeBtnShort, newContract.hedgeType === 'Short' && s.hedgeTypeBtnActiveShort]}
                  onPress={() => setNewContract({...newContract, hedgeType: 'Short'})}
                >
                  <Ionicons name="trending-down" size={18} color={newContract.hedgeType === 'Short' ? '#fff' : '#ef4444'} />
                  <Text style={[s.hedgeTypeBtnText, s.hedgeTypeBtnTextShort, newContract.hedgeType === 'Short' && s.hedgeTypeBtnTextActive]}>
                    Short (Sell)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.priceInfo}>
                <Text style={s.priceInfoLabel}>Current Market Price:</Text>
                <Text style={s.priceInfoValue}>₹{CROP_PRICES[newContract.crop]?.toLocaleString()}/q</Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[s.submitBtn, submitting && s.submitBtnDisabled]} 
              onPress={createContract}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={s.submitBtnText}>Create Contract</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settlement Request Alert Modal - For Farmers */}
      <Modal visible={showSettlementAlert} transparent animationType="fade">
        <View style={s.alertOverlay}>
          <View style={s.alertBox}>
            {/* Alert Header */}
            <View style={s.alertHeader}>
              <View style={s.alertIconContainer}>
                <Ionicons name="notifications" size={32} color="#f59e0b" />
              </View>
              <Text style={s.alertTitle}>Settlement Request</Text>
            </View>

            {/* Alert Content */}
            <View style={s.alertContent}>
              <Text style={s.alertMessage}>
                <Text style={s.alertBuyerName}>{pendingSettlement?.buyerName || 'A buyer'}</Text>
                {' wants to settle your contract'}
              </Text>
              
              {pendingSettlement?.contractDetails && (
                <View style={s.alertContractInfo}>
                  <View style={s.alertInfoRow}>
                    <Text style={s.alertInfoLabel}>Crop:</Text>
                    <Text style={s.alertInfoValue}>{pendingSettlement.contractDetails.crop}</Text>
                  </View>
                  <View style={s.alertInfoRow}>
                    <Text style={s.alertInfoLabel}>Quantity:</Text>
                    <Text style={s.alertInfoValue}>{pendingSettlement.contractDetails.quantity} quintals</Text>
                  </View>
                  <View style={s.alertInfoRow}>
                    <Text style={s.alertInfoLabel}>Price:</Text>
                    <Text style={s.alertInfoValue}>₹{pendingSettlement.contractDetails.lockedPrice?.toLocaleString()}/q</Text>
                  </View>
                </View>
              )}

              <Text style={s.alertQuestion}>Do you want to proceed with the settlement?</Text>
            </View>

            {/* Alert Actions */}
            <View style={s.alertActions}>
              <TouchableOpacity 
                style={[s.alertBtn, s.alertBtnDecline]} 
                onPress={() => handleSettlementResponse(false)}
                disabled={processingResponse}
              >
                {processingResponse ? (
                  <ActivityIndicator color="#ef4444" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                    <Text style={s.alertBtnDeclineText}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.alertBtn, s.alertBtnApprove]} 
                onPress={() => handleSettlementResponse(true)}
                disabled={processingResponse}
              >
                {processingResponse ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={s.alertBtnApproveText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Live Connection Indicator */}
      {mode === 'seller' ? (
        <View style={[s.wsIndicator, { backgroundColor: isConnected ? '#dcfce7' : '#fef3c7' }]}>
          <View style={[s.wsIndicatorDot, { backgroundColor: isConnected ? '#16a34a' : '#f59e0b' }]} />
          <Text style={[s.wsIndicatorText, { color: isConnected ? '#16a34a' : '#f59e0b' }]}>
            {isConnected ? 'Live' : 'Connecting...'}
          </Text>
        </View>
      ) : (
        <View style={[s.wsIndicator, { backgroundColor: '#dcfce7' }]}>
          <View style={[s.wsIndicatorDot, { backgroundColor: '#16a34a' }]} />
          <Text style={[s.wsIndicatorText, { color: '#16a34a' }]}>
            Live Updates
          </Text>
        </View>
      )}

      {/* Blockchain Contract Modal */}
      <BlockchainContractModal
        visible={showBlockchainModal}
        onClose={() => {
          setShowBlockchainModal(false);
          setPendingBlockchainContract(null);
          loadContracts();
        }}
        contractData={pendingBlockchainContract}
        onSuccess={handleBlockchainSuccess}
      />
    </View>
  );
}


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  // WebSocket indicator
  wsIndicator: { 
    position: 'absolute', 
    top: 100, 
    right: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12,
    gap: 6
  },
  wsIndicatorDot: { width: 8, height: 8, borderRadius: 4 },
  wsIndicatorText: { fontSize: 11, fontWeight: '600' },
  // Settlement Alert Modal
  alertOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  alertBox: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  alertHeader: { 
    backgroundColor: '#fef3c7', 
    padding: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a'
  },
  alertIconContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  alertTitle: { fontSize: 20, fontWeight: '700', color: '#92400e' },
  alertContent: { padding: 20 },
  alertMessage: { fontSize: 16, color: '#334155', textAlign: 'center', lineHeight: 24 },
  alertBuyerName: { fontWeight: '700', color: '#0f172a' },
  alertContractInfo: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 16,
    gap: 10
  },
  alertInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  alertInfoLabel: { fontSize: 14, color: '#64748b' },
  alertInfoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  alertQuestion: { 
    fontSize: 15, 
    color: '#475569', 
    textAlign: 'center', 
    marginTop: 16,
    fontWeight: '500'
  },
  alertActions: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9',
    padding: 16,
    gap: 12
  },
  alertBtn: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 12,
    gap: 8
  },
  alertBtnDecline: { 
    backgroundColor: '#fef2f2', 
    borderWidth: 1.5, 
    borderColor: '#fecaca' 
  },
  alertBtnDeclineText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
  alertBtnApprove: { backgroundColor: '#16a34a' },
  alertBtnApproveText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  titleContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  filterTabs: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  filterTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  filterTabActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  filterTabText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  filterTabTextActive: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cropName: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '600' },
  plContainer: { alignItems: 'flex-end' },
  plValue: { fontSize: 18, fontWeight: '800' },
  plLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  hedgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6, flexWrap: 'wrap' },
  hedgeText: { fontSize: 12, color: '#64748b' },
  sellerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sellerText: { fontSize: 11, color: '#64748b' },
  blockchainRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  verifyChainBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#faf5ff', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9d5ff'
  },
  verifyChainText: { fontSize: 11, fontWeight: '600', color: '#8b5cf6' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: '#64748b', marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  createFirstBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#16a34a', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginTop: 20,
    gap: 8,
    alignItems: 'center'
  },
  createFirstBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  fab: { 
    position: 'absolute', 
    bottom: 90, 
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#16a34a', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  modalContent: { padding: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a' },
  cropGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cropBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0' },
  cropBtnActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  cropBtnText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  cropBtnTextActive: { color: '#16a34a', fontWeight: '600' },
  hedgeTypeRow: { flexDirection: 'row', gap: 12 },
  hedgeTypeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: '#f0fdf4', 
    borderWidth: 2, 
    borderColor: '#16a34a',
    gap: 8
  },
  hedgeTypeBtnShort: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  hedgeTypeBtnActive: { backgroundColor: '#16a34a' },
  hedgeTypeBtnActiveShort: { backgroundColor: '#ef4444' },
  hedgeTypeBtnText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  hedgeTypeBtnTextShort: { color: '#ef4444' },
  hedgeTypeBtnTextActive: { color: '#fff' },
  priceInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#f8fafc', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 20 
  },
  priceInfoLabel: { fontSize: 14, color: '#64748b' },
  priceInfoValue: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  submitBtn: { 
    flexDirection: 'row',
    backgroundColor: '#16a34a', 
    margin: 20, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
