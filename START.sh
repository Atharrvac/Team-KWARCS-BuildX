#!/bin/bash

echo "🌾 Starting Oilseed Hedging Platform..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Start backend
echo "📦 Starting Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Starting backend server on port 3000..."
npm run dev &
BACKEND_PID=$!

cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Start mobile app
echo ""
echo "📱 Starting Mobile App..."
cd mobile

if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
fi

echo "Starting Expo..."
npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
