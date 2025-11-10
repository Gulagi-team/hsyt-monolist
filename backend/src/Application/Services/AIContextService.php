<?php

declare(strict_types=1);

namespace App\Application\Services;

use Psr\Log\LoggerInterface;
use PDO;

class AIContextService
{
    private LoggerInterface $logger;
    private MedicalContextExtractionService $contextExtractionService;

    public function __construct(
        LoggerInterface $logger,
        MedicalContextExtractionService $contextExtractionService
    ) {
        $this->logger = $logger;
        $this->contextExtractionService = $contextExtractionService;
    }

    /**
     * Build comprehensive AI context for patient questions
     */
    public function buildAIContext(int $userId, PDO $pdo, ?string $currentQuestion = null): string
    {
        try {
            // Get patient medical history context
            $patientContext = $this->contextExtractionService->getPatientHistoryContext($userId, $pdo);
            
            if (empty($patientContext)) {
                return $this->buildBasicContext($currentQuestion);
            }

            $contextParts = [];

            // Patient profile section
            $contextParts[] = "=== THÔNG TIN BỆNH NHÂN ===";
            $profile = $patientContext['patient_profile'];
            $contextParts[] = "Họ tên: " . ($profile['name'] ?? 'Không có thông tin');
            $contextParts[] = "Tuổi: " . ($profile['age'] ?? 'Không có thông tin');
            $contextParts[] = "Nhóm máu: " . ($profile['blood_type'] ?? 'Không có thông tin');
            $contextParts[] = "Dị ứng: " . ($profile['allergies'] ?? 'Không có');
            $contextParts[] = "Tình trạng hiện tại: " . ($profile['current_conditions'] ?? 'Không có thông tin');

            // Medical history section
            $history = $patientContext['medical_history'];
            $contextParts[] = "\n=== LỊCH SỬ Y TẾ ===";
            $contextParts[] = "Tổng số hồ sơ: " . ($history['total_records'] ?? 0);
            
            if (!empty($history['last_record_date'])) {
                $contextParts[] = "Hồ sơ gần nhất: " . $history['last_record_date'];
            }

            // Document types
            if (!empty($history['document_types'])) {
                $contextParts[] = "Loại tài liệu đã có: " . implode(', ', $history['document_types']);
            }

            // Recent diagnoses
            if (!empty($history['diagnoses'])) {
                $contextParts[] = "Chẩn đoán gần đây: " . implode(', ', array_filter($history['diagnoses']));
            }

            // Recent medical records summary
            if (!empty($history['recent_records'])) {
                $contextParts[] = "\n=== HỒ SƠ GẦN ĐÂY ===";
                
                foreach (array_slice($history['recent_records'], 0, 5) as $record) {
                    if (!empty($record['ai_summary'])) {
                        $date = date('d/m/Y', strtotime($record['created_at']));
                        $contextParts[] = "- [{$date}] " . $record['ai_summary'];
                        
                        // Add key findings if available
                        if (!empty($record['key_findings'])) {
                            $findings = is_string($record['key_findings']) 
                                ? json_decode($record['key_findings'], true) 
                                : $record['key_findings'];
                            
                            if (is_array($findings)) {
                                foreach (array_slice($findings, 0, 3) as $finding) {
                                    if (!empty($finding)) {
                                        $contextParts[] = "  + " . $finding;
                                    }
                                }
                            }
                        }
                        
                        // Add abnormal values if available
                        if (!empty($record['abnormal_values'])) {
                            $abnormal = is_string($record['abnormal_values']) 
                                ? json_decode($record['abnormal_values'], true) 
                                : $record['abnormal_values'];
                            
                            if (is_array($abnormal)) {
                                foreach (array_slice($abnormal, 0, 2) as $abnormalValue) {
                                    if (isset($abnormalValue['parameter']) && isset($abnormalValue['value'])) {
                                        $contextParts[] = "  ! " . $abnormalValue['parameter'] . ": " . $abnormalValue['value'] . " (" . ($abnormalValue['status'] ?? 'bất thường') . ")";
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Current question context
            if ($currentQuestion) {
                $contextParts[] = "\n=== CÂU HỎI HIỆN TẠI ===";
                $contextParts[] = $currentQuestion;
            }

            // Instructions for AI
            $contextParts[] = "\n=== HƯỚNG DẪN TRẢ LỜI ===";
            $contextParts[] = "- Dựa vào thông tin bệnh nhân và lịch sử y tế ở trên để trả lời";
            $contextParts[] = "- Tham khảo các kết quả xét nghiệm và chẩn đoán trước đây";
            $contextParts[] = "- Lưu ý đến dị ứng và tình trạng sức khỏe hiện tại";
            $contextParts[] = "- Đưa ra lời khuyên phù hợp với từng cá nhân";
            $contextParts[] = "- Luôn khuyến nghị tham khảo bác sĩ cho các vấn đề nghiêm trọng";

            return implode("\n", $contextParts);

        } catch (\Exception $e) {
            $this->logger->error('Failed to build AI context', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            
            return $this->buildBasicContext($currentQuestion);
        }
    }

    /**
     * Build basic context when patient data is not available
     */
    private function buildBasicContext(?string $currentQuestion = null): string
    {
        $contextParts = [];
        
        $contextParts[] = "=== THÔNG TIN BỆNH NHÂN ===";
        $contextParts[] = "Chưa có thông tin chi tiết về bệnh nhân.";
        
        if ($currentQuestion) {
            $contextParts[] = "\n=== CÂU HỎI ===";
            $contextParts[] = $currentQuestion;
        }
        
        $contextParts[] = "\n=== HƯỚNG DẪN TRẢ LỜI ===";
        $contextParts[] = "- Đưa ra lời khuyên y tế tổng quát";
        $contextParts[] = "- Khuyến nghị bệnh nhân cung cấp thêm thông tin nếu cần";
        $contextParts[] = "- Luôn khuyến nghị tham khảo bác sĩ cho chẩn đoán chính xác";
        
        return implode("\n", $contextParts);
    }

    /**
     * Generate AI prompt with patient context for medical questions
     */
    public function generateMedicalQuestionPrompt(
        int $userId, 
        PDO $pdo, 
        string $question,
        ?array $recentAnalysis = null
    ): string {
        // Build comprehensive context
        $patientContext = $this->buildAIContext($userId, $pdo, $question);
        
        // Add recent analysis if provided
        $recentAnalysisContext = '';
        if ($recentAnalysis) {
            $recentAnalysisContext = "\n=== PHÂN TÍCH GẦN NHẤT ===\n";
            if (isset($recentAnalysis['ai_summary'])) {
                $recentAnalysisContext .= "Tóm tắt: " . $recentAnalysis['ai_summary'] . "\n";
            }
            if (isset($recentAnalysis['key_findings']) && is_array($recentAnalysis['key_findings'])) {
                $recentAnalysisContext .= "Phát hiện chính: " . implode(', ', $recentAnalysis['key_findings']) . "\n";
            }
        }

        $prompt = "Bạn là một bác sĩ AI chuyên nghiệp và thân thiện. Hãy trả lời câu hỏi của bệnh nhân dựa trên thông tin y tế của họ.

{$patientContext}
{$recentAnalysisContext}

QUAN TRỌNG:
- Trả lời bằng tiếng Việt, dễ hiểu và thân thiện
- Dựa vào lịch sử y tế và thông tin cá nhân của bệnh nhân
- Đưa ra lời khuyên cụ thể và phù hợp
- Lưu ý đến các dị ứng và tình trạng sức khỏe hiện tại
- Tham khảo các kết quả xét nghiệm trước đây nếu có liên quan
- Luôn khuyến nghị tham khảo bác sĩ cho các vấn đề nghiêm trọng
- Không chẩn đoán bệnh mà chỉ đưa ra lời khuyên và hướng dẫn

Hãy trả lời câu hỏi một cách chi tiết và hữu ích.";

        return $prompt;
    }

    /**
     * Get recent analysis for context
     */
    public function getRecentAnalysisForContext(int $userId, PDO $pdo): ?array
    {
        try {
            $query = "SELECT ai_summary, key_findings, abnormal_values, recommendations, 
                             document_type, test_date, diagnosis, created_at
                      FROM medical_records 
                      WHERE user_id = :user_id 
                      ORDER BY created_at DESC 
                      LIMIT 1";
            
            $statement = $pdo->prepare($query);
            $statement->execute(['user_id' => $userId]);
            $record = $statement->fetch();
            
            if (!$record) {
                return null;
            }
            
            // Parse JSON fields
            if (!empty($record['key_findings'])) {
                $record['key_findings'] = is_string($record['key_findings']) 
                    ? json_decode($record['key_findings'], true) 
                    : $record['key_findings'];
            }
            
            if (!empty($record['abnormal_values'])) {
                $record['abnormal_values'] = is_string($record['abnormal_values']) 
                    ? json_decode($record['abnormal_values'], true) 
                    : $record['abnormal_values'];
            }
            
            return $record;
            
        } catch (\Exception $e) {
            $this->logger->error('Failed to get recent analysis for context', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
