import React from 'react';
import type { MedicalRecord } from '../types';

interface SuggestedQuestionsProps {
  records: MedicalRecord[];
  onQuestionSelect: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ records, onQuestionSelect }) => {
  // Generate suggested questions based on available records
  const generateSuggestions = () => {
    const suggestions: string[] = [];
    
    // Count record types
    const labResults = records.filter(r => r.type === 'lab_result').length;
    const prescriptions = records.filter(r => r.type === 'prescription').length;
    
    // General questions
    suggestions.push('Tình trạng sức khỏe tổng thể của tôi như thế nào?');
    suggestions.push('Có điều gì bất thường trong hồ sơ y tế của tôi không?');
    
    // Lab result specific questions
    if (labResults > 0) {
      suggestions.push('Kết quả xét nghiệm gần nhất của tôi có bình thường không?');
      suggestions.push('Các chỉ số nào trong xét nghiệm cần tôi chú ý?');
      if (labResults > 1) {
        suggestions.push('Kết quả xét nghiệm của tôi có cải thiện theo thời gian không?');
      }
    }
    
    // Prescription specific questions
    if (prescriptions > 0) {
      suggestions.push('Thuốc tôi đang dùng có tác dụng phụ gì không?');
      suggestions.push('Tôi có thể uống thuốc cùng với thực phẩm nào?');
      suggestions.push('Khi nào tôi nên ngừng uống thuốc này?');
    }
    
    // Lifestyle questions
    suggestions.push('Tôi nên thay đổi chế độ ăn uống như thế nào?');
    suggestions.push('Có bài tập nào phù hợp với tình trạng của tôi không?');
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        💡 Câu hỏi gợi ý:
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(question)}
            className="text-left p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors group"
          >
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 dark:text-blue-400 text-sm mt-0.5">❓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {question}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
