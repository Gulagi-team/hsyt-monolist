<?php

declare(strict_types=1);

namespace App\Application\Actions\Chat;

use Psr\Http\Message\ResponseInterface as Response;

class CreateChatSessionAction extends ChatAction
{
    protected function action(): Response
    {
        $user = $this->getCurrentUser();
        $data = $this->getFormData();

        $title = null;
        if (isset($data['title']) && is_string($data['title'])) {
            $trimmed = trim($data['title']);
            if ($trimmed !== '') {
                $title = $trimmed;
            }
        }

        $session = $this->chatHistoryRepository->createSession($user->getId(), $title);

        return $this->respondWithData([
            'session' => [
                'id' => $session->getId(),
                'title' => $session->getTitle(),
                'startedAt' => $session->getStartedAt(),
                'lastActivityAt' => $session->getLastActivityAt(),
                'status' => $session->getStatus(),
            ],
        ], 201);
    }
}
