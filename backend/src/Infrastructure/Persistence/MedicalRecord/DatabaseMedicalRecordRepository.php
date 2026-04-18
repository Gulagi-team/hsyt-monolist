<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\MedicalRecord;

use App\Domain\MedicalRecord\MedicalRecord;
use App\Domain\MedicalRecord\MedicalRecordRepository;
use PDO;

class DatabaseMedicalRecordRepository implements MedicalRecordRepository
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findRecordsByUserId(int $userId): array
    {
        $query = 'SELECT * FROM medical_records WHERE user_id = :user_id ORDER BY created_at DESC';
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId]);
        
        $records = [];
        while ($row = $statement->fetch()) {
            $records[] = new MedicalRecord(
                (int) $row['id'],
                (int) $row['user_id'],
                $row['record_name'],
                $row['type'],
                $row['file_url'],
                $row['analysis'],
                $row['created_at'],
                $row['updated_at']
            );
        }

        return $records;
    }

    public function findRecordById(int $id): ?MedicalRecord
    {
        $query = 'SELECT * FROM medical_records WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id]);
        
        $row = $statement->fetch();
        if ($row === false) {
            return null;
        }

        return new MedicalRecord(
            (int) $row['id'],
            (int) $row['user_id'],
            $row['record_name'],
            $row['type'],
            $row['file_url'],
            $row['analysis'],
            $row['created_at'],
            $row['updated_at'],
            $row['r2_url'],
            $row['structured_data'] ? json_decode($row['structured_data'], true) : null,
            $row['document_type'],
            $row['classification_confidence'] ? (float) $row['classification_confidence'] : null,
            $row['patient_context'] ? json_decode($row['patient_context'], true) : null,
            $row['test_date'],
            $row['doctor_name'],
            $row['clinic_name'],
            $row['diagnosis'],
            $row['medications'] ? json_decode($row['medications'], true) : null,
            $row['test_results'] ? json_decode($row['test_results'], true) : null,
            $row['ai_summary'],
            $row['key_findings'] ? $this->parsePostgresArray($row['key_findings']) : null,
            $row['abnormal_values'] ? json_decode($row['abnormal_values'], true) : null,
            $row['recommendations'] ? $this->parsePostgresArray($row['recommendations']) : null
        );
    }

    public function createRecord(MedicalRecord $record): MedicalRecord
    {
        $query = 'INSERT INTO medical_records (
                    user_id, record_name, type, file_url, analysis,
                    r2_url,
                    structured_data, document_type, classification_confidence, patient_context,
                    test_date, doctor_name, clinic_name, diagnosis, medications, test_results,
                    ai_summary, key_findings, abnormal_values, recommendations
                  ) VALUES (
                    :user_id, :record_name, :type, :file_url, :analysis,
                    :r2_url,
                    :structured_data, :document_type, :classification_confidence, :patient_context,
                    :test_date, :doctor_name, :clinic_name, :diagnosis, :medications, :test_results,
                    :ai_summary, :key_findings, :abnormal_values, :recommendations
                  )';
        
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'user_id' => $record->getUserId(),
            'record_name' => $record->getRecordName(),
            'type' => $record->getType(),
            'file_url' => $record->getFileUrl(),
            'analysis' => $record->getAnalysis(),
            'r2_url' => $record->getR2Url(),
            'structured_data' => $record->getStructuredData() ? json_encode($record->getStructuredData()) : null,
            'document_type' => $record->getDocumentType(),
            'classification_confidence' => $record->getClassificationConfidence(),
            'patient_context' => $record->getPatientContext() ? json_encode($record->getPatientContext()) : null,
            'test_date' => $record->getTestDate(),
            'doctor_name' => $record->getDoctorName(),
            'clinic_name' => $record->getClinicName(),
            'diagnosis' => $record->getDiagnosis(),
            'medications' => $record->getMedications() ? json_encode($record->getMedications()) : null,
            'test_results' => $record->getTestResults() ? json_encode($record->getTestResults()) : null,
            'ai_summary' => $record->getAiSummary(),
            'key_findings' => $record->getKeyFindings() ? '{' . implode(',', array_map(function($item) { return '"' . addslashes($item) . '"'; }, $record->getKeyFindings())) . '}' : null,
            'abnormal_values' => $record->getAbnormalValues() ? json_encode($record->getAbnormalValues()) : null,
            'recommendations' => $record->getRecommendations() ? '{' . implode(',', array_map(function($item) { return '"' . addslashes($item) . '"'; }, $record->getRecommendations())) . '}' : null,
        ]);

        // PostgreSQL uses RETURNING clause or sequence
        $recordId = (int) $this->connection->lastInsertId('medical_records_id_seq');
        
        return new MedicalRecord(
            $recordId,
            $record->getUserId(),
            $record->getRecordName(),
            $record->getType(),
            $record->getFileUrl(),
            $record->getAnalysis(),
            $record->getCreatedAt(),
            $record->getUpdatedAt(),
            $record->getR2Url(),
            $record->getStructuredData(),
            $record->getDocumentType(),
            $record->getClassificationConfidence(),
            $record->getPatientContext(),
            $record->getTestDate(),
            $record->getDoctorName(),
            $record->getClinicName(),
            $record->getDiagnosis(),
            $record->getMedications(),
            $record->getTestResults(),
            $record->getAiSummary(),
            $record->getKeyFindings(),
            $record->getAbnormalValues(),
            $record->getRecommendations()
        );
    }

    public function updateRecord(MedicalRecord $record): MedicalRecord
    {
        $query = 'UPDATE medical_records SET record_name = :record_name, type = :type, 
                  file_url = :file_url, analysis = :analysis, updated_at = :updated_at 
                  WHERE id = :id';
        
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'id' => $record->getId(),
            'record_name' => $record->getRecordName(),
            'type' => $record->getType(),
            'file_url' => $record->getFileUrl(),
            'analysis' => $record->getAnalysis(),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $record;
    }

    public function deleteRecord(int $id): bool
    {
        $query = 'DELETE FROM medical_records WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $id]);

        return $statement->rowCount() > 0;
    }

    public function bulkDelete(array $ids): bool
    {
        if (empty($ids)) {
            return true;
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $query = "DELETE FROM medical_records WHERE id IN ($placeholders)";
        $statement = $this->connection->prepare($query);
        $statement->execute($ids);

        return $statement->rowCount() > 0;
    }

    /**
     * Convert PostgreSQL array string (e.g. "{\"value1\",\"value2\"}") to PHP array.
     */
    private function parsePostgresArray(?string $value): ?array
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value, '{}');

        if ($trimmed === '') {
            return [];
        }

        $items = str_getcsv($trimmed, ',', '"');

        return array_map(static function (string $item): string {
            return stripslashes($item);
        }, $items);
    }

    // Public sharing methods
    public function createPublicShare(array $shareData): int
    {
        $query = 'INSERT INTO public_shares (record_id, share_token, password_hash, expires_at, created_by) 
                  VALUES (:record_id, :share_token, :password_hash, :expires_at, :created_by)';
        $statement = $this->connection->prepare($query);
        $statement->execute([
            'record_id' => $shareData['record_id'],
            'share_token' => $shareData['share_token'],
            'password_hash' => $shareData['password_hash'],
            'expires_at' => $shareData['expires_at'],
            'created_by' => $shareData['created_by']
        ]);

        return (int) $this->connection->lastInsertId();
    }

    public function findPublicSharesByUserId(int $userId): array
    {
        $query = 'SELECT ps.*, mr.record_name 
                  FROM public_shares ps 
                  JOIN medical_records mr ON ps.record_id = mr.id 
                  WHERE ps.created_by = :user_id 
                  ORDER BY ps.created_at DESC';
        $statement = $this->connection->prepare($query);
        $statement->execute(['user_id' => $userId]);

        return $statement->fetchAll();
    }

    public function findPublicShareByToken(string $token): ?array
    {
        $query = 'SELECT * FROM public_shares WHERE share_token = :token';
        $statement = $this->connection->prepare($query);
        $statement->execute(['token' => $token]);

        $result = $statement->fetch();
        return $result ?: null;
    }

    public function findPublicShareById(int $shareId): ?array
    {
        $query = 'SELECT * FROM public_shares WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $shareId]);

        $result = $statement->fetch();
        return $result ?: null;
    }

    public function shareTokenExists(string $token): bool
    {
        $query = 'SELECT COUNT(*) FROM public_shares WHERE share_token = :token';
        $statement = $this->connection->prepare($query);
        $statement->execute(['token' => $token]);

        return $statement->fetchColumn() > 0;
    }

    public function disablePublicShare(int $shareId): bool
    {
        $query = 'UPDATE public_shares SET is_active = FALSE WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $shareId]);

        return $statement->rowCount() > 0;
    }

    public function incrementShareViewCount(int $shareId): bool
    {
        $query = 'UPDATE public_shares SET view_count = view_count + 1 WHERE id = :id';
        $statement = $this->connection->prepare($query);
        $statement->execute(['id' => $shareId]);

        return $statement->rowCount() > 0;
    }
}
