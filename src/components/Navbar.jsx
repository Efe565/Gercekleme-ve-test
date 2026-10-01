import React, { useState } from 'react';
import { 
  Brain, Flame, Volume2, VolumeX, Dumbbell, Grid, BarChart3, 
  Info, Sparkles, User, Shield, Headphones 
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  profile, 
  onStartDailyWorkout, 
  onOpenProfile,
  onOpenStreakShield,
  onOpenNeuroAudio 
}) {
  const [muted, setMuted] = useState(sound.isMuted());
  const isAudioActive = sound.isBinauralActive();

  const handleToggleSound = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playTap();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: Brain },
    { id: 'games', label: 'Tüm Oyunlar', icon: Grid },
    { id: 'insights', label: 'LPI Analizi & Koç', icon: BarChart3 },
    { id: 'science', label: 'Bilimsel Temel', icon: Info },
  ];

  return (
    <header className="navbar-wrapper">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          onClick={() => {
            sound.playTap();
            setActiveTab('dashboard');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="logo-icon-wrapper">
            <Brain className="logo-brain-icon" size={26} />
            <div className="logo-pulse-dot" />
          </div>
          <div className="logo-text">
            <span className="brand-title">lumosity</span>
            <span className="brand-subtitle">BEYİN ANTRENMANI</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setActiveTab(item.id);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isActive && <div className="active-pill" />}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions & Stats */}
        <div className="nav-actions">
          {/* Quick Workout Button */}
          <button 
            className="btn btn-primary nav-workout-btn"
            onClick={() => {
              sound.playTap();
              onStartDailyWorkout();
            }}
          >
            <Dumbbell size={18} />
            <span>Günün Antrenmanı</span>
            <span className="workout-sparkle"><Sparkles size={14} /></span>
          </button>

          {/* Streak Badge with Shield Trigger */}
          <div 
            className="streak-badge-clickable" 
            onClick={() => {
              sound.playTap();
              onOpenStreakShield();
            }}
            title="Seri ve Kalkan Yönetimi (Tıklayın)"
            role="button"
            tabIndex={0}
          >
            <div className="streak-badge">
              <Flame size={18} className="flame-icon animate-bounce-slow" />
              <span className="streak-count">{profile.streak || 1}</span>
            </div>

            <div className="streak-shield-pill" title="Seri Koruma Kalkanı">
              <Shield size={14} color="#0091FF" />
              <span className="shield-num">{profile.streakFreezes !== undefined ? profile.streakFreezes : 2}</span>
            </div>
          </div>

          {/* Neuro-Focus Audio Button */}
          <button 
            className={`btn btn-ghost icon-btn audio-nav-btn ${isAudioActive ? 'active-audio' : ''}`} 
            onClick={() => {
              sound.playTap();
              onOpenNeuroAudio();
            }}
            title="Nöro-Odak Ambiyans Sesleri (Binaural Beats & Pink Noise)"
            aria-label="Nöro Müzik"
          >
            <Headphones size={19} color={isAudioActive ? '#7B4CE6' : '#94A3B8'} />
            {isAudioActive && <div className="nav-audio-indicator" />}
          </button>

          {/* Sound Toggle */}
          <button 
            className="btn btn-ghost icon-btn" 
            onClick={handleToggleSound}
            title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
            aria-label="Ses Kontrolü"
          >
            {muted ? <VolumeX size={20} color="#94A3B8" /> : <Volume2 size={20} color="#FA6432" />}
          </button>

          {/* User LPI Pill */}
          <div 
            className="user-bpi-badge" 
            onClick={() => setActiveTab('insights')}
            title="Lumosity Performans İndeksi (LPI)"
          >
            <span className="bpi-mini-label">LPI</span>
            <span className="bpi-mini-value">{profile.overallLpi || profile.overallBpi || 1045}</span>
          </div>

          {/* Profile / Settings Button */}
          <button 
            className="btn btn-ghost icon-btn user-avatar-btn"
            onClick={() => {
              sound.playTap();
              onOpenProfile();
            }}
            title={`${profile.name || 'Kullanıcı'} Profili ve Ayarlar`}
            aria-label="Profil ve Ayarlar"
          >
            <User size={19} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </header>
  );
}

