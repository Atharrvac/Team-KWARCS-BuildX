import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function WalletReportModal({ visible, onClose, userId }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (visible) {
      fetchReport();
    }
  }, [visible]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/wallet/report/${userId || 'demo-user'}`);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching wallet report:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderSummaryTab = () => (
    <View style={styles.tabContent}>
      {/* Balance Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Balance Overview</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={[styles.balanceValue, { color: '#16a34a' }]}>
              {formatCurrency(report.summary.currentBalance)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Margin Blocked</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(report.summary.marginBlocked)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Pending Settlements</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(report.summary.pendingSettlements)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Hedging P&L</Text>
            <Text style={[
              styles.balanceValue, 
              { color: report.summary.hedgingPnL >= 0 ? '#16a34a' : '#ef4444' }
            ]}>
              {report.summary.hedgingPnL >= 0 ? '+' : ''}
              {formatCurrency(report.summary.hedgingPnL)}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down-circle" size={24} color="#16a34a" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Total Credits</Text>
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                  {formatCurrency(report.summary.totalCredits)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up-circle" size={24} color="#ef4444" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Total Debits</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  {formatCurrency(report.summary.totalDebits)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <View style={styles.summaryItem}>
              <Ionicons 
                name="trending-up" 
                size={24} 
                color={report.summary.netFlow >= 0 ? '#16a34a' : '#ef4444'} 
              />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Net Flow</Text>
                <Text style={[
                  styles.summaryValue, 
                  { color: report.summary.netFlow >= 0 ? '#16a34a' : '#ef4444' }
                ]}>
                  {report.summary.netFlow >= 0 ? '+' : ''}
                  {formatCurrency(report.summary.netFlow)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Ionicons name="analytics" size={20} color="#6b7280" />
            <Text style={styles.insightText}>
              Average transaction: {formatCurrency(report.insights.averageTransactionSize)}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Ionicons name="trending-up" size={20} color="#16a34a" />
            <Text style={styles.insightText}>
              Largest credit: {formatCurrency(report.insights.largestCredit)}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Ionicons name="trending-down" size={20} color="#ef4444" />
            <Text style={styles.insightText}>
              Largest debit: {formatCurrency(report.insights.largestDebit)}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
            <Text style={styles.insightText}>
              Hedging: {report.insights.hedgingEfficiency}
            </Text>
          </View>
        </View>
        
        {report.insights.recommendedAction && (
          <View style={styles.recommendationCard}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.recommendationText}>
              {report.insights.recommendedAction}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {report.transactions.map((transaction) => (
        <View key={transaction.id} style={styles.transactionItem}>
          <View style={styles.transactionLeft}>
            <View style={[
              styles.transactionIcon,
              { backgroundColor: transaction.type === 'credit' ? '#dcfce7' : '#fee2e2' }
            ]}>
              <Ionicons 
                name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={transaction.type === 'credit' ? '#16a34a' : '#ef4444'} 
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionMeta}>
                {transaction.category} • {formatDate(transaction.date)}
              </Text>
              <Text style={styles.transactionReference}>{transaction.reference}</Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[
              styles.transactionAmount,
              { color: transaction.type === 'credit' ? '#16a34a' : '#ef4444' }
            ]}>
              {transaction.type === 'credit' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.transactionBalance}>
              Bal: {formatCurrency(transaction.balance)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderBreakdownTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Category Breakdown</Text>
      {Object.entries(report.breakdown.byCategory).map(([category, data]) => (
        <View key={category} style={styles.categoryItem}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryCount}>{data.count} transactions</Text>
          </View>
          <View style={styles.categoryAmounts}>
            {data.credit > 0 && (
              <View style={styles.categoryAmount}>
                <Text style={styles.categoryLabel}>Credits:</Text>
                <Text style={[styles.categoryValue, { color: '#16a34a' }]}>
                  {formatCurrency(data.credit)}
                </Text>
              </View>
            )}
            {data.debit > 0 && (
              <View style={styles.categoryAmount}>
                <Text style={styles.categoryLabel}>Debits:</Text>
                <Text style={[styles.categoryValue, { color: '#ef4444' }]}>
                  {formatCurrency(data.debit)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
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
              <Text style={styles.headerTitle}>Wallet Report</Text>
              {report && (
                <Text style={styles.headerSubtitle}>
                  Generated on {formatDate(report.generatedAt)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>Generating report...</Text>
            </View>
          ) : report ? (
            <>
              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
                  onPress={() => setActiveTab('summary')}
                >
                  <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
                    Summary
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
                  onPress={() => setActiveTab('transactions')}
                >
                  <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
                    Transactions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'breakdown' && styles.tabActive]}
                  onPress={() => setActiveTab('breakdown')}
                >
                  <Text style={[styles.tabText, activeTab === 'breakdown' && styles.tabTextActive]}>
                    Breakdown
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'summary' && renderSummaryTab()}
                {activeTab === 'transactions' && renderTransactionsTab()}
                {activeTab === 'breakdown' && renderBreakdownTab()}
              </ScrollView>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>Failed to load report</Text>
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
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
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
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  balanceItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  insightCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 11,
    color: '#9ca3af',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionBalance: {
    fontSize: 11,
    color: '#6b7280',
  },
  categoryItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryAmounts: {
    gap: 8,
  },
  categoryAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
