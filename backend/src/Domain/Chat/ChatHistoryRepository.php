<?php

declare(strict_types=1);

namespace App\Domain\Chat;

interface ChatHistoryRepository
{
    public function createSession(int $userId, ?string $title = null): ChatSession;

    public function findSessionByIdAndUser(int $sessionId, int $userId): ?ChatSession;

    /**
     * @return ChatSession[]
     */
    public function listSessionsByUser(int $userId, int $limit = 50, int $offset = 0): array;

    public function updateSessionLastActivity(int $sessionId): void;

    public function updateSessionTitle(int $sessionId, string $title): void;

    public function deleteSession(int $sessionId, int $userId): bool;

    public function addMessage(int $sessionId, string $sender, string $message, ?array $metadata = null): ChatMessage;

    /**
     * @return ChatMessage[]
     */
    public function getMessagesBySession(int $sessionId, int $limit = 100, int $offset = 0): array;
}
