import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ContractDetailModal({ visible, onClose, contract, onContractUpdate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [settling, setSettling] = useState(false);

  if (!contract) return null;

  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleSettle = async () => {
    Alert.alert(
      'Settle Contract',
      `Are you sure you want to settle this ${contract.crop} contract at current price of ${formatCurrency(contract.currentPrice)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          style: 'destructive',
          onPress: async () => {
            try {
              setSettling(true);
              const response = await axios.post(
                `${API_URL}/contracts/settle/${contract.id}`,
                { finalPrice: contract.currentPrice }
              );
              
              Alert.alert('Success', 'Contract settled successfully');
              onContractUpdate();
              onClose();
            } catch (error) {
              console.error('Error settling contract:', error);
              Alert.alert('Error', 'Failed to settle contract');
            } finally {
              setSettling(false);
            }
          },
        },
      ]
    );
  };

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Contract Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contract Overview</Text>
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Contract ID</Text>
            <Text style={styles.overviewValue}>#{contract.id}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Crop</Text>
            <Text style={styles.overviewValue}>
              {contract.crop.charAt(0).toUpperCase() + contract.crop.slice(1)}
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Type</Text>
            <Text style={styles.overviewValue}>
              {contract.type.charAt(0).toUpperCase() + contract.type.slice(1)}
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Status</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: contract.status === 'active' ? '#dbeafe' : 
                             contract.status === 'settled' ? '#dcfce7' : '#f3f4f6'
            }]}>
              <Text style={[styles.statusText, {
                color: contract.status === 'active' ? '#3b82f6' : 
                       contract.status === 'settled' ? '#16a34a' : '#6b7280'
              }]}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Price Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Information</Text>
        <View style={styles.priceGrid}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Locked Price</Text>
            <Text style={styles.priceValue}>{formatCurrency(contract.lockedPrice)}</Text>
            <Text style={styles.priceSubtext}>Entry price</Text>
          </View>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Current Price</Text>
            <Text style={[styles.priceValue, {
              color: contract.status === 'active' && contract.currentPrice > contract.lockedPrice ? '#16a34a' : 
                     contract.status === 'active' && contract.currentPrice < contract.lockedPrice ? '#ef4444' : '#111827'
            }]}>
              {formatCurrency(contract.currentPrice)}
            </Text>
            <Text style={styles.priceSubtext}>
              {contract.status === 'active' ? 'Live price' : 'Final price'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quantity & P&L */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Position Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{contract.quantity} quintals</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Value</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(contract.lockedPrice * contract.quantity)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Value</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(contract.currentPrice * contract.quantity)}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.pnlRow]}>
            <Text style={styles.detailLabel}>Profit/Loss</Text>
            <Text style={[styles.pnlValue, {
              color: contract.pnl >= 0 ? '#16a34a' : '#ef4444'
            }]}>
              {contract.pnl >= 0 ? '+' : ''}{formatCurrency(contract.pnl)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>P&L Percentage</Text>
            <Text style={[styles.detailValue, {
              color: contract.pnl >= 0 ? '#16a34a' : '#ef4444'
            }]}>
              {contract.pnl >= 0 ? '+' : ''}
              {((contract.pnl / (contract.lockedPrice * contract.quantity)) * 100).toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineCard}>
          <View style={styles.timelineItem}>
            <Ionicons name="calendar" size={20} color="#6b7280" />
            <View style={styles.timelineText}>
              <Text style={styles.timelineLabel}>Entry Date</Text>
              <Text style={styles.timelineValue}>{formatDate(contract.entryDate)}</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <View style={styles.timelineText}>
              <Text style={styles.timelineLabel}>Expiry Date</Text>
              <Text style={styles.timelineValue}>{formatDate(contract.expiryDate)}</Text>
            </View>
          </View>
          {contract.settledDate && (
            <View style={styles.timelineItem}>
              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              <View style={styles.timelineText}>
                <Text style={styles.timelineLabel}>Settled Date</Text>
                <Text style={styles.timelineValue}>{formatDate(contract.settledDate)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Price Change</Text>
            <Text style={[styles.metricValue, {
              color: (contract.currentPrice - contract.lockedPrice) >= 0 ? '#16a34a' : '#ef4444'
            }]}>
              {(contract.currentPrice - contract.lockedPrice) >= 0 ? '+' : ''}
              {formatCurrency(contract.currentPrice - contract.lockedPrice)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Price Change %</Text>
            <Text style={[styles.metricValue, {
              color: (contract.currentPrice - contract.lockedPrice) >= 0 ? '#16a34a' : '#ef4444'
            }]}>
              {(contract.currentPrice - contract.lockedPrice) >= 0 ? '+' : ''}
              {(((contract.currentPrice - contract.lockedPrice) / contract.lockedPrice) * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Days Active</Text>
            <Text style={styles.metricValue}>
              {Math.floor((new Date() - new Date(contract.entryDate)) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Days to Expiry</Text>
            <Text style={styles.metricValue}>
              {Math.max(0, Math.floor((new Date(contract.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
            </Text>
          </View>
        </View>
      </View>

      {/* Risk Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Analysis</Text>
        <View style={styles.riskCard}>
          <View style={styles.riskItem}>
            <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
            <View style={styles.riskText}>
              <Text style={styles.riskLabel}>Hedge Effectiveness</Text>
              <Text style={styles.riskValue}>
                {contract.status === 'active' ? 'Active protection' : 'Completed'}
              </Text>
            </View>
          </View>
          <View style={styles.riskItem}>
            <Ionicons name="trending-up" size={24} color="#3b82f6" />
            <View style={styles.riskText}>
              <Text style={styles.riskLabel}>Market Exposure</Text>
              <Text style={styles.riskValue}>
                {formatCurrency(contract.quantity * contract.currentPrice)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      {contract.status === 'active' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationCard}>
            <Ionicons name="bulb" size={24} color="#f59e0b" />
            <Text style={styles.recommendationText}>
              {contract.pnl > 0 
                ? `Consider settling to lock in profits of ${formatCurrency(contract.pnl)}`
                : contract.pnl < -1000
                ? 'Monitor closely. Consider cutting losses if trend continues'
                : 'Hold position and monitor market conditions'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {contract.crop.charAt(0).toUpperCase() + contract.crop.slice(1)} Contract
              </Text>
              <Text style={styles.headerSubtitle}>Contract #{contract.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* P&L Banner */}
          <View style={[styles.pnlBanner, {
            backgroundColor: contract.pnl >= 0 ? '#dcfce7' : '#fee2e2'
          }]}>
            <Text style={styles.pnlBannerLabel}>Current P&L</Text>
            <Text style={[styles.pnlBannerValue, {
              color: contract.pnl >= 0 ? '#16a34a' : '#ef4444'
            }]}>
              {contract.pnl >= 0 ? '+' : ''}{formatCurrency(contract.pnl)}
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.tabActive]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.tabActive]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'details' && renderDetailsTab()}
          </ScrollView>

          {/* Actions */}
          {contract.status === 'active' && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.settleButton}
                onPress={handleSettle}
                disabled={settling}
              >
                {settling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.settleButtonText}>Settle Contract</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  pnlBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pnlBannerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  pnlBannerValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  overviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pnlRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timelineCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineText: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  metricsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  riskCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskText: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 8,
  },
  settleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
