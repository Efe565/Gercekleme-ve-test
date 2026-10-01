import React, { useState } from 'react';
import { 
  Zap, Brain, Compass, Calculator, Palette, Search, 
  Play, Sparkles, Filter, Award, Clock,
  Target, Wind, CloudRain, Gem
} from 'lucide-react';
import { GAMES } from '../utils/gamesData';
import { sound } from '../utils/sound';

export default function GamesCatalog({ profile, onLaunchGame }) {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const domains = [
    { id: 'all', label: 'Tüm Egzersizler', icon: Sparkles },
    { id: 'speed', label: 'Hız', icon: Zap, color: '#FF9A00' },
    { id: 'memory', label: 'Hafıza', icon: Brain, color: '#7B4CE6' },
    { id: 'attention', label: 'Dikkat', icon: Compass, color: '#0091FF' },
    { id: 'flexibility', label: 'Esneklik', icon: Palette, color: '#E83D84' },
    { id: 'problemSolving', label: 'Problem Çözme', icon: Calculator, color: '#00B894' }
  ];

  const getDomainIcon = (key) => {
    switch (key) {
      case 'speed': return Zap;
      case 'memory': return Brain;
      case 'attention': return Compass;
      case 'flexibility': return Palette;
      case 'problemSolving': return Calculator;
      default: return Brain;
    }
  };

  const getGameIcon = (game) => {
    switch (game.iconName) {
      case 'Target': return Target;
      case 'Wind': return Wind;
      case 'CloudRain': return CloudRain;
      case 'Gem': return Gem;
      case 'Zap': return Zap;
      case 'Grid': return Brain;
      case 'Compass': return Compass;
      case 'Calculator': return Calculator;
      case 'Palette': return Palette;
      default: return getDomainIcon(game.domain);
    }
  };

  const filteredGames = GAMES.filter((game) => {
    const matchesDomain = selectedDomain === 'all' || game.domain === selectedDomain;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.englishTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="games-catalog-view container">
      {/* Catalog Header */}
      <div className="catalog-header">
        <div>
          <h1 className="page-title">Beyin Egzersizleri Kütüphanesi</h1>
          <p className="page-subtitle">
            Lumosity bilim kurulunun geliştirdiği 5 temel bilişsel alandaki tüm oyunlar ve antrenman modülleri.
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-box glass-card">
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Oyun veya yetenek ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs-row">
        {domains.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedDomain === tab.id;
          return (
            <button
              key={tab.id}
              className={`filter-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                sound.playTap();
                setSelectedDomain(tab.id);
              }}
              style={isActive && tab.color ? { borderColor: tab.color, color: tab.color } : {}}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="catalog-grid">
        {filteredGames.map((game) => {
          const Icon = getGameIcon(game);
          const gameRecord = profile.games[game.id] || { highScore: 0, timesPlayed: 0 };

          return (
            <div key={game.id} className="catalog-card glass-card animate-pop">
              <div className="catalog-card-header" style={{ background: game.gradient }}>
                <div className="catalog-icon-wrapper">
                  <Icon size={32} color="#FFFFFF" />
                </div>
                <div className="header-meta">
                  <span className="domain-pill">{game.domainLabel}</span>
                  <span className="duration-pill"><Clock size={12} /> {game.targetDuration} sn</span>
                </div>
              </div>

              <div className="catalog-card-body">
                <div className="title-row">
                  <h3>{game.title}</h3>
                  <span className="orig-title">{game.englishTitle}</span>
                </div>

                <p className="card-desc">{game.summary}</p>

                <div className="science-highlight">
                  <span className="science-tag">Nörobilim Odak:</span>
                  <p className="science-text">{game.neuroscience}</p>
                </div>

                <div className="controls-box">
                  <span className="controls-label">Kontroller:</span>
                  <span className="controls-val">{game.controls}</span>
                </div>

                <div className="catalog-footer">
                  <div className="record-stat">
                    <Award size={16} color="#FDCB6E" />
                    <span>Rekor: <strong>{gameRecord.highScore || 0}</strong></span>
                  </div>

                  <button 
                    className="btn btn-primary btn-launch-game"
                    onClick={() => {
                      sound.playTap();
                      onLaunchGame(game.id);
                    }}
                    style={{ background: game.gradient, color: '#FFFFFF' }}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Oyna</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
