import { useState, useCallback } from 'react';

export interface AnalysisStep {
  id: string;
  label: string;
  duration: number; // milliseconds
}

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'upload', label: 'Tải lên tài liệu', duration: 1000 },
  { id: 'classify', label: 'Phân loại tài liệu', duration: 2000 },
  { id: 'extract', label: 'Trích xuất thông tin', duration: 3000 },
  { id: 'analyze', label: 'Phân tích AI', duration: 4000 },
  { id: 'structure', label: 'Tạo báo cáo có cấu trúc', duration: 2000 },
  { id: 'save', label: 'Lưu kết quả', duration: 1000 }
];

export const useAnalysisLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setCurrentStep(0);
    setProgress(0);
    setMessage('Bắt đầu phân tích...');
  }, []);

  const updateStep = useCallback((stepIndex: number, customMessage?: string) => {
    setCurrentStep(stepIndex);
    const step = ANALYSIS_STEPS[stepIndex];
    setMessage(customMessage || step?.label || 'Đang xử lý...');
    
    // Calculate progress based on step
    const progressPerStep = 100 / ANALYSIS_STEPS.length;
    setProgress(Math.min((stepIndex + 1) * progressPerStep, 100));
  }, []);

  const simulateProgress = useCallback(async () => {
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      const step = ANALYSIS_STEPS[i];
      updateStep(i, step.label);
      
      // Simulate step duration with gradual progress
      const stepDuration = step.duration;
      const progressIncrement = (100 / ANALYSIS_STEPS.length) / (stepDuration / 100);
      
      for (let j = 0; j < stepDuration / 100; j++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentProgress = (i * (100 / ANALYSIS_STEPS.length)) + (j * progressIncrement);
        setProgress(Math.min(currentProgress, 100));
      }
    }
  }, [updateStep]);

  const completeLoading = useCallback(() => {
    setProgress(100);
    setMessage('Hoàn thành!');
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(0);
      setProgress(0);
      setMessage('');
    }, 1000);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setCurrentStep(0);
    setProgress(0);
    setMessage('');
  }, []);

  return {
    isLoading,
    currentStep,
    progress,
    message,
    steps: ANALYSIS_STEPS.map(step => step.label),
    startLoading,
    updateStep,
    simulateProgress,
    completeLoading,
    stopLoading
  };
};
