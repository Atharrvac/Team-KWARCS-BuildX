#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing app startup requirements...\n');

// Check all required tab files exist
const requiredFiles = [
  'app/(tabs)/_layout.jsx',
  'app/(tabs)/index.jsx',
  'app/(tabs)/market-simple.jsx',
  'app/(tabs)/trading.jsx',
  'app/(tabs)/education-simple.jsx',
  'app/(tabs)/profile.jsx'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('EXPO_PUBLIC_API_URL')) {
    console.log('✅ API URL configured');
  } else {
    console.log('⚠️  API URL not configured in .env');
  }
} else {
  console.log('❌ .env file missing');
  allFilesExist = false;
}

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json exists');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check critical dependencies
  const criticalDeps = [
    '@expo/vector-icons',
    'expo-router',
    'expo-linear-gradient',
    'axios'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} dependency`);
    } else {
      console.log(`❌ ${dep} dependency missing`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ package.json missing');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 All startup requirements met!');
  console.log('\n📋 Next steps:');
  console.log('1. cd mobile');
  console.log('2. npm install');
  console.log('3. npx expo start --clear');
  console.log('4. Press "i" for iOS or "a" for Android');
} else {
  console.log('❌ Some requirements are missing.');
  console.log('Please fix the missing files/dependencies above.');
}

console.log('\n🔧 If you encounter errors:');
console.log('- Clear Metro cache: npx expo start --clear');
console.log('- Reinstall dependencies: rm -rf node_modules && npm install');
console.log('- Check console for specific error messages');