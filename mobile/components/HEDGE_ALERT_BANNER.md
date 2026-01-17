# Hedge Alert Banner Component

## Overview
A live, horizontally auto-scrolling banner that displays real-time hedge alerts and market opportunities on the home screen.

## Features

### 🎯 Key Features
- **Continuous Auto-Scrolling**: Smooth horizontal scrolling animation
- **Live Indicator**: Pulsing "LIVE" badge with animated dot
- **Multiple Alert Types**: Positive, Warning, and Info alerts with color coding
- **Seamless Loop**: Infinite scrolling with duplicated content for smooth transitions
- **Responsive Design**: Adapts to screen width
- **Icon Support**: Each alert has a custom icon
- **Emoji Support**: Alerts include emojis for better visual appeal

### 🎨 Visual Design
- **Green Border**: 2px border with #16a34a color
- **Fixed Elements**: LIVE indicator (left) and HEDGE label (right)
- **Scrolling Content**: Middle section with continuous horizontal scroll
- **Shadow Effect**: Subtle shadow for depth
- **Color-Coded Backgrounds**: Different colors for alert types

## Usage

```jsx
import HedgeAlertBanner from '../../components/HedgeAlertBanner';

const alerts = [
  {
    icon: 'shield-checkmark',
    text: '🌾 Soybean hedge opportunity: Lock ₹4,250/qt - Up 1.2% today',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'warning',
    text: '⚠️ Risk Alert: Mustard price swing expected',
    type: 'warning',
    bgColor: '#fef3c7'
  },
  {
    icon: 'analytics',
    text: '📊 Market Pulse: Oilseeds complex bullish',
    type: 'info',
    bgColor: '#dbeafe'
  }
];

<HedgeAlertBanner alerts={alerts} />
```

## Alert Object Structure

```javascript
{
  icon: string,      // Ionicons name (e.g., 'shield-checkmark', 'trending-up')
  text: string,      // Alert message (supports emojis)
  type: string,      // 'positive', 'warning', or 'info'
  bgColor: string    // Background color (hex code)
}
```

## Alert Types

### Positive Alerts
- **Color**: Green (#dcfce7 background, #166534 text)
- **Icon Color**: #16a34a
- **Use**: Price increases, good opportunities, favorable conditions

### Warning Alerts
- **Color**: Yellow (#fef3c7 background, #92400e text)
- **Icon Color**: #f59e0b
- **Use**: Risk alerts, urgent actions, price volatility

### Info Alerts
- **Color**: Blue (#dbeafe background, #1e40af text)
- **Icon Color**: #3b82f6
- **Use**: Market updates, general information, statistics

## Animation Details

### Scrolling Animation
- **Speed**: 8 seconds per alert
- **Direction**: Right to left
- **Type**: Continuous loop
- **Easing**: Linear

### Pulsing Animation
- **Element**: LIVE indicator dot
- **Duration**: 1.6 seconds (800ms expand + 800ms contract)
- **Scale**: 1.0 to 1.3
- **Type**: Infinite loop

## Customization

### Adjust Scroll Speed
```javascript
// In HedgeAlertBanner.jsx
duration: alerts.length * 8000, // Change 8000 to desired milliseconds per alert
```

### Change Colors
```javascript
// Alert type colors
const getIconColor = (type) => {
  switch (type) {
    case 'positive': return '#16a34a'; // Change green
    case 'warning': return '#f59e0b';  // Change yellow
    case 'info': return '#3b82f6';     // Change blue
  }
};
```

### Modify Pulse Speed
```javascript
// In useEffect
duration: 800, // Change to adjust pulse speed (milliseconds)
```

## Integration with Home Screen

The banner is integrated into the home screen (`mobile/app/(tabs)/index.jsx`) and displays dynamic alerts based on real-time market data:

```javascript
// Generate alerts from market data
const oilseedsUpdates = generateOilseedsUpdates(marketData);

// Display banner
<HedgeAlertBanner alerts={oilseedsUpdates} />
```

## Performance Considerations

1. **Native Driver**: All animations use `useNativeDriver: true` for 60fps performance
2. **Memoization**: Component can be wrapped with `React.memo` if needed
3. **Cleanup**: Animations are properly cleaned up on unmount
4. **Efficient Rendering**: Uses Animated.View for smooth transitions

## Example Alerts

```javascript
const exampleAlerts = [
  {
    icon: 'shield-checkmark',
    text: '🌾 Soybean hedge opportunity: Lock ₹4,250/qt - Up 1.2% today',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'trending-up',
    text: '📈 Mustard futures rally: ₹5,800/qt - Optimal hedging window open',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'flash',
    text: '⚡ LIVE: Rapeseed contracts up 1.5% - Consider partial hedge',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'analytics',
    text: '🤖 AI Alert: Groundnut volatility detected - Hedge 40-60% now',
    type: 'warning',
    bgColor: '#fef3c7'
  },
  {
    icon: 'time',
    text: '⏰ 10:30 AM - Soybean Dec futures: Best hedge price in 3 weeks',
    type: 'info',
    bgColor: '#dbeafe'
  },
  {
    icon: 'shield',
    text: '⚠️ Risk Alert: Mustard price swing expected - Lock margins before 4 PM',
    type: 'warning',
    bgColor: '#fef3c7'
  },
  {
    icon: 'cash',
    text: '💰 Profit Lock: Sunflower at ₹6,200 - 8% above harvest avg',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'pulse',
    text: '📊 Market Pulse: Oilseeds complex bullish - 73% traders hedging',
    type: 'info',
    bgColor: '#dbeafe'
  },
  {
    icon: 'trending-up',
    text: '🎯 Castor seed at ₹6,788 - Lock now before monsoon impact',
    type: 'positive',
    bgColor: '#dcfce7'
  },
  {
    icon: 'warning',
    text: '🌧️ Weather Alert: Rain forecast in 3 days - Secure prices now',
    type: 'warning',
    bgColor: '#fef3c7'
  }
];
```

## Troubleshooting

### Banner Not Scrolling
- Check if alerts array has items
- Verify animations are not paused
- Check console for errors

### Choppy Animation
- Ensure `useNativeDriver: true` is set
- Reduce number of alerts if performance is poor
- Check device performance

### LIVE Indicator Not Pulsing
- Verify pulse animation is started
- Check if component is mounted
- Inspect animation loop

## Future Enhancements

- [ ] Add tap to pause/resume scrolling
- [ ] Add swipe gestures for manual control
- [ ] Add priority levels for alerts
- [ ] Add sound/haptic feedback for critical alerts
- [ ] Add dismiss functionality
- [ ] Add alert history view
- [ ] Add customizable scroll speed
- [ ] Add vertical scrolling option

## Dependencies

- `react-native`: Core framework
- `@expo/vector-icons`: Icon library
- `react-native` Animated API: Animation system

## Browser/Device Compatibility

- ✅ iOS (iPhone, iPad)
- ✅ Android (phones, tablets)
- ✅ Expo Go
- ✅ Production builds

---

**Created**: November 21, 2025  
**Component**: HedgeAlertBanner.jsx  
**Location**: mobile/components/  
**Status**: Production Ready
