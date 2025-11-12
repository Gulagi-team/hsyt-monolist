<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;

class GetChatSessionMessagesAction extends ChatAction
{
    protected function action(): Response
    {
        $user = $this->getCurrentUser();

        $sessionId = (int) $this->resolveArg('sessionId');
        $session = $this->chatHistoryRepository->findSessionByIdAndUser($sessionId, $user->getId());
        if (!$session) {
            throw new HttpBadRequestException($this->request, 'Phiên chat không tồn tại hoặc bạn không có quyền truy cập.');
        }

        $queryParams = $this->request->getQueryParams();
        $limit = $this->sanitizeLimit($queryParams['limit'] ?? 100);
        $offset = $this->sanitizeOffset($queryParams['offset'] ?? 0);

        $messages = $this->chatHistoryRepository->getMessagesBySession($sessionId, $limit, $offset);

        $data = array_map(static function ($message) {
            return [
                'id' => $message->getId(),
                'sender' => $message->getSender(),
                'message' => $message->getMessage(),
                'metadata' => $message->getMetadata(),
                'createdAt' => $message->getCreatedAt(),
            ];
        }, $messages);

        return $this->respondWithData([
            'session' => [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'startedAt' => $session->getStartedAt(),
                'lastActivityAt' => $session->getLastActivityAt(),
                'status' => $session->getStatus(),
            ],
            'messages' => $data,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
            ],
        ]);
    }

    private function sanitizeLimit(mixed $value): int
    {
        $limit = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['default' => 100, 'min_range' => 1],
        ]);

        return min($limit, 200);
    }

    private function sanitizeOffset(mixed $value): int
    {
        $offset = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['default' => 0, 'min_range' => 0],
        ]);

        return $offset;
    }
}
