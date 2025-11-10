#!/bin/bash

echo "🔐 Testing with Real Authentication"
echo "=================================="

# Step 1: Register a test user
echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/register \
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

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract token from registration
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo ""
    echo "Registration failed, trying login..."
    
    # Step 2: Try login if registration failed
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }')
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."

# Step 3: Test upload
echo ""
echo "2. Testing upload with real token..."

# Create test image file
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > test.png

UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.png")

echo "Upload response:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extract upload data
FILE_DATA=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.fileData // empty' 2>/dev/null)
MIME_TYPE=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.mimeType // empty' 2>/dev/null)
R2_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.r2Url // empty' 2>/dev/null)

if [ -z "$FILE_DATA" ] || [ "$FILE_DATA" = "null" ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ Upload successful"

# Step 4: Test analysis
echo ""
echo "3. Testing analysis with real token and data..."

ANALYSIS_REQUEST="{
  \"recordName\": \"Real Auth Test\",
  \"type\": \"lab_result\",
  \"fileData\": \"$FILE_DATA\",
  \"mimeType\": \"$MIME_TYPE\",
  \"r2Url\": \"$R2_URL\"
}"

echo "Analysis request:"
echo "$ANALYSIS_REQUEST" | jq '.' 2>/dev/null

ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ANALYSIS_REQUEST")

echo ""
echo "Analysis response:"
echo "$ANALYSIS_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYSIS_RESPONSE"

# Check if successful
if echo "$ANALYSIS_RESPONSE" | grep -q '"statusCode": 201'; then
    echo ""
    echo "✅ Analysis successful!"
    
    # Get record ID
    RECORD_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.data.record.id // empty' 2>/dev/null)
    echo "📋 Record created with ID: $RECORD_ID"
    
    # Check if R2 URL was saved
    R2_SAVED=$(echo "$ANALYSIS_RESPONSE" | jq -r '.data.record.r2Url // empty' 2>/dev/null)
    if [ -n "$R2_SAVED" ] && [ "$R2_SAVED" != "null" ]; then
        echo "✅ R2 URL saved: $R2_SAVED"
    else
        echo "⚠️ R2 URL not saved"
    fi
    
else
    echo ""
    echo "❌ Analysis failed"
    
    # Check for specific error
    ERROR_MSG=$(echo "$ANALYSIS_RESPONSE" | jq -r '.message // empty' 2>/dev/null)
    if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
        echo "Error: $ERROR_MSG"
    fi
fi

# Cleanup
rm -f test.png

echo ""
echo "🎉 Test completed!"
