<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpNotFoundException;

class DeleteRecordAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $recordId = (int) $this->resolveArg('id');
        
        // Check if record exists
        $record = $this->medicalRecordRepository->findRecordById($recordId);
        if (!$record) {
            throw new HttpNotFoundException($this->request, 'Medical record not found');
        }

        $deleted = $this->medicalRecordRepository->deleteRecord($recordId);

        if (!$deleted) {
            throw new HttpNotFoundException($this->request, 'Failed to delete medical record');
        }

        return $this->respondWithData(['message' => 'Medical record deleted successfully']);
    }
}
