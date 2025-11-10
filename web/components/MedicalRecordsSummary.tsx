import React, { useState } from 'react';
import type { MedicalRecord, UserProfile } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface MedicalRecordsSummaryProps {
  records: MedicalRecord[];
  profile: UserProfile;
}

const MedicalRecordsSummary: React.FC<MedicalRecordsSummaryProps> = ({ records, profile }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get recent records (last 5)
  const recentRecords = records
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Count by type
  const recordCounts = records.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'lab_result': '🧪',
      'prescription': '💊',
      'diagnostic_imaging': '📷',
      'ecg': '📈',
      'endoscopy': '🔍',
      'pathology': '🔬',
      'discharge_summary': '📋',
      'medical_certificate': '📄',
      'vaccination': '💉',
      'medical_document': '📋'
    };
    return icons[type] || '📋';
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      'lab_result': 'Xét nghiệm',
      'prescription': 'Toa thuốc',
      'diagnostic_imaging': 'Chẩn đoán hình ảnh',
      'ecg': 'Điện tim',
      'endoscopy': 'Nội soi',
      'pathology': 'Giải phẫu bệnh',
      'discharge_summary': 'Tóm tắt xuất viện',
      'medical_certificate': 'Giấy chứng nhận y tế',
      'vaccination': 'Tiêm chủng',
      'medical_document': 'Tài liệu y tế'
    };
    return names[type] || type;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🩺</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Hồ sơ Y tế của {profile.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {records.length} hồ sơ • Cập nhật gần nhất: {records.length > 0 ? formatDateTime(recentRecords[0]?.createdAt) : 'Chưa có'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{records.length}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Tổng hồ sơ</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{recordCounts['lab_result'] || 0}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Xét nghiệm</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{recordCounts['prescription'] || 0}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Toa thuốc</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Object.keys(recordCounts).length - (recordCounts['lab_result'] ? 1 : 0) - (recordCounts['prescription'] ? 1 : 0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Khác</div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Patient Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">👤 Thông tin cá nhân</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-600 dark:text-gray-400">Tuổi:</span> {profile.age}</div>
              <div><span className="text-gray-600 dark:text-gray-400">Nhóm máu:</span> {profile.bloodType}</div>
              <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Dị ứng:</span> {profile.allergies || 'Không có'}</div>
              <div className="col-span-2"><span className="text-gray-600 dark:text-gray-400">Tình trạng:</span> {profile.currentConditions || 'Không có ghi nhận'}</div>
            </div>
          </div>

          {/* Recent Records */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📋 Hồ sơ gần đây</h4>
            <div className="space-y-2">
              {recentRecords.map((record, index) => (
                <div key={record.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-lg">{getTypeIcon(record.type)}</span>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {record.recordName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {getTypeName(record.type)} • {formatDateTime(record.createdAt)}
                    </div>
                  </div>
                  {record.classification && (
                    <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {Math.round(record.classification.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
              {records.length > 5 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                  Và {records.length - 5} hồ sơ khác...
                </div>
              )}
            </div>
          </div>

          {/* Record Types Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📊 Phân loại hồ sơ</h4>
            <div className="space-y-2">
              {Object.entries(recordCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{getTypeIcon(type)}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{getTypeName(type)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Capabilities */}
      <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-green-600 dark:text-green-400">🤖</span>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">AI có thể giúp bạn:</span>
        </div>
        <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
          <div>• Giải thích kết quả xét nghiệm và ý nghĩa các chỉ số</div>
          <div>• Phân tích xu hướng sức khỏe theo thời gian</div>
          <div>• Tư vấn về thuốc và tác dụng phụ</div>
          <div>• Đưa ra lời khuyên cá nhân hóa dựa trên hồ sơ của bạn</div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsSummary;
