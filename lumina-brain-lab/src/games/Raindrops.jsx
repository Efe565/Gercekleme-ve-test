import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CloudRain, Timer, Flame, Award, RotateCcw, Home, Pause, Play, Delete, Check, Droplets } from 'lucide-react';
import { sound } from '../utils/sound';

const ARENA_WIDTH = 560;
const ARENA_HEIGHT = 380;
const WATERLINE_Y = 320; // Y coordinate where drops splash into ocean

export function RaindropsGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(50);
  const [lives, setLives] = useState(3);

  const [drops, setDrops] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [splashEvent, setSplashEvent] = useState(null); // { x, y }

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [solvedCount, setSolvedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [prePauseState, setPrePauseState] = useState(null);

  const animFrameRef = useRef(null);
  const dropsRef = useRef([]);
  const nextDropIdRef = useRef(1);
  const lastSpawnTimeRef = useRef(0);

  // Generate a random math problem
  const createProblem = () => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let text = '';
    let answer = 0;

    if (op === '+') {
      const a = Math.floor(Math.random() * 20) + 3;
      const b = Math.floor(Math.random() * 20) + 3;
      text = `${a} + ${b}`;
      answer = a + b;
    } else if (op === '-') {
      const a = Math.floor(Math.random() * 25) + 10;
      const b = Math.floor(Math.random() * (a - 3)) + 2;
      text = `${a} - ${b}`;
      answer = a - b;
    } else if (op === '×') {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      text = `${a} × ${b}`;
      answer = a * b;
    } else { // '÷'
      const b = Math.floor(Math.random() * 8) + 2;
      const ans = Math.floor(Math.random() * 9) + 2;
      const a = b * ans;
      text = `${a} ÷ ${b}`;
      answer = ans;
    }

    return { text, answer };
  };

  const spawnDrop = useCallback(() => {
    const { text, answer } = createProblem();
    const x = 50 + Math.random() * (ARENA_WIDTH - 120);
    const speed = 0.55 + Math.random() * 0.45;

    const newDrop = {
      id: nextDropIdRef.current++,
      text,
      answer,
      x,
      y: 10,
      speed,
      popped: false
    };

    dropsRef.current = [...dropsRef.current, newDrop];
    setDrops([...dropsRef.current]);
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
        setLives(3);
        dropsRef.current = [];
        setDrops([]);
        setInputVal('');
        lastSpawnTimeRef.current = Date.now();
        spawnDrop();
      }
    }
  }, [gameState, countdown, spawnDrop]);

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

  // Main game animation & falling physics loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updateLoop = () => {
      const now = Date.now();

      // Spawn new drop every ~2.5 - 3.2 seconds if fewer than 4 drops active
      const activeCount = dropsRef.current.filter(d => !d.popped).length;
      if (activeCount < 3 && now - lastSpawnTimeRef.current > 2400) {
        spawnDrop();
        lastSpawnTimeRef.current = now;
      }

      // Move drops down
      let splashOccurred = false;
      const updated = [];

      dropsRef.current.forEach(d => {
        if (d.popped) return;

        const nextY = d.y + d.speed;

        // Check if reached waterline
        if (nextY >= WATERLINE_Y) {
          splashOccurred = true;
          sound.playWrong();
          setMissedCount(m => m + 1);
          setCombo(1);
          setLives(l => {
            const nextL = l - 1;
            if (nextL <= 0) {
              finishGame();
            }
            return nextL;
          });
          setSplashEvent({ x: d.x, y: WATERLINE_Y });
          setTimeout(() => setSplashEvent(null), 400);
        } else {
          updated.push({ ...d, y: nextY });
        }
      });

      dropsRef.current = updated;
      setDrops(updated);

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, spawnDrop]);

  // Check matching input
  const checkAnswerMatch = useCallback((valStr) => {
    if (!valStr) return;
    const num = parseInt(valStr, 10);
    if (isNaN(num)) return;

    // Find if any drop matches
    const matchIdx = dropsRef.current.findIndex(d => !d.popped && d.answer === num);

    if (matchIdx !== -1) {
      sound.playBubble();
      const matched = dropsRef.current[matchIdx];
      matched.popped = true;

      // Points based on remaining height (the higher, the more points)
      const heightBonus = Math.max(50, Math.round(WATERLINE_Y - matched.y));
      const points = (100 + heightBonus) * combo;

      setScore(s => s + points);
      setSolvedCount(c => c + 1);
      setCombo(c => {
        const next = Math.min(c + 1, 5);
        if (next > maxCombo) setMaxCombo(next);
        if (next >= 3) sound.playCombo(next);
        return next;
      });

      // Remove popped drop
      dropsRef.current = dropsRef.current.filter((_, idx) => idx !== matchIdx);
      setDrops([...dropsRef.current]);
      setInputVal('');
    }
  }, [combo, maxCombo]);

  const handleKeyPress = (digit) => {
    if (gameState !== 'playing') return;
    sound.playTap();
    setInputVal(prev => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      checkAnswerMatch(next);
      return next;
    });
  };

  const handleBackspace = () => {
    if (gameState !== 'playing') return;
    sound.playTap();
    setInputVal(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (gameState !== 'playing') return;
    sound.playTap();
    setInputVal('');
  };

  // Keyboard support (0-9, Backspace, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
          return;
        }
      }
      if (gameState !== 'playing') return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        checkAnswerMatch(inputVal);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, inputVal, checkAnswerMatch]);

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

  const totalDrops = solvedCount + missedCount;
  const accuracy = totalDrops > 0 ? Math.round((solvedCount / totalDrops) * 100) : 100;

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-problem-solving)' }}>
            <div className="domain-badge-pill" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <CloudRain size={16} />
              <span>Hızlı Zihinsel Aritmetik & Sayısal Sezgi</span>
            </div>
            <h2>Yağmur Damlaları (Raindrops)</h2>
            <p className="game-subtitle">Bulutlardan süzülen matematik damlalarını denize ulaşmadan önce zihninizde çözüp patlatın.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Her yağmur damlasının içinde bir matematik işlemi (toplama, çıkarma, çarpma, bölme) bulunur.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Doğru sonucu klavyenizdeki rakamlarla veya ekrandaki tuş takımıyla girin. Cevap eşleştiğinde damla anında patlar!</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Damlaların aşağıdaki su seviyesine düşmesine izin vermeyin; canlarınızı ve çarpanınızı koruyun!</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }} onClick={startCountdown}>
              Hazırım, Başla!
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle" style={{ borderColor: '#3B82F6', boxShadow: '0 0 35px rgba(59, 130, 246, 0.5)' }}>
            <span className="countdown-number" style={{ color: '#3B82F6' }}>{countdown}</span>
          </div>
          <p className="countdown-hint">Zihinsel hesaplamaya hazır olun...</p>
        </div>
      )}

      {/* Playing & Paused Stage */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="game-board-container">
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={20} color={timeLeft <= 10 ? '#FF6B6B' : '#3B82F6'} />
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
              <Droplets size={20} color="#00C2A8" />
              <div className="hud-stat">
                <span className="hud-label">Can</span>
                <span className="hud-val" style={{ color: lives === 1 ? '#EF4444' : '#10B981' }}>
                  {'💧'.repeat(lives)}
                </span>
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
            <div className="raindrops-arena glass-card">
              {/* Sky Clouds Header */}
              <div className="raindrops-sky">
                <div className="cloud-bubble cloud-1" />
                <div className="cloud-bubble cloud-2" />
                <div className="cloud-bubble cloud-3" />
              </div>

              {/* Falling Drops Viewport */}
              <div className="raindrops-viewport" style={{ width: '100%', maxWidth: `${ARENA_WIDTH}px`, height: `${ARENA_HEIGHT}px`, position: 'relative' }}>
                {drops.map(drop => (
                  <div
                    key={drop.id}
                    className="raindrop-item animate-pop"
                    style={{
                      left: `${drop.x}px`,
                      top: `${drop.y}px`
                    }}
                  >
                    <div className="raindrop-body">
                      <span className="raindrop-text">{drop.text}</span>
                    </div>
                  </div>
                ))}

                {/* Ocean Splash FX */}
                {splashEvent && (
                  <div className="water-splash-fx animate-pop" style={{ left: `${splashEvent.x}px`, top: `${splashEvent.y - 20}px` }}>
                    💦
                  </div>
                )}

                {/* Ocean Waterline at Bottom */}
                <div className="ocean-waterline">
                  <div className="ocean-wave-crest" />
                  <span className="waterline-label">Okyanus Hattı</span>
                </div>
              </div>

              {/* Numpad & Input Display */}
              <div className="raindrops-controls">
                <div className="raindrop-input-display">
                  <span className="input-prompt">Cevabınız:</span>
                  <strong className="active-typed-val">{inputVal || '_'}</strong>
                </div>

                <div className="virtual-numpad-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button key={n} className="numpad-btn" onClick={() => handleKeyPress(n.toString())}>
                      {n}
                    </button>
                  ))}
                  <button className="numpad-btn numpad-clear" onClick={handleClear} aria-label="Temizle">
                    C
                  </button>
                  <button key={0} className="numpad-btn" onClick={() => handleKeyPress('0')}>
                    0
                  </button>
                  <button className="numpad-btn numpad-del" onClick={handleBackspace} aria-label="Geri">
                    <Delete size={20} />
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
            <Award size={64} color="#3B82F6" />
          </div>

          <h2 className="results-title">Seans Tamamlandı!</h2>
          <p className="results-subtitle">Zihinsel aritmetik hızınız ve işlem belleğiniz başarıyla test edildi.</p>

          <div className="final-score-box">
            <span className="score-label">Toplam Skor</span>
            <span className="score-big" style={{ color: '#3B82F6' }}>{score}</span>
          </div>

          <div className="game-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Çözülen Damla</span>
              <span className="stat-num text-success">{solvedCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Kaçan Damla</span>
              <span className="stat-num text-danger">{missedCount}</span>
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
            <CloudRain size={18} color="#3B82F6" />
            <span>Problem Çözme LPI Artışı: <strong>+{Math.max(4, Math.round(score / 240))} Puan</strong></span>
          </div>

          <div className="results-actions">
            <button className="btn btn-outline" onClick={() => {
              setGameState('intro');
              setScore(0);
              setSolvedCount(0);
              setMissedCount(0);
              setCombo(1);
            }}>
              <RotateCcw size={18} />
              <span>Tekrar Dene</span>
            </button>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }} onClick={() => onFinish({
              score,
              accuracy,
              solvedCount
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
