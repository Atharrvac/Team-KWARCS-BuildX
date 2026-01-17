#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing common mobile app issues...\n');

// 1. Check and fix package.json React version
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check React version
  if (packageJson.dependencies.react === '19.1.0') {
    console.log('⚠️  React 19.1.0 detected - this may cause compatibility issues');
    console.log('   Consider downgrading to React 18.x for better stability');
    
    // Suggest fix
    packageJson.dependencies.react = '18.2.0';
    packageJson.dependencies['react-dom'] = '18.2.0';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated React to 18.2.0 for better compatibility\n');
  }
}

// 2. Check .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `EXPO_PUBLIC_API_URL=http://localhost:3000/api

# For physical device, use your computer's IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# Blockchain settings
EXPO_PUBLIC_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1
EXPO_PUBLIC_RPC_URL=https://rpc-mumbai.maticvigil.com
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default settings\n');
}

// 3. Check if all required screens exist
const requiredScreens = [
  'index.jsx',
  'market-simple.jsx',
  'trading.jsx',
  'education-simple.jsx',
  'profile.jsx'
];

const tabsDir = path.join(__dirname, '../app/(tabs)');
const missingScreens = [];

requiredScreens.forEach(screen => {
  if (!fs.existsSync(path.join(tabsDir, screen))) {
    missingScreens.push(screen);
  }
});

if (missingScreens.length > 0) {
  console.log('❌ Missing required screens:', missingScreens.join(', '));
  console.log('   Please ensure all tab screens exist\n');
} else {
  console.log('✅ All required tab screens exist\n');
}

// 4. Check Metro cache
const metroCache = path.join(__dirname, '../.expo');
if (fs.existsSync(metroCache)) {
  console.log('🧹 Metro cache exists - consider clearing if you have issues');
  console.log('   Run: npx expo start --clear\n');
}

// 5. Check node_modules
const nodeModules = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModules)) {
  console.log('📦 node_modules not found - run npm install');
} else {
  console.log('✅ node_modules exists\n');
}

console.log('🎉 Common issues check complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npx expo start --clear');
console.log('3. Press "i" for iOS or "a" for Android');
console.log('\n🔍 If issues persist, check the console for specific error messages.');