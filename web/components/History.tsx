import React, { useState, useMemo } from 'react';
import type { MedicalRecord } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { ClipboardDocumentListIcon, DocumentMagnifyingGlassIcon, XMarkIcon, DocumentTextIcon, PillIcon, ShareIcon } from './icons/Icons';
import DocumentClassificationBadge from './DocumentClassificationBadge';
import ImageModal from './ImageModal';
import ShareModal from './ShareModal';

interface HistoryProps {
  records: MedicalRecord[];
  onSelectRecord: (id: string | number) => void;
  onDeleteRecord: (recordId: string | number) => Promise<void>;
  onRefreshRecords: () => void;
  isLoading: boolean;
}

const History: React.FC<HistoryProps> = ({ records, onSelectRecord, onDeleteRecord, onRefreshRecords, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletingRecordId, setDeletingRecordId] = useState<string | number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string, title: string} | null>(null);
  const [shareModal, setShareModal] = useState<{isOpen: boolean, recordId: string | number | null, recordName: string}>({
    isOpen: false,
    recordId: null,
    recordName: ''
  });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search term filter
      const matchesSearch = record.recordName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || record.type === filterType;

      // Date range filter
      const recordDate = new Date(record.createdAt);
      const matchesStartDate = !startDate || recordDate >= new Date(startDate);

      // End date should include the whole day, so we set it to the end of the day
      let matchesEndDate = true;
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        matchesEndDate = recordDate <= endDateTime;
      }

      return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [records, searchTerm, filterType, startDate, endDate]);

  const handleShare = (recordId: string | number, recordName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering onSelectRecord
    setShareModal({
      isOpen: true,
      recordId,
      recordName
    });
  };

  const handleDelete = async (recordId: string | number, event: React.MouseEvent) => {
    event.stopPropagation();

    if (deletingRecordId) {
      return;
    }

    const shouldDelete = typeof window !== 'undefined'
      ? window.confirm('Bạn có chắc chắn muốn xóa hồ sơ y tế này? Hành động này không thể hoàn tác.')
      : true;

    if (!shouldDelete) {
      return;
    }

    setDeletingRecordId(recordId);
    try {
      await onDeleteRecord(recordId);

      if (shareModal.isOpen && shareModal.recordId === recordId) {
        setShareModal({ isOpen: false, recordId: null, recordName: '' });
      }
    } catch (error) {
      console.error('Failed to delete medical record:', error);
      if (typeof window !== 'undefined') {
        window.alert('Xóa hồ sơ thất bại. Vui lòng thử lại.');
      }
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleShareCreated = (shareData: any) => {
    // Could show a success message or update UI
    console.log('Share created:', shareData);
  };

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chưa có hồ sơ y tế</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Bắt đầu quản lý sức khỏe của bạn bằng cách tải lên các tài liệu y tế như kết quả xét nghiệm, toa thuốc, hoặc hình ảnh X-quang.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Xét nghiệm</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Toa thuốc</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>X-quang</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Báo cáo</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchTerm || filterType !== 'all' || startDate || endDate;
  const showEmptyState = filteredRecords.length === 0 && hasActiveFilters;
  
  return (
    <div className="space-y-6">
        {/* Header with Statistics */}
        <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ Y tế của bạn</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Quản lý và theo dõi sức khỏe cá nhân</p>
              </div>
            </div>
            <button
              onClick={onRefreshRecords}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hồ sơ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-all duration-200"
              >
                <option value="all">Tất cả loại hồ sơ</option>
                <option value="lab_result">Xét nghiệm</option>
                <option value="prescription">Toa thuốc</option>
                <option value="diagnostic_imaging">Chẩn đoán hình ảnh</option>
                <option value="medical_document">Tài liệu khác</option>
              </select>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="Từ ngày"
                />
              </div>
              <span className="text-gray-500 dark:text-gray-400"> đến </span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm"
                  placeholder="Đến ngày"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Xóa bộ lọc ngày"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Statistics */}
          {/* <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200 dark:border-blue-700/50 hover:shadow-md transition-shadow duration-200">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{records.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Tổng hồ sơ</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-200 dark:border-green-700/50 hover:shadow-md transition-shadow duration-200">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {records.filter(r => r.type === 'lab_result').length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Xét nghiệm</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border border-purple-200 dark:border-purple-700/50 hover:shadow-md transition-shadow duration-200">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {records.filter(r => r.type === 'prescription').length}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Toa thuốc</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border border-yellow-200 dark:border-yellow-700/50 hover:shadow-md transition-shadow duration-200">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {records.filter(r => r.r2Url).length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Đã lưu trữ</div>
            </div>
          </div> */}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"></div>
                <div className="p-5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : showEmptyState ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy hồ sơ</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Không tìm thấy hồ sơ nào khớp với bộ lọc của bạn. Thử thay đổi từ khóa hoặc bộ lọc khác.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-row lg:flex-col hover:shadow-xl transition-shadow duration-300">
                {/* Preview Section */}
                {(record.fileUrl || record.r2Url) ? (
                    <div className="relative w-28 sm:w-36 lg:w-full h-28 sm:h-36 lg:h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 overflow-hidden group border border-gray-200 dark:border-gray-600 flex-shrink-0">
                        <img
                            src={record.r2Url || record.fileUrl}
                            alt={`Preview of ${record.recordName}`}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 cursor-pointer"
                            onClick={() => setSelectedImage({
                                url: record.r2Url || record.fileUrl,
                                title: record.recordName
                            })}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    parent.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                            <div class="text-center p-6">
                                                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tài liệu Y tế</p>
                                                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Click để xem chi tiết</p>
                                            </div>
                                        </div>
                                    `;
                                }
                            }}
                            loading="lazy"
                        />
                        {/* Medical Clinic Style Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Hospital/Clinic Style Badge */}
                        <div className="absolute top-3 left-3">
                            {record.classification ? (
                                <DocumentClassificationBadge record={record} />
                            ) : (
                                <span className={`px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg backdrop-blur-sm ${
                                    record.type === 'lab_result' 
                                    ? 'bg-blue-600/90 text-white border border-blue-500/50'
                                    : 'bg-emerald-600/90 text-white border border-emerald-500/50'
                                }`}>
                                    <span className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={record.type === 'lab_result' ? 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' : 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'} />
                                        </svg>
                                        <span>{record.type === 'lab_result' ? 'XN' : 'ĐƠN THUỐC'}</span>
                                    </span>
                                </span>
                            )}
                        </div>
                        
                        {/* Hospital Style Zoom Icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 shadow-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-600">
                                <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        </div>
                        
                        {/* Medical Document Corner Fold */}
                        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white/20 dark:border-t-gray-700/20"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-bl from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-bl-md shadow-sm"></div>
                    </div>
                ) : (
                    <div className="relative w-28 sm:w-36 lg:w-full h-28 sm:h-36 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
                        <div className="text-center">
                            {record.type === 'lab_result' ? (
                                <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-400 mb-3" />
                            ) : (
                                <PillIcon className="h-16 w-16 mx-auto text-green-400 mb-3" />
                            )}
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tài liệu Y tế</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Không có hình ảnh</p>
                        </div>
                        
                        {/* Type Badge */}
                        <div className="absolute top-3 left-3">
                            {record.classification ? (
                                <DocumentClassificationBadge record={record} />
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    record.type === 'lab_result' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                    {record.type === 'lab_result' ? 'Xét nghiệm' : 'Toa thuốc'}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="flex flex-col flex-grow">
                    <div className="p-4 sm:p-5 flex-grow">
                        <div className="mb-3">
                            <h4 
                                className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight" 
                                title={record.recordName}
                                style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {record.recordName}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    {formatDateTime(record.createdAt)}
                                </p>
                                {record.r2Url && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Đã lưu
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* AI Summary Preview */}
                        {record.aiSummary && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p 
                                    className="text-sm text-blue-800 dark:text-blue-200"
                                    style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}
                                >
                                    💡 {record.aiSummary}
                                </p>
                            </div>
                        )}

                        {/* Key Findings */}
                        {record.keyFindings && record.keyFindings.length > 0 && (
                            <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phát hiện chính:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {record.keyFindings.slice(0, 3).map((finding, index) => (
                                        <span key={index} className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-[11px] sm:text-xs rounded-md">
                                            {finding}
                                        </span>
                                    ))}
                                    {record.keyFindings.length > 3 && (
                                        <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[11px] sm:text-xs rounded-md">
                                            +{record.keyFindings.length - 3} khác
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => onSelectRecord(record.id)}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Xem chi tiết
                            </button>
                            {record.r2Url && (
                                <a
                                    href={record.r2Url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
                                    title="Xem file gốc"
                                >
                                    📄 File gốc
                                </a>
                            )}
                            <button
                                onClick={(e) => handleShare(record.id, record.recordName, e)}
                                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center space-x-1"
                                title="Chia sẻ hồ sơ"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span>Chia sẻ</span>
                            </button>
                        </div>
                        <button
                          onClick={(e) => handleDelete(record.id, e)}
                          disabled={deletingRecordId === record.id}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                          title="Xóa hồ sơ"
                        >
                          {deletingRecordId === record.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <XMarkIcon className="w-4 h-4" />
                          )}
                        </button>
                    </div>
                </div>
            </div>
            ))}
          </div>
        )}
        
        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            imageUrl={selectedImage.url}
            title={selectedImage.title}
          />
        )}

        {/* Share Modal */}
        {shareModal.isOpen && shareModal.recordId && (
          <ShareModal
            isOpen={shareModal.isOpen}
            onClose={() => setShareModal({ isOpen: false, recordId: null, recordName: '' })}
            recordId={shareModal.recordId}
            recordName={shareModal.recordName}
            onShareCreated={handleShareCreated}
          />
        )}
    </div>
  );
};

export default History;