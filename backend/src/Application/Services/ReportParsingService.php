<?php

declare(strict_types=1);

namespace App\Application\Services;

use Psr\Log\LoggerInterface;

class ReportParsingService
{
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function parseAIResponse(string $aiResponse): array
    {
        try {
            // Clean up the response - remove any markdown formatting
            $cleanResponse = $this->cleanAIResponse($aiResponse);
            
            // Try to decode JSON
            $decodedData = json_decode($cleanResponse, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->logger->warning('JSON decode error', [
                    'error' => json_last_error_msg(),
                    'response_preview' => substr($cleanResponse, 0, 500)
                ]);
                
                // Fallback: try to extract JSON from response
                $extractedJson = $this->extractJsonFromResponse($aiResponse);
                if ($extractedJson) {
                    $decodedData = json_decode($extractedJson, true);
                }
                
                if (!$decodedData) {
                    return $this->createFallbackResponse($aiResponse);
                }
            }
            
            // Validate the structure
            if (!$this->validateReportStructure($decodedData)) {
                $this->logger->warning('Invalid report structure', ['data' => $decodedData]);
                return $this->createFallbackResponse($aiResponse);
            }
            
            return [
                'success' => true,
                'data' => $decodedData,
                'rawResponse' => $aiResponse
            ];
            
        } catch (\Exception $e) {
            $this->logger->error('Failed to parse AI response', [
                'error' => $e->getMessage(),
                'response_preview' => substr($aiResponse, 0, 500)
            ]);
            
            return $this->createFallbackResponse($aiResponse);
        }
    }

    private function cleanAIResponse(string $response): string
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

    private function extractJsonFromResponse(string $response): ?string
    {
        // Try to find JSON using regex
        $pattern = '/\{(?:[^{}]|(?R))*\}/';
        if (preg_match($pattern, $response, $matches)) {
            return $matches[0];
        }
        
        return null;
    }

    private function validateReportStructure(array $data): bool
    {
        // Check if it has required fields
        if (!isset($data['reportType'])) {
            return false;
        }
        
        $reportType = $data['reportType'];
        
        if ($reportType === 'LAB_RESULT') {
            return isset($data['results']) && 
                   isset($data['interpretation']) && 
                   isset($data['followUp']);
        }
        
        if ($reportType === 'PRESCRIPTION') {
            return isset($data['medications']) && 
                   isset($data['generalInstructions']) && 
                   isset($data['followUp']);
        }
        
        return false;
    }

    private function createFallbackResponse(string $originalResponse): array
    {
        // Create a basic structured response from the original text
        return [
            'success' => false,
            'data' => [
                'reportType' => 'FALLBACK',
                'originalAnalysis' => $originalResponse,
                'disclaimer' => 'Kết quả này chỉ mang tính tham khảo. Vui lòng tham khảo ý kiến bác sĩ chuyên khoa.'
            ],
            'error' => 'Could not parse structured response, using fallback format',
            'rawResponse' => $originalResponse
        ];
    }

    public function generateReportId(): string
    {
        return 'RPT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -8));
    }

    public function addMetadata(array $reportData, string $userId): array
    {
        return [
            'metadata' => [
                'reportId' => $this->generateReportId(),
                'generatedAt' => date('c'),
                'generatedBy' => 'Hồ Sơ Y Tế  System',
                'version' => '1.0.0',
                'language' => 'vi-VN',
                'userId' => $userId
            ],
            'report' => $reportData
        ];
    }
}
