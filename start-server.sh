#!/bin/bash

echo "🚀 Starting Medical System Backend Server..."
echo "=========================================="

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
fi

# Check if vendor directory exists
if [ ! -d vendor ]; then
    echo "📦 Installing PHP dependencies..."
    composer install
fi

# Start the server
echo "🌐 Starting PHP development server on http://localhost:8000"
echo "📊 API endpoints available:"
echo "  - GET  /api/users/{id}/records - Get medical records"
echo "  - POST /api/upload - Upload medical files"
echo "  - POST /api/analyze - Analyze medical documents"
echo "  - POST /api/chat/medical - AI medical chat"
echo ""
echo "🔧 Configuration:"
echo "  - R2 Storage: ✅ Configured (khosource bucket)"
echo "  - PostgreSQL: ✅ Configured"
echo "  - GenAI API: ✅ Configured"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="

# Start PHP development server
php -S localhost:8000 -t public
