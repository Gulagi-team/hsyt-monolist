# 🧪 Medical Analysis API Setup Guide

## ✅ Status: API Infrastructure Complete

The Medical Analysis API has been successfully implemented and is ready for use! 

## 🔧 Final Setup Steps

### 1. Configure Google GenAI API Key

To enable AI analysis functionality, you need to set up a Google GenAI API key:

1. **Get API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Update Backend Configuration:**
   ```bash
   cd backend
   # Edit .env file
   nano .env
   
   # Replace this line:
   GENAI_API_KEY=your-google-genai-api-key
   
   # With your actual API key:
   GENAI_API_KEY=AIzaSyD...your-actual-key
   ```

3. **Restart Backend Server:**
   ```bash
   composer start
   ```

## 🚀 API Endpoints

### Upload File
```bash
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

# Form data:
file: [medical_image.jpg]
```

### Analyze Medical File
```bash
POST /api/analyze
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "recordName": "Xét nghiệm máu tổng quát",
  "type": "lab_result",  // or "prescription"
  "fileData": "base64_encoded_image_data",
  "mimeType": "image/jpeg",
  "question": "Chỉ số cholesterol có cao không?" // optional
}
```

## 🧪 Test the API

Run the test script:
```bash
./test-analysis-api.sh
```

Expected output:
```
🧪 Testing Medical Analysis API...

1. Getting JWT token...
✅ JWT token obtained: eyJ0eXAiOiJKV1QiLCJh...

2. Testing analyze API...
Response: {"statusCode":201,"data":{"record":{...}}}

✅ Analysis API test successful!
```

## 🔗 Frontend Integration

The frontend has been updated to use the backend API:

- **AnalysisService** (`web/services/analysisService.ts`) - HTTP client for API calls
- **AnalysisPage** (`web/components/AnalysisPage.tsx`) - Updated to use backend API

## 📊 Supported File Types

- **Images**: JPEG, PNG, WEBP
- **Documents**: PDF
- **Max Size**: 10MB

## 🎯 Analysis Types

1. **Lab Results** (`lab_result`):
   - Blood tests
   - Urine tests
   - Other medical lab reports

2. **Prescriptions** (`prescription`):
   - Medicine prescriptions
   - Drug information analysis

## 🛠️ Troubleshooting

### API Connection Refused
```bash
# Check if backend server is running
lsof -i :8000

# If not running, start it:
cd backend
composer start
```

### Invalid API Key Error
```
"API key not valid. Please pass a valid API key."
```
**Solution**: Update `GENAI_API_KEY` in `backend/.env` with a valid Google GenAI API key.

### Database Connection Issues
```bash
# Check MySQL container
docker ps

# If not running:
docker-compose up -d
```

## 🎉 Ready to Use!

Once you've configured the GenAI API key, the complete medical analysis system is ready:

- ✅ **Backend API** - Fully functional
- ✅ **Frontend Integration** - Complete
- ✅ **Database Storage** - Working
- ✅ **Authentication** - JWT secured
- ✅ **File Upload** - Multi-format support
- ✅ **AI Analysis** - Google GenAI powered

The system can now analyze medical documents and provide detailed Vietnamese language reports with user-specific questions answered!
