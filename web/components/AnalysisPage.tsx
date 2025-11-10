import React, { useState } from 'react';
import FileUpload from './FileUpload';
import LoadingPopup from './LoadingPopup';
import { analysisService } from '../services/analysisService';
import { useAnalysisLoading } from '../hooks/useAnalysisLoading';
import type { MedicalRecord } from '../types';

interface AnalysisPageProps {
  addRecord: (record: MedicalRecord) => void;
  showResult: (record: MedicalRecord) => void;
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ addRecord, showResult }) => {
  const [error, setError] = useState<string | null>(null);
  
  // Use analysis loading hook
  const {
    isLoading,
    currentStep,
    progress,
    message,
    steps,
    startLoading,
    updateStep,
    simulateProgress,
    completeLoading,
    stopLoading
  } = useAnalysisLoading();

  const handleAnalysis = async (file: File, recordName: string, question?: string, documentType?: 'auto_detect' | 'lab_result' | 'prescription') => {
    startLoading();
    setError(null);

    try {
      // Start progress simulation
      const progressPromise = simulateProgress();
      
      // Use documentType if provided, otherwise use auto_detect
      const analysisType = documentType || 'auto_detect';
      
      // Update steps manually for better UX
      updateStep(0, 'Tải lên tài liệu...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      updateStep(1, 'Phân loại tài liệu bằng AI...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      updateStep(2, 'Trích xuất thông tin y tế...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStep(3, 'Phân tích chuyên sâu với AI...');
      
      const response = await analysisService.analyzeFileComplete(
        file,
        recordName,
        question,
        analysisType
      );

      updateStep(4, 'Tạo báo cáo có cấu trúc...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      updateStep(5, 'Lưu kết quả vào hệ thống...');
      await new Promise(resolve => setTimeout(resolve, 600));

      const newRecord: MedicalRecord = {
        ...response.record,
        fileUrl: URL.createObjectURL(file), // Keep local file URL for display
      };
      
      // Complete loading
      completeLoading();
      
      // Wait for completion animation
      setTimeout(() => {
        addRecord(newRecord);
        showResult(newRecord);
      }, 1000);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      setError(errorMessage);
      console.error(e);
      stopLoading();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className="mb-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                    Phân tích Tài liệu Y tế
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Tải lên tài liệu y tế để nhận kết quả phân tích chuyên nghiệp từ AI
                </p>
            </div>
        </div>

        {/* AI Auto Detection Info */}
        {/* <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🤖</span>
                    </div>
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Phân tích Tự động bằng AI
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Hệ thống AI sẽ tự động nhận diện và phân tích tài liệu y tế của bạn
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">
                            Hỗ trợ 15+ loại tài liệu: xét nghiệm, toa thuốc, X-quang, CT, MRI, siêu âm, v.v.
                        </span>
                    </div>
                </div>
            </div>
        </div> */}

        <FileUpload 
            onAnalysisStart={handleAnalysis} 
            isLoading={isLoading}
        />

        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
        
        {/* Loading Popup */}
        <LoadingPopup
          isVisible={isLoading}
          title="Đang phân tích tài liệu y tế"
          message={message}
          progress={progress}
          steps={steps}
          currentStep={currentStep}
        />
    </div>
  );
};

export default AnalysisPage;
