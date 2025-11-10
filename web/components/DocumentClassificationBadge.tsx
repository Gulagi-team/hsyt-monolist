import React from 'react';
import type { MedicalRecord } from '../types';

interface DocumentClassificationBadgeProps {
  record: MedicalRecord;
  showDetails?: boolean;
}

const DocumentClassificationBadge: React.FC<DocumentClassificationBadgeProps> = ({ 
  record, 
  showDetails = false 
}) => {
  if (!record.classification) {
    return null;
  }

  const { documentType, confidence, reasoning, detectedFeatures } = record.classification;

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'LAB_RESULT': 'Kết quả xét nghiệm',
      'PRESCRIPTION': 'Toa thuốc',
      'XRAY': 'X-quang',
      'CT_SCAN': 'CT Scan',
      'MRI': 'MRI',
      'ULTRASOUND': 'Siêu âm',
      'MAMMOGRAPHY': 'Nhũ ảnh',
      'PET_SCAN': 'PET Scan',
      'ECG': 'Điện tâm đồ',
      'ENDOSCOPY': 'Nội soi',
      'PATHOLOGY': 'Giải phẫu bệnh',
      'DISCHARGE_SUMMARY': 'Tóm tắt xuất viện',
      'MEDICAL_CERTIFICATE': 'Giấy chứng nhận y tế',
      'VACCINATION_RECORD': 'Phiếu tiêm chủng',
      'UNKNOWN': 'Không xác định'
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getDocumentTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'LAB_RESULT': '🧪',
      'PRESCRIPTION': '💊',
      'XRAY': '🦴',
      'CT_SCAN': '🔍',
      'MRI': '🧠',
      'ULTRASOUND': '📡',
      'MAMMOGRAPHY': '🩺',
      'PET_SCAN': '⚡',
      'ECG': '💓',
      'ENDOSCOPY': '🔬',
      'PATHOLOGY': '🧬',
      'DISCHARGE_SUMMARY': '📋',
      'MEDICAL_CERTIFICATE': '📄',
      'VACCINATION_RECORD': '💉',
      'UNKNOWN': '❓'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="document-classification">
      {/* Main Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(confidence)}`}>
        <span className="text-base">{getDocumentTypeIcon(documentType)}</span>
        <span>{getDocumentTypeLabel(documentType)}</span>
        <span className="text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Độ tin cậy:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      confidence >= 0.8 ? 'bg-green-500' :
                      confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium">{Math.round(confidence * 100)}%</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Lý do phân loại:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{reasoning}</p>
            </div>

            {detectedFeatures && detectedFeatures.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Đặc điểm phát hiện:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {detectedFeatures.map((feature, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentClassificationBadge;
