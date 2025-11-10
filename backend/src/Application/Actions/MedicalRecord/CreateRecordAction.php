<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use App\Domain\MedicalRecord\MedicalRecord;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;

class CreateRecordAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $formData = $this->getFormData();

        // Validate required fields
        $requiredFields = ['userId', 'recordName', 'type', 'fileUrl', 'analysis'];
        foreach ($requiredFields as $field) {
            if (!isset($formData[$field]) || empty($formData[$field])) {
                throw new HttpBadRequestException($this->request, "Field '{$field}' is required");
            }
        }

        // Validate type
        if (!in_array($formData['type'], ['lab_result', 'prescription'])) {
            throw new HttpBadRequestException($this->request, "Type must be 'lab_result' or 'prescription'");
        }

        $record = new MedicalRecord(
            null,
            (int) $formData['userId'],
            $formData['recordName'],
            $formData['type'],
            $formData['fileUrl'],
            $formData['analysis']
        );

        $createdRecord = $this->medicalRecordRepository->createRecord($record);

        return $this->respondWithData($createdRecord, 201);
    }
}
