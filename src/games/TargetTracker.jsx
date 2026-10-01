import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Timer, Flame, Award, RotateCcw, Home, Pause, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

const ARENA_WIDTH = 580;
const ARENA_HEIGHT = 350;
const BUBBLE_RADIUS = 24;

export function TargetTrackerGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(50);

  const [roundPhase, setRoundPhase] = useState('highlight'); // 'highlight', 'moving', 'selecting', 'evaluated'
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [targetCount, setTargetCount] = useState(3);
  const [foundTargets, setFoundTargets] = useState(0);
  const [level, setLevel] = useState(1);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [prePauseState, setPrePauseState] = useState(null);

  const animFrameRef = useRef(null);
  const bubblesRef = useRef([]);

  // Generate random non-overlapping bubbles
  const generateRound = useCallback((currentLevel) => {
    const totalBubbles = currentLevel >= 3 ? 9 : currentLevel >= 2 ? 8 : 7;
    const targetsNeeded = currentLevel >= 3 ? 4 : 3;
    setTargetCount(targetsNeeded);
    setFoundTargets(0);

    const newBubbles = [];
    const minDistance = BUBBLE_RADIUS * 2 + 10;

    for (let i = 0; i < totalBubbles; i++) {
      let x, y, overlapping;
      let attempts = 0;

      do {
        overlapping = false;
        x = BUBBLE_RADIUS + 15 + Math.random() * (ARENA_WIDTH - BUBBLE_RADIUS * 2 - 30);
        y = BUBBLE_RADIUS + 15 + Math.random() * (ARENA_HEIGHT - BUBBLE_RADIUS * 2 - 30);

        for (const b of newBubbles) {
          const dx = b.x - x;
          const dy = b.y - y;
          if (Math.hypot(dx, dy) < minDistance) {
            overlapping = true;
            break;
          }
        }
        attempts++;
      } while (overlapping && attempts < 100);

      // Random velocity
      const speedMultiplier = 1.1 + currentLevel * 0.25;
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * (1.2 + Math.random() * 0.8) * speedMultiplier;
      const vy = Math.sin(angle) * (1.2 + Math.random() * 0.8) * speedMultiplier;

      newBubbles.push({
        id: i,
        x,
        y,
        vx,
        vy,
        isTarget: i < targetsNeeded,
        status: 'normal', // 'normal', 'correct', 'wrong', 'missed'
        selected: false
      });
    }

    // Shuffle so targets are not just the first indices in DOM
    const shuffled = [...newBubbles].sort(() => Math.random() - 0.5);
    bubblesRef.current = shuffled;
    setBubbles(shuffled);
    setRoundPhase('highlight');
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
        setTimeLeft(50);
        setLevel(1);
        generateRound(1);
      }
    }
  }, [gameState, countdown, generateRound]);

  const finishGame = () => {
    sound.playFinish();
    setGameState('ended');
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
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

  // Round phase progression
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (roundPhase === 'highlight') {
      // Show targets in gold for 2.2 seconds
      const t = setTimeout(() => {
        setRoundPhase('moving');
        setPhaseTimer(5); // 5 seconds of tracking movement
      }, 2200);
      return () => clearTimeout(t);
    }

    if (roundPhase === 'moving') {
      // Countdown for tracking
      const timerInt = setInterval(() => {
        setPhaseTimer(p => {
          if (p <= 1) {
            clearInterval(timerInt);
            setRoundPhase('selecting');
            sound.playTap();
            return 0;
          }
          return p - 1;
        });
      }, 1000);
      return () => clearInterval(timerInt);
    }
  }, [gameState, roundPhase]);

  // Physics animation loop during 'moving' phase
  useEffect(() => {
    if (gameState !== 'playing' || roundPhase !== 'moving') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updatePhysics = () => {
      bubblesRef.current = bubblesRef.current.map(b => {
        let nextX = b.x + b.vx;
        let nextY = b.y + b.vy;
        let nextVx = b.vx;
        let nextVy = b.vy;

        // Bounce left & right
        if (nextX - BUBBLE_RADIUS <= 0) {
          nextX = BUBBLE_RADIUS;
          nextVx = -b.vx;
        } else if (nextX + BUBBLE_RADIUS >= ARENA_WIDTH) {
          nextX = ARENA_WIDTH - BUBBLE_RADIUS;
          nextVx = -b.vx;
        }

        // Bounce top & bottom
        if (nextY - BUBBLE_RADIUS <= 0) {
          nextY = BUBBLE_RADIUS;
          nextVy = -b.vy;
        } else if (nextY + BUBBLE_RADIUS >= ARENA_HEIGHT) {
          nextY = ARENA_HEIGHT - BUBBLE_RADIUS;
          nextVy = -b.vy;
        }

        return {
          ...b,
          x: nextX,
          y: nextY,
          vx: nextVx,
          vy: nextVy
        };
      });

      setBubbles([...bubblesRef.current]);
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, roundPhase]);

  // Handle clicking a bubble during 'selecting'
  const handleBubbleClick = (clickedId) => {
    if (gameState !== 'playing' || roundPhase !== 'selecting') return;

    const currentList = [...bubblesRef.current];
    const targetBubble = currentList.find(b => b.id === clickedId);
    if (!targetBubble || targetBubble.selected) return;

    targetBubble.selected = true;

    if (targetBubble.isTarget) {
      sound.playBubble();
      targetBubble.status = 'correct';
      const newFound = foundTargets + 1;
      setFoundTargets(newFound);
      setCorrectCount(c => c + 1);

      const pts = 120 * combo;
      setScore(s => s + pts);

      // Check if all targets found!
      if (newFound >= targetCount) {
        sound.playLevelUp();
        setCombo(c => {
          const next = Math.min(c + 1, 5);
          if (next > maxCombo) setMaxCombo(next);
          if (next >= 3) sound.playCombo(next);
          return next;
        });

        // Round bonus points
        setScore(s => s + (targetCount * 150) * combo);
        setRoundsCompleted(r => r + 1);
        setRoundPhase('evaluated');

        setTimeout(() => {
          setLevel(prevLvl => {
            const nextLvl = (roundsCompleted + 1) % 2 === 0 ? Math.min(prevLvl + 1, 4) : prevLvl;
            generateRound(nextLvl);
            return nextLvl;
          });
        }, 1200);
      }
    } else {
      sound.playWrong();
      targetBubble.status = 'wrong';
      setMistakeCount(m => m + 1);
      setCombo(1);

      // Show actual targets in evaluated state
      setRoundPhase('evaluated');
      currentList.forEach(b => {
        if (b.isTarget && !b.selected) {
          b.status = 'missed';
        }
      });

      setTimeout(() => {
        generateRound(level);
      }, 1500);
    }

    bubblesRef.current = currentList;
    setBubbles(currentList);
  };

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

  const totalClicks = correctCount + mistakeCount;
  const accuracy = totalClicks > 0 ? Math.round((correctCount / totalClicks) * 100) : 100;

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-attention)' }}>
            <div className="domain-badge-pill" style={{ background: 'rgba(0, 194, 168, 0.15)', color: '#00C2A8' }}>
              <Target size={16} />
              <span>Görsel Çoklu Nesne Takibi (MOT) & Dikkat</span>
            </div>
            <h2>Hedef Takibi (Target Tracker)</h2>
            <p className="game-subtitle">Ekranda beliren hedefleri aklınızda tutun, karmaşık hareket esnasında gözünüzle takip edin.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Tur başında birkaç küre altın renginde parıldayacak. <strong>Bu hedefleri aklınızda tutun!</strong></p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Tüm küreler aynı renge dönüşüp arenada hızla sekerek hareket ederken gözlerinizle hedefleri kaybetmeyin.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Hareket durduğunda işaretlenen orijinal hedeflere tıklayın. Eksiksiz buldukça seviye ve hız artar!</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00C2A8 0%, #008477 100%)' }} onClick={startCountdown}>
              Hazırım, Başla!
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle" style={{ borderColor: '#00C2A8', boxShadow: '0 0 35px rgba(0, 194, 168, 0.5)' }}>
            <span className="countdown-number" style={{ color: '#00C2A8' }}>{countdown}</span>
          </div>
          <p className="countdown-hint">Hedef kürelere odaklanın...</p>
        </div>
      )}

      {/* Playing & Paused Stage */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="game-board-container">
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={20} color={timeLeft <= 10 ? '#FF6B6B' : '#00C2A8'} />
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
              <p style={{ margin: '1rem 0 2rem', color: 'var(--text-secondary)' }}>Nefes alın ve hazır olduğunuzda devam edin.</p>
              <button className="btn btn-primary" onClick={togglePause}>
                <Play size={18} />
                <span>Devam Et</span>
              </button>
            </div>
          ) : (
            <div className="target-tracker-arena glass-card">
              {/* Status Banner */}
              <div className="mot-status-banner">
                {roundPhase === 'highlight' && (
                  <span className="mot-banner-text highlight-glow">
                    ★ HEDEFLERİ AKLINIZDA TUTUN ({targetCount} Adet)
                  </span>
                )}
                {roundPhase === 'moving' && (
                  <span className="mot-banner-text tracking-glow">
                    👁️ Gözünüzle Takip Edin... ({phaseTimer}s)
                  </span>
                )}
                {roundPhase === 'selecting' && (
                  <span className="mot-banner-text selecting-glow">
                    🎯 Orijinal Hedeflere Tıklayın ({foundTargets} / {targetCount})
                  </span>
                )}
                {roundPhase === 'evaluated' && (
                  <span className="mot-banner-text text-success">
                    {foundTargets >= targetCount ? '✓ Harika Takip! Seviye Yükseliyor...' : '✖ Hedef Kaçırıldı, Yeni Tur Başlıyor...'}
                  </span>
                )}
              </div>

              {/* 2D Physics Canvas Container */}
              <div className="mot-canvas-area" style={{ width: '100%', maxWidth: `${ARENA_WIDTH}px`, height: `${ARENA_HEIGHT}px`, position: 'relative' }}>
                {bubbles.map(bubble => {
                  let bubbleClass = 'mot-bubble';
                  let showTargetRing = false;

                  if (roundPhase === 'highlight') {
                    if (bubble.isTarget) {
                      bubbleClass += ' is-target-glow';
                      showTargetRing = true;
                    }
                  } else if (roundPhase === 'moving') {
                    bubbleClass += ' is-moving-anonymous';
                  } else if (roundPhase === 'selecting') {
                    if (bubble.status === 'correct') bubbleClass += ' is-correct';
                    else if (bubble.status === 'wrong') bubbleClass += ' is-wrong';
                    else bubbleClass += ' is-interactive';
                  } else if (roundPhase === 'evaluated') {
                    if (bubble.status === 'correct') bubbleClass += ' is-correct';
                    else if (bubble.status === 'wrong') bubbleClass += ' is-wrong';
                    else if (bubble.status === 'missed') bubbleClass += ' is-missed';
                  }

                  return (
                    <div
                      key={bubble.id}
                      className={bubbleClass}
                      style={{
                        left: `${bubble.x}px`,
                        top: `${bubble.y}px`,
                        transform: 'translate(-50%, -50%)',
                        cursor: roundPhase === 'selecting' && !bubble.selected ? 'pointer' : 'default'
                      }}
                      onClick={() => handleBubbleClick(bubble.id)}
                    >
                      {showTargetRing && <div className="target-pulse-ring" />}
                      <span className="bubble-core" />
                      {bubble.status === 'correct' && <CheckCircle2 size={16} color="#FFFFFF" />}
                      {bubble.status === 'wrong' && <AlertCircle size={16} color="#FFFFFF" />}
                    </div>
                  );
                })}
              </div>

              <div className="mot-footer-bar">
                <span className="mot-level-tag">Aşama {level}</span>
                <span className="mot-completed-tag">Tamamlanan Tur: {roundsCompleted}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'ended' && (
        <div className="game-modal-card glass-card animate-pop" style={{ textAlign: 'center' }}>
          <div className="results-badge">
            <Award size={64} color="#00C2A8" />
          </div>

          <h2 className="results-title">Seans Tamamlandı!</h2>
          <p className="results-subtitle">Görsel takip ve dinamik dikkat kapasiteniz başarıyla uyarılmıştır.</p>

          <div className="final-score-box">
            <span className="score-label">Toplam Skor</span>
            <span className="score-big" style={{ color: '#00C2A8' }}>{score}</span>
          </div>

          <div className="game-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Bulunan Hedefler</span>
              <span className="stat-num text-success">{correctCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hatalı Tıklama</span>
              <span className="stat-num text-danger">{mistakeCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">İsabet Oranı</span>
              <span className="stat-num">%{accuracy}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Maksimum Seri</span>
              <span className="stat-num">{maxCombo}x</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Target size={18} color="#00C2A8" />
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
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00C2A8 0%, #008477 100%)' }} onClick={() => onFinish({
              score,
              accuracy,
              roundsCompleted,
              correctCount
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
