# Lumina Brain Lab (Lumosity Bilişsel Egzersiz Platformu) 🧠⚡

Lumosity'nin ödüllü bilişsel egzersiz modellerinden, nöropsikolojik testlerinden ve BPI (Beyin Performans Endeksi) mimarisinden ilham alarak **React 19**, **Vite** ve modern **Vanilla CSS Glassmorphism** ile geliştirilmiş, web tabanlı zihinsel antrenman platformu.

---

## 🌟 Öne Çıkan Özellikler

### 1. Günlük Antrenman Devresi (Daily Workout Circuit)
- Her gün kullanıcıya özel 3 aşamalı rehberli antrenman döngüsü:
  1. **Hız Eşleştirme** (Hız & Kısa Süreli Bellek)
  2. **Hafıza Matrisi** (Uzamsal Çalışma Belleği)
  3. **Göç Yolu** (Seçici Dikkat & Odaklanma)
- Seans sonunda kutlama konfetileri (`canvas-confetti`), antrenman serisi artışı (🔥 Günlük Seri) ve BPI puan artışı.

### 2. Beş Bilişsel Alan & 5 Klasik Egzersiz
| Egzersiz | Bilişsel Alan | Bilimsel Kök | Oynanış Özeti |
| :--- | :--- | :--- | :--- |
| **Hız Eşleştirme (Speed Match)** | ⚡ Hız | N-Back & Symbol Digit | Mevcut sembolün bir öncekiyle aynı olup olmadığını belirleme (Sol / Sağ Ok). |
| **Hafıza Matrisi (Memory Matrix)** | 🟣 Hafıza | Corsi Block Test | 3x3'ten 6x6'ya dinamik büyüyen ızgarada parlayan kareleri akılda tutup tıklama. |
| **Göç Yolu (Lost in Migration)** | 🟢 Dikkat | Eriksen Flanker Task | Çeldirici kuşları filtreleyip yalnızca ortadaki ana yeşil kuşun yönünü tuşlama (Yön tuşları / D-Pad). |
| **Kara Tahta (Chalkboard Challenge)** | 🌸 Problem Çözme | Mental Arithmetic | İki kara tahta üzerindeki matematiksel ifadelerin sonucunu anında karşılaştırma (`<`, `=`, `>`). |
| **Renk Eşleştirme (Color Match)** | 🔵 Esneklik | Stroop Effect (1935) | Üstteki kelimenin anlamı ile alttaki kelimenin yazı rengi eşleşiyor mu? Zihinsel çelişkiyi aşma. |

### 3. BPI (Beyin Performans Endeksi) & Radar Profili
- Dinamik BPI skoru hesaplaması (1000 akran taban puanı, oyun performansına göre artış).
- SVG tabanlı 5 eksenli Nöral Radar Grafiği (Spider Chart).
- Zaman çizelgesi gelişim eğrisi (SVG Sparkline).
- Akran yüzdelik dilim karşılaştırması ("Akranlarınızın %88'inden hızlı").

### 4. Ses Sentezleyici (Web Audio API)
- Sıfır harici MP3 bağımlılığı; Web Audio API ile saf osilatör ve filtrelerden sentezlenen tatlı tıklamalar, doğru zil sesleri, hata titreşimleri ve galibiyet fanfarları.
- Navbardan anında tek tıkla ses açma/kapatma (Mute/Unmute).

### 5. Kalıcı Veri & Çevrimdışı Çalışma
- `localStorage` üzerinde çalışan güvenli veri motoru ile yüksek skorlar, günlük seriler ve BPI geçmişi asla kaybolmaz.

---

## 🚀 Çalıştırma Talimatları

Geliştirici sunucusu halihazırda arka planda çalışmaktadır:
- **Yerel Adres:** [http://localhost:5173/](http://localhost:5173/)

Sunucuyu yeniden başlatmak veya terminalden çalıştırmak için:
```bash
# 1. Bağımlılıkları yükleyin (ilk seferde yapıldı)
npm install

# 2. Geliştirici sunucusunu başlatın
npm run dev

# 3. Üretim sürümünü derlemek için
npm run build
```

---

## ⌨️ Oyun Kontrolleri

- **Hız Eşleştirme**: Sol Ok [← Farklı], Sağ Ok [Aynı →]
- **Hafıza Matrisi**: Fare tıklaması veya dokunmatik seçim
- **Göç Yolu**: Yön Tuşları (↑, ↓, ←, →) veya Ekran D-Pad butonları
- **Kara Tahta**: Sol Ok [Sol Küçük], Aşağı Ok [Eşit], Sağ Ok [Sol Büyük]
- **Renk Eşleştirme**: Sol Ok [HAYIR / Farklı], Sağ Ok [EVET / Aynı]
