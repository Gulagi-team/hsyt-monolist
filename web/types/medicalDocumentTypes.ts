// Medical Document Classification Types

export type MedicalDocumentType = 
  | 'LAB_RESULT'           // Kết quả xét nghiệm
  | 'PRESCRIPTION'         // Toa thuốc
  | 'XRAY'                // Phiếu chụp X-quang
  | 'CT_SCAN'             // Chụp cắt lớp vi tính (CT)
  | 'MRI'                 // Ảnh cộng hưởng từ (MRI)
  | 'ULTRASOUND'          // Siêu âm
  | 'MAMMOGRAPHY'         // Nhũ ảnh
  | 'PET_SCAN'            // Chụp cắt lớp Positron (PET)
  | 'ECG'                 // Điện tâm đồ
  | 'ENDOSCOPY'           // Nội soi
  | 'PATHOLOGY'           // Giải phẫu bệnh
  | 'DISCHARGE_SUMMARY'   // Tóm tắt xuất viện
  | 'MEDICAL_CERTIFICATE' // Giấy chứng nhận y tế
  | 'VACCINATION_RECORD'  // Phiếu tiêm chủng
  | 'UNKNOWN';            // Không xác định

export interface DocumentClassificationResult {
  documentType: MedicalDocumentType;
  confidence: number; // 0-1
  reasoning: string;
  suggestedAnalysisType: 'diagnostic_imaging' | 'lab_test' | 'prescription' | 'medical_report';
  detectedFeatures: string[];
}

// Base interface for all medical documents
export interface BaseMedicalDocument {
  documentType: MedicalDocumentType;
  patientInfo?: {
    name?: string;
    age?: number;
    gender?: string;
    patientId?: string;
    dateOfBirth?: string;
  };
  facilityInfo?: {
    hospitalName?: string;
    departmentName?: string;
    physicianName?: string;
    technician?: string;
    reportDate?: string;
  };
  disclaimer: string;
}

// Diagnostic Imaging Documents
export interface DiagnosticImagingReport extends BaseMedicalDocument {
  documentType: 'XRAY' | 'CT_SCAN' | 'MRI' | 'ULTRASOUND' | 'MAMMOGRAPHY' | 'PET_SCAN';
  studyInfo: {
    studyType: string;
    studyDate: string;
    bodyPart: string;
    technique?: string;
    contrast?: string;
    indication: string;
  };
  findings: {
    summary: string;
    detailedFindings: string[];
    measurements?: Array<{
      structure: string;
      measurement: string;
      unit: string;
      normalRange?: string;
    }>;
    abnormalities: string[];
  };
  impression: {
    primaryDiagnosis: string;
    differentialDiagnosis?: string[];
    severity?: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  };
  recommendations: {
    followUp: string[];
    additionalStudies?: string[];
    clinicalCorrelation: string;
    urgency: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  };
}

// ECG Report
export interface ECGReport extends BaseMedicalDocument {
  documentType: 'ECG';
  studyInfo: {
    recordingDate: string;
    recordingTime?: string;
    leadConfiguration: string;
    paperSpeed?: string;
    calibration?: string;
  };
  measurements: {
    heartRate: number;
    prInterval?: number;
    qrsDuration?: number;
    qtInterval?: number;
    qtcInterval?: number;
    axis?: string;
  };
  rhythm: {
    basicRhythm: string;
    arrhythmias?: string[];
    conductionAbnormalities?: string[];
  };
  findings: {
    normalFindings: string[];
    abnormalFindings: string[];
    stChanges?: string[];
    waveAbnormalities?: string[];
  };
  interpretation: {
    summary: string;
    clinicalSignificance: string;
    recommendations: string[];
  };
}

// Pathology Report
export interface PathologyReport extends BaseMedicalDocument {
  documentType: 'PATHOLOGY';
  specimenInfo: {
    specimenType: string;
    collectionDate: string;
    collectionSite: string;
    specimenSize?: string;
    fixation?: string;
  };
  macroscopicFindings: {
    grossDescription: string;
    specimenWeight?: string;
    dimensions?: string;
    appearance: string;
  };
  microscopicFindings: {
    histologicalDescription: string;
    cellularFeatures: string[];
    architecturalFeatures: string[];
    specialStains?: Array<{
      stainType: string;
      result: string;
    }>;
  };
  diagnosis: {
    primaryDiagnosis: string;
    secondaryDiagnoses?: string[];
    gradingStaging?: string;
    margins?: string;
    lymphNodes?: string;
  };
  recommendations: {
    followUp: string[];
    additionalTesting?: string[];
    clinicalCorrelation: string;
  };
}

// Endoscopy Report
export interface EndoscopyReport extends BaseMedicalDocument {
  documentType: 'ENDOSCOPY';
  procedureInfo: {
    procedureType: string;
    procedureDate: string;
    indication: string;
    sedation?: string;
    equipment?: string;
  };
  findings: {
    normalFindings: string[];
    abnormalFindings: string[];
    lesions?: Array<{
      location: string;
      size: string;
      appearance: string;
      classification?: string;
    }>;
    biopsies?: Array<{
      site: string;
      reason: string;
      numberOfSamples: number;
    }>;
  };
  procedures: {
    interventions?: string[];
    complications?: string[];
    specimens?: string[];
  };
  assessment: {
    diagnosis: string[];
    severity?: string;
    recommendations: string[];
  };
}

// Medical Certificate
export interface MedicalCertificateReport extends BaseMedicalDocument {
  documentType: 'MEDICAL_CERTIFICATE';
  certificateInfo: {
    certificateType: string;
    issueDate: string;
    validityPeriod?: string;
    purpose: string;
  };
  medicalFindings: {
    currentCondition: string;
    limitations?: string[];
    capabilities?: string[];
    restrictions?: string[];
  };
  recommendations: {
    workStatus?: string;
    activityRestrictions?: string[];
    followUpRequired?: boolean;
    nextReviewDate?: string;
  };
}

// Vaccination Record
export interface VaccinationReport extends BaseMedicalDocument {
  documentType: 'VACCINATION_RECORD';
  vaccinations: Array<{
    vaccineName: string;
    vaccineType: string;
    manufacturer?: string;
    batchNumber?: string;
    administrationDate: string;
    administrationSite: string;
    dose: string;
    administrator?: string;
    reactions?: string[];
  }>;
  immunizationStatus: {
    completedSeries: string[];
    pendingVaccinations: string[];
    nextDueDate?: string;
  };
  recommendations: {
    upcomingVaccinations: string[];
    travelVaccinations?: string[];
    specialConsiderations?: string[];
  };
}

// Discharge Summary
export interface DischargeSummaryReport extends BaseMedicalDocument {
  documentType: 'DISCHARGE_SUMMARY';
  admissionInfo: {
    admissionDate: string;
    dischargeDate: string;
    lengthOfStay: number;
    admissionDiagnosis: string;
    dischargeDiagnosis: string;
  };
  hospitalCourse: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    hospitalStay: string;
    procedures?: string[];
    complications?: string[];
  };
  medications: {
    dischargeMedications: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration?: string;
      instructions: string;
    }>;
    discontinuedMedications?: string[];
  };
  followUp: {
    appointments: Array<{
      specialty: string;
      timeframe: string;
      reason: string;
    }>;
    instructions: string[];
    warningSignsToWatch: string[];
  };
}

// Union type for all specialized medical documents
export type SpecializedMedicalDocument = 
  | DiagnosticImagingReport
  | ECGReport
  | PathologyReport
  | EndoscopyReport
  | MedicalCertificateReport
  | VaccinationReport
  | DischargeSummaryReport;

// Classification request/response interfaces
export interface DocumentClassificationRequest {
  imageData: string;
  mimeType: string;
}

export interface DocumentClassificationResponse {
  classification: DocumentClassificationResult;
  suggestedPrompt?: string;
  processingNotes?: string[];
}
