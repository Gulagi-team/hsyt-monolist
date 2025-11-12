<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use Psr\Http\Message\ResponseInterface as Response;

class ListChatSessionsAction extends ChatAction
{
    protected function action(): Response
    {
        $user = $this->getCurrentUser();

        $queryParams = $this->request->getQueryParams();
        $limit = $this->sanitizeLimit($queryParams['limit'] ?? 50);
        $offset = $this->sanitizeOffset($queryParams['offset'] ?? 0);

        $sessions = $this->chatHistoryRepository->listSessionsByUser($user->getId(), $limit, $offset);

        $data = array_map(static function ($session) {
            return [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'startedAt' => $session->getStartedAt(),
                'lastActivityAt' => $session->getLastActivityAt(),
                'status' => $session->getStatus(),
            ];
        }, $sessions);

        return $this->respondWithData([
            'sessions' => $data,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
            ],
        ]);
    }

    private function sanitizeLimit(mixed $value): int
    {
        $limit = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['default' => 50, 'min_range' => 1],
        ]);

        return min($limit, 100);
    }

    private function sanitizeOffset(mixed $value): int
    {
        $offset = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['default' => 0, 'min_range' => 0],
        ]);

        return $offset;
    }
}
