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

