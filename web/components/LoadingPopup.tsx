import React, { useState, useEffect } from 'react';

interface LoadingPopupProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  progress?: number;
  steps?: string[];
  currentStep?: number;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({
  isVisible,
  title = "Đang phân tích...",
  message = "Vui lòng đợi trong giây lát",
  progress = 0,
  steps = [],
  currentStep = 0
}) => {
  const [dots, setDots] = useState('');
  const [animationProgress, setAnimationProgress] = useState(0);

  // Animated dots effect
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Progress animation
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setAnimationProgress(prev => {
        if (prev >= progress) return progress;
        return Math.min(prev + 2, progress);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, progress]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-16 h-16 mb-4">
            {/* Spinning medical icon */}
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-2 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400">
            {message}{dots}
          </p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Tiến độ</span>
              <span>{Math.round(animationProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${animationProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}>
                  {index < currentStep ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-sm ${
                  index <= currentStep 
                    ? 'text-gray-900 dark:text-white font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* AI Processing Animation */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Footer message */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
           Đang phân tích dữ liệu y tế của bạn
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPopup;
