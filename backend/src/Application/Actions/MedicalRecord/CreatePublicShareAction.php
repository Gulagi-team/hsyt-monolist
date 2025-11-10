<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;

class CreatePublicShareAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $userId = $this->getUserIdFromToken();
        $recordId = (int) $this->resolveArg('recordId');

        $requestData = $this->getFormData();

        // Validate record ownership
        $record = $this->medicalRecordRepository->findRecordById($recordId);
        if (!$record || $record['user_id'] !== $userId) {
            return $this->respondWithData(['error' => 'Record not found or access denied'], 404);
        }

        // Generate unique share token
        $shareToken = $this->generateUniqueToken();

        // Hash password if provided
        $passwordHash = null;
        if (!empty($requestData['password'])) {
            $passwordHash = password_hash($requestData['password'], PASSWORD_DEFAULT);
        }

        // Set expiration if provided
        $expiresAt = null;
        if (!empty($requestData['expiresAt'])) {
            $expiresAt = $requestData['expiresAt'];
        }

        // Create public share
        $shareData = [
            'record_id' => $recordId,
            'share_token' => $shareToken,
            'password_hash' => $passwordHash,
            'expires_at' => $expiresAt,
            'created_by' => $userId
        ];

        try {
            $shareId = $this->medicalRecordRepository->createPublicShare($shareData);

            return $this->respondWithData([
                'shareId' => $shareId,
                'shareToken' => $shareToken,
                'shareUrl' => $this->getShareUrl($shareToken),
                'hasPassword' => !empty($passwordHash),
                'expiresAt' => $expiresAt
            ]);
        } catch (Exception $e) {
            return $this->respondWithData(['error' => 'Failed to create public share'], 500);
        }
    }

    private function generateUniqueToken(): string
    {
        do {
            $token = bin2hex(random_bytes(32));
        } while ($this->medicalRecordRepository->shareTokenExists($token));

        return $token;
    }

    private function getShareUrl(string $token): string
    {
        $baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:3000';
        return $baseUrl . '/share/' . $token;
    }
}
