import React, { useState } from 'react';
import { 
  Lightbulb, Target, Sparkles, TrendingUp, AlertCircle, 
  Brain, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, Zap 
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function NeuroCoachInsights({ profile, onLaunchGame }) {
  const domains = profile.domains || {};
  const games = profile.games || {};

  // Find lowest domain (the cognitive bottleneck)
  const domainKeys = ['speed', 'memory', 'attention', 'flexibility', 'problemSolving'];
  let lowestDomainKey = 'memory';
  let lowestBpi = 9999;

  domainKeys.forEach(k => {
    if (domains[k] && domains[k].bpi < lowestBpi) {
      lowestBpi = domains[k].bpi;
      lowestDomainKey = k;
    }
  });

  const [activeStrategyKey, setActiveStrategyKey] = useState(lowestDomainKey);

  // Strategy database tailored to break plateaus
  const STRATEGIES = {
    memory: {
      gameId: 'memory-matrix',
      gameTitle: 'Hafıza Matrisi',
      domainTitle: 'Hafıza (Çalışma Belleği)',
      ceilingReason: 'George Miller Kuralı (7±2 birim): Beyin kareleri tek tek ezberlemeye çalıştığında 5-6 kareden sonra nöral çalışma belleği doyum noktasına ulaşır.',
      actionableAdvice: [
        {
          title: 'Gestalt / Chunking (Gruplama) Tekniği',
          detail: 'Yanan kareleri tekil noktalar olarak değil; L-harfi, üçgen, çizgi veya kare blokları gibi tek bir geometrik bütün halinde zihninizde resmedin.'
        },
        {
          title: 'Uzamsal Çapa Noktası',
          detail: 'Gözlerinizi matrisin tam merkezine sabitleyin. Kareler yandığında gözünüzü gezdirmek yerine merkezden çevreye doğru simetri algısını kullanın.'
        }
      ],
      neuroImpact: 'Dorsolateral Prefrontal Korteks & Hipokampus arasındaki sinaptik geçiş hızını %28 artırır.',
      color: '#7B4CE6'
    },
    attention: {
      gameId: 'lost-in-migration',
      gameTitle: 'Göç Yolu (Kuş Sürüsü)',
      domainTitle: 'Dikkat & Ketleme Kontrolü',
      ceilingReason: 'Eriksen Flanker Etkisi: Görsel korteks periferik hareket eden nesneleri otomatik algılar ve beynin Anterior Singulat Korteksinde mikro-duraklamalara yol açar.',
      actionableAdvice: [
        {
          title: 'Sakkadik Bakış Sabitleme',
          detail: 'Bakışınızı ekranda rastgele gezdirmeyin. Ekranın tam ortasında hayali bir küçük nokta belirleyin ve gözlerinizi oradan asla ayırmayın.'
        },
        {
          title: 'Çevresel Görüşü Bilinçli Bulanıklaştırma',
          detail: 'Kenardaki 4 kuşu algıladığınız anda nefesinizi tutmayın; sadece ortadaki kuşa tünel görüşü uygulayarak parmak refleksinizi serbest bırakın.'
        }
      ],
      neuroImpact: 'Seçici dikkat filtreleme hızınızı geliştirerek çeldiricileri 85 milisaniye daha erken eler.',
      color: '#0091FF'
    },
    speed: {
      gameId: 'speed-match',
      gameTitle: 'Hız Eşleştirme',
      domainTitle: 'İşlem Hızı & Karar Verme',
      ceilingReason: 'İçsel Seslendirme (Subvocalization): Beyninizin şekli görünce içten içe "kare", "daire" gibi kelimeleri telaffuz etmesi tepki sürenize 120-160ms gecikme ekler.',
      actionableAdvice: [
        {
          title: 'İçsel Sesi Susturma (Görsel Refleks)',
          detail: 'Şekle isim takmayı bırakın. İki şeklin eşleşmesini bir kelimeyle değil, anlık bir "uyum kıvılcımı" hissiyle doğrudan parmaklarınıza iletin.'
        },
        {
          title: 'Ritmik Tuşlama Akışı',
          detail: 'Her kartın gelmesini pasif beklemek yerine, saniyede yaklaşık 2 kartlık sabit bir zihinsel metronom ritmi tutturun.'
        }
      ],
      neuroImpact: 'Görsel uyaran ile motor korteks arasındaki iletim gecikmesini minimuma indirir.',
      color: '#FF9A00'
    },
    flexibility: {
      gameId: 'color-match',
      gameTitle: 'Renk Eşleştirme (Stroop)',
      domainTitle: 'Bilişsel Esneklik',
      ceilingReason: 'Stroop Girişimi: Sol beyin lobu kelimeyi okumak için yarışırken, sağ beyin lobu rengi algılamak için yarışır. İki lob arasındaki çatışma tereddüde yol açar.',
      actionableAdvice: [
        {
          title: 'Alttaki Yazıyı Okumama Kuralı',
          detail: 'Alttaki kart geldiğinde gözlerinizi hafifçe kısarak harflerin anlamını değil, sadece piksellerin rengini yakalayın.'
        },
        {
          title: 'Kuralı Zihinde Önceden Çapa Yapma',
          detail: '"Üstteki kelimenin anlamı = Alttaki kelimenin rengi" kuralını her yeni kartta zihninizde bir saniye önceden hazır tutun.'
        }
      ],
      neuroImpact: 'Prefrontal korteksin görevler ve zıt kurallar arasında hızlı geçiş yapabilme esnekliğini pekiştirir.',
      color: '#E83D84'
    },
    problemSolving: {
      gameId: 'chalkboard-challenge',
      gameTitle: 'Kara Tahta',
      domainTitle: 'Problem Çözme & Nicel Akıl Yürütme',
      ceilingReason: 'Gereksiz Hassas Hesaplama Tuzağı: Çoğu kişi sol ve sağ taraftaki tam sayı değerini kuruşu kuruşuna bulmaya çalışırken saniyelerini kaybeder.',
      actionableAdvice: [
        {
          title: 'Yaklaşık Yuvarlama Mantığı (Magnitude Estimation)',
          detail: 'Örneğin 14 x 4 ile 75 - 12 karşılaştırılırken tam sayıyı değil; "14x4 = ~56" iken "75-12 = ~63" olduğunu saniyeler içinde kestirin.'
        },
        {
          title: 'Bileşenleri Sadeleştirme',
          detail: 'Her iki tarafta benzer sayılar veya katlar varsa onları doğrudan zihninizde sadeleştirip kalan farka odaklanın.'
        }
      ],
      neuroImpact: 'İntraparietal Sulkustaki sayısal büyüklük sezgisini ve anlık zihinsel matematiği keskinleştirir.',
      color: '#00B894'
    }
  };

  const activeStrategy = STRATEGIES[activeStrategyKey] || STRATEGIES.memory;

  return (
    <div className="neuro-coach-section glass-card animate-pop">
      <div className="coach-section-header">
        <div className="coach-title-group">
          <div className="coach-icon-badge">
            <Lightbulb size={24} color="#FA6432" />
          </div>
          <div>
            <div className="badge coach-mini-badge">
              <Sparkles size={13} /> BİLİMSEL KOÇLUK & TAVAN KIRMA LABORATUVARI
            </div>
            <h3>Kişisel Bilişsel Koç Analizi</h3>
            <p className="card-sub">
              Lumosity kullanıcılarının talep ettiği "Neden tıkandım ve nasıl gelişirim?" sorusuna 
              nöropsikolojik çözümler ve stratejiler.
            </p>
          </div>
        </div>

        {/* Bottleneck Warning */}
        <div className="bottleneck-tag">
          <AlertCircle size={16} />
          <span>Öncelikli Gelişim Alanı: <strong>{domains[lowestDomainKey]?.name || 'Hafıza'}</strong></span>
        </div>
      </div>

      {/* Domain Switcher Buttons */}
      <div className="coach-domain-tabs">
        {domainKeys.map(k => {
          const dom = domains[k];
          const isSelected = activeStrategyKey === k;
          const isBottleneck = lowestDomainKey === k;

          return (
            <button
              key={k}
              className={`coach-tab-btn ${isSelected ? 'active' : ''}`}
              onClick={() => {
                sound.playTap();
                setActiveStrategyKey(k);
              }}
              style={isSelected ? { borderColor: dom?.color, color: '#FFFFFF', background: `${dom?.color}25` } : {}}
            >
              <span>{dom?.name}</span>
              {isBottleneck && <span className="bottleneck-dot" title="Öncelikli Gelişim Alanı" />}
            </button>
          );
        })}
      </div>

      {/* Main Diagnostic & Actionable Advice Card */}
      <div className="coach-strategy-card glass-card">
        <div className="strategy-top-row">
          <div>
            <span className="strategy-target-tag" style={{ color: activeStrategy.color }}>
              HEDEF EGZERSİZ: {activeStrategy.gameTitle.toUpperCase()}
            </span>
            <h4>{activeStrategy.domainTitle} Kapasitesini Artırma Rehberi</h4>
          </div>

          <button 
            className="btn btn-primary btn-launch-coached"
            onClick={() => {
              sound.playTap();
              if (onLaunchGame) onLaunchGame(activeStrategy.gameId);
            }}
            style={{ background: activeStrategy.color, color: '#FFFFFF' }}
          >
            <span>Taktik Egzersizini Başlat</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Ceiling Reason */}
        <div className="ceiling-box">
          <div className="ceiling-header">
            <Target size={18} color="#FA6432" />
            <strong>Neden Bu Alanda Tavan Yapmış Olabilirsiniz? (Nöral Engel):</strong>
          </div>
          <p>{activeStrategy.ceilingReason}</p>
        </div>

        {/* Actionable Concrete Techniques */}
        <div className="advice-grid">
          {activeStrategy.actionableAdvice.map((item, idx) => (
            <div key={idx} className="advice-card glass-card">
              <div className="advice-card-header">
                <span className="advice-step-num">{idx + 1}</span>
                <h5>{item.title}</h5>
              </div>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Brain Impact Footnote */}
        <div className="strategy-impact-note">
          <Brain size={18} color={activeStrategy.color} />
          <span><strong>Nöral Sonuç:</strong> {activeStrategy.neuroImpact}</span>
        </div>
      </div>
    </div>
  );
}
