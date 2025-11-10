<?php

declare(strict_types=1);

namespace App\Domain\MedicalRecord;

use JsonSerializable;

class MedicalRecord implements JsonSerializable
{
    private ?int $id;
    private int $userId;
    private string $recordName;
    private string $type;
    private string $fileUrl;
    private string $analysis;
    private string $createdAt;
    private string $updatedAt;
    
    // R2 Storage field - only store the public URL
    private ?string $r2Url;
    
    // Enhanced fields for AI context
    private ?array $structuredData;
    private ?string $documentType;
    private ?float $classificationConfidence;
    private ?array $patientContext;
    private ?string $testDate;
    private ?string $doctorName;
    private ?string $clinicName;
    private ?string $diagnosis;
    private ?array $medications;
    private ?array $testResults;
    private ?string $aiSummary;
    private ?array $keyFindings;
    private ?array $abnormalValues;
    private ?array $recommendations;

    public function __construct(
        ?int $id,
        int $userId,
        string $recordName,
        string $type,
        string $fileUrl,
        string $analysis,
        string $createdAt = '',
        string $updatedAt = '',
        ?string $r2Url = null,
        ?array $structuredData = null,
        ?string $documentType = null,
        ?float $classificationConfidence = null,
        ?array $patientContext = null,
        ?string $testDate = null,
        ?string $doctorName = null,
        ?string $clinicName = null,
        ?string $diagnosis = null,
        ?array $medications = null,
        ?array $testResults = null,
        ?string $aiSummary = null,
        ?array $keyFindings = null,
        ?array $abnormalValues = null,
        ?array $recommendations = null
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->recordName = $recordName;
        $this->type = $type;
        $this->fileUrl = $fileUrl;
        $this->analysis = $analysis;
        $this->createdAt = $createdAt ?: date('Y-m-d H:i:s');
        $this->updatedAt = $updatedAt ?: date('Y-m-d H:i:s');
        
        // R2 storage field
        $this->r2Url = $r2Url;
        
        // AI context fields
        $this->structuredData = $structuredData;
        $this->documentType = $documentType;
        $this->classificationConfidence = $classificationConfidence;
        $this->patientContext = $patientContext;
        $this->testDate = $testDate;
        $this->doctorName = $doctorName;
        $this->clinicName = $clinicName;
        $this->diagnosis = $diagnosis;
        $this->medications = $medications;
        $this->testResults = $testResults;
        $this->aiSummary = $aiSummary;
        $this->keyFindings = $keyFindings;
        $this->abnormalValues = $abnormalValues;
        $this->recommendations = $recommendations;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getRecordName(): string
    {
        return $this->recordName;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getFileUrl(): string
    {
        return $this->fileUrl;
    }

    public function getAnalysis(): string
    {
        return $this->analysis;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    // Getter for R2 storage field
    public function getR2Url(): ?string
    {
        return $this->r2Url;
    }

    // Getters for AI context fields
    public function getStructuredData(): ?array
    {
        return $this->structuredData;
    }

    public function getDocumentType(): ?string
    {
        return $this->documentType;
    }

    public function getClassificationConfidence(): ?float
    {
        return $this->classificationConfidence;
    }

    public function getPatientContext(): ?array
    {
        return $this->patientContext;
    }

    public function getTestDate(): ?string
    {
        return $this->testDate;
    }

    public function getDoctorName(): ?string
    {
        return $this->doctorName;
    }

    public function getClinicName(): ?string
    {
        return $this->clinicName;
    }

    public function getDiagnosis(): ?string
    {
        return $this->diagnosis;
    }

    public function getMedications(): ?array
    {
        return $this->medications;
    }

    public function getTestResults(): ?array
    {
        return $this->testResults;
    }

    public function getAiSummary(): ?string
    {
        return $this->aiSummary;
    }

    public function getKeyFindings(): ?array
    {
        return $this->keyFindings;
    }

    public function getAbnormalValues(): ?array
    {
        return $this->abnormalValues;
    }

    public function getRecommendations(): ?array
    {
        return $this->recommendations;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'recordName' => $this->recordName,
            'type' => $this->type,
            'fileUrl' => $this->fileUrl,
            'analysis' => $this->analysis,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
            // R2 storage field
            'r2Url' => $this->r2Url,
            'structuredData' => $this->structuredData,
            'documentType' => $this->documentType,
            'classificationConfidence' => $this->classificationConfidence,
            'patientContext' => $this->patientContext,
            'testDate' => $this->testDate,
            'doctorName' => $this->doctorName,
            'clinicName' => $this->clinicName,
            'diagnosis' => $this->diagnosis,
            'medications' => $this->medications,
            'testResults' => $this->testResults,
            'aiSummary' => $this->aiSummary,
            'keyFindings' => $this->keyFindings,
            'abnormalValues' => $this->abnormalValues,
            'recommendations' => $this->recommendations,
        ];
    }
}
