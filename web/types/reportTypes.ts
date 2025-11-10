// Professional Medical Report Types

export interface LabTestResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  flag?: string;
}

export interface StructuredLabReport {
  reportType: 'LAB_RESULT';
  patientInfo: {
    name?: string;
    age?: number;
    gender?: string;
    patientId?: string;
  };
  testInfo: {
    testName: string;
    testDate: string;
    sampleType?: string;
    requestingPhysician?: string;
    laboratoryName?: string;
  };
  results: LabTestResult[];
  interpretation: {
    summary: string;
    abnormalFindings: string[];
    clinicalSignificance: string;
    recommendations: string[];
  };
  diagnosticSuggestions: {
    possibleConditions: Array<{
      condition: string;
      probability: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }>;
  };
  followUp: {
    nextSteps: string[];
    specialistReferral?: string;
    additionalTests?: string[];
    urgencyLevel: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  };
  disclaimer: string;
}

export interface MedicationInfo {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions: string;
  primaryAction?: string; // Tác dụng chính đối với bệnh được chẩn đoán
  mechanismOfAction?: string; // Cơ chế hoạt động
  therapeuticRole?: string; // Vai trò trong phác đồ điều trị
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
}

export interface StructuredPrescriptionReport {
  reportType: 'PRESCRIPTION';
  patientInfo: {
    name?: string;
    age?: number;
    gender?: string;
    patientId?: string;
  };
  prescriptionInfo: {
    prescriptionDate: string;
    prescribingPhysician?: string;
    clinicName?: string;
    diagnosis?: string;
  };
  treatmentAnalysis?: {
    primaryDiagnosis: string;
    treatmentGoals: string[];
    treatmentApproach: string;
    expectedOutcome: string;
  };
  medications: MedicationInfo[];
  generalInstructions: {
    dosageInstructions: string[];
    storageInstructions: string[];
    generalPrecautions: string[];
    whenToSeekHelp: string[];
  };
  followUp: {
    nextAppointment?: string;
    monitoringRequired?: string[];
    warningSignsToWatch: string[];
  };
  pharmacistNotes?: string[];
  disclaimer: string;
}

export type StructuredMedicalReport = StructuredLabReport | StructuredPrescriptionReport;

// Response wrapper from AI
export interface AIStructuredResponse {
  success: boolean;
  data: StructuredMedicalReport;
  rawResponse?: string;
  error?: string;
}

// Professional report metadata
export interface ReportMetadata {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  version: string;
  language: 'vi-VN' | 'en-US';
}

export interface ProfessionalMedicalReport {
  metadata: ReportMetadata;
  report: StructuredMedicalReport;
}
