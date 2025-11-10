import React from 'react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import type { ProfessionalMedicalReport, StructuredLabReport, StructuredPrescriptionReport } from '../types/reportTypes';

interface ProfessionalReportTemplateProps {
  report: ProfessionalMedicalReport;
  showHeader?: boolean;
  showFooter?: boolean;
}

const ProfessionalReportTemplate: React.FC<ProfessionalReportTemplateProps> = ({ 
  report, 
  showHeader = true, 
  showFooter = true 
}) => {
  const { metadata, report: medicalReport } = report;

  const renderLabReport = (labReport: StructuredLabReport) => (
    <div className="professional-report">
      {/* Test Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          THÔNG TIN XÉT NGHIỆM
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Tên xét nghiệm:</strong> {labReport.testInfo.testName}</div>
          <div><strong>Ngày xét nghiệm:</strong> {labReport.testInfo.testDate || 'Không xác định'}</div>
          <div><strong>Loại mẫu:</strong> {labReport.testInfo.sampleType || 'Không xác định'}</div>
          <div><strong>Phòng xét nghiệm:</strong> {labReport.testInfo.laboratoryName || 'Không xác định'}</div>
        </div>
      </div>

      {/* Patient Information */}
      {(labReport.patientInfo.name || labReport.patientInfo.age) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            THÔNG TIN BỆNH NHÂN
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {labReport.patientInfo.name && <div><strong>Họ tên:</strong> {labReport.patientInfo.name}</div>}
            {labReport.patientInfo.age && <div><strong>Tuổi:</strong> {labReport.patientInfo.age}</div>}
            {labReport.patientInfo.gender && <div><strong>Giới tính:</strong> {labReport.patientInfo.gender}</div>}
            {labReport.patientInfo.patientId && <div><strong>Mã BN:</strong> {labReport.patientInfo.patientId}</div>}
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          KẾT QUẢ XÉT NGHIỆM
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">Chỉ số</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Kết quả</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Đơn vị</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Tham chiếu</th>
                <th className="border border-gray-300 px-3 py-2 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {labReport.results.map((result, index) => (
                <tr key={index} className={result.status !== 'NORMAL' ? 'bg-yellow-50' : ''}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{result.parameter}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {result.value}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{result.unit}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                    {result.referenceRange}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === 'NORMAL' ? 'bg-green-100 text-green-800' :
                      result.status === 'HIGH' ? 'bg-red-100 text-red-800' :
                      result.status === 'LOW' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-200 text-red-900'
                    }`}>
                      {result.status === 'NORMAL' ? 'Bình thường' :
                       result.status === 'HIGH' ? 'Cao' :
                       result.status === 'LOW' ? 'Thấp' : 'Nguy hiểm'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          DIỄN GIẢI KẾT QUẢ
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Tóm tắt:</h4>
            <p className="text-gray-600 leading-relaxed">{labReport.interpretation.summary}</p>
          </div>
          
          {labReport.interpretation.abnormalFindings.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Các chỉ số bất thường:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {labReport.interpretation.abnormalFindings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Ý nghĩa lâm sàng:</h4>
            <p className="text-gray-600 leading-relaxed">{labReport.interpretation.clinicalSignificance}</p>
          </div>
        </div>
      </div>

      {/* Diagnostic Suggestions */}
      {labReport.diagnosticSuggestions.possibleConditions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            GỢI Ý CHẨN ĐOÁN
          </h3>
          <div className="space-y-3">
            {labReport.diagnosticSuggestions.possibleConditions.map((condition, index) => (
              <div key={index} className="border-l-4 border-blue-400 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-700">{condition.condition}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    condition.probability === 'HIGH' ? 'bg-red-100 text-red-800' :
                    condition.probability === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {condition.probability === 'HIGH' ? 'Cao' :
                     condition.probability === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          KHUYẾN NGHỊ VÀ THEO DÕI
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Các bước tiếp theo:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {labReport.followUp.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
          
          {labReport.followUp.specialistReferral && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Chuyên khoa tham khảo:</h4>
              <p className="text-gray-600">{labReport.followUp.specialistReferral}</p>
            </div>
          )}
          
          {labReport.followUp.additionalTests && labReport.followUp.additionalTests.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Xét nghiệm bổ sung:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {labReport.followUp.additionalTests.map((test, index) => (
                  <li key={index}>{test}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Mức độ khẩn cấp:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                labReport.followUp.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                labReport.followUp.urgencyLevel === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {labReport.followUp.urgencyLevel === 'CRITICAL' ? 'Khẩn cấp' :
                 labReport.followUp.urgencyLevel === 'URGENT' ? 'Cần sớm' : 'Thường quy'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescriptionReport = (prescriptionReport: StructuredPrescriptionReport) => (
    <div className="professional-report">
      {/* Prescription Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          THÔNG TIN TOA THUỐC
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Ngày kê đơn:</strong> {prescriptionReport.prescriptionInfo.prescriptionDate || 'Không xác định'}</div>
          <div><strong>Bác sĩ kê đơn:</strong> {prescriptionReport.prescriptionInfo.prescribingPhysician || 'Không xác định'}</div>
          <div><strong>Phòng khám:</strong> {prescriptionReport.prescriptionInfo.clinicName || 'Không xác định'}</div>
          <div><strong>Chẩn đoán:</strong> {prescriptionReport.prescriptionInfo.diagnosis || 'Không xác định'}</div>
        </div>
      </div>

      {/* Patient Information */}
      {(prescriptionReport.patientInfo.name || prescriptionReport.patientInfo.age) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            THÔNG TIN BỆNH NHÂN
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {prescriptionReport.patientInfo.name && <div><strong>Họ tên:</strong> {prescriptionReport.patientInfo.name}</div>}
            {prescriptionReport.patientInfo.age && <div><strong>Tuổi:</strong> {prescriptionReport.patientInfo.age}</div>}
            {prescriptionReport.patientInfo.gender && <div><strong>Giới tính:</strong> {prescriptionReport.patientInfo.gender}</div>}
            {prescriptionReport.patientInfo.patientId && <div><strong>Mã BN:</strong> {prescriptionReport.patientInfo.patientId}</div>}
          </div>
        </div>
      )}

      {/* Medications */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          DANH SÁCH THUỐC
        </h3>
        <div className="space-y-4">
          {prescriptionReport.medications.map((medication, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{medication.name}</h4>
                  {medication.genericName && (
                    <p className="text-sm text-gray-600">({medication.genericName})</p>
                  )}
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Liều lượng:</strong> {medication.dosage}</div>
                  <div><strong>Tần suất:</strong> {medication.frequency}</div>
                  {medication.duration && <div><strong>Thời gian:</strong> {medication.duration}</div>}
                </div>
              </div>
              
              <div className="text-sm space-y-2">
                <div>
                  <strong>Hướng dẫn sử dụng:</strong>
                  <p className="text-gray-600 mt-1">{medication.instructions}</p>
                </div>
                
                {medication.sideEffects && medication.sideEffects.length > 0 && (
                  <div>
                    <strong>Tác dụng phụ:</strong>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {medication.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {medication.contraindications && medication.contraindications.length > 0 && (
                  <div>
                    <strong>Chống chỉ định:</strong>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {medication.contraindications.map((contra, idx) => (
                        <li key={idx}>{contra}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {medication.interactions && medication.interactions.length > 0 && (
                  <div>
                    <strong>Tương tác thuốc:</strong>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {medication.interactions.map((interaction, idx) => (
                        <li key={idx}>{interaction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Instructions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          HƯỚNG DẪN CHUNG
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Hướng dẫn liều lượng:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {prescriptionReport.generalInstructions.dosageInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Bảo quản thuốc:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {prescriptionReport.generalInstructions.storageInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Lưu ý chung:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {prescriptionReport.generalInstructions.generalPrecautions.map((precaution, index) => (
                <li key={index}>{precaution}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Khi nào cần tìm kiếm trợ giúp:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {prescriptionReport.generalInstructions.whenToSeekHelp.map((help, index) => (
                <li key={index}>{help}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Follow-up */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
          THEO DÕI VÀ TÁI KHÁM
        </h3>
        <div className="space-y-4 text-sm">
          {prescriptionReport.followUp.nextAppointment && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Lịch tái khám:</h4>
              <p className="text-gray-600">{prescriptionReport.followUp.nextAppointment}</p>
            </div>
          )}
          
          {prescriptionReport.followUp.monitoringRequired && prescriptionReport.followUp.monitoringRequired.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Theo dõi cần thiết:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {prescriptionReport.followUp.monitoringRequired.map((monitor, index) => (
                  <li key={index}>{monitor}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Dấu hiệu cảnh báo cần chú ý:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {prescriptionReport.followUp.warningSignsToWatch.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pharmacist Notes */}
      {prescriptionReport.pharmacistNotes && prescriptionReport.pharmacistNotes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
            GHI CHÚ CỦA DƯỢC SĨ
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
            {prescriptionReport.pharmacistNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="professional-medical-report bg-white">
      {/* Header */}
      {showHeader && (
        <div className="report-header mb-8 text-center border-b-2 border-gray-300 pb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            BÁO CÁO Y TẾ CHUYÊN NGHIỆP
          </h1>
          <h2 className="text-lg font-semibold text-blue-600 mb-4">
            {medicalReport.reportType === 'LAB_RESULT' ? 'KẾT QUẢ XÉT NGHIỆM' : 'PHÂN TÍCH TOA THUỐC'}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Mã báo cáo:</strong> {metadata.reportId}</div>
            <div><strong>Ngày tạo:</strong> {formatDateTime(metadata.generatedAt)}</div>
            <div><strong>Phiên bản:</strong> {metadata.version}</div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="report-content">
        {medicalReport.reportType === 'LAB_RESULT' ? 
          renderLabReport(medicalReport as StructuredLabReport) :
          renderPrescriptionReport(medicalReport as StructuredPrescriptionReport)
        }
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="report-footer mt-8 pt-6 border-t-2 border-gray-300">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{medicalReport.disclaimer}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>Báo cáo được tạo bởi {metadata.generatedBy}</p>
            <p>Thời gian: {formatDateTime(metadata.generatedAt)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalReportTemplate;
