<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;

class ListPublicSharesAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $userId = $this->getUserIdFromToken();

        try {
            $shares = $this->medicalRecordRepository->findPublicSharesByUserId($userId);

            // Format response with share URLs
            $formattedShares = array_map(function($share) {
                return [
                    'id' => $share['id'],
                    'recordId' => $share['record_id'],
                    'recordName' => $share['record_name'],
                    'shareToken' => $share['share_token'],
                    'shareUrl' => $this->getShareUrl($share['share_token']),
                    'hasPassword' => !empty($share['password_hash']),
                    'isActive' => $share['is_active'],
                    'viewCount' => $share['view_count'],
                    'expiresAt' => $share['expires_at'],
                    'createdAt' => $share['created_at']
                ];
            }, $shares);

            return $this->respondWithData($formattedShares);
        } catch (Exception $e) {
            return $this->respondWithData(['error' => 'Failed to fetch public shares'], 500);
        }
    }

    private function getShareUrl(string $token): string
    {
        $baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:3000';
        return $baseUrl . '/share/' . $token;
    }
}
