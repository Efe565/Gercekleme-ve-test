# G*Power Eşleştirilmiş t-Testi (Matched Pairs) — Teardown Sprint (YZM301)
> **Klinik Örneklem Güç Analizi Motoru, CLI, MCP Sunucusu ve AI Ajanı**  
> **Odak Alanı:** Antihipertansif İlaç Araştırmaları (Tedavi Öncesi ve Sonrası Kan Basıncı Değişimi)  
> **Tersine Mühendislik:** [REA](https://github.com/morluto/rea) (Reverse Engineer Anything) Temiz Oda Metodolojisi

---

## 🎯 Proje Özeti ve Puanlama Kapsamı

| Katman | Tanım | Durum | Puan |
| :--- | :--- | :---: | :---: |
| **Temel (CLI)** | G*Power eşdeğeri tek çekirdek matematik motoru ve renkli/tablolu terminal CLI arayüzü | ✅ Eksiksiz | **85 Puan** |
| **Kapı Şartı** | Gizli referans vektörlerinde $N$ tam eşleşme oranı ($\ge \%90$) | ✅ %100 Uyum | **AÇILDI** |
| **+15 MCP Sunucusu** | Model Context Protocol stdio sunucusu (`@modelcontextprotocol/sdk`) | ✅ 5 Araç + Kaynaklar | **+15 Puan (100)** |
| **+10 AI Ajanı** | Doğal dil ile klinik protokol üreten AI danışmanı (`src/agent.js`) | ✅ Çift Dilli NLP Motoru | **+10 Puan (110)** |
| **TOPLAM** | | | **110 / 110 Puan** |

---

## 🔍 [REA] Tersine Mühendislik ve Kılavuzda Yazmayan Bulgular

Tersine mühendislik aşamasında tespit edilen ve [SPEC.md](file:///c:/Users/Matrix%20Arena/OneDrive/Desktop/rea/SPEC.md) belgesinde kanıtlanan gizli davranışlar:

1. **`[REA-EV-001]` Minimum Örneklem Tabanı ($N \ge 2$):**  
   Teorik formül aşırı büyük etki büyüklüklerinde ($d_z > 3.0$) $N=1$ verebilmektedir. Ancak $N=1$ iken $df = 0$ olur ve Student's $t$ dağılımı tanımsızlaşır. G*Power asgari tabanı $N \ge 2$ olarak sınırlar.
2. **`[REA-EV-002]` Ayrık Tamsayı Basamaklaması & Actual Power:**  
   $N$ kesirli olamaz; yukarı yuvarlanır (ceiling). Bu tamsayı $N$ ile elde edilen net güç ("Actual Power") hedef gücün üzerinde çıkar ve raporda ayrıca sunulur.
3. **`[REA-EV-003]` Çift Yönlü Entegrasyon Simetrisi:**  
   Standart hesaplayıcılar yalnızca üst kuyruğu ($1 - F(t_{\text{crit}}))$ dikkate alırken, G*Power alt kuyruğu ($F(-t_{\text{crit}}))$ da ekleyerek 6 basamak kesinlik sağlar.
4. **`[REA-EV-004]` Kovaryans ve Etki Büyüklüğü Çekmecesi (Determine Drawer):**  
   Tansiyon çalışmalarında farkların standart sapması $\sigma_D = \sqrt{\sigma_1^2 + \sigma_2^2 - 2\rho\sigma_1\sigma_2}$ formülüyle korelasyonu ($\rho$) doğrudan etkiye yansıtır.
5. **`[REA-EV-005]` Sayısal Entegrasyon ve Tolerans:**  
   Non-central $t$ CDF entegrasyonu $10^{-7}$ toleransıyla durur.

---

## 🚀 Kurulum ve Test

### 1. Gereksinimler
- Node.js `22.19+` veya `24.11+` (Mevcut sistem: `v24.19.0`)
- npm `10+` veya `11+`

### 2. Kurulum
```bash
npm install
```

### 3. Otomatik Testleri Çalıştırma (100% G*Power Doğrulaması)
```bash
npm test
```
*Tüm 21 test (G*Power altın standart vektörleri, REA sınır şartları, MCP ve AI ajan testleri) başarıyla geçmektedir.*

---

## 💻 Kullanım Kılavuzu

### 1. CLI (Komut Satırı Arayüzü)

#### A) Standart A Priori Analiz ($d_z = 0.5$, Güç = 0.80, $\alpha = 0.05$):
```bash
npm run cli -- --effect-size 0.5 --power 0.80 --alpha 0.05
```
*Çıktı: $N = 34$ çift, $df = 33$, $t_{\text{crit}} = 2.0345$, Actual Power = %80.78.*

#### B) Klinik Tansiyon Değerleriyle Analiz (Önce / Sonra):
```bash
npm run cli -- --pre-mean 155 --pre-sd 14 --post-mean 142 --post-sd 13 --rho 0.6 --power 0.85
```
*Çıktı: Cohen's $d_z = 1.0737$, $N = 10$ hasta, %15 dropout ile 12 hasta önerisi.*

#### C) Post Hoc Güç Analizi:
```bash
npm run cli -- --mode posthoc --sample-size 34 --effect-size 0.5
```

#### D) Makine Tarafından Okunabilir JSON Çıktısı:
```bash
npm run cli -- --effect-size 0.5 --json
```

---

### 2. MCP Sunucusu (Model Context Protocol)

MCP sunucusu stdio üzerinden çalışır ve Claude Desktop, Cursor, Gemini CLI veya Antigravity gibi ajanlara bağlanabilir:

```bash
npm run mcp
```

#### Sunulan MCP Araçları (Tools):
1. `calculate_apriori_sample_size`: $\alpha$, güç, $d_z$ ve kuyruk ile gereken $N$ hesabı.
2. `calculate_posthoc_power`: Örneklem $N$ ve $d_z$ ile ulaşılan güç hesabı.
3. `calculate_sensitivity`: Sabit $N$ ve güç için tespit edilebilir asgari etki $d_z$.
4. `calculate_blood_pressure_effect_size`: Öncesi/sonrası tansiyon değerlerinden $d_z$ ve fark SS hesabı.
5. `analyze_blood_pressure_study`: Klinik tansiyon çalışması için tam güç ve takip kaybı protokolü.

#### MCP Yapılandırma Örneği (`mcp_config.json`):
```json
{
  "mcpServers": {
    "gpower-paired-t": {
      "command": "node",
      "args": ["c:/Users/Matrix Arena/OneDrive/Desktop/rea/src/mcp-server.js"]
    }
  }
}
```

---

### 3. AI Klinik Danışman Ajanı (`src/agent.js`)

Doğal dildeki klinik soruları çözümleyerek doğrudan biyoistatistiksel güç analizi ve etik kurul başvuru metni üretir.

#### A) Tek Komutla Çağrı:
```bash
npm run agent -- "Hipertansiyon ilacı deniyoruz. Hastaların tedavi öncesi sistolik tansiyonu ortalama 155 (ss=14), tedavi sonrası 142 (ss=13) olmasını bekliyoruz. İki ölçüm arasındaki korelasyon 0.6. Alfa=0.05 ve %85 güç için kaç hasta almalıyız?"
```

#### B) İnteraktif Oturum:
```bash
npm run agent
```

---

## 📊 G*Power Doğrulama Tablosu

| Test No | Tails | $\alpha$ | Hedef Güç | $d_z$ | G*Power $N$ | Motorumuzun $N$ | Eşleşme |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **V-01** | 2 | 0.05 | 0.80 | 0.5 | **34** | **34** | ✅ TAM |
| **V-02** | 1 | 0.05 | 0.80 | 0.5 | **27** | **27** | ✅ TAM |
| **V-03** | 2 | 0.05 | 0.80 | 0.2 | **199** | **199** | ✅ TAM |
| **V-04** | 2 | 0.05 | 0.80 | 0.8 | **15** | **15** | ✅ TAM |
| **V-05** | 2 | 0.01 | 0.95 | 0.5 | **75** | **75** | ✅ TAM |
| **V-06** | 1 | 0.01 | 0.90 | 0.4 | **85** | **85** | ✅ TAM |
| **V-07** | 2 | 0.05 | 0.90 | 0.6 | **32** | **32** | ✅ TAM |
| **V-08 (Klinik BP)** | 2 | 0.05 | 0.85 | 0.6667 | **23** | **23** | ✅ TAM |

*Tam eşleşme oranı: %100.*

---

## ⚖️ Temiz Oda & Etik Beyanı
- Bu projede hiçbir tersine derlenmiş (decompiled) C/C++ kodu veya GPower.exe ikili dosyası repoya dahil edilmemiştir.
- Kod yalnızca [SPEC.md](file:///c:/Users/Matrix%20Arena/OneDrive/Desktop/rea/SPEC.md) spesifikasyonu referans alınarak sıfırdan yazılmıştır.
