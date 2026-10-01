import React from 'react';
import { X } from 'lucide-react';
import { SpeedMatchGame } from '../games/SpeedMatch';
import { MemoryMatrixGame } from '../games/MemoryMatrix';
import { LostInMigrationGame } from '../games/LostInMigration';
import { ChalkboardChallengeGame } from '../games/ChalkboardChallenge';
import { ColorMatchGame } from '../games/ColorMatch';
import { TargetTrackerGame } from '../games/TargetTracker';
import { EbbAndFlowGame } from '../games/EbbAndFlow';
import { RaindropsGame } from '../games/Raindrops';
import { TidalTreasuresGame } from '../games/TidalTreasures';
import { recordGameSession } from '../utils/storage';
import { sound } from '../utils/sound';

export default function StandaloneGameModal({ gameId, onClose, onGameCompleted }) {
  if (!gameId) return null;

  const handleFinish = (domainKey, result) => {
    sound.playVictory();
    const { profile: updatedProfile } = recordGameSession(gameId, domainKey, result.score, result);
    onGameCompleted(updatedProfile);
  };

  return (
    <div className="modal-overlay">
      <div className="standalone-game-container">
        <button 
          className="standalone-close-btn" 
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          aria-label="Kapat"
        >
          <X size={24} />
        </button>

        {gameId === 'speed-match' && (
          <SpeedMatchGame 
            onFinish={(res) => handleFinish('speed', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'memory-matrix' && (
          <MemoryMatrixGame 
            onFinish={(res) => handleFinish('memory', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'lost-in-migration' && (
          <LostInMigrationGame 
            onFinish={(res) => handleFinish('attention', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'chalkboard-challenge' && (
          <ChalkboardChallengeGame 
            onFinish={(res) => handleFinish('problemSolving', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'color-match' && (
          <ColorMatchGame 
            onFinish={(res) => handleFinish('flexibility', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'target-tracker' && (
          <TargetTrackerGame 
            onFinish={(res) => handleFinish('attention', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'ebb-and-flow' && (
          <EbbAndFlowGame 
            onFinish={(res) => handleFinish('flexibility', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'raindrops' && (
          <RaindropsGame 
            onFinish={(res) => handleFinish('problemSolving', res)}
            onCancel={onClose}
          />
        )}

        {gameId === 'tidal-treasures' && (
          <TidalTreasuresGame 
            onFinish={(res) => handleFinish('memory', res)}
            onCancel={onClose}
          />
        )}

        {!['speed-match', 'memory-matrix', 'lost-in-migration', 'chalkboard-challenge', 'color-match', 'target-tracker', 'ebb-and-flow', 'raindrops', 'tidal-treasures'].includes(gameId) && (
          <div className="game-modal-card glass-card animate-pop" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Egzersiz Bulunamadı</h2>
            <p style={{ margin: '1.5rem 0', color: 'var(--text-secondary)' }}>Seçilen egzersiz yüklenemedi veya tamamlandı.</p>
            <button className="btn btn-primary" onClick={onClose}>Ana Sayfaya Dön</button>
          </div>
        )}
      </div>
    </div>
  );
}
