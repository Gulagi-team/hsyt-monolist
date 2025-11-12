<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use App\Application\Services\AIContextService;
use App\Application\Services\GenAIService;
use App\Domain\Chat\ChatHistoryRepository;
use App\Domain\Chat\ChatSession;
use App\Domain\User\UserRepository;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class MedicalChatAction extends ChatAction
{
    private GenAIService $genAIService;
    private AIContextService $aiContextService;
    private PDO $pdo;

    public function __construct(
        LoggerInterface $logger,
        GenAIService $genAIService,
        AIContextService $aiContextService,
        UserRepository $userRepository,
        ChatHistoryRepository $chatHistoryRepository,
        PDO $pdo
    ) {
        parent::__construct($logger, $chatHistoryRepository, $userRepository);
        $this->genAIService = $genAIService;
        $this->aiContextService = $aiContextService;
        $this->pdo = $pdo;
    }

    protected function action(): Response
    {
        $user = $this->getCurrentUser();
        $formData = $this->getFormData();

        if (!isset($formData['question']) || trim((string) $formData['question']) === '') {
            throw new HttpBadRequestException($this->request, 'Câu hỏi không được để trống.');
        }

        $question = trim($formData['question']);
        $sessionId = isset($formData['sessionId']) ? (int) $formData['sessionId'] : null;
        $includeRecentAnalysis = $formData['includeRecentAnalysis'] ?? true;

        try {
            $session = $this->resolveChatSession($sessionId, $user->getId(), $question);

            $userMessage = $this->chatHistoryRepository->addMessage(
                $session->getId(),
                'user',
                $question
            );

            $recentAnalysis = null;
            if ($includeRecentAnalysis) {
                $recentAnalysis = $this->aiContextService->getRecentAnalysisForContext($user->getId(), $this->pdo);
            }

            $prompt = $this->aiContextService->generateMedicalQuestionPrompt(
                $user->getId(),
                $this->pdo,
                $question,
                $recentAnalysis
            );

            $this->logger->info('Medical chat request', [
                'user_id' => $user->getId(),
                'question' => $question,
                'has_recent_analysis' => $recentAnalysis !== null,
            ]);

            $aiResponse = $this->genAIService->generateChatResponse($prompt);
            if (trim($aiResponse) === '') {
                throw new \RuntimeException('AI không thể tạo phản hồi');
            }

            $aiMessage = $this->chatHistoryRepository->addMessage(
                $session->getId(),
                'ai',
                $aiResponse,
                [
                    'has_recent_analysis' => $recentAnalysis !== null,
                ]
            );

            $this->logger->info('Medical chat response generated', [
                'user_id' => $user->getId(),
                'response_length' => strlen($aiResponse),
            ]);

            return $this->respondWithData([
                'question' => $question,
                'answer' => $aiResponse,
                'sessionId' => $session->getId(),
                'userMessageId' => $userMessage->getId(),
                'aiMessageId' => $aiMessage->getId(),
                'hasPatientContext' => !empty($this->aiContextService->buildAIContext($user->getId(), $this->pdo)),
                'hasRecentAnalysis' => $recentAnalysis !== null,
                'timestamp' => date('Y-m-d H:i:s'),
                'message' => 'Phản hồi AI thành công',
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Medical chat failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->getId(),
                'question' => $question,
            ]);

            throw new HttpBadRequestException($this->request, 'Không thể tạo phản hồi AI. Vui lòng thử lại.');
        }
    }

    private function resolveChatSession(?int $sessionId, int $userId, string $question): ChatSession
    {
        if ($sessionId !== null) {
            $session = $this->chatHistoryRepository->findSessionByIdAndUser($sessionId, $userId);
            if (!$session) {
                throw new HttpBadRequestException($this->request, 'Phiên chat không hợp lệ.');
            }

            return $session;
        }

        $title = $this->generateSessionTitle($question);
        return $this->chatHistoryRepository->createSession($userId, $title);
    }

    private function generateSessionTitle(string $question): string
    {
        $trimmed = trim($question);
        if ($trimmed === '') {
            return 'Cuộc trò chuyện mới';
        }

        $title = mb_substr($trimmed, 0, 60);

        return $title !== '' ? $title : 'Cuộc trò chuyện mới';
    }
}
