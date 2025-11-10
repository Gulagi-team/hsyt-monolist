import React, { useState, useCallback, useRef } from 'react';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from './icons/Icons';
import type { MedicalRecord } from '../types';

interface FileUploadProps {
  onAnalysisStart: (file: File, recordName: string, question?: string, documentType?: 'auto_detect' | 'lab_result' | 'prescription') => void;
  isLoading: boolean;
}

const getDocumentConfig = () => {
  return {
    title: "Phân tích Tài liệu Y tế",
    description: "Chọn loại tài liệu y tế để AI phân tích chuyên sâu (xét nghiệm, toa thuốc, X-quang, CT, MRI, siêu âm, v.v.)",
    icon: <DocumentTextIcon className="h-12 w-12 text-gray-400" />
  };
};


const FileUpload: React.FC<FileUploadProps> = ({ onAnalysisStart, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [recordName, setRecordName] = useState('');
  const [question, setQuestion] = useState('');
  const [documentType, setDocumentType] = useState<'auto_detect' | 'lab_result' | 'prescription'>('auto_detect');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = getDocumentConfig();

  const documentTypes = [
    { value: 'auto_detect', label: 'Tự động nhận diện', icon: '🔍', description: 'AI tự động phát hiện loại tài liệu' },
    { value: 'LAB_RESULT', label: 'Kết quả Xét nghiệm', icon: '🧪', description: 'Xét nghiệm máu, nước tiểu, sinh hóa' },
    { value: 'PRESCRIPTION', label: 'Đơn Thuốc', icon: '💊', description: 'Đơn thuốc kê toa, hướng dẫn dùng thuốc' },
    { value: 'XRAY', label: 'X-Quang', icon: '🩻', description: 'Chụp X-quang các bộ phận cơ thể' },
    { value: 'CT_SCAN', label: 'CT Scanner', icon: '🌀', description: 'Chụp CT, cắt lớp vi tính' },
    { value: 'MRI', label: 'MRI', icon: '🧲', description: 'Chụp cộng hưởng từ' },
    { value: 'ULTRASOUND', label: 'Siêu Âm', icon: '🌊', description: 'Siêu âm bụng, thai nhi, tim mạch' },
    { value: 'ECG', label: 'Điện Tim', icon: '❤️', description: 'Điện tâm đồ, Holter' },
    { value: 'ENDOSCOPY', label: 'Nội Soi', icon: '🔍', description: 'Nội soi dạ dày, đại tràng' },
    { value: 'PATHOLOGY', label: 'Giải Phẫu Bệnh', icon: '🔬', description: 'Kết quả sinh thiết, giải phẫu bệnh' },
    { value: 'DISCHARGE_SUMMARY', label: 'Tóm Tắt Xuất Viện', icon: '🏥', description: 'Báo cáo xuất viện' },
    { value: 'MEDICAL_CERTIFICATE', label: 'Giấy Khám Bệnh', icon: '📄', description: 'Giấy khám sức khỏe, chứng nhận' },
    { value: 'VACCINATION_RECORD', label: 'Sổ Tiêm Chủng', icon: '💉', description: 'Lịch sử tiêm chủng' },
    { value: 'OTHER', label: 'Khác', icon: '📋', description: 'Tài liệu y tế khác' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Kích thước tệp không được vượt quá 10MB.');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(selectedFile.type)) {
        setError('Chỉ chấp nhận tệp hình ảnh (JPEG, PNG, WEBP) hoặc PDF.');
        return;
      }
      setError('');
      setFile(selectedFile);
      setRecordName(selectedFile.name.split('.').slice(0, -1).join('.')); // Default name from file
      if (selectedFile.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null);
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
        if (fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(droppedFile);
            fileInputRef.current.files = dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(event);
        }
    }
  }, []);

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    setRecordName('');
    setQuestion('');
    setDocumentType('auto_detect');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (file && recordName && !isLoading) {
      onAnalysisStart(file, recordName, question.trim() || undefined, documentType);
    } else if (!recordName) {
        setError('Vui lòng đặt tên cho hồ sơ này.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-center mb-1">{config.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{config.description}</p>
        
        <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:border-blue-500 dark:hover:border-blue-400"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            />
            <div className="flex flex-col items-center justify-center space-y-4">
                {config.icon}
                <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Nhấp để tải lên</span> hoặc kéo và thả
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG, WEBP hoặc PDF (tối đa 10MB)
                </p>
            </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}

        {file && (
            <div className="mt-6 space-y-4">
                <div>
                    <label htmlFor="recordName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hồ sơ</label>
                    <input 
                        type="text" 
                        id="recordName"
                        value={recordName}
                        onChange={(e) => setRecordName(e.target.value)}
                        placeholder="VD: Kết quả xét nghiệm tháng 12/2024"
                        className="block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Loại tài liệu y tế
                    </label>
                    <select
                        id="documentType"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="block w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {documentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {documentTypes.find(t => t.value === documentType)?.description}
                    </p>
                </div>

                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Câu hỏi về tài liệu y tế <span className="text-gray-500">(tùy chọn)</span>
                    </label>
                    <textarea 
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="VD: Chỉ số này có bình thường không? Tôi cần lưu ý gì? Có thể dùng cùng thuốc khác không?"
                        rows={3}
                        className="block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Đặt câu hỏi cụ thể để AI có thể phân tích và tư vấn chi tiết hơn về kết quả của bạn.
                    </p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        {preview ? (
                            <img src={preview} alt="Preview" className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                        ) : (
                            <DocumentTextIcon className="h-12 w-12 text-gray-500 flex-shrink-0" />
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 ml-2">
                        <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>
        )}

        <div className="mt-6">
            <button
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800 transition-all transform hover:scale-105 disabled:scale-100"
            >
            {isLoading ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
            </button>
        </div>
    </div>
  );
};

export default FileUpload;