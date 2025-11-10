<?php

declare(strict_types=1);

namespace App\Application\Services;

use Psr\Log\LoggerInterface;

class MedicalContextExtractionService
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Extract medical context from structured report for AI use
     */
    public function extractMedicalContext(array $structuredReport): array
    {
        try {
            $context = [
                'structured_data' => $structuredReport,
                'document_type' => null,
                'classification_confidence' => null,
                'patient_context' => [],
                'test_date' => null,
                'doctor_name' => null,
                'clinic_name' => null,
                'diagnosis' => null,
                'medications' => [],
                'test_results' => [],
                'ai_summary' => null,
                'key_findings' => [],
                'abnormal_values' => [],
                'recommendations' => []
            ];

            // Extract classification info
            if (isset($structuredReport['classification'])) {
                $context['document_type'] = $structuredReport['classification']['documentType'] ?? null;
                $context['classification_confidence'] = $structuredReport['classification']['confidence'] ?? null;
            }

            // Extract report data
            if (isset($structuredReport['report'])) {
                $report = $structuredReport['report'];
                
                // Extract based on report type
                if ($report['reportType'] === 'LAB_RESULT') {
                    $context = array_merge($context, $this->extractLabResultContext($report));
                } elseif ($report['reportType'] === 'PRESCRIPTION') {
                    $context = array_merge($context, $this->extractPrescriptionContext($report));
                }
            }

            // Extract patient context
            $context['patient_context'] = $this->extractPatientContext($structuredReport);

            // Generate AI summary
            $context['ai_summary'] = $this->generateAISummary($context);

            return $context;

        } catch (\Exception $e) {
            $this->logger->error('Failed to extract medical context', [
                'error' => $e->getMessage(),
                'structured_report' => $structuredReport
            ]);
            
            return [
                'structured_data' => $structuredReport,
                'ai_summary' => 'Không thể trích xuất thông tin từ báo cáo này.'
            ];
        }
    }

    /**
     * Extract context from lab result report
     */
    private function extractLabResultContext(array $labReport): array
    {
        $context = [];

        // Extract patient info
        if (isset($labReport['patientInfo'])) {
            $patientInfo = $labReport['patientInfo'];
            $context['patient_context'] = [
                'name' => $patientInfo['name'] ?? null,
                'age' => $patientInfo['age'] ?? null,
                'gender' => $patientInfo['gender'] ?? null,
                'patient_id' => $patientInfo['patientId'] ?? null
            ];
        }

        // Extract test info
        if (isset($labReport['testInfo'])) {
            $testInfo = $labReport['testInfo'];
            $context['test_date'] = $this->validateDate($testInfo['testDate'] ?? null);
            $context['clinic_name'] = $testInfo['laboratoryName'] ?? null;
        }

        // Extract test results
        if (isset($labReport['results']) && is_array($labReport['results'])) {
            $context['test_results'] = $labReport['results'];
            
            // Extract abnormal values
            $abnormalValues = [];
            foreach ($labReport['results'] as $result) {
                if (isset($result['status']) && $result['status'] !== 'NORMAL') {
                    $abnormalValues[] = [
                        'parameter' => $result['parameter'] ?? '',
                        'value' => $result['value'] ?? '',
                        'unit' => $result['unit'] ?? '',
                        'reference_range' => $result['referenceRange'] ?? '',
                        'status' => $result['status'] ?? ''
                    ];
                }
            }
            $context['abnormal_values'] = $abnormalValues;
        }

        // Extract interpretation
        if (isset($labReport['interpretation'])) {
            $interpretation = $labReport['interpretation'];
            $context['key_findings'] = array_merge(
                $interpretation['abnormalFindings'] ?? [],
                [$interpretation['summary'] ?? '']
            );
            $context['recommendations'] = $interpretation['recommendations'] ?? [];
        }

        // Extract diagnostic suggestions
        if (isset($labReport['diagnosticSuggestions']['possibleConditions'])) {
            foreach ($labReport['diagnosticSuggestions']['possibleConditions'] as $condition) {
                if (isset($condition['condition'])) {
                    $context['key_findings'][] = "Có thể: " . $condition['condition'];
                }
            }
        }

        return $context;
    }

    /**
     * Extract context from prescription report
     */
    private function extractPrescriptionContext(array $prescriptionReport): array
    {
        $context = [];

        // Extract patient info
        if (isset($prescriptionReport['patientInfo'])) {
            $patientInfo = $prescriptionReport['patientInfo'];
            $context['patient_context'] = [
                'name' => $patientInfo['name'] ?? null,
                'age' => $patientInfo['age'] ?? null,
                'gender' => $patientInfo['gender'] ?? null
            ];
        }

        // Extract prescription info
        if (isset($prescriptionReport['prescriptionInfo'])) {
            $prescriptionInfo = $prescriptionReport['prescriptionInfo'];
            $context['test_date'] = $this->validateDate($prescriptionInfo['prescriptionDate'] ?? null);
            $context['doctor_name'] = $prescriptionInfo['prescribingPhysician'] ?? null;
            $context['clinic_name'] = $prescriptionInfo['clinicName'] ?? null;
            $context['diagnosis'] = $prescriptionInfo['diagnosis'] ?? null;
        }

        // Extract medications
        if (isset($prescriptionReport['medications']) && is_array($prescriptionReport['medications'])) {
            $medications = [];
            foreach ($prescriptionReport['medications'] as $medication) {
                $medications[] = [
                    'name' => $medication['name'] ?? '',
                    'generic_name' => $medication['genericName'] ?? null,
                    'dosage' => $medication['dosage'] ?? '',
                    'frequency' => $medication['frequency'] ?? '',
                    'duration' => $medication['duration'] ?? null,
                    'instructions' => $medication['instructions'] ?? '',
                    'side_effects' => $medication['sideEffects'] ?? []
                ];
            }
            $context['medications'] = $medications;
        }

        // Extract key findings from medications
        $keyFindings = [];
        if (isset($prescriptionReport['medications'])) {
            foreach ($prescriptionReport['medications'] as $medication) {
                $keyFindings[] = "Thuốc: " . ($medication['name'] ?? 'Unknown');
                if (isset($medication['sideEffects']) && is_array($medication['sideEffects'])) {
                    foreach ($medication['sideEffects'] as $sideEffect) {
                        $keyFindings[] = "Tác dụng phụ: " . $sideEffect;
                    }
                }
            }
        }
        $context['key_findings'] = $keyFindings;

        // Extract recommendations
        if (isset($prescriptionReport['generalInstructions'])) {
            $instructions = $prescriptionReport['generalInstructions'];
            $recommendations = [];
            if (isset($instructions['dosageInstructions'])) {
                $recommendations = array_merge($recommendations, $instructions['dosageInstructions']);
            }
            if (isset($instructions['storageInstructions'])) {
                $recommendations = array_merge($recommendations, $instructions['storageInstructions']);
            }
            $context['recommendations'] = $recommendations;
        }

        return $context;
    }

    /**
     * Extract general patient context
     */
    private function extractPatientContext(array $structuredReport): array
    {
        $patientContext = [];

        // Try to extract from different report types
        if (isset($structuredReport['report']['patientInfo'])) {
            $patientInfo = $structuredReport['report']['patientInfo'];
            $patientContext = [
                'name' => $patientInfo['name'] ?? null,
                'age' => $patientInfo['age'] ?? null,
                'gender' => $patientInfo['gender'] ?? null,
                'patient_id' => $patientInfo['patientId'] ?? null
            ];
        }

        return array_filter($patientContext, function($value) {
            return $value !== null && $value !== '' && $value !== 'Không có trong ảnh' && $value !== 'Không có thông tin';
        });
    }

    /**
     * Generate AI summary for quick reference
     */
    private function generateAISummary(array $context): string
    {
        $summaryParts = [];

        // Document type
        if ($context['document_type']) {
            $documentTypeNames = [
                'LAB_RESULT' => 'Kết quả xét nghiệm',
                'PRESCRIPTION' => 'Toa thuốc',
                'XRAY' => 'X-quang',
                'CT_SCAN' => 'CT Scan',
                'MRI' => 'MRI',
                'ULTRASOUND' => 'Siêu âm'
            ];
            $typeName = $documentTypeNames[$context['document_type']] ?? $context['document_type'];
            $summaryParts[] = $typeName;
        }

        // Test date
        if ($context['test_date']) {
            $summaryParts[] = "ngày " . $context['test_date'];
        }

        // Key findings
        if (!empty($context['abnormal_values'])) {
            $abnormalCount = count($context['abnormal_values']);
            $summaryParts[] = "{$abnormalCount} chỉ số bất thường";
        }

        // Medications
        if (!empty($context['medications'])) {
            $medicationCount = count($context['medications']);
            $summaryParts[] = "{$medicationCount} loại thuốc";
        }

        // Diagnosis
        if ($context['diagnosis']) {
            $summaryParts[] = "chẩn đoán: " . $context['diagnosis'];
        }

        return implode(', ', $summaryParts) ?: 'Báo cáo y tế';
    }

    /**
     * Get patient medical history context for AI
     */
    public function getPatientHistoryContext(int $userId, \PDO $pdo): array
    {
        try {
            // Get patient context from view
            $query = "SELECT * FROM patient_ai_context WHERE user_id = :user_id";
            $statement = $pdo->prepare($query);
            $statement->execute(['user_id' => $userId]);
            $patientContext = $statement->fetch();

            if (!$patientContext) {
                return [];
            }

            // Get recent medical records for detailed context
            $query = "SELECT ai_summary, key_findings, abnormal_values, recommendations, 
                             document_type, test_date, diagnosis, created_at
                      FROM medical_records 
                      WHERE user_id = :user_id 
                      ORDER BY created_at DESC 
                      LIMIT 10";
            $statement = $pdo->prepare($query);
            $statement->execute(['user_id' => $userId]);
            $recentRecords = $statement->fetchAll();

            return [
                'patient_profile' => [
                    'name' => $patientContext['name'],
                    'age' => $patientContext['age'],
                    'blood_type' => $patientContext['blood_type'],
                    'allergies' => $patientContext['allergies'],
                    'current_conditions' => $patientContext['current_conditions']
                ],
                'medical_history' => [
                    'total_records' => $patientContext['total_records'],
                    'last_record_date' => $patientContext['last_record_date'],
                    'document_types' => $patientContext['document_types'] ? json_decode($patientContext['document_types'], true) : [],
                    'diagnoses' => $patientContext['diagnoses'] ? json_decode($patientContext['diagnoses'], true) : [],
                    'recent_records' => $recentRecords
                ],
                'summary' => $patientContext['latest_summary'] ?? 'Không có thông tin tóm tắt'
            ];

        } catch (\Exception $e) {
            $this->logger->error('Failed to get patient history context', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Validate and format date string for database storage
     */
    private function validateDate(?string $dateString): ?string
    {
        if (empty($dateString) || $dateString === 'N/A' || $dateString === 'Unknown') {
            return null;
        }

        try {
            // Try to parse the date string
            $date = new \DateTime($dateString);
            return $date->format('Y-m-d');
        } catch (\Exception $e) {
            // If date parsing fails, return null
            return null;
        }
    }
}
