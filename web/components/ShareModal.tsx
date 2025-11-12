import React, { useState } from 'react';
import { ShareIcon, LockClosedIcon, GlobeAltIcon, XMarkIcon, CheckIcon } from './icons/Icons';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | number;
  recordName: string;
  onShareCreated: (shareData: any) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  recordId,
  recordName,
  onShareCreated
}) => {
  const [shareMode, setShareMode] = useState<'public' | 'password'>('public');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('7'); // days
  const [isCreating, setIsCreating] = useState(false);
  const [createdShare, setCreatedShare] = useState<any>(null);

  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString() : null;

      const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          password: shareMode === 'password' ? password : null,
          expiresAt
        })
      });

      const payload = await response.json();

      if (!response.ok || payload.error) {
        const errorMessage = payload?.error?.description ?? payload?.data?.error ?? 'Failed to create share';
        throw new Error(errorMessage);
      }

      const shareData = payload?.data ?? payload;

      if (!shareData?.shareUrl) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ');
      }

      setCreatedShare(shareData);
      onShareCreated(shareData);
    } catch (error) {
      console.error('Error creating share:', error);
      const message = error instanceof Error ? error.message : 'Không thể tạo liên kết chia sẻ. Vui lòng thử lại.';
      alert(message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép liên kết vào clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chia sẻ hồ sơ y tế
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {recordName}
          </p>
        </div>

        <div className="p-6">
          {createdShare ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckIcon className="w-5 h-5" />
                <span className="font-medium">Đã tạo liên kết chia sẻ!</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Liên kết chia sẻ
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={createdShare.shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                    <button
                      onClick={() => copyToClipboard(createdShare.shareUrl)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Chế độ:</span>
                    <div className="flex items-center space-x-1 mt-1">
                      {createdShare.hasPassword ? (
                        <>
                          <LockClosedIcon className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-700 dark:text-yellow-300">Có mật khẩu</span>
                        </>
                      ) : (
                        <>
                          <GlobeAltIcon className="w-4 h-4 text-green-500" />
                          <span className="text-green-700 dark:text-green-300">Công khai</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Hết hạn:</span>
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      {createdShare.expiresAt ? new Date(createdShare.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setCreatedShare(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Tạo liên kết khác
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Xong
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chế độ chia sẻ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShareMode('public')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      shareMode === 'public'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <GlobeAltIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium">Công khai</div>
                    <div className="text-xs text-gray-500 mt-1">Ai cũng có thể xem</div>
                  </button>
                  <button
                    onClick={() => setShareMode('password')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      shareMode === 'password'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <LockClosedIcon className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-medium">Có mật khẩu</div>
                    <div className="text-xs text-gray-500 mt-1">Cần mật khẩu để xem</div>
                  </button>
                </div>
              </div>

              {shareMode === 'password' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu để bảo vệ"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label htmlFor="expires" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời hạn chia sẻ
                </label>
                <select
                  id="expires"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Không giới hạn</option>
                  <option value="1">1 ngày</option>
                  <option value="7">7 ngày</option>
                  <option value="30">30 ngày</option>
                  <option value="90">90 ngày</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateShare}
                  disabled={isCreating || (shareMode === 'password' && !password)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4" />
                      <span>Tạo liên kết</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
