<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;

class ViewPublicRecordAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $shareToken = $this->resolveArg('shareToken');
        $providedPassword = $this->getFormData()['password'] ?? null;

        try {
            $share = $this->medicalRecordRepository->findPublicShareByToken($shareToken);

            if (!$share) {
                return $this->respondWithData(['error' => 'Share link not found'], 404);
            }

            if (!$share['is_active']) {
                return $this->respondWithData(['error' => 'Share link has been disabled'], 403);
            }

            // Check expiration
            if ($share['expires_at'] && strtotime($share['expires_at']) < time()) {
                return $this->respondWithData(['error' => 'Share link has expired'], 403);
            }

            // Check password if required
            if (!empty($share['password_hash'])) {
                if (!$providedPassword) {
                    return $this->respondWithData([
                        'requiresPassword' => true,
                        'message' => 'This shared record requires a password'
                    ], 401);
                }

                if (!password_verify($providedPassword, $share['password_hash'])) {
                    return $this->respondWithData([
                        'error' => 'Invalid password',
                        'requiresPassword' => true
                    ], 401);
                }
            }

            // Get the actual record
            $record = $this->medicalRecordRepository->findRecordById($share['record_id']);

            if (!$record) {
                return $this->respondWithData(['error' => 'Record not found'], 404);
            }

            // Increment view count
            $this->medicalRecordRepository->incrementShareViewCount($share['id']);

            // Return record data (without sensitive information)
            return $this->respondWithData([
                'record' => [
                    'id' => $record['id'],
                    'recordName' => $record['record_name'],
                    'type' => $record['type'],
                    'fileUrl' => $record['file_url'],
                    'r2Url' => $record['r2_url'],
                    'analysis' => $record['analysis'],
                    'createdAt' => $record['created_at'],
                    'documentType' => $record['document_type'],
                    'aiSummary' => $record['ai_summary'],
                    'keyFindings' => $record['key_findings']
                ],
                'shareInfo' => [
                    'viewCount' => $share['view_count'] + 1,
                    'createdAt' => $share['created_at'],
                    'expiresAt' => $share['expires_at']
                ]
            ]);

        } catch (Exception $e) {
            return $this->respondWithData(['error' => 'Failed to access shared record'], 500);
        }
    }
}
