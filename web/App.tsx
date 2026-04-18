import React, { useState, useCallback, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SessionLoader from './components/SessionLoader';
import PublicShareRouter from './components/PublicShareRouter';
import { authService } from './services/authService';
import { analysisService } from './services/analysisService';
import { useDarkMode } from './hooks/useDarkMode';
import type { MedicalRecord, UserProfile } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; id: number } | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const { isDarkMode } = useDarkMode();

  const isBrowser = typeof window !== 'undefined';
  const shareMatch = isBrowser ? window.location.pathname.match(/^\/share\/([a-fA-F0-9]{40,128}|[a-zA-Z0-9_-]+)$/) : null;

  // Load medical records from backend
  const loadMedicalRecords = useCallback(async (userId: number) => {
    console.log('Loading medical records for user ID:', userId);
    
    if (!userId || userId === undefined) {
      console.error('Invalid user ID provided to loadMedicalRecords:', userId);
      return;
    }
    
    setIsLoadingRecords(true);
    try {
      const fetchedRecords = await analysisService.getMedicalRecords(userId);
      console.log('Successfully loaded', fetchedRecords.length, 'medical records');
      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Failed to load medical records:', error);
      // You might want to show a toast notification here
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  const handleLogin = useCallback((userData: UserProfile & { email: string; id: number }) => {
    setUser({ name: userData.name, email: userData.email, id: userData.id });
    setIsLoggedIn(true);
    setProfile({
        name: userData.name,
        age: userData.age,
        bloodType: userData.bloodType,
        allergies: userData.allergies,
        currentConditions: userData.currentConditions,
    });
    
    // Load medical records after login
    loadMedicalRecords(userData.id);
  }, []);

  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);
    setRecords([]);
    setProfile(null);
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = authService.getToken();
        const userData = authService.getUserData();
        
        console.log('Session restoration - Token:', !!token);
        console.log('Session restoration - UserData:', userData);
        
        if (token && userData && userData.id) {
          console.log('Restoring session for user ID:', userData.id);
          
          // Restore user session
          setUser({ 
            name: userData.name, 
            email: userData.email, 
            id: userData.id 
          });
          setProfile({
            name: userData.name,
            age: userData.age,
            bloodType: userData.bloodType,
            allergies: userData.allergies,
            currentConditions: userData.currentConditions,
          });
          setIsLoggedIn(true);
          
          // Load medical records for restored session
          await loadMedicalRecords(userData.id);
        } else {
          console.log('No valid session found or missing user ID');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear invalid session data
        authService.logout();
      } finally {
        setIsRestoringSession(false);
      }
    };

    restoreSession();
  }, [loadMedicalRecords]);

  const addRecord = useCallback((newRecord: MedicalRecord) => {
    setRecords(prev => [newRecord, ...prev]);
  }, []);

  const deleteRecord = useCallback(async (recordId: string | number) => {
    try {
      await analysisService.deleteMedicalRecord(Number(recordId));
      setRecords(prev => prev.filter(record => record.id !== recordId));
    } catch (error) {
      console.error('Failed to delete record:', error);
      throw error; // Re-throw to let UI handle the error
    }
  }, []);

  const refreshRecords = useCallback(() => {
    if (user?.id) {
      loadMedicalRecords(user.id);
    }
  }, [user?.id, loadMedicalRecords]);

  if (shareMatch) {
    return <PublicShareRouter />;
  }

  // Show session loader while restoring session
  if (isRestoringSession) {
    return <SessionLoader />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 font-sans ${isDarkMode ? 'dark' : ''}`}>
      {/* Check if this is a public share URL - render first */}
      <PublicShareRouter />
      
      {isLoggedIn && user && profile ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          records={records}
          profile={profile}
          addRecord={addRecord}
          setProfile={setProfile}
          deleteRecord={deleteRecord}
          refreshRecords={refreshRecords}
          isLoadingRecords={isLoadingRecords}
        />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;