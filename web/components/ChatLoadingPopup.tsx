import React, { useState, useEffect } from 'react';

interface ChatLoadingPopupProps {
  isVisible: boolean;
  question?: string;
}

const ChatLoadingPopup: React.FC<ChatLoadingPopupProps> = ({
  isVisible,
  question = ""
}) => {
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    "🔍 Đang phân tích câu hỏi của bạn...",
    "📋 Tìm kiếm thông tin trong hồ sơ y tế...",
    "🧠 AI đang suy nghĩ và phân tích...",
    "💡 Chuẩn bị câu trả lời chuyên nghiệp...",
    "✨ Hoàn thiện phản hồi..."
  ];

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

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) {
      setCurrentMessage(0);
      return;
    }
    
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-16 h-16 mb-4">
            {/* Pulsing brain icon */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-30"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Bác sĩ AI đang suy nghĩ
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {messages[currentMessage]}{dots}
          </p>
        </div>

        {/* Question Display */}
        {question && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Câu hỏi của bạn:</span>
            </p>
            <p className="text-gray-800 dark:text-gray-200 mt-1 italic">
              "{question}"
            </p>
          </div>
        )}

        {/* AI Processing Animation */}
        <div className="flex justify-center items-center space-x-2 mb-4">
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.2s'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentMessage 
                  ? 'bg-blue-500 scale-110' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            ></div>
          ))}
        </div>

        {/* Footer message */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💭 Đang tham khảo hồ sơ y tế và kiến thức chuyên môn
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingPopup;
