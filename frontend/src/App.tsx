import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { DetectionPage } from './pages/DetectionPage';
import { GuidancePage } from './pages/GuidancePage';
import { FeedbackPage } from './pages/FeedbackPage';
import { HistoryPage } from './pages/HistoryPage';
import { RewardsPage } from './pages/RewardsPage';
import { LocatorPage } from './pages/LocatorPage';
import { ImpactDashboardPage } from './pages/ImpactDashboardPage';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { checkHealth, getFeedbackCount } from './services/api';
import type { PredictResponse, HistoryItem } from './types';
import type { UserRewards } from './types/rewards';
import type { AppLanguage } from './constants/translations';
import { getLocalHistory } from './utils/historyStorage';
import { getUserRewards, awardPoints } from './utils/rewardsStorage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [feedbackRecordCount, setFeedbackRecordCount] = useState<number | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserRewards>(getUserRewards());
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('en');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Carried over states between tabs
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedPredictionForFeedback, setSelectedPredictionForFeedback] =
    useState<PredictResponse | null>(null);
  const [selectedPreviewForFeedback, setSelectedPreviewForFeedback] =
    useState<string | null>(null);

  const addToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string
  ) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshHistory = () => {
    setHistoryItems(getLocalHistory());
  };

  const refreshSystemData = async () => {
    try {
      const health = await checkHealth();
      setIsBackendHealthy(health.status === 'ok');

      try {
        const countRes = await getFeedbackCount();
        setFeedbackRecordCount(countRes.total_feedback_records);
      } catch {
        // Feedback count is secondary
      }
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    refreshHistory();
    refreshSystemData();

    // Poll health status every 30 seconds
    const interval = setInterval(refreshSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  // When user drops an image on the Home page, navigate to Detect
  const handleStartDetectionWithFile = (file?: File) => {
    if (file) {
      setPendingFile(file);
    }
    setActiveTab('detect');
  };

  // When user clicks "Review & Correct Annotations" from Detection results
  const handleNavigateToFeedback = (
    prediction: PredictResponse,
    originalPreview: string
  ) => {
    setSelectedPredictionForFeedback(prediction);
    setSelectedPreviewForFeedback(originalPreview);
    setActiveTab('feedback');
    addToast(
      'info',
      'Loaded Annotations into Reviewer',
      `Image ID: ${prediction.image_id.slice(0, 8)}... (${prediction.detections.length} boxes)`
    );
  };

  // When user selects a past item from History page to review
  const handleSelectHistoryForFeedback = (item: HistoryItem) => {
    const pseudoPrediction: PredictResponse = {
      image_id: item.imageId,
      image_width: 800,
      image_height: 600,
      class_names: {},
      detections: item.detections,
      annotated_image: item.annotatedImageUrl,
    };
    setSelectedPredictionForFeedback(pseudoPrediction);
    setSelectedPreviewForFeedback(item.previewUrl || item.annotatedImageUrl);
    setActiveTab('feedback');
    addToast(
      'info',
      'Loaded Historical Annotation',
      `Ready to edit boxes for ${item.fileName}`
    );
  };

  const handleFeedbackSaved = () => {
    addToast('success', 'Corrections Recorded', 'Human review saved to backend database (+50 Eco-Points!).');
    awardPoints(50, 'Verified Model Annotations', { isFeedback: true });
    setUserRewards(getUserRewards());
    refreshHistory();
    refreshSystemData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendHealthy={isBackendHealthy}
        historyCount={historyItems.length}
        ecoPoints={userRewards.points}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'home' && (
          <HomePage
            onStartDetection={handleStartDetectionWithFile}
            onNavigateTab={setActiveTab}
            isBackendHealthy={isBackendHealthy}
            feedbackRecordCount={feedbackRecordCount}
            historyCount={historyItems.length}
          />
        )}

        {activeTab === 'detect' && (
          <DetectionPage
            initialFile={pendingFile}
            onNavigateToFeedback={handleNavigateToFeedback}
            onHistoryUpdated={refreshHistory}
            onPointsAwarded={(pts, reason) => {
              setUserRewards(getUserRewards());
              addToast('success', 'Eco-Points Earned!', `+${pts} pts: ${reason}`);
            }}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsPage
            userRewards={userRewards}
            onRewardsUpdated={() => setUserRewards(getUserRewards())}
            onNavigateToDetect={() => setActiveTab('detect')}
            onNavigateToLocator={() => setActiveTab('locator')}
            onShowToast={addToast}
          />
        )}

        {activeTab === 'locator' && (
          <LocatorPage
            onPointsAwarded={(pts, reason) => {
              setUserRewards(getUserRewards());
              addToast('success', 'Eco-Points Earned!', `+${pts} pts: ${reason}`);
            }}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactDashboardPage
            historyItems={historyItems}
            onNavigateToDetect={() => setActiveTab('detect')}
          />
        )}

        {activeTab === 'guidance' && <GuidancePage />}

        {activeTab === 'feedback' && (
          <FeedbackPage
            currentPrediction={selectedPredictionForFeedback}
            imagePreviewUrl={selectedPreviewForFeedback}
            onFeedbackSaved={handleFeedbackSaved}
            onNavigateToDetect={() => setActiveTab('detect')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            historyItems={historyItems}
            onHistoryUpdated={refreshHistory}
            onSelectHistoryForFeedback={handleSelectHistoryForFeedback}
            onNavigateToDetect={() => setActiveTab('detect')}
          />
        )}
      </main>

      {/* Multilingual Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigateTab={setActiveTab}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
