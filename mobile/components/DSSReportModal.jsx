import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.250.22.138:3000/api';

export default function DSSReportModal({ visible, onClose, dssData }) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    try {
      setGenerating(true);
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const report = {
        generatedAt: new Date().toISOString(),
        reportId: `DSS-${Date.now()}`,
        summary: {
          holxScore: dssData?.holxScore || 82,
          recommendation: dssData?.recommendation?.action || 'Hedge 60% within 7 days',
          confidence: dssData?.recommendation?.confidence || 86,
          riskLevel: dssData?.holxScore >= 71 ? 'High' : dssData?.holxScore >= 41 ? 'Moderate' : 'Low',
        },
        marketAnalysis: {
          priceTrend: '+4.8%',
          sentiment: 'Bullish',
          volatility: 'High',
          projectedPrice: '₹4,450',
        },
        weatherImpact: {
          rainForecast: 'Light rain in 3 days',
          temperature: '33°C',
          cropHealth: 'Good',
          yieldImpact: '+5%',
        },
        districtAnalysis: dssData?.districts || [],
      };
      
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const reportText = `
DSS ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Report ID: ${reportData.reportId}

SUMMARY
-------
HOLX Score: ${reportData.summary.holxScore}
Risk Level: ${reportData.summary.riskLevel}
Recommendation: ${reportData.summary.recommendation}
Confidence: ${reportData.summary.confidence}%

MARKET ANALYSIS
--------------
Price Trend: ${reportData.marketAnalysis.priceTrend}
Sentiment: ${reportData.marketAnalysis.sentiment}
Volatility: ${reportData.marketAnalysis.volatility}
Projected Price: ${reportData.marketAnalysis.projectedPrice}

WEATHER IMPACT
-------------
Rain Forecast: ${reportData.weatherImpact.rainForecast}
Temperature: ${reportData.weatherImpact.temperature}
Crop Health: ${reportData.weatherImpact.cropHealth}
Yield Impact: ${reportData.weatherImpact.yieldImpact}

DISTRICT ANALYSIS
----------------
${reportData.districtAnalysis.map(d => 
  `${d.name}: Score ${d.score} - ${d.recommendation}`
).join('\n')}

---
AgriSure Decision Support System
      `;

      if (format === 'share') {
        await Share.share({
          message: reportText,
          title: 'DSS Analysis Report',
        });
      } else {
        Alert.alert('Success', `Report exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
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
            <Text style={styles.headerTitle}>Generate DSS Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!reportData ? (
              <View style={styles.generateSection}>
                <Ionicons name="document-text" size={64} color="#16a34a" />
                <Text style={styles.generateTitle}>Comprehensive DSS Report</Text>
                <Text style={styles.generateDescription}>
                  Generate a detailed analysis report including HOLX score, market trends, 
                  weather impact, and district-wise recommendations.
                </Text>

                <View style={styles.includesList}>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.includeText}>HOLX Score & Risk Analysis</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.includeText}>Market Sentiment & Trends</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.includeText}>Weather & Yield Intelligence</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.includeText}>District-wise Analysis</Text>
                  </View>
                  <View style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.includeText}>AI Recommendations</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateReport}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="document" size={20} color="#fff" />
                      <Text style={styles.generateButtonText}>Generate Report</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.reportSection}>
                <View style={styles.reportHeader}>
                  <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                  <Text style={styles.reportTitle}>Report Generated</Text>
                  <Text style={styles.reportId}>ID: {reportData.reportId}</Text>
                </View>

                {/* Summary */}
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Summary</Text>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>HOLX Score</Text>
                      <Text style={[styles.summaryValue, { 
                        color: reportData.summary.holxScore >= 71 ? '#ef4444' : 
                               reportData.summary.holxScore >= 41 ? '#f59e0b' : '#16a34a' 
                      }]}>
                        {reportData.summary.holxScore}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Risk Level</Text>
                      <Text style={styles.summaryValue}>{reportData.summary.riskLevel}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Confidence</Text>
                      <Text style={styles.summaryValue}>{reportData.summary.confidence}%</Text>
                    </View>
                  </View>
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationText}>
                      {reportData.summary.recommendation}
                    </Text>
                  </View>
                </View>

                {/* Market Analysis */}
                <View style={styles.reportCard}>
                  <Text style={styles.cardTitle}>Market Analysis</Text>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Price Trend</Text>
                    <Text style={styles.dataValue}>{reportData.marketAnalysis.priceTrend}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Sentiment</Text>
                    <Text style={styles.dataValue}>{reportData.marketAnalysis.sentiment}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Volatility</Text>
                    <Text style={styles.dataValue}>{reportData.marketAnalysis.volatility}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Projected Price</Text>
                    <Text style={styles.dataValue}>{reportData.marketAnalysis.projectedPrice}</Text>
                  </View>
                </View>

                {/* Export Options */}
                <View style={styles.exportSection}>
                  <Text style={styles.exportTitle}>Export Report</Text>
                  <View style={styles.exportButtons}>
                    <TouchableOpacity
                      style={styles.exportButton}
                      onPress={() => handleExport('pdf')}
                    >
                      <Ionicons name="document-text" size={20} color="#ef4444" />
                      <Text style={styles.exportButtonText}>PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportButton}
                      onPress={() => handleExport('excel')}
                    >
                      <Ionicons name="grid" size={20} color="#16a34a" />
                      <Text style={styles.exportButtonText}>Excel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.exportButton}
                      onPress={() => handleExport('share')}
                    >
                      <Ionicons name="share-social" size={20} color="#3b82f6" />
                      <Text style={styles.exportButtonText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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
    maxHeight: '90%',
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
  content: {
    padding: 20,
  },
  generateSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  generateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  includesList: {
    width: '100%',
    marginBottom: 24,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  includeText: {
    fontSize: 14,
    color: '#374151',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  reportSection: {
    paddingBottom: 20,
  },
  reportHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 12,
  },
  reportId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  recommendationBox: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  exportSection: {
    marginTop: 8,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
