#!/usr/bin/env node

// Quick setup check script
console.log('🔍 Checking Snacx setup...\n');

const fs = require('fs');
const path = require('path');

// Check if essential files exist
const essentialFiles = [
  'package.json',
  'next.config.ts',
  '.env.local',
  'lib/firebase.ts',
  'lib/chatService.ts',
  'lib/blockingService.ts',
  'app/components/ChatInterface.tsx',
  'app/components/UserBlockingModal.tsx'
];

console.log('📁 Checking essential files:');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING!`);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'firebase',
    'next-cloudinary',
    'framer-motion',
    'react-hot-toast',
    'date-fns'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING!`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Check environment variables
console.log('\n🔐 Checking environment variables:');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'FIREBASE_PROJECT_ID'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - MISSING!`);
    }
  });
} catch (error) {
  console.log('❌ Could not read .env.local');
}

console.log('\n🚀 To start the development server, run:');
console.log('npm run dev');

console.log('\n📋 Then test:');
console.log('1. Open http://localhost:3000');
console.log('2. Sign in with Google');
console.log('3. Click chat button in navbar');
console.log('4. Check browser console for errors');

console.log('\n✨ Setup check complete!');
