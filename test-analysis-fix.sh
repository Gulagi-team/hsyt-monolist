#!/bin/bash

echo "🧪 Testing Analysis API Fix"
echo "=========================="

# Check if backend server is running
if ! curl -s http://localhost:8000/api/users/3/records > /dev/null; then
    echo "❌ Backend server is not running!"
    echo "Please start the backend server first:"
    echo "  cd backend && php -S localhost:8000 -t public"
    exit 1
fi

echo "✅ Backend server is running"

# Test login first to get a valid token
echo "🔐 Getting authentication token..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get authentication token"
    echo "Creating test user first..."
    
    # Try to register a test user
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test User",
        "email": "test@example.com", 
        "password": "password123",
        "age": 30,
        "bloodType": "O+",
        "allergies": "None",
        "currentConditions": "Healthy"
      }')
    
    echo "Register response: $REGISTER_RESPONSE"
    TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Still failed to get authentication token"
    echo "Please check your database connection and user setup"
    exit 1
fi

echo "✅ Got authentication token: ${TOKEN:0:20}..."

# Create test image
echo "📝 Creating test file..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > test-image.png

# Test upload first
echo "📤 Testing upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-image.png")

echo "Upload response:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extract upload data
FILE_DATA=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.fileData // empty' 2>/dev/null)
MIME_TYPE=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.mimeType // empty' 2>/dev/null)
R2_KEY=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.r2Key // empty' 2>/dev/null)
R2_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.r2Url // empty' 2>/dev/null)

if [ -n "$FILE_DATA" ] && [ "$FILE_DATA" != "null" ]; then
    echo "✅ Upload successful"
    
    # Test analysis
    echo "🧪 Testing analysis..."
    ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"recordName\": \"Test Analysis Fix\",
        \"type\": \"lab_result\",
        \"fileData\": \"$FILE_DATA\",
        \"mimeType\": \"$MIME_TYPE\",
        \"r2Key\": \"$R2_KEY\",
        \"r2Url\": \"$R2_URL\",
        \"originalName\": \"test-image.png\",
        \"size\": 1024
      }")
    
    echo "Analysis response:"
    echo "$ANALYSIS_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYSIS_RESPONSE"
    
    # Check if analysis was successful
    if echo "$ANALYSIS_RESPONSE" | grep -q '"statusCode": 201'; then
        echo "✅ Analysis successful!"
        
        # Get the record ID and check if R2 info was saved
        RECORD_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.data.record.id // empty' 2>/dev/null)
        
        if [ -n "$RECORD_ID" ] && [ "$RECORD_ID" != "null" ]; then
            echo "📋 Record created with ID: $RECORD_ID"
            
            # Check if R2 info was saved
            echo "🔍 Checking if R2 info was saved..."
            RECORDS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
              "http://localhost:8000/api/users/$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id // 1')/records")
            
            echo "Records with R2 info:"
            echo "$RECORDS_RESPONSE" | jq '.data[] | select(.r2Key != null) | {id, recordName, r2Key, r2Url, originalFileName, fileSize}' 2>/dev/null || echo "No R2 info found"
        fi
    else
        echo "❌ Analysis failed"
    fi
else
    echo "❌ Upload failed"
fi

# Cleanup
rm -f test-image.png

echo ""
echo "🎉 Test completed!"
