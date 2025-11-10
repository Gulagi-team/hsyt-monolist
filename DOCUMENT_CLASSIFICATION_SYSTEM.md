# 🔍 Medical Document Classification System

## ✅ Hệ thống Phân loại Tài liệu Y khoa Tự động

Hệ thống phân loại tài liệu y khoa tự động đã được tích hợp hoàn chỉnh, cho phép AI nhận diện và phân tích các loại tài liệu y tế khác nhau một cách chính xác.

## 🎯 Các loại tài liệu được hỗ trợ

### **1. 🧪 Kết quả Xét nghiệm (LAB_RESULT)**
- Xét nghiệm máu tổng quát
- Xét nghiệm sinh hóa
- Xét nghiệm nước tiểu
- Xét nghiệm hormone
- Các xét nghiệm chuyên khoa khác

### **2. 💊 Toa thuốc (PRESCRIPTION)**
- Đơn thuốc từ bác sĩ
- Hướng dẫn sử dụng thuốc
- Thông tin liều lượng và tần suất

### **3. 🦴 Chụp X-quang (XRAY)**
- X-quang ngực
- X-quang xương khớp
- X-quang cột sống
- X-quang các bộ phận khác

### **4. 🔍 Chụp cắt lớp vi tính (CT_SCAN)**
- CT đầu não
- CT ngực
- CT bụng
- CT toàn thân

### **5. 🧠 Cộng hưởng từ (MRI)**
- MRI não
- MRI cột sống
- MRI khớp
- MRI các cơ quan nội tạng

### **6. 📡 Siêu âm (ULTRASOUND)**
- Siêu âm bụng
- Siêu âm tim
- Siêu âm thai
- Siêu âm các cơ quan khác

### **7. 🩺 Nhũ ảnh (MAMMOGRAPHY)**
- Tầm soát ung thư vú
- Chẩn đoán bệnh lý vú

### **8. ⚡ Chụp cắt lớp Positron (PET_SCAN)**
- PET/CT toàn thân
- Phát hiện ung thư
- Theo dõi điều trị

### **9. 💓 Điện tâm đồ (ECG)**
- ECG 12 chuyển đạo
- Holter ECG
- Theo dõi nhịp tim

### **10. 🔬 Nội soi (ENDOSCOPY)**
- Nội soi dạ dày
- Nội soi đại tràng
- Nội soi phế quản

### **11. 🧬 Giải phẫu bệnh (PATHOLOGY)**
- Kết quả sinh thiết
- Tế bào học
- Mô bệnh học

### **12. 📋 Tóm tắt xuất viện (DISCHARGE_SUMMARY)**
- Giấy ra viện
- Tóm tắt bệnh án
- Hướng dẫn sau xuất viện

### **13. 📄 Giấy chứng nhận y tế (MEDICAL_CERTIFICATE)**
- Giấy khám sức khỏe
- Giấy nghỉ ốm
- Chứng nhận y tế

### **14. 💉 Phiếu tiêm chủng (VACCINATION_RECORD)**
- Sổ tiêm chủng
- Chứng nhận vaccine
- Lịch sử tiêm chủng

## 🔧 Kiến trúc Hệ thống

### **Backend Components:**

#### **1. DocumentClassificationService** (`DocumentClassificationService.php`)
```php
public function classifyDocument(string $base64Image, string $mimeType): array
{
    // Phân loại tài liệu bằng AI
    // Trả về loại tài liệu, độ tin cậy, lý do phân loại
}

public function getSpecializedPrompt(string $documentType, ?string $userQuestion = null): string
{
    // Tạo prompt chuyên biệt cho từng loại tài liệu
}
```

#### **2. Enhanced GenAIService** (`GenAIService.php`)
```php
public function analyzeByDocumentType(string $base64Image, string $mimeType, string $documentType, ?string $userQuestion = null): string
{
    // Phân tích dựa trên loại tài liệu đã được phân loại
}

// Specialized prompts for each document type:
private function buildXRayPrompt(?string $userQuestion = null): string
private function buildCTScanPrompt(?string $userQuestion = null): string
private function buildMRIPrompt(?string $userQuestion = null): string
// ... và nhiều prompts chuyên biệt khác
```

#### **3. Updated AnalyzeAction** (`AnalyzeAction.php`)
```php
protected function action(): Response
{
    // Step 1: Classify document type
    $classificationResult = $this->classificationService->classifyDocument($fileData, $mimeType);
    
    // Step 2: Use appropriate analysis method
    $aiResponse = $this->genAIService->analyzeByDocumentType($fileData, $mimeType, $documentType, $userQuestion);
    
    // Step 3: Return structured report with classification info
}
```

### **Frontend Components:**

#### **1. Document Types** (`types/medicalDocumentTypes.ts`)
```typescript
export type MedicalDocumentType = 
  | 'LAB_RESULT' | 'PRESCRIPTION' | 'XRAY' | 'CT_SCAN' 
  | 'MRI' | 'ULTRASOUND' | 'MAMMOGRAPHY' | 'PET_SCAN'
  | 'ECG' | 'ENDOSCOPY' | 'PATHOLOGY' | 'DISCHARGE_SUMMARY'
  | 'MEDICAL_CERTIFICATE' | 'VACCINATION_RECORD' | 'UNKNOWN';

export interface DocumentClassificationResult {
  documentType: MedicalDocumentType;
  confidence: number;
  reasoning: string;
  suggestedAnalysisType: string;
  detectedFeatures: string[];
}
```

#### **2. Classification Badge** (`DocumentClassificationBadge.tsx`)
```tsx
<DocumentClassificationBadge 
  record={medicalRecord}
  showDetails={true}
/>
```

#### **3. Updated Analysis Workflow** (`AnalysisPage.tsx`)
- Loại bỏ manual type selection
- AI tự động phân loại tài liệu
- Hiển thị kết quả phân loại

## 🚀 Workflow Phân loại và Phân tích

### **1. Upload Document**
```
User uploads medical document
↓
Frontend sends to /api/analyze
```

### **2. Document Classification**
```
Backend receives document
↓
DocumentClassificationService.classifyDocument()
↓
AI analyzes image and returns:
{
  "documentType": "XRAY",
  "confidence": 0.95,
  "reasoning": "Detected X-ray characteristics...",
  "suggestedAnalysisType": "diagnostic_imaging",
  "detectedFeatures": ["bone structures", "medical header"]
}
```

### **3. Specialized Analysis**
```
Based on documentType:
↓
GenAIService.analyzeByDocumentType()
↓
Uses specialized prompt for document type
↓
Returns structured JSON analysis
```

### **4. Response with Classification**
```json
{
  "record": { ... },
  "structuredReport": { ... },
  "classification": {
    "documentType": "XRAY",
    "confidence": 0.95,
    "reasoning": "...",
    "detectedFeatures": [...]
  },
  "parsingSuccess": true,
  "message": "Phân tích hoàn thành thành công"
}
```

## 📊 Classification Features

### **AI Classification Prompt:**
```
Bạn là một chuyên gia y tế AI chuyên phân loại tài liệu y khoa.

DANH SÁCH CÁC LOẠI TÀI LIỆU:
1. LAB_RESULT - Kết quả xét nghiệm
2. PRESCRIPTION - Toa thuốc  
3. XRAY - Phiếu chụp X-quang
4. CT_SCAN - Chụp cắt lớp vi tính
5. MRI - Ảnh cộng hưởng từ
... (15 loại tài liệu)

HƯỚNG DẪN PHÂN TÍCH:
1. Quan sát layout và cấu trúc
2. Tìm từ khóa đặc trưng
3. Phân tích định dạng dữ liệu
4. Xác định mức độ tin cậy
5. Đưa ra lý do cụ thể
```

### **Specialized Analysis Prompts:**
- **X-ray Analysis**: Chuyên về chẩn đoán hình ảnh X-quang
- **CT Scan Analysis**: Tập trung vào cắt lớp vi tính
- **Lab Results**: Phân tích chỉ số xét nghiệm
- **Prescriptions**: Phân tích toa thuốc và tương tác
- **ECG Analysis**: Chuyên về điện tâm đồ
- ... và nhiều prompts chuyên biệt khác

## 🎯 Benefits

### **For Users:**
- 🤖 **Automatic Detection**: Không cần chọn loại tài liệu thủ công
- 🎯 **Specialized Analysis**: Phân tích chuyên biệt cho từng loại
- 📊 **Higher Accuracy**: Độ chính xác cao hơn nhờ prompts chuyên biệt
- 🔍 **Detailed Classification**: Thông tin chi tiết về việc phân loại

### **For System:**
- 🔄 **Scalable**: Dễ dàng thêm loại tài liệu mới
- 🎛️ **Configurable**: Có thể điều chỉnh prompts cho từng loại
- 📈 **Maintainable**: Code có cấu trúc rõ ràng
- 🛡️ **Robust**: Error handling và fallback mechanisms

## 🔧 Configuration

### **Environment Variables:**
```env
GENAI_API_KEY=your-google-genai-api-key
```

### **Supported File Types:**
- **Images**: JPEG, PNG, WEBP
- **Documents**: PDF
- **Max Size**: 10MB

## 📋 API Response Example

```json
{
  "statusCode": 201,
  "data": {
    "record": {
      "id": 123,
      "recordName": "X-quang ngực",
      "type": "diagnostic_imaging",
      "analysis": "{...structured JSON...}",
      "classification": {
        "documentType": "XRAY",
        "confidence": 0.95,
        "reasoning": "Phát hiện cấu trúc xương sườn và phổi đặc trưng của X-quang ngực",
        "suggestedAnalysisType": "diagnostic_imaging",
        "detectedFeatures": [
          "Cấu trúc xương sườn",
          "Hình ảnh phổi",
          "Header bệnh viện",
          "Thông tin bệnh nhân"
        ]
      }
    },
    "structuredReport": { ... },
    "classification": { ... },
    "parsingSuccess": true,
    "message": "Phân tích hoàn thành thành công"
  }
}
```

## 🎉 Result

**Hệ thống phân loại tài liệu y khoa tự động hoàn chỉnh!**

- ✅ **15 loại tài liệu y tế** được hỗ trợ
- ✅ **AI Classification** tự động và chính xác
- ✅ **Specialized Analysis** cho từng loại tài liệu
- ✅ **Professional UI** với classification badges
- ✅ **Structured JSON Output** cho tất cả loại tài liệu
- ✅ **Error Handling** và fallback mechanisms
- ✅ **Scalable Architecture** dễ mở rộng

**Người dùng giờ chỉ cần upload tài liệu y tế và AI sẽ tự động nhận diện, phân loại và phân tích chuyên nghiệp!** 🏥🤖✨
