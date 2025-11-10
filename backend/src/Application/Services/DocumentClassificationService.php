<?php

declare(strict_types=1);

namespace App\Application\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerInterface;

class DocumentClassificationService
{
    private Client $httpClient;
    private string $apiKey;
    private LoggerInterface $logger;

    public function __construct(string $apiKey, LoggerInterface $logger)
    {
        $this->apiKey = $apiKey;
        $this->logger = $logger;
        $this->httpClient = new Client([
            'base_uri' => 'https://generativelanguage.googleapis.com/v1beta/',
            'timeout' => 30,
        ]);
    }

    public function classifyDocument(string $base64Image, string $mimeType): array
    {
        try {
            $prompt = $this->buildClassificationPrompt();
            $response = $this->generateContent($base64Image, $mimeType, $prompt);
            
            // Parse classification response
            $classification = $this->parseClassificationResponse($response);
            
            return [
                'success' => true,
                'classification' => $classification,
                'rawResponse' => $response
            ];
            
        } catch (\Exception $e) {
            $this->logger->error('Document classification failed', [
                'error' => $e->getMessage(),
                'mime_type' => $mimeType
            ]);
            
            return [
                'success' => false,
                'classification' => $this->getDefaultClassification(),
                'error' => $e->getMessage()
            ];
        }
    }

    private function buildClassificationPrompt(): string
    {
        return 'Bạn là một chuyên gia y tế AI chuyên phân loại tài liệu y khoa. Hãy phân tích hình ảnh này và xác định loại tài liệu y tế.

QUAN TRỌNG: Trả về CHÍNH XÁC định dạng JSON sau:

{
  "documentType": "DOCUMENT_TYPE",
  "confidence": 0.95,
  "reasoning": "Lý do phân loại dựa trên các đặc điểm quan sát được",
  "suggestedAnalysisType": "ANALYSIS_TYPE",
  "detectedFeatures": ["Danh sách các đặc điểm đã phát hiện"]
}

DANH SÁCH CÁC LOẠI TÀI LIỆU Y KHOA:

1. **LAB_RESULT** - Kết quả xét nghiệm
   - Đặc điểm: Bảng số liệu, chỉ số, đơn vị đo, khoảng tham chiếu
   - Ví dụ: Xét nghiệm máu, nước tiểu, sinh hóa

2. **PRESCRIPTION** - Toa thuốc
   - Đặc điểm: Danh sách thuốc, liều lượng, cách dùng
   - Ví dụ: Đơn thuốc từ bác sĩ, dược sĩ

3. **XRAY** - Phiếu chụp X-quang
   - Đặc điểm: Hình ảnh X-quang, báo cáo chụp phim
   - Ví dụ: X-quang ngực, xương, khớp

4. **CT_SCAN** - Chụp cắt lớp vi tính
   - Đặc điểm: Hình ảnh CT, báo cáo CT scan
   - Ví dụ: CT đầu, ngực, bụng

5. **MRI** - Ảnh cộng hưởng từ
   - Đặc điểm: Hình ảnh MRI, báo cáo MRI
   - Ví dụ: MRI não, cột sống, khớp

6. **ULTRASOUND** - Siêu âm
   - Đặc điểm: Hình ảnh siêu âm, báo cáo siêu âm
   - Ví dụ: Siêu âm bụng, tim, thai

7. **MAMMOGRAPHY** - Nhũ ảnh
   - Đặc điểm: Hình ảnh chụp vú, báo cáo nhũ ảnh
   - Ví dụ: Tầm soát ung thư vú

8. **PET_SCAN** - Chụp cắt lớp Positron
   - Đặc điểm: Hình ảnh PET, báo cáo PET scan
   - Ví dụ: PET/CT toàn thân

9. **ECG** - Điện tâm đồ
   - Đặc điểm: Đường cong điện tim, số liệu ECG
   - Ví dụ: ECG 12 chuyển đạo

10. **ENDOSCOPY** - Nội soi
    - Đặc điểm: Hình ảnh nội soi, báo cáo nội soi
    - Ví dụ: Nội soi dạ dày, đại tràng

11. **PATHOLOGY** - Giải phẫu bệnh
    - Đặc điểm: Báo cáo mô bệnh học, kết quả sinh thiết
    - Ví dụ: Kết quả sinh thiết, tế bào học

12. **DISCHARGE_SUMMARY** - Tóm tắt xuất viện
    - Đặc điểm: Thông tin nhập viện, điều trị, xuất viện
    - Ví dụ: Giấy ra viện, tóm tắt bệnh án

13. **MEDICAL_CERTIFICATE** - Giấy chứng nhận y tế
    - Đặc điểm: Giấy chứng nhận sức khỏe, nghỉ việc
    - Ví dụ: Giấy khám sức khỏe, nghỉ ốm

14. **VACCINATION_RECORD** - Phiếu tiêm chủng
    - Đặc điểm: Lịch sử tiêm chủng, loại vaccine
    - Ví dụ: Sổ tiêm chủng, chứng nhận vaccine

15. **UNKNOWN** - Không xác định
    - Sử dụng khi không thể phân loại chính xác

LOẠI PHÂN TÍCH (suggestedAnalysisType):
- "diagnostic_imaging": Cho X-ray, CT, MRI, Ultrasound, Mammography, PET
- "lab_test": Cho Lab results, Pathology
- "prescription": Cho Prescription
- "medical_report": Cho ECG, Endoscopy, Discharge Summary, Medical Certificate, Vaccination

HƯỚNG DẪN PHÂN TÍCH:
1. Quan sát kỹ layout và cấu trúc của tài liệu
2. Tìm kiếm các từ khóa đặc trưng (tên bệnh viện, loại xét nghiệm, tên thuốc, v.v.)
3. Phân tích định dạng dữ liệu (bảng số liệu, hình ảnh y tế, danh sách thuốc)
4. Xác định mức độ tin cậy dựa trên độ rõ ràng của các đặc điểm
5. Đưa ra lý do phân loại cụ thể và chi tiết

Trả về JSON hợp lệ, không có markdown formatting.';
    }

    private function generateContent(string $base64Image, string $mimeType, string $prompt): string
    {
        try {
            $requestBody = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $base64Image
                                ]
                            ],
                            [
                                'text' => $prompt
                            ]
                        ]
                    ]
                ]
            ];

            $response = $this->httpClient->post("models/gemini-2.5-flash:generateContent", [
                'query' => ['key' => $this->apiKey],
                'json' => $requestBody,
                'headers' => [
                    'Content-Type' => 'application/json',
                ]
            ]);

            $responseData = json_decode($response->getBody()->getContents(), true);

            if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
                return $responseData['candidates'][0]['content']['parts'][0]['text'];
            }

            throw new \RuntimeException('Invalid response format from GenAI API');

        } catch (GuzzleException $e) {
            $this->logger->error('GenAI API request failed for classification', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);

            throw new \RuntimeException('Classification API request failed: ' . $e->getMessage());
        }
    }

    private function parseClassificationResponse(string $response): array
    {
        try {
            // Clean response
            $cleanResponse = $this->cleanResponse($response);
            
            $data = json_decode($cleanResponse, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \RuntimeException('Invalid JSON response: ' . json_last_error_msg());
            }
            
            // Validate required fields
            $requiredFields = ['documentType', 'confidence', 'reasoning', 'suggestedAnalysisType', 'detectedFeatures'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    throw new \RuntimeException("Missing required field: $field");
                }
            }
            
            // Validate document type
            $validTypes = [
                'LAB_RESULT', 'PRESCRIPTION', 'XRAY', 'CT_SCAN', 'MRI', 'ULTRASOUND',
                'MAMMOGRAPHY', 'PET_SCAN', 'ECG', 'ENDOSCOPY', 'PATHOLOGY',
                'DISCHARGE_SUMMARY', 'MEDICAL_CERTIFICATE', 'VACCINATION_RECORD', 'UNKNOWN'
            ];
            
            if (!in_array($data['documentType'], $validTypes)) {
                $data['documentType'] = 'UNKNOWN';
            }
            
            // Validate analysis type
            $validAnalysisTypes = ['diagnostic_imaging', 'lab_test', 'prescription', 'medical_report'];
            if (!in_array($data['suggestedAnalysisType'], $validAnalysisTypes)) {
                $data['suggestedAnalysisType'] = 'medical_report';
            }
            
            // Ensure confidence is between 0 and 1
            $data['confidence'] = max(0, min(1, (float)$data['confidence']));
            
            return $data;
            
        } catch (\Exception $e) {
            $this->logger->warning('Failed to parse classification response', [
                'error' => $e->getMessage(),
                'response_preview' => substr($response, 0, 200)
            ]);
            
            return $this->getDefaultClassification();
        }
    }

    private function cleanResponse(string $response): string
    {
        // Remove markdown code blocks
        $response = preg_replace('/```json\s*/', '', $response);
        $response = preg_replace('/```\s*$/', '', $response);
        
        // Remove any leading/trailing whitespace
        $response = trim($response);
        
        // Try to find JSON object boundaries
        $startPos = strpos($response, '{');
        $endPos = strrpos($response, '}');
        
        if ($startPos !== false && $endPos !== false && $endPos > $startPos) {
            $response = substr($response, $startPos, $endPos - $startPos + 1);
        }
        
        return $response;
    }

    private function getDefaultClassification(): array
    {
        return [
            'documentType' => 'UNKNOWN',
            'confidence' => 0.0,
            'reasoning' => 'Không thể phân loại tài liệu do lỗi xử lý',
            'suggestedAnalysisType' => 'medical_report',
            'detectedFeatures' => []
        ];
    }

    public function getSpecializedPrompt(string $documentType, ?string $userQuestion = null): string
    {
        switch ($documentType) {
            case 'XRAY':
                return $this->buildXRayPrompt($userQuestion);
            case 'CT_SCAN':
                return $this->buildCTScanPrompt($userQuestion);
            case 'MRI':
                return $this->buildMRIPrompt($userQuestion);
            case 'ULTRASOUND':
                return $this->buildUltrasoundPrompt($userQuestion);
            case 'MAMMOGRAPHY':
                return $this->buildMammographyPrompt($userQuestion);
            case 'PET_SCAN':
                return $this->buildPETScanPrompt($userQuestion);
            case 'ECG':
                return $this->buildECGPrompt($userQuestion);
            case 'ENDOSCOPY':
                return $this->buildEndoscopyPrompt($userQuestion);
            case 'PATHOLOGY':
                return $this->buildPathologyPrompt($userQuestion);
            case 'DISCHARGE_SUMMARY':
                return $this->buildDischargeSummaryPrompt($userQuestion);
            case 'MEDICAL_CERTIFICATE':
                return $this->buildMedicalCertificatePrompt($userQuestion);
            case 'VACCINATION_RECORD':
                return $this->buildVaccinationPrompt($userQuestion);
            default:
                // Fallback to existing prompts for LAB_RESULT and PRESCRIPTION
                return '';
        }
    }

    private function buildXRayPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ chẩn đoán hình ảnh chuyên nghiệp. Phân tích hình ảnh X-quang này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về CHÍNH XÁC định dạng JSON sau:

{
  "documentType": "XRAY",
  "patientInfo": {
    "name": "Tên bệnh nhân (nếu có)",
    "age": "Tuổi (nếu có)",
    "gender": "Giới tính (nếu có)",
    "patientId": "Mã bệnh nhân (nếu có)"
  },
  "studyInfo": {
    "studyType": "Loại chụp X-quang (ngực, xương, khớp, v.v.)",
    "studyDate": "Ngày chụp (nếu có)",
    "bodyPart": "Vùng cơ thể được chụp",
    "technique": "Kỹ thuật chụp (nếu có)",
    "indication": "Chỉ định chụp X-quang"
  },
  "findings": {
    "summary": "Tóm tắt chung về hình ảnh X-quang",
    "detailedFindings": [
      "Mô tả chi tiết các cấu trúc quan sát được",
      "Các bất thường (nếu có)"
    ],
    "measurements": [
      {
        "structure": "Cấu trúc đo",
        "measurement": "Kích thước",
        "unit": "Đơn vị",
        "normalRange": "Khoảng bình thường (nếu có)"
      }
    ],
    "abnormalities": ["Danh sách các bất thường phát hiện được"]
  },
  "impression": {
    "primaryDiagnosis": "Chẩn đoán chính",
    "differentialDiagnosis": ["Chẩn đoán phân biệt (nếu có)"],
    "severity": "MILD/MODERATE/SEVERE/CRITICAL"
  },
  "recommendations": {
    "followUp": ["Khuyến nghị theo dõi"],
    "additionalStudies": ["Xét nghiệm/chụp chiếu bổ sung (nếu cần)"],
    "clinicalCorrelation": "Cần kết hợp lâm sàng",
    "urgency": "ROUTINE/URGENT/CRITICAL"
  },
  "disclaimer": "Kết quả này chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến bác sĩ chuyên khoa chẩn đoán hình ảnh."
}';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG: \"" . trim($userQuestion) . "\"
Hãy trả lời câu hỏi này trong phần 'findings.summary' và 'recommendations'.";
        }

        $prompt .= "\n\nHướng dẫn phân tích X-quang:
1. Đánh giá chất lượng hình ảnh (độ phơi sáng, độ tương phản, vị trí)
2. Quan sát hệ thống từng bộ phận (xương, khớp, mô mềm, cơ quan)
3. Xác định các bất thường về hình dạng, kích thước, mật độ
4. Đo lường các cấu trúc quan trọng (nếu cần)
5. Đưa ra chẩn đoán dựa trên các dấu hiệu hình ảnh

Trả về JSON hợp lệ, không có markdown formatting.";

        return $prompt;
    }

    private function buildCTScanPrompt(?string $userQuestion = null): string
    {
        // Similar structure for CT Scan - implement other specialized prompts
        return $this->buildDiagnosticImagingPrompt('CT_SCAN', 'chụp cắt lớp vi tính (CT)', $userQuestion);
    }

    private function buildMRIPrompt(?string $userQuestion = null): string
    {
        return $this->buildDiagnosticImagingPrompt('MRI', 'cộng hưởng từ (MRI)', $userQuestion);
    }

    private function buildUltrasoundPrompt(?string $userQuestion = null): string
    {
        return $this->buildDiagnosticImagingPrompt('ULTRASOUND', 'siêu âm', $userQuestion);
    }

    private function buildMammographyPrompt(?string $userQuestion = null): string
    {
        return $this->buildDiagnosticImagingPrompt('MAMMOGRAPHY', 'nhũ ảnh', $userQuestion);
    }

    private function buildPETScanPrompt(?string $userQuestion = null): string
    {
        return $this->buildDiagnosticImagingPrompt('PET_SCAN', 'chụp cắt lớp Positron (PET)', $userQuestion);
    }

    private function buildDiagnosticImagingPrompt(string $type, string $typeName, ?string $userQuestion = null): string
    {
        $prompt = "Bạn là một bác sĩ chẩn đoán hình ảnh chuyên nghiệp. Phân tích hình ảnh {$typeName} này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là \"{$type}\" và cấu trúc tương tự như X-ray nhưng phù hợp với đặc điểm của {$typeName}.";

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildECGPrompt(?string $userQuestion = null): string
    {
        // Implement ECG-specific prompt
        return 'Phân tích điện tâm đồ (ECG) với cấu trúc JSON chuyên biệt cho ECG...';
    }

    private function buildEndoscopyPrompt(?string $userQuestion = null): string
    {
        // Implement Endoscopy-specific prompt
        return 'Phân tích kết quả nội soi với cấu trúc JSON chuyên biệt cho nội soi...';
    }

    private function buildPathologyPrompt(?string $userQuestion = null): string
    {
        // Implement Pathology-specific prompt
        return 'Phân tích kết quả giải phẫu bệnh với cấu trúc JSON chuyên biệt...';
    }

    private function buildDischargeSummaryPrompt(?string $userQuestion = null): string
    {
        // Implement Discharge Summary-specific prompt
        return 'Phân tích tóm tắt xuất viện với cấu trúc JSON chuyên biệt...';
    }

    private function buildMedicalCertificatePrompt(?string $userQuestion = null): string
    {
        // Implement Medical Certificate-specific prompt
        return 'Phân tích giấy chứng nhận y tế với cấu trúc JSON chuyên biệt...';
    }

    private function buildVaccinationPrompt(?string $userQuestion = null): string
    {
        // Implement Vaccination Record-specific prompt
        return 'Phân tích phiếu tiêm chủng với cấu trúc JSON chuyên biệt...';
    }
}
