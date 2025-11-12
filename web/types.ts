export interface MedicalRecord {
  id: string | number;
  userId?: number;
  recordName: string;
  type: 'lab_result' | 'prescription' | 'diagnostic_imaging' | 'ecg' | 'endoscopy' | 'pathology' | 'discharge_summary' | 'medical_certificate' | 'vaccination' | 'medical_document';
  fileUrl: string; // This will be R2 public URL or data URL for local display
  r2Url?: string; // R2 public URL
  analysis: string;
  createdAt: Date | string; // Can be Date object or ISO string from API
  updatedAt?: Date | string;
  classification?: {
    documentType: string;
    confidence: number;
    reasoning: string;
    suggestedAnalysisType: string;
    detectedFeatures: string[];
  };
  
  // Enhanced fields for AI context (from PostgreSQL)
  structuredData?: any;
  documentType?: string;
  classificationConfidence?: number;
  patientContext?: any;
  testDate?: string;
  doctorName?: string;
  clinicName?: string;
  diagnosis?: string;
  medications?: any[];
  testResults?: any[];
  aiSummary?: string;
  keyFindings?: string[];
  abnormalValues?: any[];
  recommendations?: string[];
}

export interface UserProfile {
    name: string;
    age: number;
    bloodType: string;
    allergies: string;
    currentConditions: string;
}

export interface ChatSessionSummary {
    id: number;
    title: string | null;
    startedAt: string;
    lastActivityAt: string;
    status: 'active' | 'archived';
}

export interface ChatMessageItem {
    id: number;
    sessionId: number;
    sender: 'user' | 'ai';
    message: string;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
}
