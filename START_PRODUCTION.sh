#!/bin/bash

echo "🚀 Starting Oilseed Hedging Platform in PRODUCTION MODE..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Set production environment
export NODE_ENV=production

# Load production environment variables if .env.production exists
if [ -f "backend/.env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(cat backend/.env.production | grep -v '^#' | xargs)
fi

# Check if backend .env exists, if not create from .env.production
if [ ! -f "backend/.env" ] && [ -f "backend/.env.production" ]; then
    echo "📝 Creating .env from .env.production..."
    cp backend/.env.production backend/.env
fi

# Start backend in production mode
echo "📦 Starting Backend Server (PRODUCTION)..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --production=false
fi

echo "Starting backend server on port ${PORT:-3000}..."
NODE_ENV=production npm start &
BACKEND_PID=$!

cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend server started (PID: $BACKEND_PID)"
    curl -s http://localhost:${PORT:-3000}/health > /dev/null && echo "✅ Backend health check passed"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start mobile app
echo ""
echo "📱 Starting Mobile App (Expo)..."
cd mobile

if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
fi

echo "Starting Expo in production mode..."
npm start &
MOBILE_PID=$!

cd ..

echo ""
echo "=========================================="
echo "✅ PRODUCTION MODE ACTIVE"
echo "=========================================="
echo "Backend API: http://localhost:${PORT:-3000}"
echo "Health Check: http://localhost:${PORT:-3000}/health"
echo "Mobile App: Running on Expo (port 8081/8082)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Cleanup on exit
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $MOBILE_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait

