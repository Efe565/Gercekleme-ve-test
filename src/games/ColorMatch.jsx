import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Timer, Flame, Award, RotateCcw, ArrowLeft, ArrowRight, Home, Pause, Play } from 'lucide-react';
import { sound } from '../utils/sound';

const COLOR_ITEMS = [
  { name: 'KIRMIZI', hex: '#EF4444' },
  { name: 'MAVİ', hex: '#3B82F6' },
  { name: 'YEŞİL', hex: '#10B981' },
  { name: 'SARI', hex: '#F59E0B' },
  { name: 'MOR', hex: '#A855F7' }
];

export function ColorMatchGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);

  const [topCard, setTopCard] = useState({ text: 'KIRMIZI' });
  const [bottomCard, setBottomCard] = useState({ text: 'MAVİ', inkColor: '#EF4444' });
  const [doesMatch, setDoesMatch] = useState(true);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
  const [prePauseState, setPrePauseState] = useState(null);

  const trialStartTimeRef = useRef(Date.now());

  // Generate Stroop trial
  const generateTrial = useCallback(() => {
    const shouldMatch = Math.random() < 0.5;
    const topColor = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];

    let bottomInk;
    if (shouldMatch) {
      bottomInk = topColor.hex;
    } else {
      const otherColors = COLOR_ITEMS.filter(c => c.name !== topColor.name);
      bottomInk = otherColors[Math.floor(Math.random() * otherColors.length)].hex;
    }

    // Bottom card word can be any color name (distractor)
    const bottomWord = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)].name;

    setTopCard({ text: topColor.name });
    setBottomCard({ text: bottomWord, inkColor: bottomInk });
    setDoesMatch(shouldMatch);
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

  const handleAnswer = useCallback((playerSaysMatches) => {
    if (gameState !== 'playing') return;

    const rt = Date.now() - trialStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const isCorrect = playerSaysMatches === doesMatch;

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
    generateTrial();
  }, [gameState, doesMatch, combo, maxCombo, generateTrial]);

  // Keyboard navigation & pause
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
        handleAnswer(false); // Farklı / Hayır
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAnswer(true); // Aynı / Evet
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

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-flexibility)' }}>
            <div className="domain-badge-pill" style={{ background: 'var(--domain-flexibility-glow)', color: 'var(--domain-flexibility)' }}>
              <Palette size={16} />
              <span>Bilişsel Esneklik & Zihinsel Ketleme</span>
            </div>
            <h2>Renk Eşleştirme (Color Match - Stroop Effect)</h2>
            <p className="game-subtitle">Zihinsel çelişkiyi aşın, otomatik okuma dürtüsünü kontrol ederek esnekliğinizi artırın.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Üstte bir kelime, altta ise renkli mürekkeple yazılmış başka bir kelime belirir.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Kritik soru: <strong>Üstteki kelimenin ANLAMI</strong> ile <strong>alttaki kelimenin MÜREKKEP RENGİ</strong> aynı mı?</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Klavyenizdeki <strong>Sol Ok [← HAYIR]</strong> veya <strong>Sağ Ok [EVET →]</strong> tuşlarını kullanın.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'var(--domain-flexibility)', color: '#FFFFFF' }} onClick={startCountdown}>
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
          <p className="countdown-hint">Anlam ile mürekkep rengini kıyasla...</p>
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

          {/* Color Match Card Arena */}
          <div className={`stroop-arena glass-card ${feedback === 'correct' ? 'feedback-correct' : feedback === 'wrong' ? 'feedback-wrong' : ''}`}>
            {/* Top Card: Meaning */}
            <div className="stroop-card stroop-top-card">
              <span className="stroop-card-tag">ÜST KART: ANLAM</span>
              <div className="stroop-word top-word">
                {topCard.text}
              </div>
            </div>

            <div className="stroop-divider-prompt">
              <span>Üstteki anlam, alttaki <strong>RENK</strong> ile eşleşiyor mu?</span>
            </div>

            {/* Bottom Card: Ink Color */}
            <div className="stroop-card stroop-bottom-card">
              <span className="stroop-card-tag">ALT KART: MÜREKKEP RENGİ</span>
              <div 
                className="stroop-word bottom-word"
                style={{ color: bottomCard.inkColor, textShadow: `0 0 24px ${bottomCard.inkColor}50` }}
              >
                {bottomCard.text}
              </div>
            </div>
          </div>

          {/* Decision Controls */}
          <div className="decision-controls">
            <button 
              className="btn btn-decision btn-diff"
              onClick={() => handleAnswer(false)}
            >
              <div className="btn-decision-inner">
                <ArrowLeft size={24} />
                <div>
                  <span className="decision-title">HAYIR (Farklı)</span>
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
                  <span className="decision-title">EVET (Aynı)</span>
                  <span className="decision-key">Sağ Ok [→]</span>
                </div>
                <ArrowRight size={24} />
              </div>
            </button>
          </div>

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="ingame-pause-overlay animate-pop">
              <div className="pause-dialog glass-card">
                <h3>Antrenman Duraklatıldı</h3>
                <p>Nefes alın, hazır olduğunuzda devam edin.</p>
                <div className="pause-actions">
                  <button className="btn btn-primary" style={{ background: 'var(--domain-flexibility)' }} onClick={togglePause}>
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
            <div className="trophy-circle" style={{ background: 'var(--domain-flexibility-glow)' }}>
              <Palette size={48} color="var(--domain-flexibility)" />
            </div>
            <h2>Esneklik Seansı Tamamlandı!</h2>
            <p className="results-score-badge">Toplam Puan: <strong>{score}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Doğru Yanıt</span>
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
              <span className="stat-label">Ortalama Reaksiyon</span>
              <span className="stat-num">{avgReaction} ms</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Palette size={18} color="var(--domain-flexibility)" />
            <span>Esneklik LPI Artışı: <strong>+{Math.max(4, Math.round(score / 220))} Puan</strong></span>
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
            <button className="btn btn-primary" style={{ background: 'var(--domain-flexibility)' }} onClick={() => onFinish({
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
