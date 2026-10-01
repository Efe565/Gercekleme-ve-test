import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import GamesCatalog from './components/GamesCatalog';
import InsightsView from './components/InsightsView';
import ScienceView from './components/ScienceView';
import DailyWorkoutModal from './components/DailyWorkoutModal';
import StandaloneGameModal from './components/StandaloneGameModal';
import UserProfileModal from './components/UserProfileModal';
import StreakShieldModal from './components/StreakShieldModal';
import NeuroFocusAudioModal from './components/NeuroFocusAudioModal';
import { getProfile } from './utils/storage';
import { Brain, Heart, Sparkles, Shield, Headphones } from 'lucide-react';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Lumosity Error Boundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ textAlign: 'center', padding: '6rem 1.5rem' }}>
          <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#FA6432', fontSize: '1.8rem' }}>Antrenman Tamamlandı</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Oyun verileriniz ve LPI ilerlemeniz kaydedildi. Ana sayfaya dönerek güncel performansınızı görüntüleyebilirsiniz.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(() => getProfile());
  const [isDailyWorkoutOpen, setIsDailyWorkoutOpen] = useState(false);
  const [dailyWorkoutMode, setDailyWorkoutMode] = useState('full');
  const [activeGameId, setActiveGameId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStreakShieldOpen, setIsStreakShieldOpen] = useState(false);
  const [isNeuroAudioOpen, setIsNeuroAudioOpen] = useState(false);

  // Sync profile and redirect to Home Dashboard when daily workout completes
  const handleWorkoutCompleted = () => {
    setIsDailyWorkoutOpen(false);
    setActiveGameId(null);
    setActiveTab('dashboard');
    setProfile(getProfile());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync profile and redirect to Home Dashboard when standalone game completes
  const handleGameCompleted = (updatedProfile) => {
    setActiveGameId(null);
    setIsDailyWorkoutOpen(false);
    setActiveTab('dashboard');
    setProfile(updatedProfile || getProfile());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartWorkout = (mode = 'full') => {
    setDailyWorkoutMode(mode);
    setIsDailyWorkoutOpen(true);
  };

  const handleCloseWorkout = () => {
    setIsDailyWorkoutOpen(false);
    setActiveTab('dashboard');
  };

  const handleCloseGame = () => {
    setActiveGameId(null);
    setActiveTab('dashboard');
  };

  return (
    <ErrorBoundary>
      <div className="app-layout">
        {/* Top Header & Navigation */}
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          onStartDailyWorkout={() => handleStartWorkout('full')}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenStreakShield={() => setIsStreakShieldOpen(true)}
          onOpenNeuroAudio={() => setIsNeuroAudioOpen(true)}
        />

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              profile={profile}
              onStartDailyWorkout={handleStartWorkout}
              onLaunchGame={(id) => setActiveGameId(id)}
              setActiveTab={setActiveTab}
              onOpenStreakShield={() => setIsStreakShieldOpen(true)}
              onOpenNeuroAudio={() => setIsNeuroAudioOpen(true)}
            />
          )}

          {activeTab === 'games' && (
            <GamesCatalog 
              profile={profile}
              onLaunchGame={(id) => setActiveGameId(id)}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsView 
              profile={profile}
              setProfile={setProfile}
              onLaunchGame={(id) => setActiveGameId(id)}
            />
          )}

          {activeTab === 'science' && (
            <ScienceView />
          )}
        </main>

        {/* Daily Workout Modal Circuit (with in-workout swap & custom builder) */}
        {isDailyWorkoutOpen && (
          <DailyWorkoutModal 
            initialMode={dailyWorkoutMode}
            onClose={handleCloseWorkout}
            onWorkoutCompleted={handleWorkoutCompleted}
          />
        )}

        {/* Standalone Game Play Modal */}
        {activeGameId && (
          <StandaloneGameModal 
            gameId={activeGameId}
            onClose={handleCloseGame}
            onGameCompleted={handleGameCompleted}
          />
        )}

        {/* User Profile & Settings Modal */}
        {isProfileOpen && (
          <UserProfileModal 
            profile={profile}
            setProfile={setProfile}
            onClose={() => setIsProfileOpen(false)}
          />
        )}

        {/* Streak Freeze & Shield System Modal (Feedback response #1) */}
        {isStreakShieldOpen && (
          <StreakShieldModal
            profile={profile}
            setProfile={setProfile}
            onClose={() => setIsStreakShieldOpen(false)}
          />
        )}

        {/* Neuro-Focus Audio & Binaural Beats Modal (Feedback response #2) */}
        {isNeuroAudioOpen && (
          <NeuroFocusAudioModal
            profile={profile}
            setProfile={setProfile}
            onClose={() => setIsNeuroAudioOpen(false)}
          />
        )}

        {/* Footer */}
        <footer className="footer-wrapper">
          <div className="container footer-content">
            <div className="footer-left">
              <div className="footer-logo">
                <Brain size={22} color="#FA6432" />
                <span>lumosity</span>
              </div>
              <p className="footer-desc">
                Bilimsel temelli bilişsel antrenman, hafıza, reaksiyon hızı, seçici dikkat ve problem çözme geliştirme platformu.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-col">
                <h4>5 Bilişsel Alan</h4>
                <span onClick={() => setActiveTab('games')}>Hız Egzersizleri</span>
                <span onClick={() => setActiveTab('games')}>Çalışma Belleği</span>
                <span onClick={() => setActiveTab('games')}>Seçici Dikkat</span>
                <span onClick={() => setActiveTab('games')}>Bilişsel Esneklik</span>
                <span onClick={() => setActiveTab('games')}>Problem Çözme</span>
              </div>
              <div className="footer-col">
                <h4>Gelişmiş Özellikler</h4>
                <span onClick={() => setIsStreakShieldOpen(true)}>🛡️ Seri Koruma Kalkanı</span>
                <span onClick={() => setIsNeuroAudioOpen(true)}>🎧 Nöro-Müzik & Ambiyans</span>
                <span onClick={() => handleStartWorkout('custom')}>🎯 Özel Antrenman Stüdyosu</span>
                <span onClick={() => setActiveTab('insights')}>💡 Bilişsel Koçluk Analizi</span>
                <span onClick={() => setIsProfileOpen(true)}>Profil ve Yaş Normları</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="container bottom-row">
              <span>© 2026 Lumosity Brain Lab. Bilişsel Sağlık ve Nöroplastisite Egzersizleri.</span>
              <span className="footer-made-with">
                Zihinsel zindelik için <Heart size={14} color="#EF4444" fill="#EF4444" /> ile geliştirildi.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
