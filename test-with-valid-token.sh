#!/bin/bash

echo "🧪 Testing with Valid JWT Token"
echo "==============================="

# Use the generated JWT token
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjI3NjM5MDMsImV4cCI6MTc2Mjg1MDMwM30.3udjP4PS5egDvR1a5waqiFFWP8Km36OPSsRurxxAqOk"

echo "Using token: ${TOKEN:0:50}..."

# Step 1: Test upload
echo ""
echo "1. Testing upload..."

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

if [ -n "$FILE_DATA" ] && [ "$FILE_DATA" != "null" ]; then
    echo "✅ Upload successful"
    echo "  - File Data: ${FILE_DATA:0:50}..."
    echo "  - MIME Type: $MIME_TYPE"
    echo "  - R2 URL: $R2_URL"
else
    echo "❌ Upload failed"
    exit 1
fi

# Step 2: Test analysis
echo ""
echo "2. Testing analysis..."

ANALYSIS_REQUEST="{
  \"recordName\": \"Valid Token Test\",
  \"type\": \"lab_result\",
  \"fileData\": \"$FILE_DATA\",
  \"mimeType\": \"$MIME_TYPE\",
  \"r2Url\": \"$R2_URL\"
}"

echo "Analysis request:"
echo "$ANALYSIS_REQUEST" | jq '.' 2>/dev/null

echo ""
echo "Making analysis request..."

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
    
    # Test getting records
    echo ""
    echo "3. Testing get records..."
    RECORDS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8000/api/users/1/records")
    
    echo "Records response:"
    echo "$RECORDS_RESPONSE" | jq '.data[] | {id, recordName, r2Url}' 2>/dev/null || echo "$RECORDS_RESPONSE"
    
else
    echo ""
    echo "❌ Analysis failed"
    
    # Check for specific error
    ERROR_MSG=$(echo "$ANALYSIS_RESPONSE" | jq -r '.message // empty' 2>/dev/null)
    if [ -n "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
        echo "Error: $ERROR_MSG"
    fi
    
    # Check for detailed error in HTML response
    if echo "$ANALYSIS_RESPONSE" | grep -q "HttpBadRequestException"; then
        echo "Detected HttpBadRequestException in response"
        echo "This indicates the analysis logic is throwing an exception"
    fi
fi

# Cleanup
rm -f test.png

echo ""
echo "🎉 Test completed!"
