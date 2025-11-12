<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Chat;

use App\Domain\Chat\ChatHistoryRepository;
use App\Domain\Chat\ChatMessage;
use App\Domain\Chat\ChatSession;
use PDO;
use PDOException;

class DatabaseChatHistoryRepository implements ChatHistoryRepository
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function createSession(int $userId, ?string $title = null): ChatSession
    {
        $query = 'INSERT INTO ai_chat_sessions (user_id, title) VALUES (:user_id, :title)
                  RETURNING id, user_id, title, started_at, last_activity_at, status';

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'user_id' => $userId,
            'title' => $title,
        ]);

        $row = $statement->fetch();
        return $this->hydrateSession($row);
    }

    public function findSessionByIdAndUser(int $sessionId, int $userId): ?ChatSession
    {
        $query = 'SELECT id, user_id, title, started_at, last_activity_at, status
                  FROM ai_chat_sessions
                  WHERE id = :id AND user_id = :user_id';

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'id' => $sessionId,
            'user_id' => $userId,
        ]);

        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return $this->hydrateSession($row);
    }

    public function listSessionsByUser(int $userId, int $limit = 50, int $offset = 0): array
    {
        $query = 'SELECT id, user_id, title, started_at, last_activity_at, status
                  FROM ai_chat_sessions
                  WHERE user_id = :user_id
                  ORDER BY last_activity_at DESC
                  LIMIT :limit OFFSET :offset';

        $statement = $this->connection->prepare($query);
        $statement->bindValue('user_id', $userId, PDO::PARAM_INT);
        $statement->bindValue('limit', $limit, PDO::PARAM_INT);
        $statement->bindValue('offset', $offset, PDO::PARAM_INT);
        $statement->execute();

        $sessions = [];
        while ($row = $statement->fetch()) {
            $sessions[] = $this->hydrateSession($row);
        }

        return $sessions;
    }

    public function updateSessionLastActivity(int $sessionId): void
    {
        $query = 'UPDATE ai_chat_sessions
                  SET last_activity_at = NOW()
                  WHERE id = :id';

        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $sessionId]);
    }

    public function updateSessionTitle(int $sessionId, string $title): void
    {
        $query = 'UPDATE ai_chat_sessions
                  SET title = :title
                  WHERE id = :id';

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'id' => $sessionId,
            'title' => $title,
        ]);
    }

    public function deleteSession(int $sessionId, int $userId): bool
    {
        $query = 'DELETE FROM ai_chat_sessions WHERE id = :id AND user_id = :user_id';

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'id' => $sessionId,
            'user_id' => $userId,
        ]);

        return $statement->rowCount() > 0;
    }

    public function addMessage(int $sessionId, string $sender, string $message, ?array $metadata = null): ChatMessage
    {
        $query = 'INSERT INTO ai_chat_messages (session_id, sender, message, metadata)
                  VALUES (:session_id, :sender, :message, :metadata)
                  RETURNING id, session_id, sender, message, metadata, created_at';

        $statement = $this->connection->prepare($query);
        $statement->execute([
            'session_id' => $sessionId,
            'sender' => $sender,
            'message' => $message,
            'metadata' => $metadata ? json_encode($metadata, JSON_UNESCAPED_UNICODE) : null,
        ]);

        $row = $statement->fetch();

        // Update session activity timestamp
        $this->updateSessionLastActivity($sessionId);

        return $this->hydrateMessage($row);
    }

    public function getMessagesBySession(int $sessionId, int $limit = 100, int $offset = 0): array
    {
        $query = 'SELECT id, session_id, sender, message, metadata, created_at
                  FROM ai_chat_messages
                  WHERE session_id = :session_id
                  ORDER BY created_at ASC
                  LIMIT :limit OFFSET :offset';

        $statement = $this->connection->prepare($query);
        $statement->bindValue('session_id', $sessionId, PDO::PARAM_INT);
        $statement->bindValue('limit', $limit, PDO::PARAM_INT);
        $statement->bindValue('offset', $offset, PDO::PARAM_INT);
        $statement->execute();

        $messages = [];
        while ($row = $statement->fetch()) {
            $messages[] = $this->hydrateMessage($row);
        }

        return $messages;
    }

    private function hydrateSession(array $row): ChatSession
    {
        return new ChatSession(
            (int) $row['id'],
            (int) $row['user_id'],
            $row['title'] ?? null,
            $row['started_at'],
            $row['last_activity_at'],
            $row['status']
        );
    }

    private function hydrateMessage(array $row): ChatMessage
    {
        return new ChatMessage(
            (int) $row['id'],
            (int) $row['session_id'],
            $row['sender'],
            $row['message'],
            $row['metadata'] ? json_decode($row['metadata'], true) : null,
            $row['created_at']
        );
    }
}
