<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpBadRequestException;

class BulkDeleteRecordsAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $data = $this->getJsonData();

        // Validate that ids are provided and is an array
        if (!isset($data['ids']) || !is_array($data['ids'])) {
            throw new HttpBadRequestException($this->request, 'Ids array is required');
        }

        // Validate that all ids are integers
        foreach ($data['ids'] as $id) {
            if (!is_int($id) && !ctype_digit(strval($id))) {
                throw new HttpBadRequestException($this->request, 'All ids must be integers');
            }
        }

        // Convert to integers
        $ids = array_map('intval', $data['ids']);

        $deleted = $this->medicalRecordRepository->bulkDelete($ids);

        if (!$deleted) {
            return $this->respondWithData(['message' => 'No records were deleted'], 200);
        }

        return $this->respondWithData(['message' => 'Medical records deleted successfully']);
    }
}