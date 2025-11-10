<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;

class ListRecordsAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $userId = (int) $this->resolveArg('userId');
        $records = $this->medicalRecordRepository->findRecordsByUserId($userId);

        return $this->respondWithData($records);
    }
}
