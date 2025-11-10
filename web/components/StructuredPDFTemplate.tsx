import React from 'react';
import type { MedicalRecord, UserProfile } from '../types';
import type { ProfessionalMedicalReport, StructuredLabReport, StructuredPrescriptionReport } from '../types/reportTypes';
import { formatDateTime } from '../utils/dateUtils';

interface StructuredPDFTemplateProps {
  record: MedicalRecord;
  userProfile?: UserProfile | null;
}

const StructuredPDFTemplate: React.FC<StructuredPDFTemplateProps> = ({ record, userProfile }) => {
  // Parse structured report
  let structuredReport: ProfessionalMedicalReport | null = null;
  try {
    const parsedAnalysis = JSON.parse(record.analysis);
    if (parsedAnalysis.metadata && parsedAnalysis.report) {
      structuredReport = parsedAnalysis as ProfessionalMedicalReport;
    }
  } catch (error) {
    return <div>Không thể tạo báo cáo PDF cho dữ liệu này</div>;
  }

  if (!structuredReport) {
    return <div>Không có dữ liệu báo cáo có cấu trúc</div>;
  }

  const renderLabReport = (labReport: StructuredLabReport) => (
    <div className="space-y-6">
      {/* Patient & Test Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Thông tin Bệnh nhân & Xét nghiệm</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Họ tên:</strong> {labReport.patientInfo?.name || 'N/A'}
          </div>
          <div>
            <strong>Tuổi:</strong> {labReport.patientInfo?.age || 'N/A'}
          </div>
          <div>
            <strong>Giới tính:</strong> {labReport.patientInfo?.gender || 'N/A'}
          </div>
          <div>
            <strong>Mã BN:</strong> {labReport.patientInfo?.patientId || 'N/A'}
          </div>
          <div>
            <strong>Tên xét nghiệm:</strong> {labReport.testInfo?.testName || 'N/A'}
          </div>
          <div>
            <strong>Ngày xét nghiệm:</strong> {labReport.testInfo?.testDate || 'N/A'}
          </div>
          <div>
            <strong>Loại mẫu:</strong> {labReport.testInfo?.sampleType || 'N/A'}
          </div>
          <div>
            <strong>Phòng xét nghiệm:</strong> {labReport.testInfo?.laboratoryName || 'N/A'}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {labReport.results && labReport.results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Kết quả Xét nghiệm</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Chỉ số</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Giá trị</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Đơn vị</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Tham chiếu</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {labReport.results.map((result, index) => (
                  <tr key={index} className={result.status === 'NORMAL' ? '' : 'bg-red-50'}>
                    <td className="border border-gray-300 px-3 py-2">{result.parameter}</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{result.value}</td>
                    <td className="border border-gray-300 px-3 py-2">{result.unit}</td>
                    <td className="border border-gray-300 px-3 py-2">{result.referenceRange}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'NORMAL' ? 'bg-green-100 text-green-800' :
                        result.status === 'HIGH' ? 'bg-red-100 text-red-800' :
                        result.status === 'LOW' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interpretation */}
      {labReport.interpretation && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Giải thích Kết quả</h3>
          <div className="space-y-3 text-sm">
            {labReport.interpretation.summary && (
              <div>
                <strong>Tóm tắt:</strong>
                <p className="mt-1 text-gray-700">{labReport.interpretation.summary}</p>
              </div>
            )}
            {labReport.interpretation.abnormalFindings && labReport.interpretation.abnormalFindings.length > 0 && (
              <div>
                <strong>Phát hiện bất thường:</strong>
                <ul className="mt-1 list-disc list-inside text-gray-700">
                  {labReport.interpretation.abnormalFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            {labReport.interpretation.recommendations && labReport.interpretation.recommendations.length > 0 && (
              <div>
                <strong>Khuyến nghị:</strong>
                <ul className="mt-1 list-disc list-inside text-gray-700">
                  {labReport.interpretation.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagnostic Suggestions */}
      {labReport.diagnosticSuggestions && labReport.diagnosticSuggestions.possibleConditions && labReport.diagnosticSuggestions.possibleConditions.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Gợi ý Chẩn đoán</h3>
          <div className="space-y-3">
            {labReport.diagnosticSuggestions.possibleConditions.map((condition, index) => (
              <div key={index} className="bg-white p-3 rounded border-l-4 border-purple-400">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-purple-800">{condition.condition}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    condition.probability === 'HIGH' ? 'bg-red-100 text-red-800' :
                    condition.probability === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {condition.probability === 'HIGH' ? 'Cao' :
                     condition.probability === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                {condition.description && (
                  <p className="text-sm text-gray-700 mb-2">{condition.description}</p>
                )}
                {condition.supportingEvidence && condition.supportingEvidence.length > 0 && (
                  <div className="text-sm">
                    <strong className="text-gray-600">Bằng chứng:</strong>
                    <ul className="mt-1 list-disc list-inside text-gray-600">
                      {condition.supportingEvidence.map((evidence, idx) => (
                        <li key={idx}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {labReport.followUp && (
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800 mb-3">Theo dõi & Khuyến nghị</h3>
          <div className="space-y-3 text-sm">
            {labReport.followUp.nextSteps && labReport.followUp.nextSteps.length > 0 && (
              <div>
                <strong>Các bước tiếp theo:</strong>
                <ul className="mt-1 list-disc list-inside text-orange-700">
                  {labReport.followUp.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {labReport.followUp.specialistReferral && (
              <div>
                <strong>Chuyên khoa tham khảo:</strong>
                <p className="mt-1 text-orange-700">{labReport.followUp.specialistReferral}</p>
              </div>
            )}
            {labReport.followUp.additionalTests && labReport.followUp.additionalTests.length > 0 && (
              <div>
                <strong>Xét nghiệm bổ sung:</strong>
                <ul className="mt-1 list-disc list-inside text-orange-700">
                  {labReport.followUp.additionalTests.map((test, index) => (
                    <li key={index}>{test}</li>
                  ))}
                </ul>
              </div>
            )}
            {labReport.followUp.urgencyLevel && (
              <div className="mt-3 p-2 bg-orange-100 rounded">
                <strong className="text-orange-800">Mức độ khẩn cấp:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  labReport.followUp.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  labReport.followUp.urgencyLevel === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {labReport.followUp.urgencyLevel === 'CRITICAL' ? 'Khẩn cấp' :
                   labReport.followUp.urgencyLevel === 'URGENT' ? 'Cần sớm' : 'Thường quy'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPrescriptionReport = (prescriptionReport: StructuredPrescriptionReport) => (
    <div className="space-y-6">
      {/* Patient & Prescription Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Thông tin Bệnh nhân & Toa thuốc</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Họ tên:</strong> {prescriptionReport.patientInfo?.name || 'N/A'}
          </div>
          <div>
            <strong>Tuổi:</strong> {prescriptionReport.patientInfo?.age || 'N/A'}
          </div>
          <div>
            <strong>Giới tính:</strong> {prescriptionReport.patientInfo?.gender || 'N/A'}
          </div>
          <div>
            <strong>Bác sĩ kê đơn:</strong> {prescriptionReport.prescriptionInfo?.prescribingPhysician || 'N/A'}
          </div>
          <div>
            <strong>Ngày kê đơn:</strong> {prescriptionReport.prescriptionInfo?.prescriptionDate || 'N/A'}
          </div>
          <div>
            <strong>Phòng khám:</strong> {prescriptionReport.prescriptionInfo?.clinicName || 'N/A'}
          </div>
        </div>
      </div>

      {/* Treatment Analysis */}
      {prescriptionReport.treatmentAnalysis && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Chẩn đoán và Mục đích Điều trị</h3>
          <div className="space-y-3 text-sm">
            {prescriptionReport.treatmentAnalysis.primaryDiagnosis && (
              <div>
                <strong>Chẩn đoán chính:</strong>
                <p className="mt-1 text-green-700">{prescriptionReport.treatmentAnalysis.primaryDiagnosis}</p>
              </div>
            )}
            {prescriptionReport.treatmentAnalysis.treatmentGoals && prescriptionReport.treatmentAnalysis.treatmentGoals.length > 0 && (
              <div>
                <strong>Mục tiêu điều trị:</strong>
                <ul className="mt-1 list-disc list-inside text-green-700">
                  {prescriptionReport.treatmentAnalysis.treatmentGoals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medications */}
      {prescriptionReport.medications && prescriptionReport.medications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Danh sách Thuốc</h3>
          <div className="space-y-4">
            {prescriptionReport.medications.map((medication, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Tên thuốc:</strong> {medication.name}
                  </div>
                  <div>
                    <strong>Liều lượng:</strong> {medication.dosage}
                  </div>
                  <div>
                    <strong>Tần suất:</strong> {medication.frequency}
                  </div>
                  <div>
                    <strong>Cách dùng:</strong> {medication.instructions}
                  </div>
                </div>
                
                {medication.primaryAction && (
                  <div className="mt-3 bg-green-50 p-3 rounded">
                    <strong className="text-green-800">Tác dụng chính:</strong>
                    <p className="mt-1 text-green-700">{medication.primaryAction}</p>
                  </div>
                )}
                
                {medication.mechanismOfAction && (
                  <div className="mt-2">
                    <strong>Cơ chế hoạt động:</strong>
                    <p className="mt-1 text-gray-600">{medication.mechanismOfAction}</p>
                  </div>
                )}
                
                {medication.sideEffects && medication.sideEffects.length > 0 && (
                  <div className="mt-2">
                    <strong>Tác dụng phụ:</strong>
                    <ul className="mt-1 list-disc list-inside text-gray-600">
                      {medication.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Instructions */}
      {prescriptionReport.generalInstructions && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Hướng dẫn Chung</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            {prescriptionReport.generalInstructions.dosageInstructions && prescriptionReport.generalInstructions.dosageInstructions.length > 0 && (
              <div>
                <strong className="text-indigo-800">Hướng dẫn liều lượng:</strong>
                <ul className="mt-1 list-disc list-inside text-indigo-700">
                  {prescriptionReport.generalInstructions.dosageInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
            {prescriptionReport.generalInstructions.storageInstructions && prescriptionReport.generalInstructions.storageInstructions.length > 0 && (
              <div>
                <strong className="text-indigo-800">Bảo quản thuốc:</strong>
                <ul className="mt-1 list-disc list-inside text-indigo-700">
                  {prescriptionReport.generalInstructions.storageInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="structured-pdf-template bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">BÁO CÁO Y TẾ</h1>
        <p className="text-gray-600">Hệ thống Phân tích Hồ sơ Y tế AI</p>
      </div>

      {/* Patient Info */}
      {userProfile && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Thông tin Bệnh nhân</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Họ tên:</strong> {userProfile.name}</div>
            <div><strong>Tuổi:</strong> {userProfile.age}</div>
            <div><strong>Nhóm máu:</strong> {userProfile.bloodType}</div>
            <div><strong>Dị ứng:</strong> {userProfile.allergies}</div>
            <div><strong>Tình trạng hiện tại:</strong> {userProfile.currentConditions}</div>
            <div><strong>Ngày tạo báo cáo:</strong> {formatDateTime(record.createdAt)}</div>
          </div>
        </div>
      )}

      {/* Report Metadata */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Thông tin Báo cáo</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Tên hồ sơ:</strong> {record.recordName}</div>
          <div><strong>Loại báo cáo:</strong> {structuredReport.report.reportType === 'LAB_RESULT' ? 'Kết quả Xét nghiệm' : 'Toa thuốc'}</div>
          <div><strong>Mã báo cáo:</strong> {structuredReport.metadata.reportId}</div>
          <div><strong>Phiên bản:</strong> {structuredReport.metadata.version}</div>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {structuredReport.report.reportType === 'LAB_RESULT' ? 
          renderLabReport(structuredReport.report as StructuredLabReport) :
          renderPrescriptionReport(structuredReport.report as StructuredPrescriptionReport)
        }
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Báo cáo này được tạo tự động bởi hệ thống AI. Bao gồm gợi ý chẩn đoán và khuyến nghị theo dõi.</p>
        <p>Vui lòng tham khảo ý kiến bác sĩ chuyên khoa để được tư vấn cụ thể.</p>
        <p>Ngày tạo: {new Date().toLocaleDateString('vi-VN')} - Hệ thống Hồ Sơ Y Tế </p>
      </div>
    </div>
  );
};

export default StructuredPDFTemplate;
