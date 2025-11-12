import React, { useState } from 'react';
import type { MedicalRecord, UserProfile } from '../types';
import type { ProfessionalMedicalReport, StructuredLabReport, StructuredPrescriptionReport } from '../types/reportTypes';
import { formatDateTime } from '../utils/dateUtils';
import DocumentClassificationBadge from './DocumentClassificationBadge';
// Simple inline icons for expand/collapse
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface StructuredAnalysisResultProps {
  record: MedicalRecord;
  userProfile?: UserProfile | null;
}

const StructuredAnalysisResult: React.FC<StructuredAnalysisResultProps> = ({ record, userProfile }) => {
  // Track collapsed sections; empty set means all sections open by default
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Parse structured report from analysis
  let structuredReport: ProfessionalMedicalReport | null = null;
  try {
    const parsedAnalysis = JSON.parse(record.analysis);
    if (parsedAnalysis.metadata && parsedAnalysis.report) {
      structuredReport = parsedAnalysis as ProfessionalMedicalReport;
    }
  } catch (error) {
    console.error('Failed to parse structured report:', error);
  }

  const toggleSection = (sectionId: string) => {
    const updated = new Set(collapsedSections);
    if (updated.has(sectionId)) {
      updated.delete(sectionId);
    } else {
      updated.add(sectionId);
    }
    setCollapsedSections(updated);
  };

  const CollapsibleSection: React.FC<{
    id: string;
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }> = ({ id, title, children, defaultExpanded = false }) => {
    const isExpanded = !collapsedSections.has(id);
    
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderLabReport = (labReport: StructuredLabReport) => (
    <div className="space-y-4">
      {/* Patient & Test Info */}
      <CollapsibleSection id="patient-info" title="Thông tin Bệnh nhân & Xét nghiệm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Thông tin Bệnh nhân</h4>
            <div className="space-y-1 text-sm">
              {labReport.patientInfo?.name && <div><strong>Họ tên:</strong> {labReport.patientInfo.name}</div>}
              {labReport.patientInfo?.age && <div><strong>Tuổi:</strong> {labReport.patientInfo.age}</div>}
              {labReport.patientInfo?.gender && <div><strong>Giới tính:</strong> {labReport.patientInfo.gender}</div>}
              {labReport.patientInfo?.patientId && <div><strong>Mã BN:</strong> {labReport.patientInfo.patientId}</div>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Thông tin Xét nghiệm</h4>
            <div className="space-y-1 text-sm">
              {labReport.testInfo?.testName && <div><strong>Tên XN:</strong> {labReport.testInfo.testName}</div>}
              {labReport.testInfo?.testDate && <div><strong>Ngày XN:</strong> {labReport.testInfo.testDate}</div>}
              {labReport.testInfo?.sampleType && <div><strong>Loại mẫu:</strong> {labReport.testInfo.sampleType}</div>}
              {labReport.testInfo?.laboratoryName && <div><strong>Phòng XN:</strong> {labReport.testInfo.laboratoryName}</div>}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Results Table */}
      {labReport.results && labReport.results.length > 0 && (
        <CollapsibleSection id="results" title="Kết quả Xét nghiệm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Chỉ số</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">Kết quả</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">Đơn vị</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">Tham chiếu</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {labReport.results.map((result, index) => (
                  <tr key={index} className={result.status !== 'NORMAL' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">{result.parameter}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold">
                      {result.value}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{result.unit}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                      {result.referenceRange}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'NORMAL' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        result.status === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        result.status === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
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
        </CollapsibleSection>
      )}

      {/* Interpretation */}
      {labReport.interpretation && (
        <CollapsibleSection id="interpretation" title="Diễn giải Kết quả">
          <div className="space-y-4">
            {labReport.interpretation.summary && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tóm tắt:</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{labReport.interpretation.summary}</p>
              </div>
            )}
            
            {labReport.interpretation.abnormalFindings && labReport.interpretation.abnormalFindings.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Các chỉ số bất thường:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {labReport.interpretation.abnormalFindings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
          
            {labReport.interpretation.clinicalSignificance && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Ý nghĩa lâm sàng:</h4>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{labReport.interpretation.clinicalSignificance}</p>
              </div>
            )}

            {labReport.interpretation.recommendations && labReport.interpretation.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Khuyến nghị:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {labReport.interpretation.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Diagnostic Suggestions */}
      {labReport.diagnosticSuggestions && labReport.diagnosticSuggestions.possibleConditions && labReport.diagnosticSuggestions.possibleConditions.length > 0 && (
        <CollapsibleSection id="diagnostic" title="Gợi ý Chẩn đoán">
          <div className="space-y-3">
            {labReport.diagnosticSuggestions.possibleConditions.map((condition, index) => (
              <div key={index} className="border-l-4 border-blue-400 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">{condition.condition}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    condition.probability === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    condition.probability === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {condition.probability === 'HIGH' ? 'Cao' :
                     condition.probability === 'MEDIUM' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{condition.description}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Follow-up */}
      {labReport.followUp && (
        <CollapsibleSection id="followup" title="Theo dõi & Khuyến nghị">
          <div className="space-y-4">
            {labReport.followUp.nextSteps && labReport.followUp.nextSteps.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Các bước tiếp theo:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {labReport.followUp.nextSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {labReport.followUp.specialistReferral && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Chuyên khoa tham khảo:</h4>
                <p className="text-gray-600 dark:text-gray-400">{labReport.followUp.specialistReferral}</p>
              </div>
            )}
            
            {labReport.followUp.additionalTests && labReport.followUp.additionalTests.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Xét nghiệm bổ sung:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {labReport.followUp.additionalTests.map((test, index) => (
                    <li key={index}>{test}</li>
                  ))}
                </ul>
              </div>
            )}
          
            {labReport.followUp.urgencyLevel && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Mức độ khẩn cấp:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    labReport.followUp.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    labReport.followUp.urgencyLevel === 'URGENT' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {labReport.followUp.urgencyLevel === 'CRITICAL' ? 'Khẩn cấp' :
                     labReport.followUp.urgencyLevel === 'URGENT' ? 'Cần sớm' : 'Thường quy'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );

  const renderPrescriptionReport = (prescriptionReport: StructuredPrescriptionReport) => (
    <div className="space-y-4">
      {/* Patient & Prescription Info */}
      <CollapsibleSection id="prescription-info" title="Thông tin Bệnh nhân & Toa thuốc">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Thông tin Bệnh nhân</h4>
            <div className="space-y-1 text-sm">
              {prescriptionReport.patientInfo?.name && <div><strong>Họ tên:</strong> {prescriptionReport.patientInfo.name}</div>}
              {prescriptionReport.patientInfo?.age && <div><strong>Tuổi:</strong> {prescriptionReport.patientInfo.age}</div>}
              {prescriptionReport.patientInfo?.gender && <div><strong>Giới tính:</strong> {prescriptionReport.patientInfo.gender}</div>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Thông tin Toa thuốc</h4>
            <div className="space-y-1 text-sm">
              {prescriptionReport.prescriptionInfo?.prescriptionDate && <div><strong>Ngày kê đơn:</strong> {prescriptionReport.prescriptionInfo.prescriptionDate}</div>}
              {prescriptionReport.prescriptionInfo?.prescribingPhysician && <div><strong>Bác sĩ:</strong> {prescriptionReport.prescriptionInfo.prescribingPhysician}</div>}
              {prescriptionReport.prescriptionInfo?.clinicName && <div><strong>Phòng khám:</strong> {prescriptionReport.prescriptionInfo.clinicName}</div>}
              {prescriptionReport.prescriptionInfo?.diagnosis && <div><strong>Chẩn đoán:</strong> {prescriptionReport.prescriptionInfo.diagnosis}</div>}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Treatment Analysis */}
      {prescriptionReport.treatmentAnalysis && (
        <CollapsibleSection id="treatment-analysis" title="Chẩn đoán và Mục đích Điều trị">
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Chẩn đoán chính</h4>
              <p className="text-blue-700 dark:text-blue-300">{prescriptionReport.treatmentAnalysis.primaryDiagnosis}</p>
            </div>
            
            {prescriptionReport.treatmentAnalysis.treatmentGoals && prescriptionReport.treatmentAnalysis.treatmentGoals.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Mục tiêu điều trị</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  {prescriptionReport.treatmentAnalysis.treatmentGoals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {prescriptionReport.treatmentAnalysis.treatmentApproach && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Phương pháp điều trị</h4>
                <p className="text-gray-600 dark:text-gray-400">{prescriptionReport.treatmentAnalysis.treatmentApproach}</p>
              </div>
            )}
            
            {prescriptionReport.treatmentAnalysis.expectedOutcome && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Kết quả mong đợi</h4>
                <p className="text-gray-600 dark:text-gray-400">{prescriptionReport.treatmentAnalysis.expectedOutcome}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Medications */}
      <CollapsibleSection id="medications" title="Danh sách Thuốc">
        <div className="space-y-4">
          {prescriptionReport.medications?.map((medication, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{medication.name}</h4>
                  {medication.genericName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">({medication.genericName})</p>
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
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{medication.instructions}</p>
                </div>
                
                {/* Tác dụng chính đối với bệnh */}
                {medication.primaryAction && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <strong className="text-green-800 dark:text-green-200">Tác dụng chính đối với bệnh:</strong>
                    <p className="text-green-700 dark:text-green-300 mt-1">{medication.primaryAction}</p>
                  </div>
                )}
                
                {/* Cơ chế hoạt động */}
                {medication.mechanismOfAction && (
                  <div>
                    <strong>Cơ chế hoạt động:</strong>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{medication.mechanismOfAction}</p>
                  </div>
                )}
                
                {/* Vai trò trong điều trị */}
                {medication.therapeuticRole && (
                  <div>
                    <strong>Vai trò trong phác đồ điều trị:</strong>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{medication.therapeuticRole}</p>
                  </div>
                )}
                
                {medication.sideEffects && medication.sideEffects.length > 0 && (
                  <div>
                    <strong>Tác dụng phụ:</strong>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-1">
                      {medication.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* General Instructions */}
      {prescriptionReport.generalInstructions && (
        <CollapsibleSection id="instructions" title="Hướng dẫn Chung">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {prescriptionReport.generalInstructions.dosageInstructions && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Hướng dẫn liều lượng:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {prescriptionReport.generalInstructions.dosageInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {prescriptionReport.generalInstructions.storageInstructions && (
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Bảo quản thuốc:</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  {prescriptionReport.generalInstructions.storageInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );

  const renderFallbackAnalysis = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Hiển thị định dạng cũ
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          Tài liệu này được phân tích bằng định dạng cũ. Kết quả hiển thị dưới dạng text thông thường.
        </p>
      </div>
      
      <div className="prose prose-blue dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: record.analysis.replace(/\n/g, '<br />') }} />
      </div>
    </div>
  );

  if (!structuredReport) {
    return renderFallbackAnalysis();
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {structuredReport.report.reportType === 'LAB_RESULT' ? 'Kết quả Xét nghiệm' : 'Phân tích Toa thuốc'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hồ sơ: <span className="font-medium">{record.recordName}</span>
            </p>
          </div>
          {record.classification && (
            <DocumentClassificationBadge record={record} showDetails />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Mã báo cáo:</span>
            <p className="text-gray-600 dark:text-gray-400">{structuredReport.metadata.reportId}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Ngày tạo:</span>
            <p className="text-gray-600 dark:text-gray-400">{formatDateTime(structuredReport.metadata.generatedAt)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Phiên bản:</span>
            <p className="text-gray-600 dark:text-gray-400">{structuredReport.metadata.version}</p>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {structuredReport.report.reportType === 'LAB_RESULT' ? 
          renderLabReport(structuredReport.report as StructuredLabReport) :
          renderPrescriptionReport(structuredReport.report as StructuredPrescriptionReport)
        }
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Lưu ý quan trọng</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>{structuredReport.report.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructuredAnalysisResult;
