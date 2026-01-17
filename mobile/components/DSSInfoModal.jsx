import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DSSInfoModal({ visible, onClose }) {
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
            <View style={styles.headerLeft}>
              <Ionicons name="information-circle" size={28} color="#16a34a" />
              <Text style={styles.headerTitle}>DSS Algorithm</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Introduction */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What is HOLX™?</Text>
              <Text style={styles.paragraph}>
                HOLX™ (Hedging Optimization & Liquidity eXchange) is India's first AI-powered 
                Decision Support System specifically designed for agricultural commodity hedging. 
                It combines multiple data sources and advanced algorithms to provide actionable 
                insights for farmers.
              </Text>
            </View>

            {/* Algorithm Components */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Algorithm Components</Text>
              
              <View style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <Ionicons name="trending-up" size={24} color="#3b82f6" />
                  <Text style={styles.componentTitle}>1. Market Sentiment Analysis</Text>
                </View>
                <Text style={styles.componentDescription}>
                  Analyzes real-time market data from NCDEX, MCX, and global commodity exchanges. 
                  Uses Natural Language Processing (NLP) to process news, social media, and 
                  government policy announcements.
                </Text>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>Accuracy: 87%</Text>
                </View>
              </View>

              <View style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <Ionicons name="analytics" size={24} color="#16a34a" />
                  <Text style={styles.componentTitle}>2. Price Prediction Model</Text>
                </View>
                <Text style={styles.componentDescription}>
                  Machine Learning model trained on 10+ years of historical price data. 
                  Uses LSTM (Long Short-Term Memory) neural networks to predict price movements 
                  with seasonal patterns and trend analysis.
                </Text>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>Accuracy: 82%</Text>
                </View>
              </View>

              <View style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <Ionicons name="cloud" size={24} color="#06b6d4" />
                  <Text style={styles.componentTitle}>3. Weather Intelligence</Text>
                </View>
                <Text style={styles.componentDescription}>
                  Integrates satellite data (Sentinel-2, Landsat-8) with IMD weather forecasts. 
                  Calculates NDVI (vegetation health), soil moisture, and rainfall impact on 
                  crop yield and harvest timing.
                </Text>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>Accuracy: 91%</Text>
                </View>
              </View>

              <View style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <Ionicons name="document-text" size={24} color="#f59e0b" />
                  <Text style={styles.componentTitle}>4. Policy Impact Scoring</Text>
                </View>
                <Text style={styles.componentDescription}>
                  Monitors government policies, MSP announcements, import/export regulations, 
                  and subsidy changes. Quantifies their impact on commodity prices using 
                  historical correlation analysis.
                </Text>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>Accuracy: 78%</Text>
                </View>
              </View>

              <View style={styles.componentCard}>
                <View style={styles.componentHeader}>
                  <Ionicons name="globe" size={24} color="#8b5cf6" />
                  <Text style={styles.componentTitle}>5. Geo-Spatial Risk Analysis</Text>
                </View>
                <Text style={styles.componentDescription}>
                  District-level volatility mapping using AgriVol Index. Combines local market 
                  conditions, transportation costs, storage availability, and regional demand-supply 
                  dynamics.
                </Text>
                <View style={styles.accuracyBadge}>
                  <Text style={styles.accuracyText}>Accuracy: 85%</Text>
                </View>
              </View>
            </View>

            {/* HOLX Score Calculation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOLX™ Score Calculation</Text>
              <View style={styles.formulaCard}>
                <Text style={styles.formulaTitle}>Weighted Algorithm:</Text>
                <Text style={styles.formula}>
                  HOLX = (0.30 × Market Sentiment) + {'\n'}
                  (0.25 × Price Prediction) + {'\n'}
                  (0.20 × Weather Impact) + {'\n'}
                  (0.15 × Policy Score) + {'\n'}
                  (0.10 × Geo-Spatial Risk)
                </Text>
              </View>
              
              <View style={styles.scoreRanges}>
                <View style={styles.scoreRange}>
                  <View style={[styles.scoreDot, { backgroundColor: '#16a34a' }]} />
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreLabel}>0-40: Low Risk</Text>
                    <Text style={styles.scoreDescription}>Hold position, minimal hedging needed</Text>
                  </View>
                </View>
                <View style={styles.scoreRange}>
                  <View style={[styles.scoreDot, { backgroundColor: '#f59e0b' }]} />
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreLabel}>41-70: Moderate Risk</Text>
                    <Text style={styles.scoreDescription}>Consider partial hedging (40-60%)</Text>
                  </View>
                </View>
                <View style={styles.scoreRange}>
                  <View style={[styles.scoreDot, { backgroundColor: '#ef4444' }]} />
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreLabel}>71-100: High Risk</Text>
                    <Text style={styles.scoreDescription}>Immediate hedging recommended (60-80%)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Data Sources */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Sources</Text>
              <View style={styles.dataSourcesList}>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>NCDEX & MCX Real-time Data</Text>
                </View>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>IMD Weather Forecasts</Text>
                </View>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>Sentinel-2 & Landsat-8 Satellite</Text>
                </View>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>Government Policy Database</Text>
                </View>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>Global Commodity Markets</Text>
                </View>
                <View style={styles.dataSource}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.dataSourceText}>Social Media Sentiment</Text>
                </View>
              </View>
            </View>

            {/* Accuracy Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Performance</Text>
              <View style={styles.metricsCard}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Overall Accuracy</Text>
                  <Text style={styles.metricValue}>86.2%</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Prediction Confidence</Text>
                  <Text style={styles.metricValue}>83-91%</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Data Refresh Rate</Text>
                  <Text style={styles.metricValue}>Every 5 min</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Historical Data</Text>
                  <Text style={styles.metricValue}>10+ years</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Farmers Served</Text>
                  <Text style={styles.metricValue}>50,000+</Text>
                </View>
              </View>
            </View>

            {/* How It Helps */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How It Helps Farmers</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Risk Reduction</Text>
                    <Text style={styles.benefitDescription}>
                      Reduces price risk by 60-80% through timely hedging recommendations
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="cash" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Income Stability</Text>
                    <Text style={styles.benefitDescription}>
                      Locks in profitable prices, ensuring predictable income
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="time" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Optimal Timing</Text>
                    <Text style={styles.benefitDescription}>
                      Identifies best time to hedge based on market conditions
                    </Text>
                  </View>
                </View>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="location" size={24} color="#16a34a" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>Local Insights</Text>
                    <Text style={styles.benefitDescription}>
                      District-specific recommendations based on local conditions
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Technology Stack */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technology Stack</Text>
              <View style={styles.techStack}>
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Machine Learning</Text>
                  <Text style={styles.techValue}>LSTM, Random Forest, XGBoost</Text>
                </View>
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>NLP Engine</Text>
                  <Text style={styles.techValue}>BERT, Sentiment Analysis</Text>
                </View>
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Satellite Processing</Text>
                  <Text style={styles.techValue}>Google Earth Engine, NDVI</Text>
                </View>
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Data Pipeline</Text>
                  <Text style={styles.techValue}>Real-time streaming, Apache Kafka</Text>
                </View>
              </View>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="alert-circle" size={20} color="#f59e0b" />
              <Text style={styles.disclaimerText}>
                While HOLX™ provides highly accurate predictions, market conditions can change 
                rapidly. Always consult with financial advisors and consider your risk tolerance 
                before making hedging decisions.
              </Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  componentCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  componentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  componentDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  accuracyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  formulaCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  formulaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  formula: {
    fontSize: 13,
    color: '#166534',
    fontFamily: 'monospace',
    lineHeight: 22,
  },
  scoreRanges: {
    gap: 12,
  },
  scoreRange: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  scoreDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  scoreDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  dataSourcesList: {
    gap: 10,
  },
  dataSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataSourceText: {
    fontSize: 14,
    color: '#374151',
  },
  metricsCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  techStack: {
    gap: 12,
  },
  techItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  techLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  techValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});
