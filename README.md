# 🌾 Complete Oilseed Hedging Platform

A comprehensive, real-time mobile application for farmers and traders to hedge oilseed prices, manage risk, and optimize trading strategies with AI-powered insights.

## ✨ Complete Features

### 📊 **Real-time Market Data**
- Live NCDEX futures prices with 3-second updates
- **OHLC (Open, High, Low, Close) data** for all contracts
- **Animated price movements** with smooth sliding transitions
- Spot market prices from major mandis
- Interactive price charts and candlestick charts
- Technical indicators with real-time updates
- Market summary with gainers/losers
- Volume and open interest tracking
- Day range and average price calculations

### 💹 **Advanced Trading & Hedging**
- Real-time futures trading with live P&L
- Comprehensive hedging calculator
- Optimal hedge ratio recommendations
- Risk management tools and analytics
- Position monitoring and effectiveness tracking

### 🤖 **AI-Powered Intelligence**
- 7-30 day price predictions with confidence scores
- Market sentiment analysis
- Trading recommendations based on volatility
- Basis trading opportunities identification
- Risk-adjusted strategy suggestions

### ⚖️ **Professional Risk Management**
- Portfolio volatility analysis
- Value at Risk (VaR) calculations
- Correlation matrix for asset relationships
- Hedge effectiveness monitoring
- Margin utilization tracking

### 📈 **Advanced Analytics**
- Performance attribution analysis
- Sharpe ratio and risk-adjusted returns
- Drawdown analysis and recovery metrics
- Market comparison and benchmarking
- Comprehensive reporting and insights

### 📝 **Contract Management**
- Forward contracts with AI price suggestions
- Digital signature integration
- Settlement tracking and notifications
- Contract performance analysis

### 💰 **Comprehensive Wallet**
- Real-time balance tracking
- Margin management and alerts
- Settlement history and projections
- Multi-currency support

### 🛡️ **AutoHedge System**
- Automated hedging based on market conditions
- Risk tolerance customization
- Performance tracking and optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (for mobile)

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3000`

### 2. Start Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app

## 📱 Mobile App

### Screens
- **Dashboard** - Market overview, prices, AI insights
- **Trading** - Open/close positions, real-time P&L
- **AI Insights** - Price predictions, market sentiment
- **Simulator** - Practice futures trading
- **Contracts** - Forward contract management
- **Wallet** - Balance, transactions, payouts
- **AutoHedge** - Automated hedging enrollment

### Real-Time Features
- ✅ Live price updates (5 second intervals)
- ✅ Real-time P&L calculation
- ✅ Pull-to-refresh on all screens
- ✅ Instant position updates

## 🗄️ Complete Backend APIs

### Tech Stack
- Node.js + Express
- PostgreSQL + Drizzle ORM
- JWT Authentication
- Real-time WebSocket support
- OpenAI Integration (optional)

### Comprehensive API Endpoints

#### Market API (`/api/market`)
```
GET  /api/market/prices              # Real-time prices
GET  /api/market/ticker              # Market ticker
GET  /api/market/ncdex-futures       # NCDEX futures contracts
GET  /api/market/spot-prices         # Spot market prices
GET  /api/market/mandi/:location     # Mandi-specific prices
GET  /api/market/history/:crop       # Historical data
GET  /api/market/volatility/:crop    # Volatility analysis
GET  /api/market/basis/:crop         # Basis data (spot vs futures)
GET  /api/market/summary             # Market summary
GET  /api/market/movers              # Top gainers/losers
POST /api/market/alerts              # Create price alert
DELETE /api/market/alerts/:id        # Delete alert
```

#### Trading API (`/api/trading`)
```
GET  /api/trading/positions/:userId    # User positions
POST /api/trading/positions            # Open position
POST /api/trading/positions/:id/close  # Close position
GET  /api/trading/pnl/:userId          # P&L summary
GET  /api/trading/history/:userId      # Trade history
GET  /api/trading/futures              # Available futures
GET  /api/trading/wallet/:userId       # Wallet balance
```

#### Hedging API (`/api/hedging`) - **NEW**
```
GET  /api/hedging/dashboard/:userId       # Hedging dashboard
POST /api/hedging/calculate-hedge         # Calculate optimal hedge
POST /api/hedging/execute                 # Execute hedge strategy
GET  /api/hedging/recommendations/:userId # AI recommendations
GET  /api/hedging/effectiveness/:userId   # Hedge effectiveness
GET  /api/hedging/basis/:crop            # Basis analysis
GET  /api/hedging/volatility/:crop       # Volatility data
GET  /api/hedging/analytics/:userId      # Performance analytics
GET  /api/hedging/risk-metrics/:userId   # Risk metrics
```

#### AI API (`/api/ai`)
```
POST /api/ai/predict              # Price prediction
POST /api/ai/recommend            # Trading recommendation
GET  /api/ai/sentiment/:crop      # Market sentiment
GET  /api/ai/insights/:crop       # AI insights
```

#### Contracts API (`/api/contracts`)
```
GET  /api/contracts/user/:userId     # User contracts
GET  /api/contracts/ai-suggestion/:crop # AI price suggestion
POST /api/contracts/                 # Create contract
GET  /api/contracts/:id              # Contract details
POST /api/contracts/:id/execute      # Execute contract
```

#### Auth API (`/api/auth`)
```
POST /api/auth/register           # Register user
POST /api/auth/login              # Login user
POST /api/auth/demo-login         # Demo access
GET  /api/auth/profile/:userId    # User profile
PUT  /api/auth/profile/:userId    # Update profile
```

#### Wallet API (`/api/wallet`)
```
GET  /api/wallet/balance/:userId     # Wallet balance
GET  /api/wallet/transactions/:userId # Transaction history
POST /api/wallet/deposit             # Deposit funds
POST /api/wallet/withdraw            # Withdraw funds
```

#### AutoHedge API (`/api/autohedge`)
```
GET  /api/autohedge/status/:userId      # AutoHedge status
POST /api/autohedge/enroll              # Enroll in AutoHedge
PUT  /api/autohedge/settings/:userId    # Update settings
GET  /api/autohedge/performance/:userId # Performance metrics
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=3000
DATABASE_URL=postgresql://localhost:5432/oilseed_hedging
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-key (optional)
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# For physical device, use your computer's IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

## 📱 Complete Mobile App Sections

### 🏠 **Dashboard** (`/app/(tabs)/index.jsx`)
- Real-time market ticker with infinite scroll
- Portfolio overview with live P&L
- AutoHedge status and performance
- Price alerts and notifications
- Quick action buttons

### 📊 **Market** (`/app/(tabs)/market.jsx`) - **NEW**
- NCDEX futures contracts with expiry dates
- Spot prices from multiple mandis
- Market summary with trend analysis
- Top gainers/losers tracking
- Real-time volume and open interest

### 💹 **Trading** (`/app/(tabs)/trading.jsx`)
- Live futures trading with real-time prices
- Position management and P&L tracking
- Stop-loss and take-profit orders
- Trade history and performance metrics

### ⚖️ **Hedging** (`/app/hedging.jsx`) - **NEW**
- Comprehensive hedging calculator
- Optimal hedge ratio recommendations
- Risk reduction analysis
- Hedge effectiveness monitoring
- Strategy execution and tracking

### 📈 **Analytics** (`/app/(tabs)/analytics.jsx`) - **NEW**
- Portfolio performance analysis
- Risk metrics and VaR calculations
- Correlation matrix visualization
- Market comparison and benchmarking
- Interactive charts and insights

### 🎓 **Education** (`/app/(tabs)/education.jsx`) - **NEW**
- **8 Comprehensive Learning Modules** for financial literacy
- Interactive lessons with videos, simulations, and hands-on exercises
- Progress tracking and certificates
- Quick resources and glossary
- Learning journey with achievements

### 🤝 **FPO Integration** (`/app/fpo-integration.jsx`) - **NEW**
- **Farmer Producer Organization** membership and benefits
- Collective bargaining and group trading
- Price comparison (FPO vs market rates)
- Collective order participation
- Membership application system

### 🎮 **Simulation Mode** (`/app/simulation-mode.jsx`) - **NEW**
- **Virtual Trading Platform** with ₹5 lakh virtual money
- Risk-free practice environment
- Real-time market data integration
- Performance tracking and leaderboards
- Complete trading simulation

### 🔗 **Blockchain Integration** (Enhanced)
- **Smart Contract Management** for forward contracts
- Digital signature verification
- Transaction history and verification
- Polygon Mumbai testnet integration
- E-contract creation and execution

### 🤖 **AI Insights** (`/app/(tabs)/ai-insights.jsx`)
- Real-time price predictions
- Market sentiment analysis
- Trading recommendations
- Confidence scoring

### 📝 **Contracts** (`/app/(tabs)/mandi-prices.jsx`)
- Forward contract management
- AI price suggestions
- Digital signatures
- Settlement tracking

### 💰 **Wallet** (`/app/(tabs)/profile.jsx`)
- Real-time balance tracking
- Margin management
- Transaction history
- Settlement projections

## 📊 Database Setup

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb oilseed_hedging

# Run migrations
cd backend
npm run db:push
```

### Option 2: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Update `DATABASE_URL` in backend/.env
5. Run migrations: `npm run db:push`

### Option 3: Neon (Serverless)
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update `DATABASE_URL` in backend/.env
5. Run migrations: `npm run db:push`

## 🔗 Blockchain (Optional)

Smart contracts for forward contracts on Polygon.

```bash
cd blockchain
npm install

# Deploy to Mumbai testnet
npm run deploy:mumbai
```

Get test MATIC: https://faucet.polygon.technology/

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:3000/health

# Get market prices
curl http://localhost:3000/api/market/prices

# Demo login
curl -X POST http://localhost:3000/api/auth/demo-login
```

### Test Mobile
1. Open Trading screen
2. Watch prices update every 5 seconds
3. Open a position
4. See real-time P&L calculation

## 📁 Project Structure

```
oilseed-hedging-platform/
├── mobile/                 # React Native app
│   ├── app/(tabs)/        # Screen components
│   ├── components/        # Reusable components
│   ├── services/          # API services
│   └── constants/         # Config & constants
├── backend/               # Node.js API
│   └── src/
│       ├── routes/        # API endpoints
│       ├── services/      # Business logic
│       ├── middleware/    # Auth, validation
│       └── db/            # Database schema
├── blockchain/            # Smart contracts
│   ├── contracts/         # Solidity files
│   └── scripts/           # Deploy scripts
└── README.md              # This file
```

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check if port 3000 is free
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Mobile not connecting
- Check `EXPO_PUBLIC_API_URL` in mobile/.env
- For physical device, use computer's IP address
- Ensure backend is running

### Prices not updating
- Check backend is running
- Pull to refresh manually
- Check network connection

## 📚 Documentation

- `BACKEND_IMPLEMENTATION.md` - Complete backend guide
- `IMPLEMENTATION_COMPLETE.md` - Full implementation details
- `blockchain/README.md` - Smart contract documentation

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Check documentation files
- Review troubleshooting section

---

**Built with ❤️ for farmers**
