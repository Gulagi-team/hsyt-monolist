import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, LockClosedIcon,  DocumentTextIcon, PillIcon } from './icons/Icons';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
import StructuredAnalysisResult from './StructuredAnalysisResult';

interface PublicRecordViewerProps {
  shareToken: string;
  onBack?: () => void;
}

const PublicRecordViewer: React.FC<PublicRecordViewerProps> = ({ shareToken, onBack }) => {
  const [record, setRecord] = useState<any>(null);
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSharedRecord();
  }, [shareToken]);

  const loadSharedRecord = async (providedPassword?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/public/share/${shareToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: providedPassword || null
        })
      });

      const payload = await response.json();
      const responseData = payload?.data ?? payload;

      if (!response.ok) {
        if (responseData?.requiresPassword) {
          setRequiresPassword(true);
          setError(null);
        } else {
          setError(responseData?.error || 'Không thể tải hồ sơ được chia sẻ');
        }
        return;
      }

      setRecord(responseData?.record ?? null);
      setShareInfo(responseData?.shareInfo ?? null);
      setRequiresPassword(false);
      setError(null);
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await loadSharedRecord(password);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <LockClosedIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hồ sơ được bảo vệ
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Nhập mật khẩu để xem hồ sơ y tế này
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-4 h-4" />
                    <span>Xem hồ sơ</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Không thể truy cập
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Quay lại</span>
                </button>
              )}
              <div className="flex items-center space-x-2">
                {record ? (
                  <>
                    {record.type === 'lab_result' ? (
                      <DocumentTextIcon className="w-6 h-6 text-blue-500" />
                    ) : (
                      <PillIcon className="w-6 h-6 text-green-500" />
                    )}
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {record.recordName}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Được chia sẻ công khai</span>
                        {shareInfo && (
                          <span className="flex items-center space-x-1">
                            <span>{shareInfo.viewCount} lượt xem</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Hồ sơ y tế
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Đang tải dữ liệu hồ sơ chia sẻ...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {record ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              {(record.r2Url || record.fileUrl) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Hình ảnh tài liệu</h3>
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    {(() => {
                      const previewUrl = record.r2Url || record.fileUrl;
                      const isImage = typeof previewUrl === 'string' && /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewUrl.split('?')[0]);

                      if (previewUrl && isImage) {
                        return (
                          <img
                            src={previewUrl}
                            alt={record.recordName || 'Tài liệu y tế'}
                            className="w-full h-auto max-h-[600px] object-contain bg-white"
                          />
                        );
                      }

                      if (previewUrl) {
                        return (
                          <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-300">
                            <p>Tài liệu không ở định dạng ảnh. Bạn có thể tải và xem trực tiếp:</p>
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 mt-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors"
                            >
                              Mở tài liệu
                            </a>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
              )}
              <StructuredAnalysisResult
                record={record}
                userProfile={null}
              />
            </div>

            <div className="xl:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sticky top-24">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">Thông tin chia sẻ</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lượt xem:</span>
                    <span className="font-medium">{shareInfo?.viewCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ngày chia sẻ:</span>
                    <span className="font-medium">
                      {shareInfo?.createdAt ? new Date(shareInfo.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                  {shareInfo?.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Hết hạn:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {new Date(shareInfo.expiresAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Hồ sơ này được chia sẻ công khai. Thông tin sức khỏe nhạy cảm - hãy cân nhắc khi chia sẻ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu hồ sơ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRecordViewer;
