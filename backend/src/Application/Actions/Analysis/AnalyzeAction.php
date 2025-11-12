<?php

declare(strict_types=1);

namespace App\Application\Actions\Analysis;

use App\Application\Actions\Action;
use App\Application\Services\GenAIService;
use App\Application\Services\DocumentClassificationService;
use App\Application\Services\ReportParsingService;
use App\Application\Services\MedicalContextExtractionService;
use App\Domain\MedicalRecord\MedicalRecord;
use App\Domain\MedicalRecord\MedicalRecordRepository;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AnalyzeAction extends Action
{
    private GenAIService $genAIService;
    private DocumentClassificationService $classificationService;
    private ReportParsingService $reportParsingService;
    private MedicalContextExtractionService $contextExtractionService;
    private MedicalRecordRepository $medicalRecordRepository;
    private UserRepository $userRepository;

    public function __construct(
        LoggerInterface $logger,
        GenAIService $genAIService,
        DocumentClassificationService $classificationService,
        ReportParsingService $reportParsingService,
        MedicalContextExtractionService $contextExtractionService,
        MedicalRecordRepository $medicalRecordRepository,
        UserRepository $userRepository
    ) {
        parent::__construct($logger);
        $this->genAIService = $genAIService;
        $this->classificationService = $classificationService;
        $this->reportParsingService = $reportParsingService;
        $this->contextExtractionService = $contextExtractionService;
        $this->medicalRecordRepository = $medicalRecordRepository;
        $this->userRepository = $userRepository;
    }

    protected function action(): Response
    {
        // Get user from JWT token
        $user = $this->getCurrentUser();
        
        // if ($user->getPoints() <= 0) {
        //     return $this->respondWithData([
        //         'error' => 'Bạn không còn điểm để thực hiện phân tích. Vui lòng nạp thêm điểm.',
        //         'message' => 'Bạn không còn điểm để thực hiện phân tích. Vui lòng nạp thêm điểm.'
        //     ], 402);
        // }

        $formData = $this->getFormData();
        
        // Validate required fields
        if (!isset($formData['recordName']) || empty(trim($formData['recordName']))) {
            throw new HttpBadRequestException($this->request, 'Tên hồ sơ là bắt buộc');
        }
        
        if (!isset($formData['type']) || !in_array($formData['type'], [
            'lab_result', 'prescription', 'auto_detect', 'XRAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 
            'ECG', 'ENDOSCOPY', 'PATHOLOGY', 'DISCHARGE_SUMMARY', 'MEDICAL_CERTIFICATE', 
            'VACCINATION_RECORD', 'OTHER'
        ])) {
            throw new HttpBadRequestException($this->request, 'Loại phân tích không hợp lệ');
        }
        
        if (!isset($formData['fileData']) || empty($formData['fileData'])) {
            throw new HttpBadRequestException($this->request, 'Dữ liệu file là bắt buộc');
        }
        
        if (!isset($formData['mimeType']) || empty($formData['mimeType'])) {
            throw new HttpBadRequestException($this->request, 'Loại file là bắt buộc');
        }

        $recordName = trim($formData['recordName']);
        $type = $formData['type'];
        $fileData = $formData['fileData'];
        $mimeType = $formData['mimeType'];
        $userQuestion = $formData['question'] ?? null;
        
        // R2 storage info from upload - only URL needed
        $r2Url = $formData['r2Url'] ?? null;

        // Validate file type
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])) {
            throw new HttpBadRequestException($this->request, 'Loại file không được hỗ trợ');
        }

        // Remove data URL prefix if present
        if (strpos($fileData, 'data:') === 0) {
            $fileData = substr($fileData, strpos($fileData, ',') + 1);
        }

        try {
            $classificationResult = null;
            $documentType = 'UNKNOWN';
            $confidence = 0.0;
            
            // Step 1: Handle document type selection
            if ($type === 'auto_detect') {
                // Run AI classification
                $this->logger->info('Starting document classification', [
                    'user_id' => $user->getId(),
                    'record_name' => $recordName,
                    'mime_type' => $mimeType
                ]);
                
                $classificationResult = $this->classificationService->classifyDocument($fileData, $mimeType);
                
                $this->logger->info('Classification result', [
                    'success' => $classificationResult['success'],
                    'document_type' => $classificationResult['classification']['documentType'] ?? 'unknown',
                    'confidence' => $classificationResult['classification']['confidence'] ?? 0
                ]);
                
                if (!$classificationResult['success']) {
                    $this->logger->warning('Document classification failed, using fallback', [
                        'user_id' => $user->getId(),
                        'record_name' => $recordName
                    ]);
                    $documentType = 'UNKNOWN';
                    $confidence = 0.0;
                } else {
                    $documentType = $classificationResult['classification']['documentType'] ?? 'UNKNOWN';
                    $confidence = $classificationResult['classification']['confidence'] ?? 0.0;
                }
            } else {
                // Use manually selected document type
                $documentType = $type;
                $confidence = 1.0; // Full confidence for manual selection
                
                $this->logger->info('Using manually selected document type', [
                    'user_id' => $user->getId(),
                    'record_name' => $recordName,
                    'selected_type' => $documentType
                ]);
            }
            
            // Step 2: Use appropriate analysis based on document type
            if ($documentType === 'LAB_RESULT' || $type === 'lab_result') {
                $aiResponse = $this->genAIService->analyzeLabResult($fileData, $mimeType, $userQuestion);
            } else if ($documentType === 'PRESCRIPTION' || $type === 'prescription') {
                $aiResponse = $this->genAIService->analyzePrescription($fileData, $mimeType, $userQuestion);
            } else {
                // For other document types or unknown, use lab result analysis as fallback
                $aiResponse = $this->genAIService->analyzeLabResult($fileData, $mimeType, $userQuestion);
            }
            
            // Step 3: Parse AI response to structured format
            $parsedResponse = $this->reportParsingService->parseAIResponse($aiResponse);
            
            // Add classification information to the parsed response (if available)
            if ($classificationResult && isset($classificationResult['classification'])) {
                $parsedResponse['data']['classification'] = $classificationResult['classification'];
            }
            
            // Step 4: Add metadata to the report
            $structuredReport = $this->reportParsingService->addMetadata(
                $parsedResponse['data'], 
                (string)$user->getId()
            );

            // Step 5: Extract medical context for AI
            $medicalContext = $this->contextExtractionService->extractMedicalContext($structuredReport);

            // Step 6: Store both structured and original analysis
            $analysisForStorage = json_encode($structuredReport, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            // Step 7: Create medical record with detected document type and AI context
            $recordType = $this->mapDocumentTypeToRecordType($documentType);
            $medicalRecord = new MedicalRecord(
                null,
                $user->getId(),
                $recordName,
                $recordType,
                $r2Url ?? '', // Use R2 URL as file URL
                $analysisForStorage,
                '', // createdAt - will be set automatically
                '', // updatedAt - will be set automatically
                $r2Url, // Only store R2 URL
                $medicalContext['structured_data'] ?? null,
                $medicalContext['document_type'] ?? null,
                $medicalContext['classification_confidence'] ?? null,
                $medicalContext['patient_context'] ?? null,
                $medicalContext['test_date'] ?? null,
                $medicalContext['doctor_name'] ?? null,
                $medicalContext['clinic_name'] ?? null,
                $medicalContext['diagnosis'] ?? null,
                $medicalContext['medications'] ?? null,
                $medicalContext['test_results'] ?? null,
                $medicalContext['ai_summary'] ?? null,
                $medicalContext['key_findings'] ?? null,
                $medicalContext['abnormal_values'] ?? null,
                $medicalContext['recommendations'] ?? null
            );

            $savedRecord = $this->medicalRecordRepository->createRecord($medicalRecord);

            $responseData = [
                'record' => $savedRecord,
                'structuredReport' => $structuredReport,
                'parsingSuccess' => $parsedResponse['success'],
                'message' => 'Phân tích hoàn thành thành công',
                'remainingPoints' => $user->getPoints()
            ];
            
            // Add classification info if available
            if ($classificationResult && isset($classificationResult['classification'])) {
                $responseData['classification'] = $classificationResult['classification'];
            }
            
            return $this->respondWithData($responseData, 201);

        } catch (\Exception $e) {
            $this->logger->error('Analysis failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->getId(),
                'record_name' => $recordName,
                'type' => $type,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            throw new HttpBadRequestException($this->request, 'Không thể phân tích file. Lỗi: ' . $e->getMessage());
        }
    }

    private function getCurrentUser()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        
        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            throw new HttpUnauthorizedException($this->request, 'Token xác thực là bắt buộc');
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], $_ENV['JWT_ALGORITHM']));
            $userId = $decoded->user_id;

            $user = $this->userRepository->findUserById($userId);
            if (!$user) {
                throw new HttpUnauthorizedException($this->request, 'Người dùng không tồn tại');
            }

            return $user;

        } catch (\Exception $e) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ');
        }
    }

    private function mapDocumentTypeToRecordType(string $documentType): string
    {
        // Map document types to existing record types for backward compatibility
        switch ($documentType) {
            case 'LAB_RESULT':
                return 'lab_result';
            case 'PRESCRIPTION':
                return 'prescription';
            case 'XRAY':
            case 'CT_SCAN':
            case 'MRI':
            case 'ULTRASOUND':
            case 'MAMMOGRAPHY':
            case 'PET_SCAN':
                return 'diagnostic_imaging';
            case 'ECG':
                return 'ecg';
            case 'ENDOSCOPY':
                return 'endoscopy';
            case 'PATHOLOGY':
                return 'pathology';
            case 'DISCHARGE_SUMMARY':
                return 'discharge_summary';
            case 'MEDICAL_CERTIFICATE':
                return 'medical_certificate';
            case 'VACCINATION_RECORD':
                return 'vaccination';
            default:
                return 'medical_document';
        }
    }
}
