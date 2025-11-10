#!/bin/bash

echo "🔧 Updating .env file with R2 configuration..."

# Navigate to backend directory
cd backend

# Check if .env exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
fi

# Update R2 configuration in .env file
echo "📝 Updating R2 configuration..."

# Use sed to update the R2 configuration
sed -i '' 's/R2_ACCESS_KEY_ID=.*/R2_ACCESS_KEY_ID=19fe0c203d759faa136e1fd023834227/' .env
sed -i '' 's/R2_SECRET_ACCESS_KEY=.*/R2_SECRET_ACCESS_KEY=24fdc0956a134c34e7c490e2caf6c28c1a36c2ba153b6832b1a4d53cc163fe2c/' .env
sed -i '' 's/R2_BUCKET=.*/R2_BUCKET=khosource/' .env
sed -i '' 's|R2_ENDPOINT=.*|R2_ENDPOINT=https://eeac9b668059321534d04547f1a26786.r2.cloudflarestorage.com|' .env
sed -i '' 's|R2_PUBLIC_URL=.*|R2_PUBLIC_URL=https://storage.khosource.io.vn|' .env

echo "✅ R2 configuration updated successfully!"
echo ""
echo "📋 Current R2 configuration:"
echo "- Access Key: 19fe0c20... (truncated for security)"
echo "- Bucket: khosource"
echo "- Endpoint: https://eeac9b668059321534d04547f1a26786.r2.cloudflarestorage.com"
echo "- Public URL: https://storage.khosource.io.vn"
echo ""
echo "🚀 Ready to test R2 connection!"
echo "Run: php ../test-r2-connection.php"
