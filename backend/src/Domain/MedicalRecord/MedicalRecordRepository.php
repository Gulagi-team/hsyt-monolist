<?php

declare(strict_types=1);

namespace App\Domain\MedicalRecord;

interface MedicalRecordRepository
{
    public function findRecordsByUserId(int $userId): array;

    public function findRecordById(int $id): ?MedicalRecord;

    public function createRecord(MedicalRecord $record): MedicalRecord;

    public function updateRecord(MedicalRecord $record): MedicalRecord;

    public function deleteRecord(int $id): bool;

    // Public sharing methods
    public function createPublicShare(array $shareData): int;

    public function findPublicSharesByUserId(int $userId): array;

    public function findPublicShareByToken(string $token): ?array;

    public function findPublicShareById(int $shareId): ?array;

    public function shareTokenExists(string $token): bool;

    public function disablePublicShare(int $shareId): bool;

    public function incrementShareViewCount(int $shareId): bool;
}
