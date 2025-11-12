import React, { useState } from 'react';
import type { MedicalRecord, UserProfile } from '../types';
import AnalysisPage from './AnalysisPage';
import History from './History';
import AnalysisResult from './AnalysisResult';
import ChatPage from './ChatPage';
import ProfilePage from './ProfilePage';
import Logo, { LogoIcon } from './Logo';
import { PlusCircleIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, UserCircleIcon, ArrowRightOnRectangleIcon, ArrowLeftIcon, GlobeAltIcon } from './icons/Icons';

interface DashboardProps {
  user: { name: string };
  onLogout: () => void;
  records: MedicalRecord[];
  profile: UserProfile;
  addRecord: (newRecord: MedicalRecord) => void;
  setProfile: (profile: UserProfile) => void;
  deleteRecord: (recordId: string | number) => Promise<void>;
  refreshRecords: () => void;
  isLoadingRecords: boolean;
}

type View = 'analysis' | 'history' | 'chat' | 'profile' | 'result';

const viewTitles: Record<View, string> = {
    analysis: 'Tải tài liệu Mới',
    history: 'Hồ sơ Y tế',
    chat: 'Bác sĩ AI',
    profile: 'Thông tin Cá nhân',
    result: 'Chi tiết Phân tích',
};


const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  onLogout, 
  records, 
  profile, 
  addRecord, 
  setProfile, 
  deleteRecord, 
  refreshRecords, 
  isLoadingRecords 
}) => {
  const [currentView, setCurrentView] = useState<View>('analysis');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const handleSelectRecord = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setCurrentView('result');
    }
  };

  const handleShowResult = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setCurrentView('result');
  };

  const handleBack = () => {
    setSelectedRecord(null);
    setCurrentView('history');
  };

  const renderView = () => {
    switch (currentView) {
      case 'analysis':
        return <AnalysisPage addRecord={addRecord} showResult={handleShowResult} />;
      case 'history':
        return (
          <History 
            records={records} 
            onSelectRecord={handleSelectRecord}
            onDeleteRecord={deleteRecord}
            onRefreshRecords={refreshRecords}
            isLoading={isLoadingRecords}
          />
        );
      case 'result':
        return selectedRecord ? <AnalysisResult record={selectedRecord} onBack={handleBack} userProfile={profile} /> : <p>Không tìm thấy hồ sơ</p>;
      case 'chat':
        return <ChatPage records={records} profile={profile} />;
      case 'profile':
        return <ProfilePage profile={profile} setProfile={setProfile} />;
      default:
        return <AnalysisPage addRecord={addRecord} showResult={handleShowResult} />;
    }
  };

  const NavItem: React.FC<{ view: View; label: string; icon: React.ReactElement }> = ({ view, label, icon }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
        currentView === view
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  const BottomNavItem: React.FC<{ view: View; label: string; icon: React.ReactElement }> = ({ view, label, icon }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center space-y-1 w-full pt-2 pb-1 transition-colors ${
        currentView === view
          ? 'text-blue-600'
          : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'
      }`}
    >
      {React.cloneElement(icon, { className: "h-6 w-6" })}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-64 bg-white dark:bg-gray-800 p-4 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex-col hidden md:flex">
        <div className="mb-8 px-2">
            <Logo size="md" variant="full" />
        </div>
        
        <nav className="space-y-2 flex-grow">
          <NavItem view="analysis" label="Upload Hồ Sơ" icon={<PlusCircleIcon className="h-6 w-6" />} />
          <NavItem view="history" label="Lịch sử Hồ sơ" icon={<ClipboardDocumentListIcon className="h-6 w-6" />} />
          {/* <a
            href="http://tintuc.hsyt.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <GlobeAltIcon className="h-6 w-6" />
            <span className="font-medium">Tin tức HSYT</span>
          </a> */}
          <NavItem view="chat" label="Trò chuyện AI" icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} />
          <NavItem view="profile" label="Thông tin Cá nhân" icon={<UserCircleIcon className="h-6 w-6" />} />
        </nav>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-3 mb-4 p-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Patient</p>
                </div>
            </div>
            <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                <ArrowRightOnRectangleIcon className="h-5 w-5 transform rotate-180" />
                <span>Đăng xuất</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between">
                <LogoIcon size="sm" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewTitles[currentView]}
                </h1>
                <div className="w-6"></div> {/* Spacer for centering */}
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-2 md:p-10 overflow-y-auto pb-24 md:pb-10">
          {renderView()}
        </div>
      </main>

      {/* Bottom Tab Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around p-1 z-50 shadow-t-lg">
        <BottomNavItem view="analysis" label="Phân tích" icon={<PlusCircleIcon />} />
        <BottomNavItem view="history" label="Hồ sơ" icon={<ClipboardDocumentListIcon />} />
        {/* <a
          href="http://tintuc.hsyt.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center space-y-1 w-full pt-2 pb-1 transition-colors text-gray-500 dark:text-gray-400 hover:text-blue-500"
        >
          <GlobeAltIcon className="h-6 w-6" />
          <span className="text-xs font-medium">Tin tức</span>
        </a> */}
        <BottomNavItem view="chat" label="Trò chuyện" icon={<ChatBubbleLeftRightIcon />} />
        <BottomNavItem view="profile" label="Cá nhân" icon={<UserCircleIcon />} />
      </nav>
    </div>
  );
};

export default Dashboard;