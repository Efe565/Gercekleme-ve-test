import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gem, Timer, Flame, Award, RotateCcw, Home, Pause, Play, Sparkles, Waves } from 'lucide-react';
import { sound } from '../utils/sound';

const TREASURE_POOL = [
  { id: 'shell', name: 'Deniz Kabuğu', emoji: '🐚', color: '#FCD34D' },
  { id: 'starfish', name: 'Denizyıldızı', emoji: '⭐', color: '#F87171' },
  { id: 'gem', name: 'Mavi Safir', emoji: '💎', color: '#60A5FA' },
  { id: 'coin', name: 'Altın Sikke', emoji: '🪙', color: '#FBBF24' },
  { id: 'compass', name: 'Antik Pusula', emoji: '🧭', color: '#34D399' },
  { id: 'anchor', name: 'Gemi Çapası', emoji: '⚓', color: '#94A3B8' },
  { id: 'bottle', name: 'Mesaj Şişesi', emoji: '🍾', color: '#A78BFA' },
  { id: 'crab', name: 'Mercan Yengeci', emoji: '🦀', color: '#FB7185' },
  { id: 'key', name: 'Batık Anahtar', emoji: '🗝️', color: '#F59E0B' },
  { id: 'orb', name: 'Kristal Küre', emoji: '🔮', color: '#C084FC' },
  { id: 'crown', name: 'Korsan Tacı', emoji: '👑', color: '#FBBF24' },
  { id: 'coral', name: 'Mor Mercan', emoji: '🪸', color: '#F472B6' },
  { id: 'pearl', name: 'İstiridye İncisi', emoji: '🦪', color: '#E2E8F0' },
  { id: 'fish', name: 'Tropik Balık', emoji: '🐠', color: '#38BDF8' }
];

export function TidalTreasuresGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(50);

  const [visibleItems, setVisibleItems] = useState([]);
  const [clickedItemIds, setClickedItemIds] = useState(new Set());
  const [tideWashing, setTideWashing] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [prePauseState, setPrePauseState] = useState(null);

  const clickedItemsRef = useRef(new Set());

  // Generate round items
  // Ensure that at least 1 or 2 UNCLICKED items are present, plus several previously clicked items
  const generateTideRound = useCallback(() => {
    const clickedSet = clickedItemsRef.current;
    const unclickedPool = TREASURE_POOL.filter(item => !clickedSet.has(item.id));
    const alreadyClickedPool = TREASURE_POOL.filter(item => clickedSet.has(item.id));

    // If all items are clicked, reset clicked pool to start fresh wave!
    let effectiveUnclicked = unclickedPool;
    if (effectiveUnclicked.length === 0) {
      clickedSet.clear();
      effectiveUnclicked = [...TREASURE_POOL];
      setClickedItemIds(new Set());
    }

    // Determine how many items to display: 4 at start, up to 7 as memory load increases
    const totalSlots = Math.min(4 + Math.floor(clickedSet.size / 3), 7);

    // Pick 1 or 2 unclicked items
    const guaranteedUnclickedCount = Math.min(Math.floor(Math.random() * 2) + 1, effectiveUnclicked.length);
    const shuffledUnclicked = [...effectiveUnclicked].sort(() => Math.random() - 0.5);
    const pickedUnclicked = shuffledUnclicked.slice(0, guaranteedUnclickedCount);

    // Fill remaining slots with already clicked items if available, or more unclicked items
    const remainingSlots = totalSlots - pickedUnclicked.length;
    const shuffledClicked = [...alreadyClickedPool].sort(() => Math.random() - 0.5);
    const pickedClicked = shuffledClicked.slice(0, remainingSlots);

    // If still have empty slots, fill with remaining unclicked items
    let roundItems = [...pickedUnclicked, ...pickedClicked];
    if (roundItems.length < totalSlots) {
      const restUnclicked = shuffledUnclicked.slice(guaranteedUnclickedCount);
      roundItems = [...roundItems, ...restUnclicked.slice(0, totalSlots - roundItems.length)];
    }

    // Shuffle the final round items so their positions change
    roundItems.sort(() => Math.random() - 0.5);
    setVisibleItems(roundItems);
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
        clickedItemsRef.current = new Set();
        setClickedItemIds(new Set());
        generateTideRound();
      }
    }
  }, [gameState, countdown, generateTideRound]);

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

  // Handle player clicking an item
  const handleItemClick = (item) => {
    if (gameState !== 'playing' || tideWashing) return;

    const alreadyClicked = clickedItemsRef.current.has(item.id);

    if (!alreadyClicked) {
      // CORRECT! New unclicked item
      sound.playBubble();
      clickedItemsRef.current.add(item.id);
      setClickedItemIds(new Set(clickedItemsRef.current));

      const points = 120 * combo + (clickedItemsRef.current.size * 20);
      setScore(s => s + points);
      setCorrectCount(c => c + 1);

      setCombo(c => {
        const next = Math.min(c + 1, 5);
        if (next > maxCombo) setMaxCombo(next);
        if (next >= 3) sound.playCombo(next);
        return next;
      });

      setFeedback('correct');

      // Wave wash animation
      setTideWashing(true);
      setTimeout(() => {
        setFeedback(null);
        generateTideRound();
        setTideWashing(false);
      }, 400);

    } else {
      // WRONG! Already clicked before
      sound.playWrong();
      setMistakeCount(m => m + 1);
      setCombo(1);
      setFeedback('wrong');

      setTimeout(() => {
        setFeedback(null);
      }, 500);
    }
  };

  const totalMoves = correctCount + mistakeCount;
  const accuracy = totalMoves > 0 ? Math.round((correctCount / totalMoves) * 100) : 100;
  const memoryLoad = clickedItemIds.size;

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-memory)' }}>
            <div className="domain-badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Gem size={16} />
              <span>Sürekli Olay Belleği (Episodic Memory) & Tanıma</span>
            </div>
            <h2>Deniz Hazineleri (Tidal Treasures)</h2>
            <p className="game-subtitle">Sahile vuran hazineleri aklınızda tutun; her turda daha önce HİÇ seçmediğiniz yeni bir nesneye tıklayın.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Sahilde birkaç deniz hazinesi belirecek (denizyıldızı, inci, sikke, pusula vb.).</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Altın Kural: <strong>Bu oyun boyunca DAHA ÖNCE HİÇ TIKLAMADIĞINIZ bir nesneyi bulun ve seçin!</strong></p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Doğru seçtiğinizde dalga kıyıya vurur ve yeni hazineler getirir. Daha önce seçtiğiniz bir nesneye tıklarsanız seriniz sıfırlanır!</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} onClick={startCountdown}>
              Hazırım, Başla!
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle" style={{ borderColor: '#10B981', boxShadow: '0 0 35px rgba(16, 185, 129, 0.5)' }}>
            <span className="countdown-number" style={{ color: '#10B981' }}>{countdown}</span>
          </div>
          <p className="countdown-hint">Daha önce hiç tıklanmamış hazineyi bulun...</p>
        </div>
      )}

      {/* Playing & Paused Stage */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="game-board-container">
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <Timer size={20} color={timeLeft <= 10 ? '#FF6B6B' : '#10B981'} />
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
              <Sparkles size={20} color="#10B981" />
              <div className="hud-stat">
                <span className="hud-label">Hafızada</span>
                <span className="hud-val" style={{ color: '#10B981' }}>{memoryLoad} Nesne</span>
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
            <div className={`tidal-arena glass-card ${feedback ? `feedback-${feedback}` : ''}`}>
              {/* Shoreline Status Header */}
              <div className="tidal-rule-banner">
                <Waves size={20} color="#38BDF8" className="animate-pulse" />
                <span className="tidal-prompt-text">
                  Daha önce <strong>HİÇ TIKLAMADIĞINIZ</strong> bir nesneyi seçin!
                </span>
              </div>

              {/* Beach Sand Tiles Grid */}
              <div className={`tidal-shore-grid ${tideWashing ? 'tide-washing-active' : ''}`}>
                {visibleItems.map(item => (
                  <button
                    key={item.id}
                    className="treasure-card animate-pop"
                    onClick={() => handleItemClick(item)}
                    disabled={tideWashing}
                  >
                    <div className="treasure-emoji-box">
                      <span className="treasure-emoji">{item.emoji}</span>
                    </div>
                    <span className="treasure-name">{item.name}</span>
                  </button>
                ))}
              </div>

              {/* Water wave sweep animation overlay */}
              {tideWashing && (
                <div className="tide-wave-overlay">
                  <div className="wave-foam" />
                </div>
              )}

              {/* Footer memory chain tracker */}
              <div className="tidal-footer-stats">
                <span>Zincir Uzunluğu: <strong>{memoryLoad} Farklı Nesne</strong></span>
                <span className="tidal-hint">Aynı nesneye iki kez basmayın!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'ended' && (
        <div className="game-modal-card glass-card animate-pop" style={{ textAlign: 'center' }}>
          <div className="results-badge">
            <Award size={64} color="#10B981" />
          </div>

          <h2 className="results-title">Seans Tamamlandı!</h2>
          <p className="results-subtitle">Sürekli tanıma belleği ve nesne takibi kapasiteniz başarıyla uyarılmıştır.</p>

          <div className="final-score-box">
            <span className="score-label">Toplam Skor</span>
            <span className="score-big" style={{ color: '#10B981' }}>{score}</span>
          </div>

          <div className="game-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Hafızaya Alınan</span>
              <span className="stat-num text-success">{memoryLoad} Nesne</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hatalı Seçim</span>
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
            <Gem size={18} color="#10B981" />
            <span>Hafıza LPI Artışı: <strong>+{Math.max(4, Math.round(score / 230))} Puan</strong></span>
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
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }} onClick={() => onFinish({
              score,
              accuracy,
              memoryLoad
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
