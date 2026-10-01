import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dumbbell, Zap, Brain, Compass, Calculator, Palette, 
  CheckCircle2, Award, Flame, ArrowRight, X, Home, Sparkles, Clock, 
  RefreshCw, SlidersHorizontal, ShieldCheck, Check,
  Target, Wind, CloudRain, Gem
} from 'lucide-react';
import { SpeedMatchGame } from '../games/SpeedMatch';
import { MemoryMatrixGame } from '../games/MemoryMatrix';
import { LostInMigrationGame } from '../games/LostInMigration';
import { ChalkboardChallengeGame } from '../games/ChalkboardChallenge';
import { ColorMatchGame } from '../games/ColorMatch';
import { TargetTrackerGame } from '../games/TargetTracker';
import { EbbAndFlowGame } from '../games/EbbAndFlow';
import { RaindropsGame } from '../games/Raindrops';
import { TidalTreasuresGame } from '../games/TidalTreasures';
import { completeDailyWorkout, getProfile } from '../utils/storage';
import { sound } from '../utils/sound';

export const ALL_CIRCUIT_GAMES = [
  { id: 'speed-match', domain: 'speed', title: 'Hız Eşleştirme', focus: 'İşlem Hızı & Reaksiyon', icon: Zap, color: '#FF9A00', component: SpeedMatchGame },
  { id: 'memory-matrix', domain: 'memory', title: 'Hafıza Matrisi', focus: 'Uzamsal Çalışma Belleği', icon: Brain, color: '#7B4CE6', component: MemoryMatrixGame },
  { id: 'lost-in-migration', domain: 'attention', title: 'Göç Yolu', focus: 'Seçici Dikkat & Odaklanma', icon: Compass, color: '#0091FF', component: LostInMigrationGame },
  { id: 'chalkboard-challenge', domain: 'problemSolving', title: 'Kara Tahta', focus: 'Nicel Akıl Yürütme & Mantık', icon: Calculator, color: '#00B894', component: ChalkboardChallengeGame },
  { id: 'color-match', domain: 'flexibility', title: 'Renk Eşleştirme', focus: 'Stroop Etkisi & Bilişsel Esneklik', icon: Palette, color: '#E83D84', component: ColorMatchGame },
  { id: 'target-tracker', domain: 'attention', title: 'Hedef Takibi', focus: 'Çoklu Nesne Takibi & Görsel Dikkat', icon: Target, color: '#00C2A8', component: TargetTrackerGame },
  { id: 'ebb-and-flow', domain: 'flexibility', title: 'Gelgit Akışı', focus: 'Görev Değiştirme & Bilişsel Esneklik', icon: Wind, color: '#A855F7', component: EbbAndFlowGame },
  { id: 'raindrops', domain: 'problemSolving', title: 'Yağmur Damlaları', focus: 'Hızlı Zihinsel Aritmetik & Sayısal Sezgi', icon: CloudRain, color: '#3B82F6', component: RaindropsGame },
  { id: 'tidal-treasures', domain: 'memory', title: 'Deniz Hazineleri', focus: 'Sürekli Olay Belleği & Tanıma', icon: Gem, color: '#10B981', component: TidalTreasuresGame }
];

export default function DailyWorkoutModal({ initialMode = 'full', onClose, onWorkoutCompleted }) {
  const profile = getProfile();
  const [workoutMode, setWorkoutMode] = useState(initialMode || profile.workoutPreference || 'full'); // 'full', 'quick', or 'custom'
  
  // Custom circuit builder state
  const [circuit, setCircuit] = useState(() => {
    if (initialMode === 'quick') return ALL_CIRCUIT_GAMES.slice(0, 3);
    return [...ALL_CIRCUIT_GAMES];
  });

  // Game swapping state: index of the game being swapped, or null
  const [swappingIndex, setSwappingIndex] = useState(null);

  // Stages: 'overview', 'playing', 'transition', 'summary'
  const [stage, setStage] = useState('overview');
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [gameResults, setGameResults] = useState([]);
  const [workoutOutcome, setWorkoutOutcome] = useState({ bonusBpi: 0, shieldProtected: false, earnedShield: false });

  const handleModeChange = (mode) => {
    sound.playTap();
    setWorkoutMode(mode);
    if (mode === 'full') {
      setCircuit([...ALL_CIRCUIT_GAMES]);
    } else if (mode === 'quick') {
      setCircuit(ALL_CIRCUIT_GAMES.slice(0, 3));
    }
  };

  const handleSwapGame = (targetIndex, newGameDef) => {
    sound.playTap();
    setCircuit(prev => {
      const copy = [...prev];
      copy[targetIndex] = newGameDef;
      return copy;
    });
    setSwappingIndex(null);
  };

  const handleToggleCustomGame = (gameDef) => {
    sound.playTap();
    const exists = circuit.some(g => g.id === gameDef.id);
    if (exists) {
      if (circuit.length <= 2) {
        alert('En az 2 egzersiz seçilmelidir.');
        return;
      }
      setCircuit(prev => prev.filter(g => g.id !== gameDef.id));
    } else {
      if (circuit.length >= 5) {
        alert('En fazla 5 egzersiz seçebilirsiniz.');
        return;
      }
      setCircuit(prev => [...prev, gameDef]);
    }
  };

  const startCircuit = () => {
    sound.playTap();
    setCurrentGameIndex(0);
    setGameResults([]);
    setStage('playing');
  };

  const handleGameFinish = (result) => {
    const currentGame = circuit[currentGameIndex];
    const prevHighScore = profile.games?.[currentGame.id]?.highScore || 0;
    const isNewRecord = result.score > prevHighScore;

    const gameResultRecord = {
      gameId: currentGame.id,
      domain: currentGame.domain,
      title: currentGame.title,
      color: currentGame.color,
      isNewRecord,
      ...result
    };

    const updatedResults = [...gameResults, gameResultRecord];
    setGameResults(updatedResults);

    const isLastGame = currentGameIndex >= circuit.length - 1;

    if (!isLastGame) {
      sound.playLevelUp();
      setStage('transition');
    } else {
      // Completed entire circuit!
      const outcome = completeDailyWorkout(updatedResults);
      setWorkoutOutcome(outcome);
      sound.playVictory();
      setStage('summary');

      // Trigger festive multi-burst confetti
      try {
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 70,
            angle: 60,
            spread: 60,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 70,
            angle: 120,
            spread: 60,
            origin: { x: 1 }
          });
        }, 250);
      } catch (e) {
        console.log('Confetti not available', e);
      }
    }
  };

  const proceedToNextGame = () => {
    sound.playTap();
    setCurrentGameIndex(prev => prev + 1);
    setStage('playing');
  };

  const totalWorkoutScore = gameResults.reduce((sum, g) => sum + (g.score || 0), 0);
  const CurrentGameComponent = circuit[currentGameIndex]?.component;
  const nextGame = circuit[currentGameIndex + 1];
  const lastFinishedResult = gameResults[gameResults.length - 1];

  return (
    <div className="modal-overlay">
      <div className="workout-modal-container glass-card animate-pop">
        {/* Close Button on Overview or Summary */}
        {(stage === 'overview' || stage === 'summary') && (
          <button className="workout-close-btn" onClick={onClose} aria-label="Kapat">
            <X size={22} />
          </button>
        )}

        {/* OVERVIEW STAGE */}
        {stage === 'overview' && (
          <div className="workout-overview-content">
            <div className="workout-icon-badge">
              <Dumbbell size={38} color="#FA6432" />
            </div>

            <h2>Günün Bilişsel Antrenmanı</h2>
            <p className="workout-desc">
              Bilimsel kurul tarafından hazırlanan ve nöroplastisiteyi uyaran 
              kişiselleştirilmiş günlük beyin antrenman programınız.
            </p>

            {/* Mode Switcher Tabs */}
            <div className="workout-mode-tabs">
              <button
                className={`mode-tab-btn ${workoutMode === 'full' ? 'active' : ''}`}
                onClick={() => handleModeChange('full')}
              >
                <Sparkles size={16} />
                <span>Tam Antrenman (5 Alan)</span>
                <span className="mode-pill">Önerilen</span>
              </button>

              <button
                className={`mode-tab-btn ${workoutMode === 'quick' ? 'active' : ''}`}
                onClick={() => handleModeChange('quick')}
              >
                <Clock size={16} />
                <span>Hızlı Seans (3 Alan)</span>
              </button>

              <button
                className={`mode-tab-btn ${workoutMode === 'custom' ? 'active' : ''}`}
                onClick={() => handleModeChange('custom')}
                title="Kendi antrenman seansınızı serbestçe özelleştirin"
              >
                <SlidersHorizontal size={16} />
                <span>Özel Antrenman</span>
              </button>
            </div>

            {/* Custom Mode Info Alert */}
            {workoutMode === 'custom' && (
              <div className="custom-mode-banner glass-card">
                <span>🎯 İstediğiniz egzersizleri seçin veya sırasını özelleştirin ({circuit.length} egzersiz seçili):</span>
                <div className="custom-games-picker-row">
                  {ALL_CIRCUIT_GAMES.map(g => {
                    const isSelected = circuit.some(c => c.id === g.id);
                    return (
                      <button
                        key={g.id}
                        className={`custom-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleCustomGame(g)}
                        style={isSelected ? { borderColor: g.color, color: g.color } : {}}
                      >
                        {isSelected && <Check size={14} />}
                        <span>{g.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Circuit Games Timeline with In-Workout Game Swap */}
            <div className="workout-circuit-list">
              {circuit.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div key={`${item.id}-${idx}`} className="circuit-item">
                    <div className="circuit-step-num">{idx + 1}</div>
                    <div className="circuit-icon-box" style={{ background: `${item.color}25`, color: item.color }}>
                      <ItemIcon size={20} />
                    </div>
                    <div className="circuit-info">
                      <span className="circuit-name">{item.title}</span>
                      <span className="circuit-focus">{item.focus}</span>
                    </div>

                    <div className="circuit-item-actions">
                      <button 
                        className="btn-swap-game" 
                        onClick={() => {
                          sound.playTap();
                          setSwappingIndex(idx);
                        }}
                        title="Bu aşamadaki oyunu kütüphaneden başka bir oyunla değiştir (Lumosity'de olmayan özellik!)"
                      >
                        <RefreshCw size={14} />
                        <span>Değiştir</span>
                      </button>
                      <span className="circuit-time">~45 sn</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="workout-actions">
              <button 
                className="btn btn-primary btn-large-workout" 
                onClick={startCircuit}
              >
                <span>Antrenmanı Başlat ({circuit.length} Egzersiz, ~{circuit.length} dk)</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* GAME SWAP MODAL / PICKER OVERLAY */}
        {swappingIndex !== null && (
          <div className="swap-picker-overlay animate-fade">
            <div className="swap-picker-card glass-card animate-pop">
              <div className="swap-picker-header">
                <div>
                  <h3>{swappingIndex + 1}. Aşamayı Başka Bir Egzersizle Değiştir</h3>
                  <p className="card-sub">Antrenmanınızı tam olarak geliştirmek istediğiniz zihinsel alana göre uyarlayın.</p>
                </div>
                <button className="workout-close-btn" onClick={() => setSwappingIndex(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="swap-options-list">
                {ALL_CIRCUIT_GAMES.map(g => {
                  const GIcon = g.icon;
                  const isCurrentInSlot = circuit[swappingIndex]?.id === g.id;

                  return (
                    <div 
                      key={g.id} 
                      className={`swap-option-card ${isCurrentInSlot ? 'current' : ''}`}
                      onClick={() => handleSwapGame(swappingIndex, g)}
                    >
                      <div className="swap-opt-icon" style={{ background: `${g.color}25`, color: g.color }}>
                        <GIcon size={22} />
                      </div>
                      <div className="swap-opt-info">
                        <h4>{g.title}</h4>
                        <span className="swap-opt-domain" style={{ color: g.color }}>{g.domainLabel}</span>
                        <p>{g.focus}</p>
                      </div>
                      <button className="btn btn-sm btn-outline">
                        {isCurrentInSlot ? 'Mevcut' : 'Bunu Seç'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PLAYING STAGE */}
        {stage === 'playing' && CurrentGameComponent && (
          <div className="circuit-active-game-wrapper">
            {/* Top Circuit Step Indicator */}
            <div className="circuit-progress-header">
              <div className="circuit-steps-indicator">
                {circuit.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isDone = idx < currentGameIndex;
                  const isCurrent = idx === currentGameIndex;
                  return (
                    <div 
                      key={`${step.id}-${idx}`} 
                      className={`circuit-step-pill ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                      title={step.title}
                    >
                      <StepIcon size={14} />
                      <span className="step-pill-label">{idx + 1}. {step.title}</span>
                      {isDone && <CheckCircle2 size={13} className="step-check" />}
                    </div>
                  );
                })}
              </div>

              <span className="circuit-count-tag">
                Egzersiz <strong>{currentGameIndex + 1}</strong> / {circuit.length}
              </span>
            </div>

            {/* Embedded Active Game */}
            <CurrentGameComponent 
              onFinish={handleGameFinish}
              onCancel={onClose}
            />
          </div>
        )}

        {/* TRANSITION STAGE BETWEEN GAMES */}
        {stage === 'transition' && lastFinishedResult && nextGame && (
          <div className="circuit-transition-box animate-pop">
            <div className="transition-badge text-success">
              <CheckCircle2 size={46} />
            </div>

            <h3>{currentGameIndex + 1}. Aşama Başarıyla Tamamlandı!</h3>
            
            <div className="transition-score-pill">
              <span>{lastFinishedResult.title} Skorunuz:</span>
              <strong>{lastFinishedResult.score} Puan</strong>
              {lastFinishedResult.isNewRecord && (
                <span className="new-record-tag">★ YENİ KİŞİSEL REKOR!</span>
              )}
            </div>

            {/* Next Game Preview Card */}
            <div className="next-game-preview glass-card">
              <span className="next-tag">SIRADAKİ EGZERSİZ ({currentGameIndex + 2} / {circuit.length})</span>
              <div className="next-game-details">
                <div className="next-icon-box" style={{ background: `${nextGame.color}20`, color: nextGame.color }}>
                  {React.createElement(nextGame.icon, { size: 28 })}
                </div>
                <div>
                  <h4>{nextGame.title}</h4>
                  <p>{nextGame.focus}</p>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary btn-next-game" 
              onClick={proceedToNextGame}
              style={{ background: nextGame.color, color: '#FFFFFF' }}
            >
              <span>{nextGame.title} Egzersizine Başla</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* FINAL WORKOUT CELEBRATION SUMMARY */}
        {stage === 'summary' && (
          <div className="workout-summary-content animate-pop">
            <div className="summary-trophy-badge">
              <Award size={56} color="#FA6432" />
            </div>

            <div className="streak-achieved-pill">
              <Flame size={20} color="#FF9F1C" className="animate-bounce-slow" />
              <span>GÜNLÜK ANTRENMAN SERİSİ DEVAM EDİYOR!</span>
            </div>

            {/* If Streak Shield protected the user's streak */}
            {workoutOutcome.shieldProtected && (
              <div className="shield-saved-alert glass-card animate-pop">
                <ShieldCheck size={24} color="#0091FF" />
                <div>
                  <strong>🛡️ Seri Koruma Kalkanı Devreye Girdi!</strong>
                  <p>Kaçırdığınız gün serinizi sıfırlamadı; {profile.streak}. gün seriniz kalkanınız sayesinde korundu.</p>
                </div>
              </div>
            )}

            {/* If Streak Shield was earned */}
            {workoutOutcome.earnedShield && (
              <div className="shield-earned-alert glass-card animate-pop">
                <Sparkles size={22} color="#FF9A00" />
                <div>
                  <strong>🎉 +1 Yeni Seri Koruma Kalkanı Kazandınız!</strong>
                  <p>Düzenli antrenman ödülü olarak kalkan haznenize 1 kalkan eklendi.</p>
                </div>
              </div>
            )}

            <h2>Tebrikler! Günün Seansı Tamamlandı</h2>
            <p className="summary-subtitle">
              Tüm hedeflenen zihinsel merkezler çalıştırıldı. Nöral bağlantılarınız güçlendi!
            </p>

            <div className="summary-metrics-row">
              <div className="summary-metric-card glass-card">
                <span className="summary-m-label">Toplam Seans Puanı</span>
                <span className="summary-m-val text-primary">{totalWorkoutScore}</span>
              </div>
              <div className="summary-metric-card glass-card bpi-boost-card">
                <span className="summary-m-label">Kazanılan LPI / BPI</span>
                <span className="summary-m-val text-success">+{workoutOutcome.bonusBpi || 15} LPI</span>
              </div>
            </div>

            {/* Individual Breakdown of all games */}
            <div className="summary-breakdown-list">
              {gameResults.map((item, idx) => (
                <div key={idx} className="breakdown-item glass-card">
                  <span className="item-order">{idx + 1}</span>
                  <div className="item-info">
                    <span className="item-title">{item.title}</span>
                    <span className="item-domain-badge" style={{ color: item.color, borderColor: item.color }}>
                      {(item.domain || '').toUpperCase()}
                    </span>
                  </div>
                  <span className="item-score">{item.score} Puan</span>
                </div>
              ))}
            </div>

            <div className="summary-footer-actions">
              <button 
                className="btn btn-primary btn-large-finish" 
                onClick={() => {
                  sound.playTap();
                  onWorkoutCompleted();
                }}
              >
                <Home size={20} />
                <span>Sonuçları Kaydet ve Ana Sayfaya Dön</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
