#!/bin/bash

echo "🧪 Testing File Upload with R2 Storage Integration"
echo "================================================="

# Check if backend server is running
if ! curl -s http://localhost:8000/api/users/3/records > /dev/null; then
    echo "❌ Backend server is not running!"
    echo "Please start the backend server first:"
    echo "  cd backend && php -S localhost:8000 -t public"
    exit 1
fi

echo "✅ Backend server is running"

# Create a test image file
echo "📝 Creating test file..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > test-image.png

# Convert to base64 for API
TEST_FILE_BASE64=$(base64 -i test-image.png)

echo "📤 Testing upload endpoint..."

# Test upload
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/upload \
  -F "file=@test-image.png" \
  -H "Authorization: Bearer test-token")

echo "📋 Upload Response:"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Extract R2 info from upload response
R2_KEY=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.r2Key // empty' 2>/dev/null)
R2_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.r2Url // empty' 2>/dev/null)
ORIGINAL_NAME=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.originalName // empty' 2>/dev/null)
FILE_SIZE=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.size // empty' 2>/dev/null)
MIME_TYPE=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.mimeType // empty' 2>/dev/null)

if [ -n "$R2_KEY" ] && [ -n "$R2_URL" ]; then
    echo "✅ File uploaded to R2 successfully!"
    echo "  - R2 Key: $R2_KEY"
    echo "  - R2 URL: $R2_URL"
    echo "  - Original Name: $ORIGINAL_NAME"
    echo "  - File Size: $FILE_SIZE bytes"
    echo "  - MIME Type: $MIME_TYPE"
    
    echo ""
    echo "🧪 Testing analysis with R2 info..."
    
    # Test analysis with R2 info
    ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer test-token" \
      -d "{
        \"recordName\": \"Test R2 Integration\",
        \"type\": \"lab_result\",
        \"fileData\": \"$TEST_FILE_BASE64\",
        \"mimeType\": \"$MIME_TYPE\",
        \"r2Url\": \"$R2_URL\"
      }")
    
    echo "📋 Analysis Response:"
    echo "$ANALYSIS_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYSIS_RESPONSE"
    
    # Check if record was created with R2 info
    RECORD_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.data.record.id // empty' 2>/dev/null)
    
    if [ -n "$RECORD_ID" ]; then
        echo "✅ Medical record created with ID: $RECORD_ID"
        
        echo ""
        echo "🔍 Checking if R2 info was saved..."
        
        echo "🔍 Checking saved record..."
        RECORDS_RESPONSE=$(curl -s -H "Authorization: Bearer test-token" \
          "http://localhost:8000/api/users/1/records")
        
        echo "📊 Records with R2 info:"
        echo "$RECORDS_RESPONSE" | jq '.data[] | select(.r2Url != null) | {id, recordName, r2Url}' 2>/dev/null || echo "No R2 info found"
        
    else
        echo "❌ Failed to create medical record"
    fi
    
else
    echo "❌ Upload failed or R2 info missing"
fi

# Cleanup
rm -f test-image.png

echo ""
echo "🎉 Test completed!"
echo "Check your database to verify R2 fields are populated."
