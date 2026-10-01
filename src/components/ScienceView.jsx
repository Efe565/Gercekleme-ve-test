import React from 'react';
import { Brain, GraduationCap, Microscope, Award, CheckCircle, Sparkles, BookOpen } from 'lucide-react';

export default function ScienceView() {
  return (
    <div className="science-view container">
      {/* Hero */}
      <div className="science-hero glass-card animate-pop">
        <div className="science-badge">
          <Microscope size={16} />
          <span>BİLİMSEL TEMELLER & NÖROPLASTİSİTE</span>
        </div>
        <h1>Zihinsel Egzersizlerin Arkasındaki Bilim</h1>
        <p className="science-hero-sub">
          Lumina Brain Lab / Lumosity egzersizleri, bilişsel psikoloji ve nörobilim alanında yarım asrı aşkın 
          süredir kullanılan kanıtlanmış nöropsikolojik testlerin modern dijital uyarlamalarıdır.
        </p>
      </div>

      {/* 3 Core Pillars */}
      <div className="science-pillars-grid">
        <div className="pillar-card glass-card">
          <div className="pillar-icon-box" style={{ background: 'rgba(250, 100, 50, 0.15)', color: '#FA6432' }}>
            <Brain size={28} />
          </div>
          <h3>1. Nöroplastisite</h3>
          <p>
            Beyin, yaşam boyu değişebilen ve yeni nöral yollar kurabilen dinamik bir organdır. 
            Hedefe yönelik bilişsel uyaranlar, sinapsların güçlenmesini (LTP) ve yeni dentritik bağlantıları uyarır.
          </p>
        </div>

        <div className="pillar-card glass-card">
          <div className="pillar-icon-box" style={{ background: 'rgba(123, 76, 230, 0.15)', color: '#7B4CE6' }}>
            <GraduationCap size={28} />
          </div>
          <h3>2. Klasik Testlerin Evrimi</h3>
          <p>
            Oyunlarımız rastgele tasarlanmamıştır: Göç Yolu ünlü <strong>Eriksen Flanker Görevi</strong>'ne, 
            Renk Eşleştirme <strong>Stroop Etkisi</strong>'ne, Hafıza Matrisi ise <strong>Corsi Blok Testi</strong>'ne dayanır.
          </p>
        </div>

        <div className="pillar-card glass-card">
          <div className="pillar-icon-box" style={{ background: 'rgba(255, 154, 0, 0.15)', color: '#FF9A00' }}>
            <Sparkles size={28} />
          </div>
          <h3>3. Dinamik Zorluk Adaptasyonu</h3>
          <p>
            Bilişsel gelişim, yeteneğinizin sınırında (Zone of Proximal Development) çalışırken gerçekleşir. 
            Algoritmamız başarılarınıza göre hızı ve karmaşıklığı anlık olarak ayarlar.
          </p>
        </div>
      </div>

      {/* Table of Neuropsychological Foundations */}
      <div className="science-table-card glass-card">
        <h3>Egzersizler ve Bilimsel Karşılıkları</h3>
        <div className="science-table-wrapper">
          <table className="science-table">
            <thead>
              <tr>
                <th>Oyun</th>
                <th>Bilişsel Alan</th>
                <th>Klasik Nöropsikolojik Test</th>
                <th>Hedeflenen Beyin Bölgesi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Hız Eşleştirme (Speed Match)</strong></td>
                <td>İşlem Hızı</td>
                <td>N-Back & Symbol Digit Modalities Test</td>
                <td>Oksipital & Parietal Korteks</td>
              </tr>
              <tr>
                <td><strong>Hafıza Matrisi (Memory Matrix)</strong></td>
                <td>Çalışma Belleği</td>
                <td>Corsi Block-Tapping Test</td>
                <td>Dorsolateral Prefrontal Korteks & Hipokampus</td>
              </tr>
              <tr>
                <td><strong>Göç Yolu (Lost in Migration)</strong></td>
                <td>Seçici Dikkat</td>
                <td>Eriksen Flanker Task</td>
                <td>Anterior Singulat Korteks (ACC)</td>
              </tr>
              <tr>
                <td><strong>Kara Tahta (Chalkboard Challenge)</strong></td>
                <td>Problem Çözme</td>
                <td>Mental Arithmetic & Numerical Magnitude</td>
                <td>İntraparietal Sulkus (IPS)</td>
              </tr>
              <tr>
                <td><strong>Renk Eşleştirme (Color Match)</strong></td>
                <td>Bilişsel Esneklik</td>
                <td>Stroop Color and Word Test (1935)</td>
                <td>Ventrolateral Prefrontal Korteks</td>
              </tr>
              <tr>
                <td><strong>Hedef Takibi (Target Tracker)</strong></td>
                <td>Görsel Dikkat</td>
                <td>Multiple Object Tracking (MOT - Pylyshyn 1988)</td>
                <td>Parietal Korteks & Üst Kolikulus</td>
              </tr>
              <tr>
                <td><strong>Gelgit Akışı (Ebb and Flow)</strong></td>
                <td>Bilişsel Esneklik</td>
                <td>Cognitive Shifting & Task-Switching Task</td>
                <td>Dorsolateral Prefrontal Korteks & Striatum</td>
              </tr>
              <tr>
                <td><strong>Yağmur Damlaları (Raindrops)</strong></td>
                <td>Problem Çözme</td>
                <td>Mental Calculation Velocity Paradigm</td>
                <td>Sol İntraparietal Sulkus & Açısal Girus</td>
              </tr>
              <tr>
                <td><strong>Deniz Hazineleri (Tidal Treasures)</strong></td>
                <td>Sürekli Hafıza</td>
                <td>Continuous Recognition & Episodic Retrieval</td>
                <td>Hipokampus & Medial Temporal Lob</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Habits Recommendation */}
      <div className="science-recommendation-card glass-card">
        <div className="rec-header">
          <BookOpen size={24} color="#38BDF8" />
          <h3>Optimum Zihinsel Performans İçin 4 Kural</h3>
        </div>
        <div className="rec-grid">
          <div className="rec-item">
            <CheckCircle size={18} color="#00B894" />
            <span><strong>Düzenlilik:</strong> Haftada 4-5 gün, günde 10-15 dakikalık kısa seanslar.</span>
          </div>
          <div className="rec-item">
            <CheckCircle size={18} color="#00B894" />
            <span><strong>Uyku Kalitesi:</strong> Derin uyku, öğrenilen desenlerin konsolidasyonu için vazgeçilmezdir.</span>
          </div>
          <div className="rec-item">
            <CheckCircle size={18} color="#00B894" />
            <span><strong>Aerobik Egzersiz:</strong> BDNF (Beyin Kaynaklı Nörotrofik Faktör) salınımını tetikler.</span>
          </div>
          <div className="rec-item">
            <CheckCircle size={18} color="#00B894" />
            <span><strong>Çeşitlilik:</strong> Tek bir oyunda uzmanlaşmak yerine 5 alanı da eşit çalıştırın.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
