import type { MedicalRecord } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface AnalysisRequest {
  recordName: string;
  type: 'lab_result' | 'prescription' | 'auto_detect';
  fileData: string;
  mimeType: string;
  question?: string;
  // R2 storage info - only URL needed
  r2Url?: string;
}

export interface AnalysisResponse {
  record: MedicalRecord;
  message: string;
}

export interface UploadResponse {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileData: string;
  message: string;
  // R2 storage info
  r2Key?: string;
  r2Url?: string;
}

class AnalysisService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = this.getAuthToken();
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload thất bại');
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  async analyzeFile(analysisRequest: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Phân tích thất bại');
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Lỗi kết nối. Vui lòng thử lại.');
    }
  }

  // Helper method to convert File to base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Comprehensive analysis method that handles both upload and analysis
  // Supports both automatic classification and manual type selection
  async analyzeFileComplete(
    file: File, 
    recordName: string, 
    question?: string,
    analysisType: 'auto_detect' | 'lab_result' | 'prescription' = 'auto_detect'
  ): Promise<AnalysisResponse> {
    try {
      // Step 1: Upload file
      const uploadResponse = await this.uploadFile(file);
      
      // Step 2: Analyze
      const analysisRequest: AnalysisRequest = {
        recordName,
        type: analysisType,
        fileData: uploadResponse.fileData,
        mimeType: uploadResponse.mimeType,
        question,
        // Include R2 storage info from upload
        r2Url: uploadResponse.r2Url
      };

      const analysisResponse = await this.analyzeFile(analysisRequest);
      
      return analysisResponse;
    } catch (error) {
      console.error('Complete analysis failed:', error);
      throw error;
    }
  }

  async getMedicalRecords(userId: number): Promise<MedicalRecord[]> {
    try {
      console.log('Fetching medical records for user ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/records`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      // Check if data has records array or if data itself is the records array
      const records = data.records || data.data || data;
      
      if (!Array.isArray(records)) {
        console.error('Expected records array, got:', records);
        return [];
      }
      
      // Transform the response data to match MedicalRecord interface
      return records.map((record: any) => ({
        id: record.id,
        userId: record.userId,
        recordName: record.recordName,
        type: record.type,
        fileUrl: record.fileUrl || '',
        analysis: record.analysis,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        // Enhanced fields from PostgreSQL
        structuredData: record.structuredData,
        documentType: record.documentType,
        classificationConfidence: record.classificationConfidence,
        patientContext: record.patientContext,
        testDate: record.testDate,
        doctorName: record.doctorName,
        clinicName: record.clinicName,
        diagnosis: record.diagnosis,
        medications: record.medications,
        testResults: record.testResults,
        aiSummary: record.aiSummary,
        keyFindings: record.keyFindings,
        abnormalValues: record.abnormalValues,
        recommendations: record.recommendations
      }));
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
      throw new Error('Không thể tải lịch sử hồ sơ. Vui lòng thử lại.');
    }
  }

  async deleteMedicalRecord(recordId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete medical record:', error);
      throw new Error('Không thể xóa hồ sơ. Vui lòng thử lại.');
    }
  }
}

export const analysisService = new AnalysisService();
export default analysisService;
