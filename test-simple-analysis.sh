#!/bin/bash

echo "🧪 Simple Analysis Test"
echo "======================"

# Use the generated JWT token
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjI3NjM5MDMsImV4cCI6MTc2Mjg1MDMwM30.3udjP4PS5egDvR1a5waqiFFWP8Km36OPSsRurxxAqOk"

echo "Using token: ${TOKEN:0:50}..."

# Create test image file
echo ""
echo "1. Creating test image..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > test.png
echo "✅ Test image created"

# Test upload
echo ""
echo "2. Testing upload..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.png")

echo "Upload response:"
echo "$UPLOAD_RESPONSE"

# Check if upload was successful (look for statusCode 200)
if echo "$UPLOAD_RESPONSE" | grep -q '"statusCode": 200'; then
    echo "✅ Upload successful!"
    
    # Extract data manually (simple approach)
    FILE_DATA=$(echo "$UPLOAD_RESPONSE" | grep -o '"fileData":"[^"]*"' | cut -d'"' -f4)
    R2_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"r2Url":"[^"]*"' | cut -d'"' -f4 | sed 's/\\\//g')
    
    echo "  - File Data: ${FILE_DATA:0:50}..."
    echo "  - R2 URL: $R2_URL"
    
    # Test analysis
    echo ""
    echo "3. Testing analysis..."
    
    ANALYSIS_REQUEST="{
      \"recordName\": \"Simple Test\",
      \"type\": \"lab_result\",
      \"fileData\": \"$FILE_DATA\",
      \"mimeType\": \"image/png\",
      \"r2Url\": \"$R2_URL\"
    }"
    
    echo "Making analysis request..."
    
    ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$ANALYSIS_REQUEST")
    
    echo ""
    echo "Analysis response:"
    echo "$ANALYSIS_RESPONSE"
    
    # Check if analysis was successful
    if echo "$ANALYSIS_RESPONSE" | grep -q '"statusCode": 201'; then
        echo ""
        echo "✅ Analysis successful!"
        
        # Extract record ID
        RECORD_ID=$(echo "$ANALYSIS_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "📋 Record created with ID: $RECORD_ID"
        
        # Check if R2 URL was saved
        if echo "$ANALYSIS_RESPONSE" | grep -q '"r2Url"'; then
            echo "✅ R2 URL was saved in record"
        else
            echo "⚠️ R2 URL not found in record"
        fi
        
    else
        echo ""
        echo "❌ Analysis failed"
        
        # Look for error message
        if echo "$ANALYSIS_RESPONSE" | grep -q "HttpBadRequestException"; then
            echo "Error: HttpBadRequestException detected"
        fi
    fi
    
else
    echo "❌ Upload failed"
    echo "Response: $UPLOAD_RESPONSE"
fi

# Cleanup
rm -f test.png

echo ""
echo "🎉 Test completed!"
