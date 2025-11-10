#!/bin/bash

echo "🧪 Direct Analysis Test"
echo "======================"

# Use the generated JWT token
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjI3NjM5MDMsImV4cCI6MTc2Mjg1MDMwM30.3udjP4PS5egDvR1a5waqiFFWP8Km36OPSsRurxxAqOk"

echo "Using token: ${TOKEN:0:50}..."

# Use hardcoded base64 image data
FILE_DATA="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
R2_URL="https://storage.khosource.io.vn/medical-uploads/2025/11/10/test.png"

echo "File Data: ${FILE_DATA:0:50}..."
echo "R2 URL: $R2_URL"

# Test analysis directly
echo ""
echo "Testing analysis..."

ANALYSIS_REQUEST="{
  \"recordName\": \"Direct Test\",
  \"type\": \"lab_result\",
  \"fileData\": \"$FILE_DATA\",
  \"mimeType\": \"image/png\",
  \"r2Url\": \"$R2_URL\"
}"

echo "Request JSON:"
echo "$ANALYSIS_REQUEST"

echo ""
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
    
elif echo "$ANALYSIS_RESPONSE" | grep -q '"statusCode": 400'; then
    echo ""
    echo "❌ Analysis failed with 400 Bad Request"
    
    # Look for specific error message
    if echo "$ANALYSIS_RESPONSE" | grep -q "Dữ liệu file là bắt buộc"; then
        echo "Error: File data is required (fileData validation failed)"
    elif echo "$ANALYSIS_RESPONSE" | grep -q "Loại phân tích không hợp lệ"; then
        echo "Error: Invalid analysis type"
    elif echo "$ANALYSIS_RESPONSE" | grep -q "Loại file là bắt buộc"; then
        echo "Error: MIME type is required"
    else
        echo "Error: Unknown 400 error"
    fi
    
else
    echo ""
    echo "❌ Analysis failed with unknown error"
fi

echo ""
echo "🎉 Test completed!"
