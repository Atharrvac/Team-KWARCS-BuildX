import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PriceChart from '../../components/PriceChart';
import CandlestickChart from '../../components/CandlestickChart';
import MarketDetailCard from '../../components/MarketDetailCard';
import { marketAPI } from '../../services/marketAPI';

export default function MarketDetailsScreen() {
  const [selectedCrop, setSelectedCrop] = useState('soybean');
  const [marketData, setMarketData] = useState(null);
  const [ohlcData, setOhlcData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop]);

  const fetchMarketData = async () => {
    try {
      // Fetch current price with OHLC
      const prices = await marketAPI.getCurrentPrices();
      const cropData = prices.find(p => p.crop === selectedCrop);
      setMarketData(cropData);

      // Fetch historical OHLC data
      const history = await marketAPI.getHistoricalPrices(selectedCrop, 7);
      if (history && history.ohlc) {
        setOhlcData(history.ohlc);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Market Details</Text>
          
          {/* Market Detail Card with OHLC */}
          {marketData && <MarketDetailCard data={marketData} />}

          {/* Price Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Trend (7 Days)</Text>
            <PriceChart crop={selectedCrop} />
          </View>

          {/* Candlestick Chart */}
          {ohlcData.length > 0 && (
            <View style={styles.section}>
              <CandlestickChart 
                ohlcData={ohlcData} 
                title="OHLC Candlestick Chart"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
});
