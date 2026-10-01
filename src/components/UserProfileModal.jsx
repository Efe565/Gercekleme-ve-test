import React, { useState } from 'react';
import { X, User, Calendar, Target, Award, RotateCcw, Check, Sparkles } from 'lucide-react';
import { updateProfile, resetAllData } from '../utils/storage';
import { sound } from '../utils/sound';

export default function UserProfileModal({ profile, setProfile, onClose }) {
  const [name, setName] = useState(profile.name || 'Bilişsel Sporcu');
  const [ageGroup, setAgeGroup] = useState(profile.ageGroup || '25-34');
  const [weeklyGoal, setWeeklyGoal] = useState(profile.weeklyGoal || 5);
  const [workoutPreference, setWorkoutPreference] = useState(profile.workoutPreference || 'full');
  const [trainingGoals, setTrainingGoals] = useState(profile.trainingGoals || ['memory', 'attention', 'speed']);
  const [isSaved, setIsSaved] = useState(false);

  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  
  const goalOptions = [
    { key: 'speed', label: 'Hız ve Karar Verme', color: '#FF9A00' },
    { key: 'memory', label: 'Hafıza ve Hatırlama', color: '#7B4CE6' },
    { key: 'attention', label: 'Dikkat ve Odaklanma', color: '#0091FF' },
    { key: 'flexibility', label: 'Zihinsel Esneklik', color: '#E83D84' },
    { key: 'problemSolving', label: 'Problem Çözme', color: '#00B894' }
  ];

  const toggleGoal = (key) => {
    sound.playTap();
    if (trainingGoals.includes(key)) {
      if (trainingGoals.length > 1) {
        setTrainingGoals(trainingGoals.filter(g => g !== key));
      }
    } else {
      setTrainingGoals([...trainingGoals, key]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    sound.playTap();
    const updated = updateProfile({
      name,
      ageGroup,
      weeklyGoal: Number(weeklyGoal),
      workoutPreference,
      trainingGoals
    });
    setProfile(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm('Tüm ilerlemeniz, LPI geçmişiniz ve rekorlarınız sıfırlanacaktır. Onaylıyor musunuz?')) {
      const fresh = resetAllData();
      setProfile(fresh);
      sound.playTap();
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="profile-modal-container glass-card animate-pop">
        <div className="profile-modal-header">
          <div className="profile-title-group">
            <div className="profile-avatar-box">
              <User size={24} color="#FA6432" />
            </div>
            <div>
              <h2>Profil ve Antrenman Ayarları</h2>
              <p className="profile-sub">Kişiselleştirilmiş LPI ve nöroplastisite hedeflerinizi yönetin.</p>
            </div>
          </div>
          <button className="profile-close-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          {/* User Name */}
          <div className="form-group">
            <label className="form-label">Kullanıcı Adı / Takma Ad</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınızı girin"
              required
            />
          </div>

          {/* Age Group Benchmark */}
          <div className="form-group">
            <label className="form-label">
              Yaş Grubu (Akran LPI Karşılaştırması İçin)
            </label>
            <div className="age-group-pills">
              {ageGroups.map((group) => (
                <button
                  type="button"
                  key={group}
                  className={`age-pill-btn ${ageGroup === group ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    setAgeGroup(group);
                  }}
                >
                  {group} Yaş
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="form-group">
            <label className="form-label">
              Haftalık Antrenman Hedefi ({weeklyGoal} Gün / Hafta)
            </label>
            <div className="weekly-goal-slider-box">
              <input 
                type="range" 
                min="3" 
                max="7" 
                step="1"
                value={weeklyGoal} 
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                className="goal-slider"
              />
              <div className="slider-ticks">
                <span>3 Gün (Hafif)</span>
                <span>5 Gün (Önerilen)</span>
                <span>7 Gün (Maksimum)</span>
              </div>
            </div>
          </div>

          {/* Workout Preference */}
          <div className="form-group">
            <label className="form-label">Varsayılan Günlük Antrenman Tipi</label>
            <div className="workout-pref-options">
              <div 
                className={`workout-pref-card ${workoutPreference === 'full' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setWorkoutPreference('full');
                }}
              >
                <div className="pref-radio">
                  {workoutPreference === 'full' && <div className="pref-radio-dot" />}
                </div>
                <div>
                  <div className="pref-title">
                    <span>Tam Antrenman (5 Bilişsel Alan)</span>
                    <span className="pref-tag">Önerilen</span>
                  </div>
                  <p className="pref-desc">Hız, Hafıza, Dikkat, Problem Çözme ve Esneklik alanlarının tümünü kapsayan ~5 dakikalık eksiksiz seans.</p>
                </div>
              </div>

              <div 
                className={`workout-pref-card ${workoutPreference === 'quick' ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setWorkoutPreference('quick');
                }}
              >
                <div className="pref-radio">
                  {workoutPreference === 'quick' && <div className="pref-radio-dot" />}
                </div>
                <div>
                  <div className="pref-title">
                    <span>Hızlı Seans (3 Alan)</span>
                  </div>
                  <p className="pref-desc">Zamanınız kısıtlı olduğunda 3 temel egzersizden oluşan ~3 dakikalık hızlı zindelik seansı.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Training Focus Goals */}
          <div className="form-group">
            <label className="form-label">Öncelikli Zihinsel Hedefleriniz</label>
            <div className="goals-chips-grid">
              {goalOptions.map((goal) => {
                const isSelected = trainingGoals.includes(goal.key);
                return (
                  <button
                    type="button"
                    key={goal.key}
                    className={`goal-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGoal(goal.key)}
                    style={isSelected ? { borderColor: goal.color, background: `${goal.color}20` } : {}}
                  >
                    <span className="chip-dot" style={{ background: goal.color }} />
                    <span>{goal.label}</span>
                    {isSelected && <Check size={14} color={goal.color} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="profile-form-footer">
            <button 
              type="button" 
              className="btn btn-outline btn-danger-text" 
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Verileri Sıfırla</span>
            </button>

            <button type="submit" className="btn btn-primary btn-save-profile">
              {isSaved ? <Check size={18} /> : <Sparkles size={18} />}
              <span>{isSaved ? 'Kaydedildi!' : 'Ayarları Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
