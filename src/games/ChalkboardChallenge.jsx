import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Timer, Flame, Award, RotateCcw, Home, Pause, Play } from 'lucide-react';
import { sound } from '../utils/sound';

export function ChalkboardChallengeGame({ onFinish, onCancel }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'countdown', 'playing', 'paused', 'ended'
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);

  const [problem, setProblem] = useState({
    leftExpr: '7 × 8',
    leftVal: 56,
    rightExpr: '9 × 6',
    rightVal: 54,
    correctRelation: '>' // '<', '=', '>'
  });

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct', 'wrong'
  const [prePauseState, setPrePauseState] = useState(null);

  // Generate dynamic arithmetic expressions scaling with combo / streak
  const generateProblem = useCallback(() => {
    const generateExpr = () => {
      // 5 types of arithmetic challenges
      const type = Math.floor(Math.random() * 5);
      if (type === 0) {
        // Addition
        const a = Math.floor(Math.random() * 35) + 12;
        const b = Math.floor(Math.random() * 35) + 12;
        return { text: `${a} + ${b}`, val: a + b };
      } else if (type === 1) {
        // Subtraction
        const a = Math.floor(Math.random() * 60) + 30;
        const b = Math.floor(Math.random() * 25) + 6;
        return { text: `${a} - ${b}`, val: a - b };
      } else if (type === 2) {
        // Multiplication
        const a = Math.floor(Math.random() * 9) + 3;
        const b = Math.floor(Math.random() * 9) + 4;
        return { text: `${a} × ${b}`, val: a * b };
      } else if (type === 3) {
        // Division
        const div = Math.floor(Math.random() * 6) + 3;
        const mul = Math.floor(Math.random() * 12) + 3;
        return { text: `${div * mul} ÷ ${div}`, val: mul };
      } else {
        // Squares or Parentheses
        if (Math.random() < 0.5) {
          const base = Math.floor(Math.random() * 7) + 3;
          return { text: `${base}²`, val: base * base };
        } else {
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 6) + 2;
          const mult = Math.floor(Math.random() * 3) + 2;
          return { text: `(${a} + ${b}) × ${mult}`, val: (a + b) * mult };
        }
      }
    };

    const left = generateExpr();
    let right = generateExpr();

    // 25% probability of equality
    if (Math.random() < 0.25) {
      const diff = Math.floor(Math.random() * 8) + 2;
      right = { text: `${left.val - diff} + ${diff}`, val: left.val };
    }

    let rel = '=';
    if (left.val < right.val) rel = '<';
    else if (left.val > right.val) rel = '>';

    setProblem({
      leftExpr: left.text,
      leftVal: left.val,
      rightExpr: right.text,
      rightVal: right.val,
      correctRelation: rel
    });
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
        generateProblem();
      }
    }
  }, [gameState, countdown, generateProblem]);

  const finishGame = () => {
    sound.playFinish();
    setGameState('ended');
  };

  // Main timer
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

  const handleChoice = useCallback((relation) => {
    if (gameState !== 'playing') return;

    const isCorrect = relation === problem.correctRelation;

    if (isCorrect) {
      sound.playCorrect();
      setCorrectCount(c => c + 1);
      const points = 120 * combo;
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
    generateProblem();
  }, [gameState, problem, combo, maxCombo, generateProblem]);

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
        handleChoice('<');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleChoice('=');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleChoice('>');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleChoice]);

  const accuracy = (correctCount + mistakeCount) > 0
    ? Math.round((correctCount / (correctCount + mistakeCount)) * 100)
    : 100;

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-problem)' }}>
            <div className="domain-badge-pill" style={{ background: 'var(--domain-problem-glow)', color: 'var(--domain-problem)' }}>
              <Calculator size={16} />
              <span>Problem Çözme & Nicel Akıl Yürütme</span>
            </div>
            <h2>Kara Tahta (Chalkboard Challenge)</h2>
            <p className="game-subtitle">Zihinsel aritmetik hızınızı ve anlık nicel büyüklük kestirimi yeteneğinizi geliştirin.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>İki ayrı kara tahta üzerinde matematiksel işlemler belirir.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>İfadelerin sonuçlarını hızlıca karşılaştırın: <strong>Sol Küçük [&lt;]</strong>, <strong>Eşit [=]</strong> veya <strong>Sol Büyük [&gt;]</strong>.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Klavyenizdeki <strong>Sol Ok [&lt;]</strong>, <strong>Aşağı Ok [=]</strong>, <strong>Sağ Ok [&gt;]</strong> tuşlarını kullanabilirsiniz.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-primary" style={{ background: 'var(--domain-problem)', color: '#FFFFFF' }} onClick={startCountdown}>
              <span>Antrenmana Başla (45sn)</span>
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {gameState === 'countdown' && (
        <div className="countdown-overlay animate-pop">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown > 0 ? countdown : 'HESAPLA!'}</span>
          </div>
          <p className="countdown-hint">Zihinsel hesaplamaya hazırlan...</p>
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

          {/* Chalkboard Display Area with Wood Frame & Realistic Chalk Font */}
          <div className={`chalkboard-duo-wrapper ${feedback === 'correct' ? 'feedback-correct' : feedback === 'wrong' ? 'feedback-wrong' : ''}`}>
            {/* Left Chalkboard */}
            <div className="chalkboard-slate left-slate">
              <span className="chalk-label">SOL İFADE</span>
              <div className="chalk-expression">{problem.leftExpr}</div>
            </div>

            {/* VS Divider */}
            <div className="chalkboard-vs">
              <span className="vs-badge">VS</span>
            </div>

            {/* Right Chalkboard */}
            <div className="chalkboard-slate right-slate">
              <span className="chalk-label">SAĞ İFADE</span>
              <div className="chalk-expression">{problem.rightExpr}</div>
            </div>
          </div>

          {/* Relation Choice Buttons */}
          <div className="chalk-controls">
            <button 
              className="btn btn-chalk-choice"
              onClick={() => handleChoice('<')}
            >
              <span className="chalk-symbol">&lt;</span>
              <span className="chalk-choice-text">Sol Küçük</span>
              <span className="chalk-shortcut">Sol Ok [←]</span>
            </button>

            <button 
              className="btn btn-chalk-choice btn-equal"
              onClick={() => handleChoice('=')}
            >
              <span className="chalk-symbol">=</span>
              <span className="chalk-choice-text">Eşit</span>
              <span className="chalk-shortcut">Aşağı Ok [↓]</span>
            </button>

            <button 
              className="btn btn-chalk-choice"
              onClick={() => handleChoice('>')}
            >
              <span className="chalk-symbol">&gt;</span>
              <span className="chalk-choice-text">Sol Büyük</span>
              <span className="chalk-shortcut">Sağ Ok [→]</span>
            </button>
          </div>

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="ingame-pause-overlay animate-pop">
              <div className="pause-dialog glass-card">
                <h3>Antrenman Duraklatıldı</h3>
                <p>Nefes alın, hazır olduğunuzda devam edin.</p>
                <div className="pause-actions">
                  <button className="btn btn-primary" style={{ background: 'var(--domain-problem)' }} onClick={togglePause}>
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
            <div className="trophy-circle" style={{ background: 'var(--domain-problem-glow)' }}>
              <Calculator size={48} color="var(--domain-problem)" />
            </div>
            <h2>Kara Tahta Seansı Tamamlandı!</h2>
            <p className="results-score-badge">Toplam Puan: <strong>{score}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Doğru Çözüm</span>
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
              <span className="stat-label">En Yüksek Seri</span>
              <span className="stat-num">{maxCombo}x</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Calculator size={18} color="var(--domain-problem)" />
            <span>Problem Çözme LPI Artışı: <strong>+{Math.max(4, Math.round(score / 220))} Puan</strong></span>
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
            <button className="btn btn-primary" style={{ background: 'var(--domain-problem)' }} onClick={() => onFinish({
              score,
              accuracy,
              solved: correctCount
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
