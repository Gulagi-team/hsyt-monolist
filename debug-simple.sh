#!/bin/bash

echo "🧪 Simple Debug Test"
echo "==================="

# Test basic connection
echo "1. Testing backend connection..."
curl -s http://localhost:8000/ | jq '.' 2>/dev/null || echo "Backend not responding"

echo ""
echo "2. Testing with minimal data..."

# Create minimal test data
TEST_DATA='{"recordName":"Debug Test","type":"lab_result","fileData":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==","mimeType":"image/png"}'

echo "Request data:"
echo "$TEST_DATA" | jq '.'

echo ""
echo "3. Making request..."

RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-123" \
  -d "$TEST_DATA")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "4. Check backend logs..."
echo "Look at the terminal running PHP server for detailed error logs."
