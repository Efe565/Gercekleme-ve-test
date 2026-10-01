import React, { useState } from 'react';
import { 
  BarChart3, Zap, Brain, Compass, Calculator, Palette, 
  TrendingUp, Award, Flame, Calendar, RotateCcw, ShieldCheck, 
  CheckCircle2, Users, ArrowUpRight 
} from 'lucide-react';
import RadarChart from './RadarChart';
import NeuroCoachInsights from './NeuroCoachInsights';
import { resetAllData, updateProfile } from '../utils/storage';
import { sound } from '../utils/sound';

export default function InsightsView({ profile, setProfile, onLaunchGame }) {
  const domainKeys = ['speed', 'memory', 'attention', 'flexibility', 'problemSolving'];
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(profile.ageGroup || '25-34');

  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

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

  const handleAgeChange = (grp) => {
    sound.playTap();
    setSelectedAgeGroup(grp);
    const updated = updateProfile({ ageGroup: grp });
    setProfile(updated);
  };

  const handleReset = () => {
    if (window.confirm('Tüm antrenman geçmişinizi ve LPI skorunuzu sıfırlamak istediğinize emin misiniz?')) {
      const fresh = resetAllData();
      setProfile(fresh);
      sound.playTap();
    }
  };

  // Compute SVG line chart coordinates for history
  const history = profile.history || [];
  const svgWidth = 520;
  const svgHeight = 200;
  const padding = 38;

  const minBpi = Math.min(...history.map(h => h.bpi), 980) - 15;
  const maxBpi = Math.max(...history.map(h => h.bpi), 1080) + 15;

  const getX = (index) => {
    if (history.length <= 1) return svgWidth / 2;
    return padding + (index / (history.length - 1)) * (svgWidth - padding * 2);
  };

  const getY = (val) => {
    return svgHeight - padding - ((val - minBpi) / (maxBpi - minBpi)) * (svgHeight - padding * 2);
  };

  const linePoints = history.map((h, i) => `${getX(i)},${getY(h.bpi)}`).join(' ');
  const areaPoints = `${getX(0)},${svgHeight - padding} ${linePoints} ${getX(history.length - 1)},${svgHeight - padding}`;

  const currentLpi = profile.overallLpi || profile.overallBpi || 1045;
  const initialLpi = history.length > 0 ? history[0].bpi : 1015;
  const lpiGain = currentLpi - initialLpi;

  return (
    <div className="insights-view container">
      {/* Header */}
      <div className="insights-header">
        <div>
          <div className="badge" style={{ background: 'rgba(250, 100, 50, 0.15)', color: '#FA6432', marginBottom: '0.5rem' }}>
            <Award size={14} /> LUMOSITY PERFORMANS İNDEKSİ (LPI)
          </div>
          <h1 className="page-title">Bilişsel Profil ve Gelişim Analizi</h1>
          <p className="page-subtitle">
            Lumosity bilimsel normları, 5 zihinsel fonksiyonunuzun ayrıntılı dökümü ve yaş grubu akran kıyaslamaları.
          </p>
        </div>

        <button className="btn btn-outline btn-reset" onClick={handleReset}>
          <RotateCcw size={16} />
          <span>Verileri Sıfırla</span>
        </button>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="metrics-summary-grid">
        <div className="metric-box glass-card animate-pop">
          <div className="metric-icon-wrap" style={{ background: 'rgba(250, 100, 50, 0.15)', color: '#FA6432' }}>
            <Award size={24} />
          </div>
          <div>
            <span className="metric-box-label">Genel LPI Skoru</span>
            <span className="metric-box-val">{currentLpi}</span>
            <span className="metric-box-sub text-success">Ortalama normun %14 üzerinde</span>
          </div>
        </div>

        <div className="metric-box glass-card animate-pop">
          <div className="metric-icon-wrap" style={{ background: 'rgba(255, 154, 0, 0.15)', color: '#FF9A00' }}>
            <Flame size={24} />
          </div>
          <div>
            <span className="metric-box-label">Antrenman Serisi</span>
            <span className="metric-box-val">{profile.streak} Gün</span>
            <span className="metric-box-sub text-warning">Rekor Seri: {profile.longestStreak || 5} Gün</span>
          </div>
        </div>

        <div className="metric-box glass-card animate-pop">
          <div className="metric-icon-wrap" style={{ background: 'rgba(0, 145, 255, 0.15)', color: '#0091FF' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span className="metric-box-label">Tamamlanan Seans</span>
            <span className="metric-box-val">{profile.totalWorkouts || 12} Seans</span>
            <span className="metric-box-sub text-success">Kayıtlı egzersiz verisi</span>
          </div>
        </div>

        <div className="metric-box glass-card animate-pop">
          <div className="metric-icon-wrap" style={{ background: 'rgba(123, 76, 230, 0.15)', color: '#7B4CE6' }}>
            <Users size={24} />
          </div>
          <div>
            <span className="metric-box-label">Akran Dilimi</span>
            <span className="metric-box-val">%{profile.domains.attention?.percentile || 91} Üst Segment</span>
            <span className="metric-box-sub">{selectedAgeGroup} Yaş Grubu Normu</span>
          </div>
        </div>
      </div>

      {/* Age Group Benchmark Selector Bar */}
      <div className="age-benchmark-filter glass-card">
        <div className="filter-title">
          <Users size={18} color="#FA6432" />
          <span>Akran Karşılaştırma Yaş Grubu:</span>
        </div>
        <div className="age-buttons-row">
          {ageGroups.map((grp) => (
            <button
              key={grp}
              className={`age-btn ${selectedAgeGroup === grp ? 'active' : ''}`}
              onClick={() => handleAgeChange(grp)}
            >
              {grp} Yaş
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row: Line Graph + Spider Radar */}
      <div className="charts-split-row">
        {/* LPI History Line Chart */}
        <div className="chart-panel glass-card">
          <div className="chart-panel-header">
            <div>
              <h3>LPI Zaman Çizelgesi Gelişimi</h3>
              <p className="card-sub">Son antrenman seanslarınızdaki nöral ilerleme eğrisi</p>
            </div>
            <span className="trend-badge">
              <TrendingUp size={16} /> +{Math.max(12, lpiGain)} LPI Gelişim
            </span>
          </div>

          <div className="svg-chart-wrapper">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="timeline-svg">
              <defs>
                <linearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FA6432" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FA6432" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[minBpi, (minBpi + maxBpi) / 2, maxBpi].map((gridVal, i) => {
                const y = getY(gridVal);
                return (
                  <g key={i}>
                    <line 
                      x1={padding} 
                      y1={y} 
                      x2={svgWidth - padding} 
                      y2={y} 
                      stroke="rgba(255, 255, 255, 0.08)" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={padding - 8} 
                      y={y + 4} 
                      fill="#64748B" 
                      fontSize="10" 
                      textAnchor="end"
                    >
                      {Math.round(gridVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <polygon points={areaPoints} fill="url(#chartAreaGrad)" />

              {/* Curve Line */}
              <polyline
                points={linePoints}
                fill="none"
                stroke="#FA6432"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Nodes */}
              {history.map((h, i) => {
                const cx = getX(i);
                const cy = getY(h.bpi);
                return (
                  <g key={i} className="chart-node-group">
                    <circle cx={cx} cy={cy} r="5.5" fill="#0A1927" stroke="#FA6432" strokeWidth="2.5" />
                    <text x={cx} y={svgHeight - 12} fill="#94A3B8" fontSize="11" textAnchor="middle">
                      {h.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Radar Profile */}
        <div className="chart-panel glass-card">
          <div className="chart-panel-header">
            <div>
              <h3>Bilişsel Profil Dengesi</h3>
              <p className="card-sub">{selectedAgeGroup} yaş akran ortalaması (1000) ile karşılaştırma</p>
            </div>
          </div>
          <RadarChart domains={profile.domains} overallBpi={currentLpi} />
        </div>
      </div>

      {/* AI Cognitive Coach & Deficit Diagnostic (Direct solution to user complaints) */}
      <NeuroCoachInsights profile={profile} onLaunchGame={onLaunchGame} />

      {/* Domain Details Cards */}
      <div className="domains-deepdive-section">
        <h2>5 Bilişsel Alan ve Nörolojik Temeller</h2>
        <div className="domain-deepdive-grid">
          {domainKeys.map((key) => {
            const domain = profile.domains[key];
            const Icon = getDomainIcon(key);
            if (!domain) return null;

            return (
              <div key={key} className="deepdive-card glass-card">
                <div className="deepdive-top">
                  <div className="deepdive-icon" style={{ background: `${domain.color}20`, color: domain.color }}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="deepdive-title">{domain.name}</h3>
                    <span className="deepdive-bpi" style={{ color: domain.color }}>{domain.bpi} LPI</span>
                  </div>
                  <span className="deepdive-percentile">%{domain.percentile} Dilim</span>
                </div>

                <p className="deepdive-desc">{domain.description}</p>

                <div className="deepdive-daily-life">
                  <strong>Günlük Hayata Etkisi:</strong>
                  <span>
                    {key === 'speed' && 'Hızlı ve isabetli kararlar alabilme, trafikte acil refleks gösterme ve ekrandaki verileri hızlı tarama.'}
                    {key === 'memory' && 'Yeni tanışılan kişilerin isimlerini, telefon numaralarını, şifreleri ve eşyaların yerlerini unutmama.'}
                    {key === 'attention' && 'Gürültülü veya dikkat dağıtıcı ortamlarda işine odaklanabilme ve çeldiricileri kolayca filtreleme.'}
                    {key === 'flexibility' && 'Aynı anda birden fazla görevi aksatmadan yönetebilme ve planlar değiştiğinde hızla yeni duruma adapte olma.'}
                    {key === 'problemSolving' && 'Bütçe hesapları, stratejik planlama, restoran hesabı bölüştürme ve mantık hatalarını anında fark edebilme.'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
