import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wind, Timer, Flame, Award, RotateCcw, Home, Pause, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { sound } from '../utils/sound';

const DIRECTIONS = ['up', 'down', 'left', 'right'];

export function EbbAndFlowGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);

  // Trial properties
  const [rule, setRule] = useState('pointing'); // 'pointing' (Green) or 'moving' (Orange)
  const [leafPointing, setLeafPointing] = useState('up');
  const [leafMoving, setLeafMoving] = useState('right');
  const [ruleSwitched, setRuleSwitched] = useState(false);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
  const [prePauseState, setPrePauseState] = useState(null);

  const trialStartTimeRef = useRef(Date.now());
  const trialCountRef = useRef(0);
  const currentRuleRef = useRef('pointing');

  // Generate trial
  const generateTrial = useCallback(() => {
    trialCountRef.current += 1;

    // Rule switch logic: every 3-5 trials, switch between 'pointing' and 'moving'
    let newRule = currentRuleRef.current;
    let switched = false;

    if (trialCountRef.current > 1 && (trialCountRef.current % 4 === 0 || Math.random() < 0.28)) {
      newRule = currentRuleRef.current === 'pointing' ? 'moving' : 'pointing';
      currentRuleRef.current = newRule;
      switched = true;
    }

    // Pick random pointing and moving directions
    const pointing = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    // Make moving direction different 75% of the time to generate cognitive Stroop/flanker conflict
    let moving = pointing;
    if (Math.random() < 0.75) {
      const others = DIRECTIONS.filter(d => d !== pointing);
      moving = others[Math.floor(Math.random() * others.length)];
    }

    setRule(newRule);
    setLeafPointing(pointing);
    setLeafMoving(moving);
    setRuleSwitched(switched);
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
        trialCountRef.current = 0;
        currentRuleRef.current = 'pointing';
        generateTrial();
      }
    }
  }, [gameState, countdown, generateTrial]);

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

  // Evaluate user response
  const handleAnswer = useCallback((chosenDirection) => {
    if (gameState !== 'playing') return;

    const rt = Date.now() - trialStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const targetDirection = rule === 'pointing' ? leafPointing : leafMoving;
    const isCorrect = chosenDirection === targetDirection;

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

    setTimeout(() => setFeedback(null), 180);
    generateTrial();
  }, [gameState, rule, leafPointing, leafMoving, combo, maxCombo, generateTrial]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
          return;
        }
      }
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleAnswer('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleAnswer('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAnswer('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleAnswer('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswer]);

  const avgReaction = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  const accuracy = (correctCount + mistakeCount) > 0
    ? Math.round((correctCount / (correctCount + mistakeCount)) * 100)
    : 100;

  // Rotation style for leaf pointing
  const getRotation = (dir) => {
    switch (dir) {
      case 'up': return '0deg';
      case 'right': return '90deg';
      case 'down': return '180deg';
      case 'left': return '270deg';
      default: return '0deg';
    }
  };

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-flexibility)' }}>
            <div className="domain-badge-pill" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
              <Wind size={16} />
              <span>Görev Değiştirme (Task Switching) & Bilişsel Esneklik</span>
            </div>
            <h2>Gelgit Akışı (Ebb and Flow)</h2>
            <p className="game-subtitle">Rüzgarda savrulan yaprağın rengine göre kural değişir; zihninizi anında yeni kurala adapte edin.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num" style={{ background: '#10B981' }}>1</span>
              <p>
                <strong style={{ color: '#10B981' }}>YEŞİL YAPRAK:</strong> Yaprağın ucunun <strong>BAKTIĞI YÖNÜ</strong> tuşlayın.
              </p>
            </div>
            <div className="instruction-step">
              <span className="step-num" style={{ background: '#F97316' }}>2</span>
              <p>
                <strong style={{ color: '#F97316' }}>TURUNCU YAPRAK:</strong> Yaprağın ekranda <strong>HAREKET ETTİĞİ (SÜRÜKLENDİĞİ) YÖNÜ</strong> tuşlayın.
              </p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Klavyenizdeki <strong>Yön Tuşlarını (↑, ↓, ←, →)</strong> veya aşağıdaki butonları kullanın.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)' }} onClick={startCountdown}>
              Hazırım, Başla!
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle" style={{ borderColor: '#A855F7', boxShadow: '0 0 35px rgba(168, 85, 247, 0.5)' }}>
            <span className="countdown-number" style={{ color: '#A855F7' }}>{countdown}</span>
          </div>
          <p className="countdown-hint">Yeşil = Baktığı Yön | Turuncu = Hareket Yönü</p>
        </div>
      )}

      {/* Playing & Paused Stage */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="game-board-container">
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={20} color={timeLeft <= 10 ? '#FF6B6B' : '#A855F7'} />
              <div className="hud-stat">
                <span className="hud-label">Süre</span>
                <span className={`hud-val ${timeLeft <= 10 ? 'time-warning' : ''}`}>{timeLeft}s</span>
              </div>
            </div>

            <div className="hud-metric">
              <Flame size={20} color="#FF9F1C" />
              <div className="hud-stat">
                <span className="hud-label">Çarpan</span>
                <span className="hud-val combo-val">{combo}x</span>
              </div>
            </div>

            <div className="hud-metric">
              <Award size={20} color="#FDCB6E" />
              <div className="hud-stat">
                <span className="hud-label">Puan</span>
                <span className="hud-val score-val">{score}</span>
              </div>
            </div>

            <button className="btn-icon-pause" onClick={togglePause} aria-label={gameState === 'paused' ? 'Devam Et' : 'Duraklat'}>
              {gameState === 'paused' ? <Play size={18} /> : <Pause size={18} />}
            </button>
          </div>

          {gameState === 'paused' ? (
            <div className="pause-overlay glass-card animate-pop" style={{ textAlign: 'center', padding: '3rem' }}>
              <h2>Oyun Duraklatıldı</h2>
              <p style={{ margin: '1rem 0 2rem', color: 'var(--text-secondary)' }}>Hazır olduğunuzda devam edin.</p>
              <button className="btn btn-primary" onClick={togglePause}>
                <Play size={18} />
                <span>Devam Et</span>
              </button>
            </div>
          ) : (
            <div className={`ebb-arena glass-card ${feedback ? `feedback-${feedback}` : ''}`}>
              {/* Active Rule Guidance Banner */}
              <div className={`ebb-rule-banner ${rule === 'pointing' ? 'rule-pointing-active' : 'rule-moving-active'}`}>
                {rule === 'pointing' ? (
                  <span className="ebb-rule-text">
                    🌿 <strong>YEŞİL:</strong> Yaprağın <u>BAKTIĞI YÖNÜ</u> Seçin!
                  </span>
                ) : (
                  <span className="ebb-rule-text">
                    🍁 <strong>TURUNCU:</strong> Yaprağın <u>HAREKET ETTİĞİ YÖNÜ</u> Seçin!
                  </span>
                )}
                {ruleSwitched && <span className="ebb-switched-badge animate-pop">KURAL DEĞİŞTİ!</span>}
              </div>

              {/* Dynamic Leaf Stream Simulation */}
              <div className="ebb-stream-viewport">
                <div className={`ebb-leaf-container drift-${leafMoving}`}>
                  <svg
                    className={`ebb-leaf-svg ${rule === 'pointing' ? 'leaf-green' : 'leaf-orange'}`}
                    style={{ transform: `rotate(${getRotation(leafPointing)})` }}
                    viewBox="0 0 100 100"
                    width="100"
                    height="100"
                  >
                    {/* Stylized organic pointed leaf */}
                    <defs>
                      <linearGradient id="leafGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="leafGradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <filter id="leafGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={rule === 'pointing' ? '#10B981' : '#F97316'} floodOpacity="0.6" />
                      </filter>
                    </defs>

                    <path
                      d="M 50 10 Q 85 45 50 90 Q 15 45 50 10 Z"
                      fill={rule === 'pointing' ? 'url(#leafGradGreen)' : 'url(#leafGradOrange)'}
                      filter="url(#leafGlow)"
                    />
                    {/* Leaf center vein & pointer arrow notch */}
                    <line x1="50" y1="20" x2="50" y2="85" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round" />
                    <polyline points="42,32 50,18 58,32" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Wind drift particles */}
                <div className={`ebb-wind-trails drift-${leafMoving}`}>
                  <span className="wind-line line-1" />
                  <span className="wind-line line-2" />
                  <span className="wind-line line-3" />
                </div>
              </div>

              {/* On-screen Directional D-Pad Controls */}
              <div className="ebb-controls-dpad">
                <div className="dpad-row dpad-row-top">
                  <button className="dpad-btn" onClick={() => handleAnswer('up')} aria-label="Yukarı">
                    <ArrowUp size={24} />
                  </button>
                </div>
                <div className="dpad-row dpad-row-mid">
                  <button className="dpad-btn" onClick={() => handleAnswer('left')} aria-label="Sol">
                    <ArrowLeft size={24} />
                  </button>
                  <div className="dpad-center-guide">
                    <span>{rule === 'pointing' ? 'Baktığı Yön' : 'Hareket Yönü'}</span>
                  </div>
                  <button className="dpad-btn" onClick={() => handleAnswer('right')} aria-label="Sağ">
                    <ArrowRight size={24} />
                  </button>
                </div>
                <div className="dpad-row dpad-row-bot">
                  <button className="dpad-btn" onClick={() => handleAnswer('down')} aria-label="Aşağı">
                    <ArrowDown size={24} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'ended' && (
        <div className="game-modal-card glass-card animate-pop" style={{ textAlign: 'center' }}>
          <div className="results-badge">
            <Award size={64} color="#A855F7" />
          </div>

          <h2 className="results-title">Seans Tamamlandı!</h2>
          <p className="results-subtitle">Zihinsel esneklik ve görev değiştirme refleksiniz başarıyla geliştirildi.</p>

          <div className="final-score-box">
            <span className="score-label">Toplam Skor</span>
            <span className="score-big" style={{ color: '#A855F7' }}>{score}</span>
          </div>

          <div className="game-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Doğru Hamle</span>
              <span className="stat-num text-success">{correctCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hatalı Hamle</span>
              <span className="stat-num text-danger">{mistakeCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">İsabet Oranı</span>
              <span className="stat-num">%{accuracy}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Ortalama Reaksiyon</span>
              <span className="stat-num">{avgReaction} ms</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Wind size={18} color="#A855F7" />
            <span>Esneklik LPI Artışı: <strong>+{Math.max(4, Math.round(score / 230))} Puan</strong></span>
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
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)' }} onClick={() => onFinish({
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
