<?php

declare(strict_types=1);

namespace App\Domain\Chat;

class ChatSession
{
    private ?int $id;
    private int $userId;
    private ?string $title;
    private string $startedAt;
    private string $lastActivityAt;
    private string $status;

    public function __construct(
        ?int $id,
        int $userId,
        ?string $title,
        string $startedAt,
        string $lastActivityAt,
        string $status = 'active'
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->title = $title;
        $this->startedAt = $startedAt;
        $this->lastActivityAt = $lastActivityAt;
        $this->status = $status;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function getStartedAt(): string
    {
        return $this->startedAt;
    }

    public function getLastActivityAt(): string
    {
        return $this->lastActivityAt;
    }

    public function getStatus(): string
    {
        return $this->status;
    }
}
