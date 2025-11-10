<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Exception;

class DisablePublicShareAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $userId = $this->getUserIdFromToken();
        $shareId = (int) $this->resolveArg('shareId');

        try {
            $share = $this->medicalRecordRepository->findPublicShareById($shareId);

            if (!$share || $share['created_by'] !== $userId) {
                return $this->respondWithData(['error' => 'Share not found or access denied'], 404);
            }

            $this->medicalRecordRepository->disablePublicShare($shareId);

            return $this->respondWithData(['message' => 'Public share disabled successfully']);

        } catch (Exception $e) {
            return $this->respondWithData(['error' => 'Failed to disable public share'], 500);
        }
    }
}
