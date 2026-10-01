import React from 'react';
import { 
  Zap, Brain, Compass, Calculator, Palette, Dumbbell, 
  Flame, Award, TrendingUp, Sparkles, ArrowRight, Play, CheckCircle2, 
  Calendar, Clock, Check, Shield, Headphones, SlidersHorizontal 
} from 'lucide-react';
import RadarChart from './RadarChart';
import { GAMES } from '../utils/gamesData';
import { sound } from '../utils/sound';

export default function Dashboard({ 
  profile, 
  onStartDailyWorkout, 
  onLaunchGame, 
  setActiveTab,
  onOpenStreakShield,
  onOpenNeuroAudio 
}) {
  const domainKeys = ['speed', 'memory', 'attention', 'flexibility', 'problemSolving'];
  const todayStr = new Date().toISOString().split('T')[0];
  const isTodayCompleted = profile.lastWorkoutDate === todayStr;

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

  // Generate 7 days of the current week (Monday to Sunday)
  const getWeeklyCalendar = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const now = new Date();
    // Monday is day 1, Sunday is day 0 in JS Date
    const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = Mon, 6 = Sun
    
    return days.map((dayName, idx) => {
      const diff = idx - currentDayOfWeek;
      const targetDate = new Date(now.getTime() + diff * 86400000);
      const dateIso = targetDate.toISOString().split('T')[0];
      const isPastOrToday = idx <= currentDayOfWeek;
      const isToday = idx === currentDayOfWeek;
      const isCompleted = profile.completedDays && profile.completedDays.includes(dateIso);

      return {
        name: dayName,
        dateNumber: targetDate.getDate(),
        dateIso,
        isToday,
        isPastOrToday,
        isCompleted
      };
    });
  };

  const weekCalendar = getWeeklyCalendar();
  const completedThisWeek = weekCalendar.filter(d => d.isCompleted).length;
  const weeklyGoal = profile.weeklyGoal || 5;

  return (
    <div className="dashboard-view container">
      {/* Top Hero Banner */}
      <div className="hero-banner glass-card animate-pop">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>GÜNLÜK BİLİŞSEL GELİŞİM PROGRAMI</span>
          </div>

          <h1 className="hero-title">
            Hoş Geldin, <span className="text-gradient">{profile.name || 'Bilişsel Sporcu'}</span>!
          </h1>

          <p className="hero-subtitle">
            {isTodayCompleted 
              ? 'Tebrikler! Bugünkü zihinsel antrenman seansınızı tamamladınız. Zihnin formda ve odaklı kalmaya devam ediyor. İsterseniz serbest egzersiz yapabilirsiniz.'
              : 'Bugünkü kişiselleştirilmiş 5 aşamalı antrenmanınız hazır. Hafıza, hız, dikkat, mantık ve esneklik merkezlerinizi uyararak LPI skorunuzu yükseltin.'}
          </p>

          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-hero-cta"
              onClick={() => {
                sound.playTap();
                onStartDailyWorkout('full');
              }}
            >
              <Dumbbell size={20} />
              <span>{isTodayCompleted ? 'Antrenmanı Tekrarla (5 Alan)' : 'Tam Antrenmanı Başlat (5 Alan)'}</span>
              <ArrowRight size={18} />
            </button>

            <button 
              className="btn btn-outline btn-quick-workout"
              onClick={() => {
                sound.playTap();
                onStartDailyWorkout('quick');
              }}
            >
              <Clock size={18} />
              <span>Hızlı Seans (3 Alan, ~3 dk)</span>
            </button>

            <button 
              className="btn btn-ghost btn-custom-workout"
              onClick={() => {
                sound.playTap();
                onStartDailyWorkout('custom');
              }}
              title="İstediğiniz oyunları seçerek kendi seansınızı kurun (Lumosity'de olmayan özellik!)"
            >
              <SlidersHorizontal size={17} />
              <span>Özel Antrenman</span>
            </button>

            <div 
              className="hero-streak-indicator hero-streak-clickable"
              onClick={() => {
                sound.playTap();
                onOpenStreakShield();
              }}
              title="Seri Koruma Kalkanlarını İncele & Yönet"
              role="button"
              tabIndex={0}
            >
              <Flame size={22} className="flame-glow animate-bounce-slow" />
              <div>
                <div className="hero-streak-title-row">
                  <span className="streak-title">{profile.streak || 1} Günlük Seri</span>
                  <span className="hero-shield-pill">
                    <Shield size={12} color="#0091FF" />
                    <span>{profile.streakFreezes !== undefined ? profile.streakFreezes : 2} Kalkan</span>
                  </span>
                </div>
                <span className="streak-sub">{isTodayCompleted ? 'Bugün Tamamlandı ✓' : 'Bugün antrenmanını bekliyor'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Decorative Brain Card */}
        <div className="hero-visual">
          <div className="overall-bpi-circle">
            <span className="circle-tag">LPI SKORU</span>
            <span className="circle-val">{profile.overallLpi || profile.overallBpi || 1045}</span>
            <span className="circle-sub">{profile.ageGroup || '25-34'} Yaş Dilimi: %88</span>
            <div className="circle-glow-ring" />
          </div>
        </div>
      </div>

      {/* Weekly Training Tracker (Lumosity Signature Calendar) */}
      <div className="weekly-tracker-card glass-card">
        <div className="tracker-header">
          <div className="tracker-title-group">
            <Calendar size={20} color="#FA6432" />
            <div>
              <h3>Haftalık Antrenman Takibi</h3>
              <p className="tracker-sub">
                Haftalık Hedef: <strong>{weeklyGoal} gün</strong> ({completedThisWeek}/{weeklyGoal} tamamlandı)
              </p>
            </div>
          </div>

          <div className="tracker-goal-status">
            {completedThisWeek >= weeklyGoal ? (
              <span className="goal-achieved-badge">
                <CheckCircle2 size={16} /> Haftalık Hedefe Ulaşıldı!
              </span>
            ) : (
              <span className="goal-progress-badge">
                Hedefe {weeklyGoal - completedThisWeek} gün kaldı
              </span>
            )}
          </div>
        </div>

        <div className="week-days-row">
          {weekCalendar.map((day, idx) => (
            <div 
              key={idx} 
              className={`week-day-col ${day.isToday ? 'day-today' : ''} ${day.isCompleted ? 'day-done' : ''}`}
            >
              <span className="day-name">{day.name}</span>
              <div className="day-circle">
                {day.isCompleted ? (
                  <Check size={18} className="day-check" />
                ) : (
                  <span className="day-num">{day.dateNumber}</span>
                )}
              </div>
              <span className="day-status-label">
                {day.isToday ? (day.isCompleted ? 'Tamam' : 'Bugün') : (day.isCompleted ? 'Yapıldı' : '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Grid: 5 Cognitive Domains + Spider Radar */}
      <div className="dashboard-grid-row">
        {/* Left Column: 5 Domain Score Breakdown */}
        <div className="domains-card glass-card">
          <div className="card-header">
            <div>
              <h3>Bilişsel Yetenek Dağılımı</h3>
              <p className="card-sub">5 ana zihinsel fonksiyonunuzun güncel Lumosity performans endeksi</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('insights')}>
              <span>Detaylı Analiz</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="domain-bars-list">
            {domainKeys.map((key) => {
              const domain = profile.domains[key];
              const Icon = getDomainIcon(key);
              if (!domain) return null;

              // Scale LPI percentage for visual bar (e.g. 1000 = 50%, 1200 = 100%)
              const barWidth = Math.min(100, Math.max(20, Math.round(((domain.bpi - 900) / 300) * 100)));

              return (
                <div key={key} className="domain-bar-item">
                  <div className="domain-bar-header">
                    <div className="domain-title-group">
                      <div className="domain-mini-icon" style={{ background: `${domain.color}20`, color: domain.color }}>
                        <Icon size={16} />
                      </div>
                      <span className="domain-name">{domain.name}</span>
                    </div>

                    <div className="domain-score-group">
                      <span className="domain-bpi-val">{domain.bpi} LPI</span>
                      <span className="domain-percentile-tag">Akranların %{domain.percentile}'inden iyi</span>
                    </div>
                  </div>

                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${barWidth}%`, 
                        backgroundColor: domain.color,
                        boxShadow: `0 0 12px ${domain.color}60`
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Radar Spider Chart */}
        <div className="radar-card glass-card">
          <div className="card-header">
            <div>
              <h3>Zihinsel Denge Grafiği</h3>
              <p className="card-sub">{profile.ageGroup || '25-34'} yaş grubu akran ortalaması (1000) ile karşılaştırma</p>
            </div>
          </div>

          <RadarChart domains={profile.domains} overallBpi={profile.overallLpi || profile.overallBpi} />
        </div>
      </div>

      {/* Featured Games Section */}
      <div className="games-section">
        <div className="section-header">
          <div>
            <h2>Öne Çıkan Beyin Egzersizleri</h2>
            <p className="section-sub">Lumosity bilim kurulu ve nöropsikologlar tarafından geliştirilmiş 5 ana egzersiz</p>
          </div>

          <button className="btn btn-outline" onClick={() => setActiveTab('games')}>
            <span>Tüm Oyunları Gör (5 Oyun)</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="game-cards-grid">
          {GAMES.map((game) => {
            const Icon = getDomainIcon(game.domain);
            const gameRecord = profile.games[game.id] || { highScore: 0, timesPlayed: 0 };

            return (
              <div key={game.id} className="game-card glass-card">
                <div className="game-card-top">
                  <div className="game-icon-box" style={{ background: game.gradient }}>
                    <Icon size={24} color="#FFFFFF" />
                  </div>
                  <span className="game-domain-badge" style={{ color: game.color, background: `${game.color}15` }}>
                    {game.domainLabel}
                  </span>
                </div>

                <h3 className="game-card-title">{game.title}</h3>
                <span className="game-english-title">{game.englishTitle}</span>
                <p className="game-card-summary">{game.summary}</p>

                <div className="game-stats-row">
                  <div className="game-stat">
                    <span className="stat-label">En Yüksek</span>
                    <span className="stat-val">{gameRecord.highScore || '—'}</span>
                  </div>
                  <div className="game-stat">
                    <span className="stat-label">Oynanma</span>
                    <span className="stat-val">{gameRecord.timesPlayed || 0} Kez</span>
                  </div>
                </div>

                <button 
                  className="btn btn-outline btn-play-card"
                  onClick={() => {
                    sound.playTap();
                    onLaunchGame(game.id);
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Hemen Oyna</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Neuroscience Tip Footer */}
      <div className="neuro-tip-card glass-card">
        <div className="tip-icon">
          <Brain size={28} color="#FA6432" />
        </div>
        <div className="tip-content">
          <h4>Günün Nörobilim İpucu: Bilişsel Rezerv ve Nöroplastisite</h4>
          <p>
            Stanford ve Lumosity araştırmalarına göre, haftada en az 4 gün düzenli yapılan bilişsel egzersizler, 
            sinaptik yoğunluğu korur ve frontal-parietal nöral ağların verimliliğini artırarak zihinsel yorgunluğa karşı dayanıklılık sağlar.
          </p>
        </div>
      </div>
    </div>
  );
}

