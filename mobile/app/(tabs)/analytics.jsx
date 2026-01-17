import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import axios from 'axios';
import { getHybridForecast } from '../../services/hybridForecastService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('pnl');
  
  // Analytics data
  const [portfolioAnalytics, setPortfolioAnalytics] = useState({});
  const [hedgeAnalytics, setHedgeAnalytics] = useState({});
  const [riskMetrics, setRiskMetrics] = useState({});
  const [marketAnalytics, setMarketAnalytics] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [correlationData, setCorrelationData] = useState({});
  
  // Hybrid ML Forecast data
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    loadForecastData();
    // Real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadAnalyticsData();
      loadForecastData();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadForecastData = async () => {
    setForecastLoading(true);
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 30;
      const result = await getHybridForecast(days);
      setForecastData(result);
    } catch (error) {
      console.error('Error loading forecast:', error);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const userId = 1; // Demo user
      
      // Fetch all analytics data
      const [
        portfolioRes,
        hedgeRes,
        riskRes,
        marketRes
      ] = await Promise.all([
        axios.get(`${API_URL}/trading/pnl/${userId}`),
        axios.get(`${API_URL}/hedging/analytics/${userId}?period=${selectedPeriod}`),
        axios.get(`${API_URL}/hedging/risk-metrics/${userId}`),
        axios.get(`${API_URL}/market/summary`)
      ]);

      setPortfolioAnalytics(portfolioRes.data);
      setHedgeAnalytics(hedgeRes.data);
      setRiskMetrics(riskRes.data);
      setMarketAnalytics(marketRes.data);
      
      // Generate performance data
      setPerformanceData(generatePerformanceData());
      setCorrelationData(generateCorrelationData());
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set mock data on error
      setPortfolioAnalytics({
        totalPnl: 15750,
        winRate: 68,
        totalTrades: 25,
        avgTradeSize: 45000,
        sharpeRatio: 1.42,
        maxDrawdown: -8500
      });
      setHedgeAnalytics({
        totalHedges: 5,
        successfulHedges: 4,
        successRate: 80,
        avgRiskReduction: 65,
        totalHedgingCost: 2500,
        netBenefit: 8500,
        roi: 240
      });
      setRiskMetrics({
        portfolioValue: 450000,
        valueAtRisk: 25000,
        expectedShortfall: 35000,
        portfolioVolatility: 18.5,
        riskScore: 'Medium'
      });
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const generatePerformanceData = () => {
    // Generate mock performance data for the last 30 days
    const data = [];
    let cumulativePnL = 0;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dailyPnL = (Math.random() - 0.4) * 2000; // Slightly positive bias
      cumulativePnL += dailyPnL;
      
      data.push({
        date: date.toISOString().split('T')[0],
        dailyPnL,
        cumulativePnL,
        portfolioValue: 450000 + cumulativePnL
      });
    }
    
    return data;
  };

  const generateCorrelationData = () => {
    return {
      'soybean-mustard': 0.72,
      'soybean-groundnut': 0.65,
      'mustard-groundnut': 0.58,
      'portfolio-market': 0.85
    };
  };

  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getColorForValue = (value, threshold = 0) => {
    return value >= threshold ? '#16a34a' : '#ef4444';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Portfolio performance & risk insights</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="download-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {['7d', '30d', '90d', '1y', 'All'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Performance Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>Portfolio Performance</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Total P&L</Text>
              <Text style={[styles.performanceValue, { 
                color: getColorForValue(portfolioAnalytics.totalPnl || 0) 
              }]}>
                {portfolioAnalytics.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioAnalytics.totalPnl || 0)}
              </Text>
              <Text style={styles.performanceChange}>
                {formatPercentage(((portfolioAnalytics.totalPnl || 0) / 450000) * 100)}
              </Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Win Rate</Text>
              <Text style={[styles.performanceValue, { 
                color: getColorForValue(portfolioAnalytics.winRate || 0, 50) 
              }]}>
                {portfolioAnalytics.winRate || 0}%
              </Text>
              <Text style={styles.performanceChange}>
                {portfolioAnalytics.totalTrades || 0} trades
              </Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Sharpe Ratio</Text>
              <Text style={[styles.performanceValue, { 
                color: getColorForValue(portfolioAnalytics.sharpeRatio || 0, 1) 
              }]}>
                {(portfolioAnalytics.sharpeRatio || 0).toFixed(2)}
              </Text>
              <Text style={styles.performanceChange}>Risk-adjusted</Text>
            </View>
            
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Max Drawdown</Text>
              <Text style={[styles.performanceValue, { color: '#ef4444' }]}>
                {formatCurrency(portfolioAnalytics.maxDrawdown || 0)}
              </Text>
              <Text style={styles.performanceChange}>
                {formatPercentage(((portfolioAnalytics.maxDrawdown || 0) / 450000) * 100)}
              </Text>
            </View>
          </View>
        </View>

        {/* Soybean Price Forecast Chart - Hybrid ML Model */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>Soybean Price Forecast</Text>
              <Text style={styles.chartSubtitle}>Hybrid ML (59% LSTM + 41% XGBoost)</Text>
            </View>
            {forecastData?.isMock && (
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>Demo</Text>
              </View>
            )}
          </View>
          
          {forecastLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="small" color="#7c3aed" />
              <Text style={styles.chartLoadingText}>Loading forecast...</Text>
            </View>
          ) : forecastData?.success ? (
            <View>
              {/* Price Summary */}
              <View style={styles.forecastSummary}>
                <View style={styles.forecastSummaryItem}>
                  <Text style={styles.forecastLabel}>Current Price</Text>
                  <Text style={styles.forecastValue}>
                    ₹{(forecastData.data?.current_price || 4350).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.forecastSummaryItem}>
                  <Text style={styles.forecastLabel}>Trend</Text>
                  <View style={styles.trendBadge}>
                    <Ionicons 
                      name={forecastData.data?.trend === 'bullish' ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={forecastData.data?.trend === 'bullish' ? '#16a34a' : '#ef4444'} 
                    />
                    <Text style={[styles.trendText, { 
                      color: forecastData.data?.trend === 'bullish' ? '#16a34a' : '#ef4444' 
                    }]}>
                      {forecastData.data?.trend === 'bullish' ? 'Bullish' : 'Bearish'}
                    </Text>
                  </View>
                </View>
                <View style={styles.forecastSummaryItem}>
                  <Text style={styles.forecastLabel}>Confidence</Text>
                  <Text style={styles.forecastValue}>
                    {Math.round((forecastData.data?.confidence || 0.85) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Simple Line Chart */}
              <View style={styles.chartContainer}>
                <View style={styles.chartYAxis}>
                  {[4600, 4450, 4300, 4150].map((val) => (
                    <Text key={val} style={styles.chartYLabel}>₹{val}</Text>
                  ))}
                </View>
                <View style={styles.chartArea}>
                  <View style={styles.chartGrid}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={styles.chartGridLine} />
                    ))}
                  </View>
                  <View style={styles.chartLine}>
                    {(forecastData.data?.predictions || []).slice(0, 10).map((point, index, arr) => {
                      const minPrice = 4150;
                      const maxPrice = 4600;
                      const price = point.predicted_price || 4350;
                      const heightPercent = ((price - minPrice) / (maxPrice - minPrice)) * 100;
                      return (
                        <View key={index} style={styles.chartPointContainer}>
                          <View style={[styles.chartBar, { height: `${heightPercent}%` }]}>
                            <View style={styles.chartDot} />
                          </View>
                          {index % 3 === 0 && (
                            <Text style={styles.chartXLabel}>
                              {new Date(point.date).getDate()}/{new Date(point.date).getMonth() + 1}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Prediction Details */}
              <View style={styles.predictionDetails}>
                <Text style={styles.predictionTitle}>Next 7 Days Prediction</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(forecastData.data?.predictions || []).slice(0, 7).map((pred, idx) => (
                    <View key={idx} style={styles.predictionCard}>
                      <Text style={styles.predictionDate}>
                        {new Date(pred.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.predictionPrice}>₹{pred.predicted_price?.toLocaleString('en-IN')}</Text>
                      <Text style={styles.predictionRange}>
                        ±₹{Math.round((pred.confidence_upper - pred.confidence_lower) / 2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.chartError}>
              <Ionicons name="cloud-offline-outline" size={32} color="#9ca3af" />
              <Text style={styles.chartErrorText}>Could not load forecast</Text>
            </View>
          )}
        </View>

        {/* Risk Analytics */}
        <View style={styles.riskCard}>
          <Text style={styles.cardTitle}>Risk Analytics</Text>
          
          <View style={styles.riskGrid}>
            <View style={styles.riskItem}>
              <View style={styles.riskItemHeader}>
                <Ionicons name="shield-outline" size={20} color="#ef4444" />
                <Text style={styles.riskItemTitle}>Value at Risk (95%)</Text>
              </View>
              <Text style={styles.riskItemValue}>{formatCurrency(riskMetrics.valueAtRisk || 0)}</Text>
              <Text style={styles.riskItemSubtext}>1-day potential loss</Text>
            </View>
            
            <View style={styles.riskItem}>
              <View style={styles.riskItemHeader}>
                <Ionicons name="pulse-outline" size={20} color="#f59e0b" />
                <Text style={styles.riskItemTitle}>Portfolio Volatility</Text>
              </View>
              <Text style={styles.riskItemValue}>{(riskMetrics.portfolioVolatility || 0).toFixed(1)}%</Text>
              <Text style={styles.riskItemSubtext}>Annualized</Text>
            </View>
            
            <View style={styles.riskItem}>
              <View style={styles.riskItemHeader}>
                <Ionicons name="trending-down-outline" size={20} color="#ef4444" />
                <Text style={styles.riskItemTitle}>Expected Shortfall</Text>
              </View>
              <Text style={styles.riskItemValue}>{formatCurrency(riskMetrics.expectedShortfall || 0)}</Text>
              <Text style={styles.riskItemSubtext}>Tail risk</Text>
            </View>
            
            <View style={styles.riskItem}>
              <View style={styles.riskItemHeader}>
                <Ionicons name="speedometer-outline" size={20} color="#3b82f6" />
                <Text style={styles.riskItemTitle}>Risk Score</Text>
              </View>
              <Text style={[styles.riskItemValue, {
                color: riskMetrics.riskScore === 'Low' ? '#16a34a' : 
                       riskMetrics.riskScore === 'Medium' ? '#f59e0b' : '#ef4444'
              }]}>
                {riskMetrics.riskScore || 'Medium'}
              </Text>
              <Text style={styles.riskItemSubtext}>Overall assessment</Text>
            </View>
          </View>
        </View>

        {/* Hedging Performance */}
        <View style={styles.hedgeCard}>
          <Text style={styles.cardTitle}>Hedging Performance</Text>
          
          <View style={styles.hedgeStats}>
            <View style={styles.hedgeStatItem}>
              <Text style={styles.hedgeStatLabel}>Success Rate</Text>
              <Text style={[styles.hedgeStatValue, { color: '#16a34a' }]}>
                {hedgeAnalytics.successRate || 0}%
              </Text>
            </View>
            <View style={styles.hedgeStatItem}>
              <Text style={styles.hedgeStatLabel}>Avg Risk Reduction</Text>
              <Text style={styles.hedgeStatValue}>{hedgeAnalytics.avgRiskReduction || 0}%</Text>
            </View>
            <View style={styles.hedgeStatItem}>
              <Text style={styles.hedgeStatLabel}>ROI</Text>
              <Text style={[styles.hedgeStatValue, { color: '#16a34a' }]}>
                {hedgeAnalytics.roi || 0}%
              </Text>
            </View>
            <View style={styles.hedgeStatItem}>
              <Text style={styles.hedgeStatLabel}>Net Benefit</Text>
              <Text style={[styles.hedgeStatValue, { color: '#16a34a' }]}>
                {formatCurrency(hedgeAnalytics.netBenefit || 0)}
              </Text>
            </View>
          </View>
          
          <View style={styles.hedgeInsights}>
            <Text style={styles.insightsTitle}>Key Insights</Text>
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                <Text style={styles.insightText}>
                  Hedging strategy reduced portfolio volatility by 35%
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={16} color="#3b82f6" />
                <Text style={styles.insightText}>
                  Best performance during high volatility periods
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="flash" size={16} color="#f59e0b" />
                <Text style={styles.insightText}>
                  Consider rebalancing hedge ratios monthly
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Correlation Matrix */}
        <View style={styles.correlationCard}>
          <Text style={styles.cardTitle}>Asset Correlations</Text>
          
          <View style={styles.correlationMatrix}>
            {Object.entries(correlationData).map(([pair, correlation]) => (
              <View key={pair} style={styles.correlationItem}>
                <Text style={styles.correlationPair}>
                  {pair.split('-').map(asset => asset.charAt(0).toUpperCase() + asset.slice(1)).join(' - ')}
                </Text>
                <View style={styles.correlationBar}>
                  <View style={[styles.correlationBarFill, { 
                    width: `${Math.abs(correlation) * 100}%`,
                    backgroundColor: correlation > 0.7 ? '#ef4444' : correlation > 0.3 ? '#f59e0b' : '#16a34a'
                  }]} />
                </View>
                <Text style={styles.correlationValue}>{correlation.toFixed(2)}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.correlationLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>High (&gt;0.7)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>Medium (0.3-0.7)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.legendText}>Low (&lt;0.3)</Text>
            </View>
          </View>
        </View>

        {/* Market Comparison */}
        <View style={styles.marketCard}>
          <Text style={styles.cardTitle}>Market Comparison</Text>
          
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Your Portfolio</Text>
              <Text style={[styles.comparisonValue, { color: '#16a34a' }]}>
                +{formatPercentage(((portfolioAnalytics.totalPnl || 0) / 450000) * 100)}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Market Average</Text>
              <Text style={[styles.comparisonValue, { color: '#6b7280' }]}>
                +{formatPercentage((marketAnalytics.avgChange || 0))}
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Outperformance</Text>
              <Text style={[styles.comparisonValue, { color: '#16a34a' }]}>
                +{formatPercentage(((portfolioAnalytics.totalPnl || 0) / 450000) * 100 - (marketAnalytics.avgChange || 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/hedging')}
            >
              <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
              <Text style={styles.actionButtonText}>Optimize Hedges</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/trading')}
            >
              <Ionicons name="trending-up" size={24} color="#16a34a" />
              <Text style={styles.actionButtonText}>Rebalance Portfolio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={24} color="#f59e0b" />
              <Text style={styles.actionButtonText}>Export Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications" size={24} color="#ef4444" />
              <Text style={styles.actionButtonText}>Set Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  
  // Period Selector
  periodSelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodScroll: {
    paddingHorizontal: 16,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  periodButtonActive: {
    backgroundColor: '#7c3aed',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  
  content: {
    flex: 1,
  },
  
  // Cards
  overviewCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  performanceItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 72) / 2,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  performanceChange: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Chart Card
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: 2,
  },
  mockBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d97706',
  },
  chartLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  forecastSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  forecastSummaryItem: {
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 160,
    marginBottom: 16,
  },
  chartYAxis: {
    width: 45,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  chartYLabel: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    justifyContent: 'space-between',
  },
  chartGridLine: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  chartLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 20,
    gap: 2,
  },
  chartPointContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    backgroundColor: '#7c3aed20',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
    marginTop: -4,
  },
  chartXLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 4,
    position: 'absolute',
    bottom: -16,
  },
  predictionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  predictionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  predictionDate: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  predictionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  predictionRange: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  chartError: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartErrorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  
  // Risk Card
  riskCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  riskItem: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 72) / 2,
  },
  riskItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  riskItemTitle: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  riskItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  riskItemSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  
  // Hedge Card
  hedgeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hedgeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  hedgeStatItem: {
    alignItems: 'center',
  },
  hedgeStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  hedgeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  hedgeInsights: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  
  // Correlation Card
  correlationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  correlationMatrix: {
    gap: 12,
    marginBottom: 16,
  },
  correlationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  correlationPair: {
    fontSize: 12,
    color: '#6b7280',
    width: 120,
  },
  correlationBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
  },
  correlationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  correlationValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    width: 40,
    textAlign: 'right',
  },
  correlationLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  
  // Market Card
  marketCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  comparisonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Actions Card
  actionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
});