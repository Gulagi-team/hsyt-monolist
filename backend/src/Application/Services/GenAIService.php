<?php

declare(strict_types=1);

namespace App\Application\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerInterface;

class GenAIService
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
            'timeout' => 60,
        ]);
    }

    public function analyzeLabResult(string $base64Image, string $mimeType, ?string $userQuestion = null): string
    {
        $prompt = $this->buildLabResultPrompt($userQuestion);
        return $this->generateContent($base64Image, $mimeType, $prompt);
    }

    public function analyzePrescription(string $base64Image, string $mimeType, ?string $userQuestion = null): string
    {
        $prompt = $this->buildPrescriptionPrompt($userQuestion);
        return $this->generateContent($base64Image, $mimeType, $prompt);
    }

    public function analyzeByDocumentType(string $base64Image, string $mimeType, string $documentType, ?string $userQuestion = null): string
    {
        $prompt = $this->getPromptByDocumentType($documentType, $userQuestion);
        return $this->generateContent($base64Image, $mimeType, $prompt);
    }

    private function getPromptByDocumentType(string $documentType, ?string $userQuestion = null): string
    {
        switch ($documentType) {
            case 'LAB_RESULT':
                return $this->buildLabResultPrompt($userQuestion);
            case 'PRESCRIPTION':
                return $this->buildPrescriptionPrompt($userQuestion);
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
                // Fallback to general medical document analysis
                return $this->buildGeneralMedicalPrompt($userQuestion);
        }
    }

    private function buildLabResultPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một chuyên gia y tế AI chuyên nghiệp. Phân tích hình ảnh kết quả xét nghiệm và trả về kết quả dưới dạng JSON có cấu trúc chuyên nghiệp.

QUAN TRỌNG: Trả về CHÍNH XÁC định dạng JSON sau, không thêm markdown hay text khác:

{
  "reportType": "LAB_RESULT",
  "patientInfo": {
    "name": "Tên bệnh nhân (nếu có trong ảnh)",
    "age": "Tuổi (nếu có)",
    "gender": "Giới tính (nếu có)",
    "patientId": "Mã bệnh nhân (nếu có)"
  },
  "testInfo": {
    "testName": "Tên xét nghiệm",
    "testDate": "Ngày xét nghiệm (nếu có)",
    "sampleType": "Loại mẫu (máu, nước tiểu, v.v.)",
    "laboratoryName": "Tên phòng xét nghiệm (nếu có)"
  },
  "results": [
    {
      "parameter": "Tên chỉ số",
      "value": "Giá trị đo được",
      "unit": "Đơn vị",
      "referenceRange": "Khoảng tham chiếu",
      "status": "NORMAL/HIGH/LOW/CRITICAL",
      "flag": "Ghi chú đặc biệt (nếu có)"
    }
  ],
  "interpretation": {
    "summary": "Tóm tắt tổng quan kết quả xét nghiệm",
    "abnormalFindings": ["Danh sách các chỉ số bất thường"],
    "clinicalSignificance": "Ý nghĩa lâm sàng của các kết quả",
    "recommendations": ["Khuyến nghị cụ thể cho bệnh nhân"]
  },
  "diagnosticSuggestions": {
    "possibleConditions": [
      {
        "condition": "Tên bệnh lý có thể",
        "probability": "HIGH/MEDIUM/LOW",
        "description": "Mô tả ngắn gọn"
      }
    ]
  },
  "followUp": {
    "nextSteps": ["Các bước tiếp theo cần thực hiện"],
    "specialistReferral": "Chuyên khoa cần tham khảo (nếu có)",
    "additionalTests": ["Xét nghiệm bổ sung cần làm (nếu có)"],
    "urgencyLevel": "ROUTINE/URGENT/CRITICAL"
  },
  "disclaimer": "Kết quả này chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến bác sĩ chuyên khoa để có chẩn đoán và điều trị chính xác."
}';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG: \"" . trim($userQuestion) . "\"
Hãy trả lời câu hỏi này trong phần 'interpretation.summary' và 'recommendations'.";
        }

        $prompt .= "\n\nHướng dẫn phân tích:
1. Trích xuất TẤT CẢ các chỉ số từ hình ảnh
2. Phân loại chính xác trạng thái (NORMAL/HIGH/LOW/CRITICAL)
3. Đưa ra giải thích y khoa chuyên nghiệp
4. Khuyến nghị cụ thể và thiết thực
5. Đánh giá mức độ khẩn cấp phù hợp

Trả về JSON hợp lệ, không có markdown formatting.";

        return $prompt;
    }

    private function buildPrescriptionPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một dược sĩ AI chuyên nghiệp. Phân tích hình ảnh toa thuốc và trả về kết quả dưới dạng JSON có cấu trúc chuyên nghiệp.

QUAN TRỌNG: Trả về CHÍNH XÁC định dạng JSON sau, không thêm markdown hay text khác:

{
  "reportType": "PRESCRIPTION",
  "patientInfo": {
    "name": "Tên bệnh nhân (nếu có trong ảnh)",
    "age": "Tuổi (nếu có)",
    "gender": "Giới tính (nếu có)",
    "patientId": "Mã bệnh nhân (nếu có)"
  },
  "prescriptionInfo": {
    "prescriptionDate": "Ngày kê đơn (nếu có)",
    "prescribingPhysician": "Tên bác sĩ kê đơn (nếu có)",
    "clinicName": "Tên phòng khám/bệnh viện (nếu có)",
    "diagnosis": "Chẩn đoán (nếu có)"
  },
  "treatmentAnalysis": {
    "primaryDiagnosis": "Chẩn đoán chính dựa trên tổ hợp thuốc được kê",
    "treatmentGoals": ["Mục tiêu điều trị chính"],
    "treatmentApproach": "Phương pháp điều trị tổng thể",
    "expectedOutcome": "Kết quả mong đợi từ điều trị"
  },
  "medications": [
    {
      "name": "Tên thuốc thương mại",
      "genericName": "Tên hoạt chất (nếu có)",
      "dosage": "Liều lượng (mg, ml, v.v.)",
      "frequency": "Tần suất sử dụng",
      "duration": "Thời gian sử dụng (nếu có)",
      "instructions": "Hướng dẫn sử dụng chi tiết",
      "primaryAction": "Tác dụng chính của thuốc đối với bệnh được chẩn đoán",
      "mechanismOfAction": "Cơ chế hoạt động của thuốc",
      "therapeuticRole": "Vai trò của thuốc trong phác đồ điều trị tổng thể",
      "sideEffects": ["Tác dụng phụ có thể gặp"],
      "contraindications": ["Chống chỉ định"],
      "interactions": ["Tương tác thuốc cần lưu ý"]
    }
  ],
  "generalInstructions": {
    "dosageInstructions": ["Hướng dẫn về liều lượng"],
    "storageInstructions": ["Hướng dẫn bảo quản"],
    "generalPrecautions": ["Các lưu ý chung"],
    "whenToSeekHelp": ["Khi nào cần tìm kiếm trợ giúp y tế"]
  },
  "followUp": {
    "nextAppointment": "Lịch tái khám (nếu có)",
    "monitoringRequired": ["Theo dõi cần thiết"],
    "warningSignsToWatch": ["Dấu hiệu cảnh báo cần chú ý"]
  },
  "pharmacistNotes": ["Ghi chú của dược sĩ (nếu có)"],
  "disclaimer": "Thông tin này chỉ mang tính tham khảo. Vui lòng tuân thủ chỉ định của bác sĩ và không tự ý thay đổi liều lượng."
}';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ CỦA NGƯỜI DÙNG: \"" . trim($userQuestion) . "\"
Hãy trả lời câu hỏi này trong phần 'generalInstructions' và 'pharmacistNotes'.";
        }

        $prompt .= "\n\nHướng dẫn phân tích:
1. Trích xuất TẤT CẢ thông tin thuốc từ hình ảnh
2. Phân tích liều lượng và tần suất chính xác
3. Đưa ra hướng dẫn sử dụng chi tiết
4. Cảnh báo tác dụng phụ và tương tác thuốc
5. Khuyến nghị theo dõi và lưu ý an toàn

Trả về JSON hợp lệ, không có markdown formatting.";

        return $prompt;
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
    "studyType": "Loại chụp X-quang",
    "studyDate": "Ngày chụp (nếu có)",
    "bodyPart": "Vùng cơ thể được chụp",
    "technique": "Kỹ thuật chụp (nếu có)",
    "indication": "Chỉ định chụp X-quang"
  },
  "findings": {
    "summary": "Tóm tắt chung về hình ảnh X-quang",
    "detailedFindings": ["Mô tả chi tiết các cấu trúc quan sát được"],
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
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"
Hãy trả lời câu hỏi này trong phần 'findings.summary' và 'recommendations'.";
        }

        return $prompt;
    }

    private function buildCTScanPrompt(?string $userQuestion = null): string
    {
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

    private function buildECGPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ tim mạch chuyên nghiệp. Phân tích điện tâm đồ (ECG) này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "ECG" và cấu trúc chuyên biệt cho điện tâm đồ.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildEndoscopyPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ tiêu hóa chuyên nghiệp. Phân tích kết quả nội soi này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "ENDOSCOPY" và cấu trúc chuyên biệt cho nội soi.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildPathologyPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ giải phẫu bệnh chuyên nghiệp. Phân tích kết quả giải phẫu bệnh này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "PATHOLOGY" và cấu trúc chuyên biệt cho giải phẫu bệnh.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildDischargeSummaryPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ lâm sàng chuyên nghiệp. Phân tích tóm tắt xuất viện này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "DISCHARGE_SUMMARY" và cấu trúc chuyên biệt cho tóm tắt xuất viện.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildMedicalCertificatePrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ chuyên nghiệp. Phân tích giấy chứng nhận y tế này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "MEDICAL_CERTIFICATE" và cấu trúc chuyên biệt cho giấy chứng nhận y tế.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
    }

    private function buildVaccinationPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một bác sĩ y tế dự phòng chuyên nghiệp. Phân tích phiếu tiêm chủng này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON với documentType là "VACCINATION_RECORD" và cấu trúc chuyên biệt cho phiếu tiêm chủng.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
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

    private function buildGeneralMedicalPrompt(?string $userQuestion = null): string
    {
        $prompt = 'Bạn là một chuyên gia y tế AI. Phân tích tài liệu y tế này và trả về kết quả dưới dạng JSON có cấu trúc.

QUAN TRỌNG: Trả về định dạng JSON phù hợp với loại tài liệu được phát hiện.';

        if ($userQuestion && trim($userQuestion)) {
            $prompt .= "\n\nCÂU HỎI CỤ THỂ: \"" . trim($userQuestion) . "\"";
        }

        return $prompt;
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

            $this->logger->error('GenAI API response missing expected text content', [
                'response' => $responseData
            ]);

            return 'Không thể phân tích hình ảnh. Vui lòng thử lại sau.';

        } catch (GuzzleException $e) {
            $this->logger->error('GenAI API request failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);

            return 'Đã xảy ra lỗi trong quá trình phân tích: ' . $e->getMessage() . '. Vui lòng thử lại.';
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error during GenAI analysis', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 'Đã xảy ra lỗi không xác định trong quá trình phân tích. Vui lòng thử lại.';
        }
    }
}
