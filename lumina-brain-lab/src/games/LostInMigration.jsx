import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Timer, Flame, Award, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Pause, Play } from 'lucide-react';
import { sound } from '../utils/sound';

const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const DIRECTION_ANGLES = {
  UP: 0,
  RIGHT: 90,
  DOWN: 180,
  LEFT: 270
};

// Formations: 'cross', 'horizontal', 'vertical', 'v-flight'
const FORMATIONS = ['cross', 'v-flight', 'horizontal', 'vertical'];

// Sleek Migratory Bird SVG component
function BirdIcon({ direction, isCenter, isHighlighted }) {
  const angle = DIRECTION_ANGLES[direction] || 0;
  return (
    <div 
      className={`bird-wrapper ${isCenter ? 'center-bird' : 'flanker-bird'} ${isHighlighted ? 'bird-glow' : ''}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <svg viewBox="0 0 64 64" className="bird-svg">
        <defs>
          <linearGradient id={isCenter ? "centerBirdGrad" : "flankerBirdGrad"} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isCenter ? "#00D2FF" : "#94A3B8"} />
            <stop offset="100%" stopColor={isCenter ? "#0072FF" : "#475569"} />
          </linearGradient>
          {isCenter && (
            <filter id="birdLeaderGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#00D2FF" floodOpacity="0.75" />
            </filter>
          )}
        </defs>

        {/* Detailed Migratory Bird Silhouette */}
        <g filter={isCenter ? "url(#birdLeaderGlow)" : undefined}>
          {/* Main Body & Beak */}
          <path 
            d="M32 4 C34 10 38 18 36 28 C42 22 52 14 58 18 C50 26 44 32 37 36 C38 46 41 54 44 60 C38 56 34 52 32 46 C30 52 26 56 20 60 C23 54 26 46 27 36 C20 32 14 26 6 18 C12 14 22 22 28 28 C26 18 30 10 32 4 Z" 
            fill={`url(#${isCenter ? "centerBirdGrad" : "flankerBirdGrad"})`}
            stroke={isCenter ? "#38BDF8" : "rgba(255,255,255,0.25)"}
            strokeWidth="1.5"
          />
          {/* Eye spot on Leader Bird */}
          {isCenter && (
            <circle cx="32" cy="18" r="3.5" fill="#FFFFFF" />
          )}
        </g>
      </svg>
    </div>
  );
}

export function LostInMigrationGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);

  const [flock, setFlock] = useState({ 
    center: 'UP', 
    flankers: 'UP',
    formation: 'cross'
  });

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
  const [prePauseState, setPrePauseState] = useState(null);

  const trialStartTimeRef = useRef(Date.now());

  // Generate random flock with variable formations (authentic Lumosity)
  const generateFlock = useCallback(() => {
    const centerDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    // 35% congruent (all same), 65% incongruent (flankers pointing differently)
    const isCongruent = Math.random() < 0.35;
    let flankerDir = centerDir;
    if (!isCongruent) {
      const others = DIRECTIONS.filter(d => d !== centerDir);
      flankerDir = others[Math.floor(Math.random() * others.length)];
    }

    const formation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];

    setFlock({ center: centerDir, flankers: flankerDir, formation });
    trialStartTimeRef.current = Date.now();
  }, []);

  const startCountdown = () => {
    sound.playTap();
    setGameState('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        sound.playCountdown();
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        sound.playStart();
        setGameState('playing');
        setTimeLeft(45);
        generateFlock();
      }
    }
  }, [gameState, countdown, generateFlock]);

  const finishGame = () => {
    sound.playFinish();
    setGameState('ended');
  };

  // Main countdown timer
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  const togglePause = () => {
    if (gameState === 'paused') {
      sound.playTap();
      setGameState(prePauseState || 'playing');
      setPrePauseState(null);
    } else if (gameState === 'playing') {
      sound.playTap();
      setPrePauseState('playing');
      setGameState('paused');
    }
  };

  // Process user direction input
  const handleDirection = useCallback((dir) => {
    if (gameState !== 'playing') return;

    const rt = Date.now() - trialStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const isCorrect = dir === flock.center;

    if (isCorrect) {
      sound.playCorrect();
      setCorrectCount(c => c + 1);
      const points = 100 * combo;
      setScore(s => s + points);
      setCombo(c => {
        const next = Math.min(c + 1, 5);
        if (next > maxCombo) setMaxCombo(next);
        if (next >= 3) sound.playCombo(next);
        return next;
      });
      setFeedback('correct');
    } else {
      sound.playWrong();
      setMistakeCount(m => m + 1);
      setCombo(1);
      setFeedback('wrong');
    }

    setTimeout(() => setFeedback(null), 200);
    generateFlock();
  }, [gameState, flock, combo, maxCombo, generateFlock]);

  // Keyboard navigation & pause hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
          return;
        }
      }
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleDirection('UP');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDirection('DOWN');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDirection('LEFT');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleDirection('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDirection]);

  const avgReaction = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  const accuracy = (correctCount + mistakeCount) > 0
    ? Math.round((correctCount / (correctCount + mistakeCount)) * 100)
    : 100;

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-attention)' }}>
            <div className="domain-badge-pill" style={{ background: 'var(--domain-attention-glow)', color: 'var(--domain-attention)' }}>
              <Compass size={16} />
              <span>Dikkat & Odaklanma Antrenmanı</span>
            </div>
            <h2>Göç Yolu (Lost in Migration)</h2>
            <p className="game-subtitle">Çeldiricileri filtreleyin; yalnızca ortadaki mavi lider kuşun yönünü tuşlayın.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>5 kuştan oluşan bir sürü ekranda farklı uçuş düzenlerinde (haç, V-formasyonu, yatay) belirecektir.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Çevredeki kuşlar sizi şaşırtmaya çalışır. Sadece <strong>ORTADAKİ PARLAK MAVİ LİDER KUŞUN</strong> yönünü seçin.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Klavyedeki <strong>Yön Tuşları</strong> (↑, ↓, ←, →) veya ekrandaki butonları en yüksek hızla kullanın.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" onClick={startCountdown}>
              <span>Antrenmana Başla (45sn)</span>
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown > 0 ? countdown : 'ODAKLAN!'}</span>
          </div>
          <p className="countdown-hint">Ortadaki mavi lider kuşa kilitlen...</p>
        </div>
      )}

      {/* Playing Board */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className={`game-board-container ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
          {/* Top HUD */}
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={18} className="hud-icon" color="#38BDF8" />
              <div className="hud-stat">
                <span className="hud-label">Süre</span>
                <span className={`hud-val ${timeLeft <= 10 ? 'time-warning' : ''}`}>{timeLeft}s</span>
              </div>
            </div>

            <div className="hud-metric">
              <Flame size={18} className="hud-icon" color="#FF9F1C" />
              <div className="hud-stat">
                <span className="hud-label">Seri Çarpanı</span>
                <span className="hud-val combo-val">{combo}x</span>
              </div>
            </div>

            <div className="hud-metric score-metric">
              <Award size={18} className="hud-icon" color="#FDCB6E" />
              <div className="hud-stat">
                <span className="hud-label">Puan</span>
                <span className="hud-val score-val">{score}</span>
              </div>
              <button 
                className="btn btn-ghost btn-sm pause-btn" 
                onClick={togglePause} 
                title="Duraklat (ESC)"
                aria-label="Duraklat"
              >
                <Pause size={18} />
              </button>
            </div>
          </div>

          {/* Flock Formation Arena */}
          <div className={`flock-arena glass-card ${feedback === 'correct' ? 'feedback-correct' : feedback === 'wrong' ? 'feedback-wrong' : ''}`}>
            <div className="flock-prompt">
              <span>Ortadaki Lider Kuş Hangi Yöne Bakıyor?</span>
            </div>

            {/* Dynamic Flock Layouts */}
            <div className={`flock-layout-container formation-${flock.formation}`}>
              {/* CROSS FORMATION */}
              {flock.formation === 'cross' && (
                <div className="flock-grid-cross">
                  <div className="flock-pos top-pos">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                  <div className="flock-row-mid">
                    <div className="flock-pos left-pos">
                      <BirdIcon direction={flock.flankers} isCenter={false} />
                    </div>
                    <div className="flock-pos center-pos">
                      <BirdIcon direction={flock.center} isCenter={true} isHighlighted={true} />
                    </div>
                    <div className="flock-pos right-pos">
                      <BirdIcon direction={flock.flankers} isCenter={false} />
                    </div>
                  </div>
                  <div className="flock-pos bottom-pos">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                </div>
              )}

              {/* V-FLIGHT FORMATION (Iconic Lumosity V-Pattern) */}
              {flock.formation === 'v-flight' && (
                <div className="flock-v-formation">
                  {/* Left Wing Top */}
                  <div className="v-bird v-left-2">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                  {/* Left Wing Inner */}
                  <div className="v-bird v-left-1">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                  {/* Apex Leader Bird */}
                  <div className="v-bird v-apex">
                    <BirdIcon direction={flock.center} isCenter={true} isHighlighted={true} />
                  </div>
                  {/* Right Wing Inner */}
                  <div className="v-bird v-right-1">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                  {/* Right Wing Top */}
                  <div className="v-bird v-right-2">
                    <BirdIcon direction={flock.flankers} isCenter={false} />
                  </div>
                </div>
              )}

              {/* HORIZONTAL FLIGHT */}
              {flock.formation === 'horizontal' && (
                <div className="flock-row-linear">
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.center} isCenter={true} isHighlighted={true} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                </div>
              )}

              {/* VERTICAL FLIGHT */}
              {flock.formation === 'vertical' && (
                <div className="flock-col-linear">
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.center} isCenter={true} isHighlighted={true} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                  <BirdIcon direction={flock.flankers} isCenter={false} />
                </div>
              )}
            </div>
          </div>

          {/* D-Pad Touch Controls */}
          <div className="dpad-controls">
            <button 
              className="dpad-btn dpad-up" 
              onClick={() => handleDirection('UP')}
              aria-label="Yukarı"
            >
              <ArrowUp size={28} />
            </button>
            <div className="dpad-middle-row">
              <button 
                className="dpad-btn dpad-left" 
                onClick={() => handleDirection('LEFT')}
                aria-label="Sol"
              >
                <ArrowLeft size={28} />
              </button>
              <div className="dpad-center-hub" />
              <button 
                className="dpad-btn dpad-right" 
                onClick={() => handleDirection('RIGHT')}
                aria-label="Sağ"
              >
                <ArrowRight size={28} />
              </button>
            </div>
            <button 
              className="dpad-btn dpad-down" 
              onClick={() => handleDirection('DOWN')}
              aria-label="Aşağı"
            >
              <ArrowDown size={28} />
            </button>
          </div>

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="ingame-pause-overlay animate-pop">
              <div className="pause-dialog glass-card">
                <h3>Antrenman Duraklatıldı</h3>
                <p>Nefes alın, hazır olduğunuzda devam edin.</p>
                <div className="pause-actions">
                  <button className="btn btn-primary" onClick={togglePause}>
                    <Play size={18} />
                    <span>Devam Et</span>
                  </button>
                  <button className="btn btn-outline" onClick={onCancel}>
                    <span>Antrenmandan Çık</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Ended Results Modal */}
      {gameState === 'ended' && (
        <div className="game-modal-card glass-card animate-pop results-card">
          <div className="results-header">
            <div className="trophy-circle" style={{ background: 'var(--domain-attention-glow)' }}>
              <Compass size={48} color="var(--domain-attention)" />
            </div>
            <h2>Dikkat Seansı Tamamlandı!</h2>
            <p className="results-score-badge">Toplam Puan: <strong>{score}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Doğru Kuş</span>
              <span className="stat-num text-success">{correctCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hatalı</span>
              <span className="stat-num text-danger">{mistakeCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">İsabet Oranı</span>
              <span className="stat-num">%{accuracy}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Reaksiyon Hızı</span>
              <span className="stat-num">{avgReaction} ms</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Compass size={18} color="var(--domain-attention)" />
            <span>Dikkat LPI Artışı: <strong>+{Math.max(4, Math.round(score / 240))} Puan</strong></span>
          </div>

          <div className="results-actions">
            <button className="btn btn-outline" onClick={() => {
              setGameState('intro');
              setScore(0);
              setCorrectCount(0);
              setMistakeCount(0);
              setCombo(1);
            }}>
              <RotateCcw size={18} />
              <span>Tekrar Dene</span>
            </button>
            <button className="btn btn-primary" onClick={() => onFinish({
              score,
              accuracy,
              avgReactionMs: avgReaction
            })}>
              <Home size={18} />
              <span>Kaydet & Ana Sayfaya Dön</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
