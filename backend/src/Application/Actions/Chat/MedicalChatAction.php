<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use App\Application\Actions\Action;
use App\Application\Services\GenAIService;
use App\Application\Services\AIContextService;
use App\Domain\User\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpUnauthorizedException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;

class MedicalChatAction extends Action
{
    private GenAIService $genAIService;
    private AIContextService $aiContextService;
    private UserRepository $userRepository;
    private PDO $pdo;

    public function __construct(
        LoggerInterface $logger,
        GenAIService $genAIService,
        AIContextService $aiContextService,
        UserRepository $userRepository,
        PDO $pdo
    ) {
        parent::__construct($logger);
        $this->genAIService = $genAIService;
        $this->aiContextService = $aiContextService;
        $this->userRepository = $userRepository;
        $this->pdo = $pdo;
    }

    protected function action(): Response
    {
        // Get user from JWT token
        $user = $this->getCurrentUser();
        
        $formData = $this->getFormData();
        
        // Validate required fields
        if (!isset($formData['question']) || empty(trim($formData['question']))) {
            throw new HttpBadRequestException($this->request, 'Câu hỏi không được để trống.');
        }

        $question = trim($formData['question']);
        $includeRecentAnalysis = $formData['includeRecentAnalysis'] ?? true;

        try {
            // Get recent analysis for additional context if requested
            $recentAnalysis = null;
            if ($includeRecentAnalysis) {
                $recentAnalysis = $this->aiContextService->getRecentAnalysisForContext($user->getId(), $this->pdo);
            }

            // Generate AI prompt with patient context
            $prompt = $this->aiContextService->generateMedicalQuestionPrompt(
                $user->getId(),
                $this->pdo,
                $question,
                $recentAnalysis
            );

            $this->logger->info('Medical chat request', [
                'user_id' => $user->getId(),
                'question' => $question,
                'has_recent_analysis' => $recentAnalysis !== null
            ]);

            // Get AI response
            $aiResponse = $this->genAIService->generateContent($prompt);

            if (empty($aiResponse)) {
                throw new \Exception('AI không thể tạo phản hồi');
            }

            // Log successful response
            $this->logger->info('Medical chat response generated', [
                'user_id' => $user->getId(),
                'response_length' => strlen($aiResponse)
            ]);

            return $this->respondWithData([
                'question' => $question,
                'answer' => $aiResponse,
                'hasPatientContext' => !empty($this->aiContextService->buildAIContext($user->getId(), $this->pdo)),
                'hasRecentAnalysis' => $recentAnalysis !== null,
                'timestamp' => date('Y-m-d H:i:s'),
                'message' => 'Phản hồi AI thành công'
            ]);

        } catch (\Exception $e) {
            $this->logger->error('Medical chat failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->getId(),
                'question' => $question
            ]);

            throw new HttpBadRequestException($this->request, 'Không thể tạo phản hồi AI. Vui lòng thử lại.');
        }
    }

    /**
     * Get current user from JWT token
     */
    private function getCurrentUser()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ');
        }

        $token = substr($authHeader, 7);
        
        try {
            $jwtSecret = $_ENV['JWT_SECRET'] ?? '';
            $jwtAlgorithm = $_ENV['JWT_ALGORITHM'] ?? 'HS256';
            
            $decoded = JWT::decode($token, new Key($jwtSecret, $jwtAlgorithm));
            $userId = $decoded->user_id;
            
            $user = $this->userRepository->findUserOfId($userId);
            if (!$user) {
                throw new HttpUnauthorizedException($this->request, 'Người dùng không tồn tại');
            }
            
            return $user;
            
        } catch (\Exception $e) {
            throw new HttpUnauthorizedException($this->request, 'Token không hợp lệ: ' . $e->getMessage());
        }
    }
}
