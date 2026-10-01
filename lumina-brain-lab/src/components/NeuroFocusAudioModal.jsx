import React, { useState, useEffect } from 'react';
import { Headphones, Volume2, VolumeX, Play, Square, Sparkles, X, Activity, Waves } from 'lucide-react';
import { sound } from '../utils/sound';
import { updateProfile } from '../utils/storage';

export default function NeuroFocusAudioModal({ profile, setProfile, onClose }) {
  const [isPlaying, setIsPlaying] = useState(sound.isBinauralActive());
  const [activeMode, setActiveMode] = useState(sound.getBinauralMode() || 'alpha');
  const [volume, setVolume] = useState(0.25);

  const soundModes = [
    {
      id: 'alpha',
      title: 'Alfa Dalgaları (10 Hz)',
      subtitle: 'Sakin Odaklanma & Akış',
      desc: 'Prefrontal korteksi sakinleştirirken dikkat açıklığını korur. Zihinsel yorgunluğu ve kaygıyı azaltır.',
      color: '#0091FF',
      freq: '196 Hz + 10 Hz Titreşim'
    },
    {
      id: 'gamma',
      title: 'Gama Dalgaları (40 Hz)',
      subtitle: 'Yüksek Bilişsel Bağlanma (ADHD Odak)',
      desc: 'Bilgi işleme hızını ve nöronlar arası anlık senkronizasyonu maksimize eder. Hızlı reaksiyon oyunları için idealdir.',
      color: '#7B4CE6',
      freq: '220 Hz + 40 Hz Titreşim'
    },
    {
      id: 'flow',
      title: 'Pembe Gürültü & Akış (Flow Noise)',
      subtitle: 'Derin Odaklanma & Çevre Maskeleme',
      desc: 'Doğal frekans dağılımı ile dikkat dağıtan dış sesleri maskeler ve beyni derin konsantrasyona sokar.',
      color: '#00B894',
      freq: '1/f Harmonik Filtre'
    }
  ];

  const handleTogglePlay = (modeId = activeMode) => {
    sound.playTap();
    if (isPlaying && modeId === activeMode) {
      sound.stopBinaural();
      setIsPlaying(false);
      updateProfile({ binauralSettings: { enabled: false, mode: modeId, volume } });
    } else {
      setActiveMode(modeId);
      sound.startBinaural(modeId, volume);
      setIsPlaying(true);
      updateProfile({ binauralSettings: { enabled: true, mode: modeId, volume } });
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setBinauralVolume(val);
  };

  return (
    <div className="modal-overlay">
      <div className="neuro-audio-modal glass-card animate-pop">
        <button className="modal-close-btn" onClick={onClose} aria-label="Kapat">
          <X size={20} />
        </button>

        <div className="audio-icon-badge">
          <Headphones size={36} color="#7B4CE6" />
          {isPlaying && <div className="audio-live-dot" />}
        </div>

        <h2 className="audio-modal-title">Nöro-Odak Ambiyans Sesleri</h2>
        <p className="audio-modal-sub">
          Lumosity'de bulunmayan Web Audio tabanlı gerçek zamanlı frekans jeneratörü. 
          Kulaklıkla dinlendiğinde çift kulaklı vuruşlar (Binaural Beats) nöral osilasyonları senkronize eder.
        </p>

        {/* Sound Selection Cards */}
        <div className="audio-modes-grid">
          {soundModes.map((m) => {
            const isSelected = activeMode === m.id;
            const isThisPlaying = isPlaying && isSelected;

            return (
              <div 
                key={m.id} 
                className={`audio-mode-card glass-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTogglePlay(m.id)}
              >
                <div className="mode-card-header">
                  <div className="mode-color-dot" style={{ background: m.color }} />
                  <div className="mode-titles">
                    <h4>{m.title}</h4>
                    <span className="mode-sub">{m.subtitle}</span>
                  </div>
                  <button className={`mode-play-btn ${isThisPlaying ? 'playing' : ''}`}>
                    {isThisPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                </div>

                <p className="mode-card-desc">{m.desc}</p>
                <span className="mode-freq-tag">{m.freq}</span>
              </div>
            );
          })}
        </div>

        {/* Volume & Master Controls */}
        <div className="audio-controls-bar glass-card">
          <div className="volume-slider-group">
            <Volume2 size={18} color="#94A3B8" />
            <input 
              type="range" 
              min="0.05" 
              max="0.6" 
              step="0.01" 
              value={volume}
              onChange={handleVolumeChange}
              className="volume-range-input"
            />
            <span className="volume-pct">{Math.round(volume * 100 * 1.6)}%</span>
          </div>

          <button 
            className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} btn-master-audio`}
            onClick={() => handleTogglePlay(activeMode)}
          >
            {isPlaying ? (
              <>
                <Square size={16} fill="currentColor" />
                <span>Nöro-Müziği Durdur</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Odaklanma Sesini Başlat</span>
              </>
            )}
          </button>
        </div>

        <div className="audio-scientific-note">
          <Waves size={15} color="#0091FF" />
          <span>
            <strong>Nörobilim Notu:</strong> En yüksek etki için stereo kulaklık kullanılması tavsiye edilir. 
            Sol ve sağ kulak arasındaki faz farkı beynin Superior Olivary kompleksinde algılanarak nöral ritmi yönlendirir.
          </span>
        </div>
      </div>
    </div>
  );
}
