# Gerçekleme ve Test

Bu repository, Gerçekleme ve Test çalışmaları kapsamında geliştirilen projeleri ve test modüllerini içermektedir.

## 📁 Projeler

### 🧠 [Lumina Brain Lab](./lumina-brain-lab)
Bilişsel nörobilim testlerine dayalı; Hafıza, İşlem Hızı, Dikkat, Bilişsel Esneklik ve Problem Çözme becerilerini ölçen ve geliştiren, 9 bilimsel oyundan oluşan interaktif web platformu.

- **Dizin:** `lumina-brain-lab/`
- **Teknolojiler:** React, Vite, Web Audio API, CSS3
- **Çalıştırma:**
  ```bash
  cd lumina-brain-lab
  npm install
  npm run dev
  ```

### 🛡️ [ToS-Agent TR - Chrome Uzantısı](./tos-agent-extension)
Alibaba `page-agent` mimarisine dayalı, kullanım koşulları ve gizlilik politikalarını DOM seviyesinde okuyup Türk Hukukuna göre yapılandırılmış risk analizi çıkaran Manifest V3 Chrome uzantısı.

- **Dizin:** `tos-agent-extension/`
- **Temel Özellikler:**
  - Alibaba `page-agent` DOM çıkarımı ve sayfa içi sarı vurgulama (Visual Grounding)
  - Deterministik alıntı doğrulama (Alıntısı olmayan iddialar geçersiz sayılır)
  - JSON şema doğrulama (Serbest metin reddi)
  - Prompt Injection savunması (Adversarial saldırı tespiti ve güvenlik alarmı)
  - Dürüst belirsizlik anı (Hukuken muğlak maddelerde güven skorunu düşürme)
  - 5 Gerçek ToS + 1 Adversarial test setiyle Mini-Eval (24/24 TP, 0 FN, 0 FP)
  - Cypress E2E demo videosu (≤ 90 sn, 47 sn yüksek çözünürlüklü kayıt)
- **Çalıştırma & Test:**
  ```bash
  cd tos-agent-extension
  npm install
  npm test          # Mini-eval testlerini koşar
  npm run cypress   # Cypress E2E testlerini ve videosunu koşar
  ```

### 🔬 [G*Power Matched Pairs t-Test - Teardown Sprint](./gpower-paired-t)
G*Power biyoistatistiksel güç analizi aracının (Means: Difference between two dependent means / matched pairs) REA (Reverse Engineer Anything) ile temiz oda tersine mühendisliği; klinik tansiyon modülü (önce/sonra), CLI, MCP Sunucusu ve AI Ajanı.

- **Dizin:** `gpower-paired-t/`
- **Temel Özellikler:**
  - REA kanıt tabanlı temiz oda spesifikasyonu (`SPEC.md` — [REA-EV-001] ... [REA-EV-006])
  - G*Power referans vektörlerinde %100 tam eşleşme (N doğruluk kapısı)
  - Tek çekirdek matematiksel motor (`src/engine.js`)
  - Renkli ve tablolu CLI arayüzü (`src/cli.js`)
  - Model Context Protocol (MCP) stdio sunucusu (`src/mcp-server.js` - 5 araç)
  - Doğal dille klinik araştırma protokolü oluşturan AI Klinik Danışman Ajanı (`src/agent.js`)
- **Çalıştırma & Test:**
  ```bash
  cd gpower-paired-t
  npm install
  npm test          # 21/21 birim ve G*Power vektör testlerini koşar
  npm run cli -- --effect-size 0.5 --power 0.80
  npm run agent -- "Tansiyon ilacı için öncesi 155, sonrası 142, r=0.6, %85 güçle kaç hasta gerekir?"
  ```
