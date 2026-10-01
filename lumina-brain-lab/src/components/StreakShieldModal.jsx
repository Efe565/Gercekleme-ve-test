import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Flame, X, Sparkles, CheckCircle2, History, PlusCircle } from 'lucide-react';
import { earnStreakFreeze, useStreakFreezeManually } from '../utils/storage';
import { sound } from '../utils/sound';

export default function StreakShieldModal({ profile, setProfile, onClose }) {
  const [msg, setMsg] = useState(null);
  const freezes = profile.streakFreezes || 0;
  const maxFreezes = profile.maxStreakFreezes || 3;
  const logs = profile.streakShieldLogs || [];

  const handleEarnShield = () => {
    sound.playLevelUp();
    const res = earnStreakFreeze('Antrenman Motivasyon Görevi Tamamlandı');
    if (res.success) {
      setProfile(res.profile);
      setMsg('Harika! +1 Seri Koruma Kalkanı başarıyla eklendi.');
    } else {
      setMsg(res.reason);
    }
  };

  const handleUseShield = () => {
    sound.playTap();
    const res = useStreakFreezeManually();
    if (res.success) {
      setProfile(res.profile);
      setMsg('Seri Koruma Kalkanı rezerve edildi! Yarın antrenman yapamasanız dahi seriniz korunacak.');
    } else {
      setMsg(res.reason);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="streak-shield-modal glass-card animate-pop">
        <button className="modal-close-btn" onClick={onClose} aria-label="Kapat">
          <X size={20} />
        </button>

        {/* Top Header Badge */}
        <div className="shield-icon-badge">
          <Shield size={36} color="#0091FF" />
          <div className="shield-sparkle-dot" />
        </div>

        <h2 className="shield-modal-title">Seri Koruma Kalkanı (Streak Freeze)</h2>
        <p className="shield-modal-sub">
          Lumosity'de olmayan, en çok talep edilen özellik! Hastalık, seyahat veya yoğun günlerde 
          aylarca biriktirdiğiniz antrenman seriniz sıfırlanmaz; kalkanınız otomatik devreye girer.
        </p>

        {/* Shields Slots Row */}
        <div className="shield-slots-row">
          {[...Array(maxFreezes)].map((_, i) => {
            const isFilled = i < freezes;
            return (
              <div key={i} className={`shield-slot ${isFilled ? 'filled' : 'empty'}`}>
                {isFilled ? (
                  <>
                    <ShieldCheck size={32} className="shield-glow-icon" />
                    <span className="slot-label">Kalkan {i + 1} Aktif</span>
                  </>
                ) : (
                  <>
                    <Shield size={28} className="shield-empty-icon" />
                    <span className="slot-label">Boş Yuva</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Current Status Message */}
        <div className="shield-status-card glass-card">
          <div className="status-flex">
            <div className="status-icon">
              <Flame size={24} color="#FF9A00" className="animate-bounce-slow" />
            </div>
            <div>
              <span className="status-title">{profile.streak || 1} Günlük Aktif Seriniz Güvende</span>
              <p className="status-desc">
                {freezes > 0 
                  ? `Mevcut ${freezes} adet kalkanınız sayesinde önümüzdeki ${freezes} kaçırılan güne kadar seriniz korunur.`
                  : 'Şu an aktif kalkanınız bulunmuyor. Haftalık antrenman hedefinizi tutturarak yeni kalkan kazanabilirsiniz.'}
              </p>
            </div>
          </div>
        </div>

        {msg && (
          <div className="shield-feedback-msg text-success animate-fade">
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="shield-modal-actions">
          {freezes < maxFreezes && (
            <button className="btn btn-primary btn-earn-shield" onClick={handleEarnShield}>
              <PlusCircle size={18} />
              <span>Görevi Tamamla & Kalkan Kazan (+1)</span>
            </button>
          )}

          {freezes > 0 && (
            <button className="btn btn-outline" onClick={handleUseShield}>
              <ShieldAlert size={17} />
              <span>Yarın İçin Manuel Kalkan Ayır</span>
            </button>
          )}
        </div>

        {/* Shield Activity History */}
        {logs.length > 0 && (
          <div className="shield-history-section">
            <div className="history-header">
              <History size={15} />
              <span>Kalkan Geçmişi ve Güvenlik Kayıtları</span>
            </div>
            <div className="history-list">
              {logs.slice(0, 3).map((log, idx) => (
                <div key={idx} className="history-item">
                  <span className="history-date">{log.date}</span>
                  <span className="history-text">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
