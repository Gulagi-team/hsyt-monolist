<?php

declare(strict_types=1);

namespace App\Domain\Chat;

class ChatMessage
{
    private ?int $id;
    private int $sessionId;
    private string $sender;
    private string $message;
    private ?array $metadata;
    private string $createdAt;

    public function __construct(
        ?int $id,
        int $sessionId,
        string $sender,
        string $message,
        ?array $metadata,
        string $createdAt
    ) {
        $this->id = $id;
        $this->sessionId = $sessionId;
        $this->sender = $sender;
        $this->message = $message;
        $this->metadata = $metadata;
        $this->createdAt = $createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSessionId(): int
    {
        return $this->sessionId;
    }

    public function getSender(): string
    {
        return $this->sender;
    }

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }
}
