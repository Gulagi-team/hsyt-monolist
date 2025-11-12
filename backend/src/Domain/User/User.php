<?php

declare(strict_types=1);

namespace App\Domain\User;

use JsonSerializable;

class User implements JsonSerializable
{
    private ?int $id;
    private string $name;
    private string $email;
    private string $passwordHash;
    private int $age;
    private string $bloodType;
    private ?string $allergies;
    private ?string $currentConditions;
    private int $points;
    private bool $emailVerified;
    private ?string $emailVerificationToken;
    private ?string $resetPasswordToken;
    private ?string $resetPasswordExpires;
    private string $createdAt;
    private string $updatedAt;

    public function __construct(
        ?int $id,
        string $name,
        string $email,
        string $passwordHash = '',
        int $age = 30,
        string $bloodType = 'O+',
        ?string $allergies = null,
        ?string $currentConditions = null,
        int $points = 1,
        bool $emailVerified = false,
        ?string $emailVerificationToken = null,
        ?string $resetPasswordToken = null,
        ?string $resetPasswordExpires = null,
        string $createdAt = '',
        string $updatedAt = ''
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->age = $age;
        $this->bloodType = $bloodType;
        $this->allergies = $allergies ?: 'Không có';
        $this->currentConditions = $currentConditions ?: 'Khỏe mạnh';
        $this->points = $points;
        $this->emailVerified = $emailVerified;
        $this->emailVerificationToken = $emailVerificationToken;
        $this->resetPasswordToken = $resetPasswordToken;
        $this->resetPasswordExpires = $resetPasswordExpires;
        $this->createdAt = $createdAt ?: date('Y-m-d H:i:s');
        $this->updatedAt = $updatedAt ?: date('Y-m-d H:i:s');
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
    }

    public function isEmailVerified(): bool
    {
        return $this->emailVerified;
    }

    public function setEmailVerified(bool $verified): void
    {
        $this->emailVerified = $verified;
    }

    public function getEmailVerificationToken(): ?string
    {
        return $this->emailVerificationToken;
    }

    public function setEmailVerificationToken(?string $token): void
    {
        $this->emailVerificationToken = $token;
    }

    public function getResetPasswordToken(): ?string
    {
        return $this->resetPasswordToken;
    }

    public function setResetPasswordToken(?string $token): void
    {
        $this->resetPasswordToken = $token;
    }

    public function getResetPasswordExpires(): ?string
    {
        return $this->resetPasswordExpires;
    }

    public function setResetPasswordExpires(?string $expires): void
    {
        $this->resetPasswordExpires = $expires;
    }

    public function getAge(): int
    {
        return $this->age;
    }

    public function getBloodType(): string
    {
        return $this->bloodType;
    }

    public function getAllergies(): string
    {
        return $this->allergies ?: 'Không có';
    }

    public function getCurrentConditions(): string
    {
        return $this->currentConditions ?: 'Khỏe mạnh';
    }

    public function getPoints(): int
    {
        return $this->points;
    }

    public function setPoints(int $points): void
    {
        $this->points = max(0, $points);
    }

    public function decrementPoints(int $amount = 1): void
    {
        $this->points = max(0, $this->points - max(0, $amount));
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'age' => $this->age,
            'bloodType' => $this->bloodType,
            'allergies' => $this->allergies,
            'currentConditions' => $this->currentConditions,
            'points' => $this->points,
            'emailVerified' => $this->emailVerified,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
        ];
    }
}
