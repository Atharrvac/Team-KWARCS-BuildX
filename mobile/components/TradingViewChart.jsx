import { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// TradingView symbols for oilseeds
const OILSEED_SYMBOLS = {
  soybean: 'NCDEX:SOYBEAN1!',
  rapeseed: 'RS',
  mustard: 'RS',
  sunflower: 'MCX:SUNOIL1!',
  groundnut: 'NCDEX:GNUT1!',
  castor: 'NCDEX:CASTORSEED1!',
};

export default function TradingViewChart({ 
  symbol = 'soybean', 
  interval = 'D',
  theme = 'light',
  height = 400 
}) {
  const webViewRef = useRef(null);
  const tradingViewSymbol = OILSEED_SYMBOLS[symbol.toLowerCase()] || OILSEED_SYMBOLS.soybean;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; }
          body { overflow: hidden; }
          #tradingview_widget { width: 100%; height: ${height}px; }
        </style>
      </head>
      <body>
        <div id="tradingview_widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
          new TradingView.widget({
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
              "RSI@tv-basicstudies"
            ],
            "show_popup_button": true,
            "popup_width": "1000",
            "popup_height": "650"
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={[styles.webview, { height }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2d5f3f" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
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
  },
});
