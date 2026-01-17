import { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// Map Indian oilseeds to TradingView charts
// If commodity doesn't have chart, use similar oilseed that does
const OILSEED_CHARTS = {
  // Oilseeds with their own charts
  'SOYBEAN': 'Soybean',           // ✅ Has own chart
  'RAPESEED': 'RS',               // ✅ Rapeseed symbol: RS
  
  // Indian oilseeds → Similar oilseed with chart
  'MUSTARD': 'RS',                // Mustard similar to Rapeseed
  'GROUNDNUT': 'Soybean',         // Groundnut (peanut) similar to Soybean
  'CASTOR': 'Soybean',            // Castor similar to Soybean
  'SESAME': 'Soybean',            // Sesame similar to Soybean
  'SUNFLOWER': 'Soybean',         // Sunflower similar to Soybean
  'COTTONSEED': 'Cotton',         // Cottonseed → Cotton
  'SAFFLOWER': 'Soybean',         // Safflower similar to Soybean
  'NIGER': 'Soybean',             // Niger similar to Soybean
  'LINSEED': 'Soybean',           // Linseed similar to Soybean
  
  // Oils
  'SOYOIL': 'Soybean Oil',        // ✅ Has own chart
  'MUSTARDOIL': 'Soybean Oil',    // Mustard Oil similar to Soybean Oil
  'GROUNDNUTOIL': 'Soybean Oil',  // Groundnut Oil similar to Soybean Oil
  'COCONUTOIL': 'Soybean Oil',    // Coconut Oil similar to Soybean Oil
  'PALMOIL': 'Palm Oil',          // ✅ Has own chart
  'COTTON': 'Cotton',             // ✅ Has own chart
};

export default function TradingViewCandlestickChart({ 
  symbol = 'NCDEX:SOYBEAN1!',
  commodityName = '',
  interval = 'D',
  theme = 'light',
  height = 500 
}) {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentSymbol, setCurrentSymbol] = useState('NCDEX:SOYBEAN1!');
  
  // Reset loading when commodity changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [commodityName, symbol]);
  
  // Map to related oilseed chart
  let tradingViewSymbol = 'Soybean'; // Default to Soybean
  let commodityDisplayName = commodityName || symbol || 'Commodity';
  
  if (symbol) {
    const upperSymbol = symbol.toUpperCase();
    
    // Check if we have a chart (own or similar)
    if (OILSEED_CHARTS[upperSymbol]) {
      tradingViewSymbol = OILSEED_CHARTS[upperSymbol];
    } else {
      // Default to Soybean (most common oilseed)
      tradingViewSymbol = 'Soybean';
      console.log('⚠️ No mapping, using Soybean for:', symbol);
    }
  } else if (commodityName) {
    // Clean the name and map it
    const cleanName = commodityName
      .replace(/\d{1,2}-[A-Za-z]{3}-\d{4}/g, '')
      .replace(/\b(Dec|Nov|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct)\b\s*\d{4}/gi, '')
      .replace(/\bCE\b|\bPE\b/gi, '')
      .replace(/\d+/g, '')
      .trim()
      .toUpperCase();
    
    if (OILSEED_CHARTS[cleanName]) {
      tradingViewSymbol = OILSEED_CHARTS[cleanName];
    }
  }
  
  // Update current symbol when it changes
  useEffect(() => {
    setCurrentSymbol(tradingViewSymbol);
  }, [commodityName, symbol, tradingViewSymbol]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
          }
          body { 
            overflow: hidden;
            background-color: #ffffff;
          }
          #tradingview_widget { 
            width: 100%; 
            height: ${height}px; 
          }
        </style>
      </head>
      <body>
        <div id="tradingview_widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
          try {
            new TradingView.widget({
              "autosize": false,
              "width": "100%",
              "height": ${height},
              "symbol": "${tradingViewSymbol}",
              "interval": "${interval}",
              "timezone": "Asia/Kolkata",
              "theme": "${theme}",
              "style": "1",
              "locale": "en",
              "toolbar_bg": "#f1f3f6",
              "enable_publishing": false,
              "hide_side_toolbar": false,
              "allow_symbol_change": true,
              "save_image": false,
              "container_id": "tradingview_widget",
              "studies": [
                "MASimple@tv-basicstudies",
                "Volume@tv-basicstudies"
              ],
              "show_popup_button": true,
              "popup_width": "1000",
              "popup_height": "650",
              "hide_top_toolbar": false,
              "hide_legend": false,
              "withdateranges": true,
              "range": "3M",
              "details": true,
              "hotlist": true,
              "calendar": false,
              "studies_overrides": {},
              "disabled_features": [],
              "enabled_features": ["study_templates"],
              "overrides": {
                "mainSeriesProperties.candleStyle.upColor": "#16a34a",
                "mainSeriesProperties.candleStyle.downColor": "#ef4444",
                "mainSeriesProperties.candleStyle.borderUpColor": "#16a34a",
                "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
                "mainSeriesProperties.candleStyle.wickUpColor": "#16a34a",
                "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
                "mainSeriesProperties.showCountdown": true,
                "paneProperties.background": "#ffffff",
                "paneProperties.vertGridProperties.color": "#f0f0f0",
                "paneProperties.horzGridProperties.color": "#f0f0f0"
              },
              "loading_screen": {
                "backgroundColor": "#ffffff",
                "foregroundColor": "#16a34a"
              }
            });
            
            // Notify React Native that loading is complete
            setTimeout(() => {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage('loaded');
            }, 2000);
          } catch (error) {
            console.error('TradingView widget error:', error);
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error');
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Loading {commodityDisplayName}...</Text>
          <Text style={styles.symbolText}>{tradingViewSymbol}</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'loaded') {
            setLoading(false);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setLoading(false);
        }}
        onLoadEnd={() => {
          // Fallback in case message doesn't arrive
          setTimeout(() => setLoading(false), 3000);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  symbolText: {
    marginTop: 6,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
