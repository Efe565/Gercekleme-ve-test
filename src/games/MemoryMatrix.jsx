import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Grid, Heart, Award, RotateCcw, Brain, Eye, Check, Home, Pause, Play, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

export function MemoryMatrixGame({ onFinish, onCancel }) {
  // Stages: 'intro', 'memorize', 'recall', 'roundSuccess', 'roundFail', 'paused', 'ended'
  const [gameState, setGameState] = useState('intro');
  const [level, setLevel] = useState(1);
  const [strikesLeft, setStrikesLeft] = useState(3);
  const [score, setScore] = useState(0);

  // Dynamic Grid sizing based on level (classic Lumosity adaptive ladder)
  const getGridConfig = (lvl) => {
    if (lvl === 1) return { size: 3, tilesCount: 3 };
    if (lvl === 2) return { size: 3, tilesCount: 4 };
    if (lvl === 3) return { size: 4, tilesCount: 4 };
    if (lvl === 4) return { size: 4, tilesCount: 5 };
    if (lvl === 5) return { size: 4, tilesCount: 6 };
    if (lvl === 6) return { size: 5, tilesCount: 6 };
    if (lvl === 7) return { size: 5, tilesCount: 7 };
    if (lvl === 8) return { size: 5, tilesCount: 8 };
    if (lvl === 9) return { size: 6, tilesCount: 8 };
    return { size: 6, tilesCount: Math.min(9 + (lvl - 10), 14) };
  };

  const [gridConfig, setGridConfig] = useState(getGridConfig(1));
  const [activeTiles, setActiveTiles] = useState([]); // indices of target tiles
  const [selectedTiles, setSelectedTiles] = useState([]); // correct clicked by user
  const [wrongTiles, setWrongTiles] = useState([]); // wrong clicked by user
  const [missedTiles, setMissedTiles] = useState([]); // unrevealed target tiles shown on fail
  const [totalTilesRemembered, setTotalTilesRemembered] = useState(0);
  const [highestLevel, setHighestLevel] = useState(1);
  const [prePauseState, setPrePauseState] = useState(null);

  // Generate a new round of target tiles
  const generateNewRound = useCallback((targetLevel) => {
    const config = getGridConfig(targetLevel);
    setGridConfig(config);

    const totalCells = config.size * config.size;
    const indices = [];
    while (indices.length < config.tilesCount) {
      const rand = Math.floor(Math.random() * totalCells);
      if (!indices.includes(rand)) {
        indices.push(rand);
      }
    }

    setActiveTiles(indices);
    setSelectedTiles([]);
    setWrongTiles([]);
    setMissedTiles([]);
    setGameState('memorize');

    // Memorization display duration (1.8 seconds)
    setTimeout(() => {
      setGameState(currentState => {
        if (currentState === 'memorize') {
          sound.playTap();
          return 'recall';
        }
        return currentState;
      });
    }, 1800);
  }, []);

  const startIntro = () => {
    sound.playTap();
    setLevel(1);
    setHighestLevel(1);
    setScore(0);
    setStrikesLeft(3);
    setTotalTilesRemembered(0);
    generateNewRound(1);
  };

  // Pause / Resume
  const togglePause = () => {
    if (gameState === 'paused') {
      sound.playTap();
      setGameState(prePauseState || 'recall');
      setPrePauseState(null);
    } else if (gameState === 'recall' || gameState === 'memorize') {
      sound.playTap();
      setPrePauseState(gameState);
      setGameState('paused');
    }
  };

  // Handle tile click during recall phase
  const handleTileClick = (index) => {
    if (gameState !== 'recall') return;
    if (selectedTiles.includes(index) || wrongTiles.includes(index)) return;

    if (activeTiles.includes(index)) {
      // Correct tile clicked!
      sound.playCorrect();
      const updatedSelected = [...selectedTiles, index];
      setSelectedTiles(updatedSelected);
      setTotalTilesRemembered(t => t + 1);

      // Check if all active tiles were found
      if (updatedSelected.length === activeTiles.length) {
        sound.playLevelUp();
        const roundPoints = level * 250;
        setScore(s => s + roundPoints);
        setGameState('roundSuccess');

        setTimeout(() => {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          if (nextLevel > highestLevel) setHighestLevel(nextLevel);
          generateNewRound(nextLevel);
        }, 1200);
      }
    } else {
      // Wrong tile clicked
      sound.playWrong();
      setWrongTiles([index]);
      
      // Reveal remaining missed targets
      const unselectedTargets = activeTiles.filter(t => !selectedTiles.includes(t));
      setMissedTiles(unselectedTargets);

      const nextStrikes = strikesLeft - 1;
      setStrikesLeft(nextStrikes);
      setGameState('roundFail');

      if (nextStrikes <= 0) {
        // Game Over after strike 3
        setTimeout(() => {
          sound.playFinish();
          setGameState('ended');
        }, 1600);
      } else {
        // Retry next round after showing the pattern correction
        setTimeout(() => {
          // Drop level by 1 if above 1, adaptive staircase
          const nextLvl = Math.max(1, level - 1);
          setLevel(nextLvl);
          generateNewRound(nextLvl);
        }, 1600);
      }
    }
  };

  // Keyboard shortcut for pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (['recall', 'memorize', 'paused'].includes(gameState)) {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, prePauseState]);

  return (
    <div className="game-stage">
      {/* Intro Modal */}
      {gameState === 'intro' && (
        <div className="game-modal-card glass-card animate-pop">
          <div className="game-modal-header" style={{ borderColor: 'var(--domain-memory)' }}>
            <div className="domain-badge-pill" style={{ background: 'var(--domain-memory-glow)', color: 'var(--domain-memory)' }}>
              <Brain size={16} />
              <span>Hafıza Antrenmanı</span>
            </div>
            <h2>Hafıza Matrisi (Memory Matrix)</h2>
            <p className="game-subtitle">Uzamsal çalışma belleğinizi ve görsel desenleri hatırlama gücünüzü geliştirin.</p>
          </div>

          <div className="game-instructions-box">
            <h4>Nasıl Oynanır?</h4>
            <div className="instruction-step">
              <span className="step-num">1</span>
              <p>Izgaradaki bazı kareler kısa bir süre için parlak mor renkle yanacaktır.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">2</span>
              <p>Kareler kapandığında, parlayan kareleri zihninizden hatırlayarak eksiksiz tıklayın.</p>
            </div>
            <div className="instruction-step">
              <span className="step-num">3</span>
              <p>Her doğru desen matrisi büyütür ve seviyenizi yükseltir; 3 hata hakkınız bulunmaktadır.</p>
            </div>
          </div>

          <div className="game-modal-footer">
            <button className="btn btn-outline" onClick={onCancel}>Vazgeç</button>
            <button className="btn btn-memory" onClick={startIntro}>
              <span>Antrenmana Başla</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Game Stage (Memorize, Recall, Round Transitions) */}
      {(gameState === 'memorize' || gameState === 'recall' || gameState === 'roundSuccess' || gameState === 'roundFail' || gameState === 'paused') && (
        <div className="game-board-container">
          {/* Top HUD */}
          <div className="game-hud glass-card">
            <div className="hud-metric">
              <span className="level-pill">Seviye {level}</span>
              <span className="matrix-size-label">{gridConfig.size}×{gridConfig.size} Matris</span>
            </div>

            <div className="hud-metric">
              <div className="hearts-container" title={`${strikesLeft} hata hakkınız kaldı`}>
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={22} 
                    fill={i < strikesLeft ? '#FF6B6B' : 'none'} 
                    color={i < strikesLeft ? '#FF6B6B' : '#475569'}
                    className={i >= strikesLeft ? 'heart-lost' : ''}
                  />
                ))}
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

          {/* Phase Hint Banner */}
          <div className="phase-banner-wrapper">
            {gameState === 'memorize' && (
              <div className="phase-banner memorize-banner animate-pop">
                <Eye size={20} className="animate-bounce-slow" />
                <span>Deseni Ezberleyin! ({gridConfig.tilesCount} Kare)</span>
              </div>
            )}
            {gameState === 'recall' && (
              <div className="phase-banner recall-banner animate-pop">
                <Check size={20} />
                <span>Kalan: <strong>{activeTiles.length - selectedTiles.length}</strong> Kareyi Seçin</span>
              </div>
            )}
            {gameState === 'roundSuccess' && (
              <div className="phase-banner success-banner animate-pop">
                <span>Harika! Seviye {level + 1}'e geçiliyor...</span>
              </div>
            )}
            {gameState === 'roundFail' && (
              <div className="phase-banner fail-banner animate-pop">
                <AlertCircle size={20} />
                <span>{strikesLeft > 0 ? `Hata! Doğru desen sarı ile gösterildi (${strikesLeft} hak kaldı)` : '3 Hata Yapıldı! Seans tamamlandı...'}</span>
              </div>
            )}
          </div>

          {/* Dynamic Grid Board */}
          <div className="matrix-board-wrapper glass-card">
            <div 
              className="matrix-grid"
              style={{
                gridTemplateColumns: `repeat(${gridConfig.size}, 1fr)`,
                gridTemplateRows: `repeat(${gridConfig.size}, 1fr)`
              }}
            >
              {[...Array(gridConfig.size * gridConfig.size)].map((_, index) => {
                const isTarget = activeTiles.includes(index);
                const isSelected = selectedTiles.includes(index);
                const isWrong = wrongTiles.includes(index);
                const isMissed = missedTiles.includes(index);
                const isMemorizeFlash = gameState === 'memorize' && isTarget;
                const isSuccessReveal = gameState === 'roundSuccess' && isTarget;

                let tileClass = 'matrix-tile';
                if (isMemorizeFlash || isSuccessReveal) tileClass += ' tile-highlighted';
                if (isSelected) tileClass += ' tile-correct';
                if (isWrong) tileClass += ' tile-wrong';
                if (isMissed) tileClass += ' tile-missed';

                return (
                  <button
                    key={index}
                    className={tileClass}
                    onClick={() => handleTileClick(index)}
                    disabled={gameState !== 'recall' || isSelected || isWrong}
                    aria-label={`Kare ${index + 1}`}
                  >
                    <div className="tile-inner">
                      {isSelected && <Check size={24} className="tile-check-icon animate-pop" />}
                      {isWrong && <span className="tile-x-icon animate-shake">✕</span>}
                      {isMissed && <span className="tile-missed-dot" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="ingame-pause-overlay animate-pop">
              <div className="pause-dialog glass-card">
                <h3>Antrenman Duraklatıldı</h3>
                <p>Nefes alın, hazır olduğunuzda devam edin.</p>
                <div className="pause-actions">
                  <button className="btn btn-memory" onClick={togglePause}>
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
            <div className="trophy-circle" style={{ background: 'var(--domain-memory-glow)' }}>
              <Brain size={48} color="var(--domain-memory)" />
            </div>
            <h2>Matris Seansı Tamamlandı!</h2>
            <p className="results-score-badge">Toplam Puan: <strong>{score}</strong></p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">En Yüksek Seviye</span>
              <span className="stat-num text-accent">Seviye {highestLevel}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">En Büyük Izgara</span>
              <span className="stat-num">{gridConfig.size}×{gridConfig.size}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hatırlanan Kare</span>
              <span className="stat-num text-success">{totalTilesRemembered}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Hafıza Kapasitesi</span>
              <span className="stat-num">%{Math.min(99, 65 + highestLevel * 4)}</span>
            </div>
          </div>

          <div className="bpi-increase-pill">
            <Brain size={18} color="var(--domain-memory)" />
            <span>Hafıza LPI Artışı: <strong>+{Math.max(5, Math.round(score / 200))} Puan</strong></span>
          </div>

          <div className="results-actions">
            <button className="btn btn-outline" onClick={startIntro}>
              <RotateCcw size={18} />
              <span>Tekrar Dene</span>
            </button>
            <button className="btn btn-memory" onClick={() => onFinish({
              score,
              bestLevel: highestLevel,
              tilesRecalled: totalTilesRemembered
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
