import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Timer, Flame, CheckCircle2, XCircle, ArrowLeft, ArrowRight, RotateCcw, Award, Home, Pause, Play } from 'lucide-react';
import { sound } from '../utils/sound';

// Aesthetic SVG geometric symbols with glowing gradients
const SHAPES = [
  { id: 'circle', name: 'Daire', color: '#FF9F1C', svg: (color) => <circle cx="60" cy="60" r="42" fill={color} /> },
  { id: 'triangle', name: 'Üçgen', color: '#00B894', svg: (color) => <polygon points="60,18 102,96 18,96" fill={color} /> },
  { id: 'square', name: 'Kare', color: '#0984E3', svg: (color) => <rect x="22" y="22" width="76" height="76" rx="14" fill={color} /> },
  { id: 'diamond', name: 'Baklava', color: '#E84393', svg: (color) => <polygon points="60,16 104,60 60,104 16,60" fill={color} /> },
  { id: 'star', name: 'Yıldız', color: '#FDCB6E', svg: (color) => <polygon points="60,14 73,46 108,48 81,71 89,104 60,86 31,104 39,71 12,48 47,46" fill={color} /> },
  { id: 'hexagon', name: 'Altıgen', color: '#6C5CE7', svg: (color) => <polygon points="60,16 98,38 98,82 60,104 22,82 22,38" fill={color} /> }
];

export function SpeedMatchGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);
  
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [previousSymbol, setPreviousSymbol] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

  const [lastFeedback, setLastFeedback] = useState(null); // 'correct', 'wrong'
  const [reactionTimes, setReactionTimes] = useState([]);
  const [prePauseState, setPrePauseState] = useState(null);
  const cardStartTimeRef = useRef(Date.now());

  // Generate next symbol (approx 45% probability of matching previous)
  const getNextSymbol = (prev) => {
    if (!prev) {
      return SHAPES[Math.floor(Math.random() * SHAPES.length)];
    }
    const shouldMatch = Math.random() < 0.45;
    if (shouldMatch) {
      return prev;
    }
    const otherShapes = SHAPES.filter(s => s.id !== prev.id);
    return otherShapes[Math.floor(Math.random() * otherShapes.length)];
  };

  const startCountdown = () => {
    sound.playTap();
    setGameState('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        sound.playCountdown();
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        sound.playStart();
        setGameState('playing');
        setTimeLeft(45);
        const first = getNextSymbol(null);
        setCurrentSymbol(first);
        setPreviousSymbol(null);
        setCardIndex(0);
        cardStartTimeRef.current = Date.now();
      }
    }
  }, [gameState, countdown]);

  const finishGame = () => {
    sound.playFinish();
    setGameState('ended');
  };

  // Main game timer
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
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

  // Player action handler
  const handleAnswer = useCallback((playerSaysMatches) => {
    if (gameState !== 'playing' || !currentSymbol) return;

    // First card is reference card
    if (cardIndex === 0) {
      setPreviousSymbol(currentSymbol);
      const next = getNextSymbol(currentSymbol);
      setCurrentSymbol(next);
      setCardIndex(1);
      cardStartTimeRef.current = Date.now();
      sound.playTap();
      return;
    }

    const reactionTime = Date.now() - cardStartTimeRef.current;
    setReactionTimes(prev => [...prev, reactionTime]);

    const actuallyMatches = previousSymbol && currentSymbol.id === previousSymbol.id;
    const isCorrect = playerSaysMatches === actuallyMatches;

    if (isCorrect) {
      sound.playCorrect();
      setCorrectCount(c => c + 1);
      const points = 100 * combo;
      setScore(s => s + points);
      setCombo(c => {
        const nextCombo = Math.min(c + 1, 5);
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);
        if (nextCombo >= 3) sound.playCombo(nextCombo);
        return nextCombo;
      });
      setLastFeedback('correct');
    } else {
      sound.playWrong();
      setMistakeCount(m => m + 1);
      setCombo(1);
      setLastFeedback('wrong');
    }

    setTimeout(() => setLastFeedback(null), 250);

    // Advance to next card
    setPreviousSymbol(currentSymbol);
    const next = getNextSymbol(currentSymbol);
    setCurrentSymbol(next);
    setCardIndex(i => i + 1);
    cardStartTimeRef.current = Date.now();
  }, [gameState, currentSymbol, previousSymbol, cardIndex, combo, maxCombo]);

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
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAnswer(false); // Farklı
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAnswer(true); // Aynı
      } else if (e.key === ' ' && cardIndex === 0) {
        e.preventDefault();
        handleAnswer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cardIndex, handleAnswer]);

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
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-speed)' }}>
            <div className="domain-badge-pill" style={{ background: 'var(--domain-speed-glow)', color: 'var(--domain-speed)' }}>
              <Zap size={16} />
              <span>Hız & İşlem Kapasitesi</span>
            </div>
            <h2>Hız Eşleştirme (Speed Match)</h2>
            <p className="game-subtitle">Görsel işlem hızınızı ve anlık reaksiyon kapasitenizi test edin.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Ekranda sırayla geometrik semboller belirecektir.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Mevcut sembolün, <strong>bir önceki sembolle aynı</strong> olup olmadığını karar verin.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Klavyenizdeki <strong>Sol Ok [← Farklı]</strong> veya <strong>Sağ Ok [Aynı →]</strong> tuşlarını kullanabilirsiniz.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-speed" onClick={startCountdown}>
              <span>Antrenmana Başla (45sn)</span>
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown > 0 ? countdown : 'BAŞLA!'}</span>
          </div>
          <p className="countdown-hint">İlk sembolü aklında tut...</p>
        </div>
      )}

      {/* Main Playing Stage */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className={`game-board-container ${lastFeedback === 'wrong' ? 'animate-shake' : ''}`}>
          {/* Top HUD */}
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={18} className="hud-icon" color="#38BDF8" />
              <div className="hud-stat">
                <span className="hud-label">Kalan Süre</span>
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

          {/* Symbol Display Arena */}
          <div className={`symbol-arena glass-card ${lastFeedback === 'correct' ? 'feedback-correct' : lastFeedback === 'wrong' ? 'feedback-wrong' : ''}`}>
            {cardIndex === 0 ? (
              <div className="reference-card-indicator">
                <span className="ref-pill">BAŞLANGIÇ REFERANS SEMBOLÜ</span>
                <p className="ref-desc">Bu şekli aklında tut, bir sonraki şekille karşılaştıracaksın!</p>
              </div>
            ) : (
              <div className="comparison-prompt">
                <span>Bir önceki sembolle <strong>AYNI MI?</strong></span>
              </div>
            )}

            <div className="symbol-viewport">
              {currentSymbol && (
                <svg viewBox="0 0 120 120" className="animated-shape">
                  <defs>
                    <filter id="shape-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={currentSymbol.color} floodOpacity="0.5" />
                    </filter>
                  </defs>
                  <g filter="url(#shape-glow)">
                    {currentSymbol.svg(currentSymbol.color)}
                  </g>
                </svg>
              )}
            </div>

            <div className="symbol-meta">
              <span className="symbol-label">{currentSymbol?.name}</span>
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="decision-controls">
            {cardIndex === 0 ? (
              <button 
                className="btn btn-primary btn-large-start"
                onClick={() => handleAnswer(false)}
              >
                <span>Anladım, Karşılaştırmaya Başla! (Boşluk / Tıkla)</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-decision btn-diff"
                  onClick={() => handleAnswer(false)}
                >
                  <div className="btn-decision-inner">
                    <ArrowLeft size={24} />
                    <div>
                      <span className="decision-title">FARKLI</span>
                      <span className="decision-key">Sol Ok [←]</span>
                    </div>
                  </div>
                </button>

                <button 
                  className="btn btn-decision btn-same"
                  onClick={() => handleAnswer(true)}
                >
                  <div className="btn-decision-inner">
                    <div>
                      <span className="decision-title">AYNI</span>
                      <span className="decision-key">Sağ Ok [→]</span>
                    </div>
                    <ArrowRight size={24} />
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="ingame-pause-overlay animate-pop">
              <div className="pause-dialog glass-card">
                <h3>Antrenman Duraklatıldı</h3>
                <p>Nefes alın, hazır olduğunuzda devam edin.</p>
                <div className="pause-actions">
                  <button className="btn btn-speed" onClick={togglePause}>
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
            <div className="trophy-circle" style={{ background: 'var(--domain-speed-glow)' }}>
              <Award size={48} color="var(--domain-speed)" />
            </div>
            <h2>Hız Seansı Tamamlandı!</h2>
            <p className="results-score-badge">Toplam Puan: <strong>{score}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Doğru Eşleşme</span>
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
              <span className="stat-label">Ort. Reaksiyon</span>
              <span className="stat-num">{avgReaction} ms</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Zap size={18} color="var(--domain-speed)" />
            <span>Hız LPI Artışı: <strong>+{Math.max(4, Math.round(score / 220))} Puan</strong></span>
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
              <span>Tekrar Oyna</span>
            </button>
            <button className="btn btn-speed" onClick={() => onFinish({
              score,
              correctCount,
              mistakeCount,
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
