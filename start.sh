#!/bin/bash

# Notification Microservice Startup Script
echo "🚀 Starting Notification Microservice..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the notifications directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env file with your MongoDB connection string."
        echo "   Required: MONGODB_URI"
        exit 1
    else
        echo "❌ No .env.example found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set default environment if not specified
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=development
fi

echo "🌍 Environment: $NODE_ENV"

# Start the service based on environment
if [ "$NODE_ENV" = "production" ]; then
    echo "🚀 Starting in production mode..."
    if command -v pm2 &> /dev/null; then
        echo "Using PM2 for process management..."
        npm run start:pm2
    else
        echo "PM2 not found, starting with node..."
        npm start
    fi
else
    echo "🚀 Starting in development mode..."
    npm run dev
fi
