<?php

declare(strict_types=1);

namespace App\Application\Actions\MedicalRecord;

use Psr\Http\Message\ResponseInterface as Response;
use Slim\Exception\HttpNotFoundException;

class GetRecordAction extends MedicalRecordAction
{
    protected function action(): Response
    {
        $recordId = (int) $this->resolveArg('id');
        $record = $this->medicalRecordRepository->findRecordById($recordId);

        if (!$record) {
            throw new HttpNotFoundException($this->request, 'Medical record not found');
        }

        return $this->respondWithData($record);
    }
}
