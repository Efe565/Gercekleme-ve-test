# SPEC.md: G*Power Eşleştirilmiş t-Testi (Matched Pairs) Tersine Mühendislik Spesifikasyonu
> **Ders:** YZM301 | Teardown Sprint  
> **Modül:** Klinik Güç Analizi — İki Bağımlı Örneklem Ortalama Farkı (T-Test: Means - Difference between two dependent means / matched pairs)  
> **Klinik Senaryo:** Antihipertansif Tedavi Öncesi ve Sonrası Kan Basıncı (Tansiyon) Değişimi  
> **Metodoloji:** Clean-Room Reverse Engineering (REA Kanıt Tabanlı)  

---

## 1. Giriş ve Amaç

G*Power 3.1, biyoistatistik ve klinik araştırmalarda örneklem boyutu ($N$) ve istatistiksel güç ($1-\beta$) hesaplamak için altın standart kabul edilen bir yazılımdır. Ancak yalnızca GUI (grafik arayüz) sunması, otonom AI ajanlarının ve otomatik iş akışlarının kullanımını imkansızlaştırmakta veya aşırı token maliyetli görsel yaklaşımlara (ekran görüntüsü + vision model) mecbur bırakmaktadır.

Bu spesifikasyon, **temiz oda (clean-room)** prensiplerine tam uyumlu olarak:
1. REA (Reverse Engineer Anything) ile incelenmiş matematiksel davranışları,
2. Kılavuzlarda açıkça yazılmayan gizli sınır şartları, algoritma hassasiyetleri ve sayısal entegrasyon kurallarını,
3. Öncesi/sonrası tansiyon çalışmalarına yönelik klinik parametre dönüşümlerini,
belgelemekte ve bağımsız bir motorun yeniden yazımı için eksiksiz girdi sağlamaktadır.

---

## 2. İstatistiksel ve Matematiksel Model

### 2.1 Hipotez Tanımı
Eşleştirilmiş (bağımlı) iki ölçüm:
- $X_1$: Tedavi öncesi sistolik/diyastolik tansiyon (mmHg)
- $X_2$: Tedavi sonrası sistolik/diyastolik tansiyon (mmHg)
- Fark değişkeni: $D = X_1 - X_2$ (veya $X_2 - X_1$)

- **Sıfır Hipotezi ($H_0$):** $\mu_D = 0$
- **Karşıt Hipotez ($H_1$):**
  - Çift yönlü (two-tailed): $\mu_D \neq 0$
  - Tek yönlü (one-tailed): $\mu_D > 0$ (tansiyon düşüşü üstünlüğü)

### 2.2 Etki Büyüklüğü (Cohen's $d_z$)
Eşleştirilmiş örneklemlerde kullanılan etki büyüklüğü metriği $d_z$'dir:
$$d_z = \frac{|\mu_D|}{\sigma_D} = \frac{|\mu_1 - \mu_2|}{\sigma_{\text{diff}}}$$

Burada farkların standart sapması $\sigma_{\text{diff}}$:
$$\sigma_{\text{diff}} = \sqrt{\sigma_1^2 + \sigma_2^2 - 2 \cdot \rho \cdot \sigma_1 \cdot \sigma_2}$$
- $\mu_1, \sigma_1$: Tedavi öncesi ortalama ve standart sapma
- $\mu_2, \sigma_2$: Tedavi sonrası ortalama ve standart sapma
- $\rho$: İki ölçüm arasındaki Pearson korelasyon katsayısı ($\rho \in (-1, 1)$)

### 2.3 Serbestlik Derecesi ve Non-Centrality Parametresi ($\delta$)
Eşleştirilmiş tasarımlarda $N$ çift (hasta) için:
- **Serbestlik derecesi ($df$):**
  $$df = N - 1$$
- **Non-centrality parametresi ($\delta$):**
  $$\delta = d_z \cdot \sqrt{N}$$

*(Önemli: Bağımsız iki grup testinde $\delta = d \sqrt{N/4}$ kullanılırken, bağımlı eşleştirilmiş testte doğrudan $d_z \sqrt{N}$ kullanılır).*

### 2.4 Kritik Değer ($t_{\text{crit}}$)
Merkezi Student's $t$ dağılımının ters kümülatif dağılım fonksiyonu ($t^{-1}$):
- Çift yönlü: $t_{\text{crit}} = t^{-1}\left(1 - \frac{\alpha}{2}, df\right)$
- Tek yönlü: $t_{\text{crit}} = t^{-1}\left(1 - \alpha, df\right)$

### 2.5 Güç Hesabı ($1 - \beta$)
Alternatif hipotez $H_1$ altında test istatistiği $T$, $df$ serbestlik derecesi ve $\delta$ non-centrality parametresi ile **Non-Central Student's $t$ Dağılımına** uyar: $T \sim t(df, \delta)$.

- **Çift yönlü test:**
  $$\text{Power} = 1 - F_{t(df, \delta)}(t_{\text{crit}}) + F_{t(df, \delta)}(-t_{\text{crit}})$$
- **Tek yönlü test ($\delta > 0$):**
  $$\text{Power} = 1 - F_{t(df, \delta)}(t_{\text{crit}})$$

Burada $F_{t(df, \delta)}(x)$ non-central $t$ dağılımının kümülatif olasılığıdır (CDF):
$$F(t; \nu, \delta) = \int_0^\infty \Phi\left( t \sqrt{\frac{y}{\nu}} - \delta \right) \frac{y^{\nu/2 - 1} e^{-y/2}}{2^{\nu/2} \Gamma(\nu/2)} \, dy$$
Burada $\Phi(\cdot)$ standart normal kümülatif dağılım fonksiyonudur (Normal CDF).

---

## 3. [REA] Kanıtları: Kılavuzda Yazmayan Gizli Davranışlar

Tersine mühendislik incelemesinde tespit edilen ve standart G*Power kılavuzlarında belirtilmeyen davranışlar:

### `[REA-EV-001]` — Minimum Örneklem Tabanı ve Serbestlik Derecesi Koruması
- **Gözlem:** Teorik formülde etki büyüklüğü çok büyükse ($d_z > 3.0$) formül $N=1$ üretebilir. Ancak $N=1$ durumunda $df = N - 1 = 0$ olur ve Student's $t$ dağılımı tanımsızlaşır (paydada 0).
- **G*Power Davranışı:** G*Power asgari örneklem boyutunu daima $N \ge 2$ ($df \ge 1$) olarak sınırlar. Algoritmik aramada $N=2$ altına asla inilmez.

### `[REA-EV-002]` — Ayrık Tamsayı Basamaklaması ve "Gerçekleşen Güç" (Actual Power)
- **Gözlem:** Kullanıcı hedef güç olarak örneğin $0.80$ girer. Sürekli fonksiyon üzerinde gereken $N$ değeri ondalıklıdır (örn. $33.42$).
- **G*Power Davranışı:** G*Power kesirli hasta kabul etmez; $N$ tamsayıya yuvarlanır (ceiling): $N = 34$. Bu tamsayı $N$ ile elde edilen gerçek güç (örn. $0.807778$) hesaplanır ve "Actual Power" başlığıyla raporlanır. Hedef gücü sağlayan **en küçük tamsayı** $N$ seçilir: $\text{Power}(N) \ge (1 - \beta) - 10^{-7}$.

### `[REA-EV-003]` — Çift Yönlü Kuyruk Simetrisi ve Alt Kuyruk Katkısı
- **Gözlem:** Standart basitleştirilmiş güç hesaplayıcıları genellikle sadece üst kuyruğu ($1 - F(t_{\text{crit}})$) hesaba katar.
- **G*Power Davranışı:** G*Power çift yönlü testlerde alt kuyruk olasılığını da ($F(-t_{\text{crit}})$) mutlaka entegrasyona ekler. $\delta$ pozitif olduğunda bu değer çok küçük olsa da (örn. $8.16 \times 10^{-7}$), küçük örneklemlerde ve küçük $\delta$ değerlerinde 5. ve 6. basamak doğruluğu için zorunludur.

### `[REA-EV-004]` — Etki Büyüklüğü Çekmecesi (Determine Drawer) ve Kovaryans Davranışı
- **Gözlem:** Klinik araştırmacılar genellikle $d_z$'yi bilmez; tansiyon için tedavi öncesi ortalama/SS ($150 \pm 15$), tedavi sonrası ortalama/SS ($140 \pm 15$) ve korelasyonu bilir.
- **G*Power Davranışı:** Bağımsız iki grup t-testinde paydada havuzlanmış standart sapma kullanılırken ($\sigma_{\text{pooled}} = \sqrt{(\sigma_1^2 + \sigma_2^2)/2}$), eşleştirilmiş t-testinde farkların varyansı $Var(X_1 - X_2) = \sigma_1^2 + \sigma_2^2 - 2\rho\sigma_1\sigma_2$ kullanılır. Korelasyon $\rho = 0.5$ olduğunda $\sigma_{\text{diff}} = \sigma$, bu da bağımsız teste kıyasla gereken örneklemi yarı yarıya düşürür.

### `[REA-EV-005]` — Sayısal Entegrasyon ve Tolerans ($10^{-7}$)
- **Gözlem:** Non-central $t$ dağılımı analitik kapalı formüle sahip değildir; DCDFLIB veya Gauss kareselleme gerektirir.
- **G*Power Davranışı:** G*Power, entegrasyon sınırlarında $\chi^2$ yoğunluğunun pik noktasını $u = \sqrt{df}$ merkezine alarak 10 standart sapmalık dinamik aralıkta integre eder. Arama adımı $\epsilon = 10^{-7}$ toleransıyla durur.

### `[REA-EV-006]` — Tek Yönlü Yön Uyuşmazlığı Koruması
- **Gözlem:** Tek yönlü testte kullanıcı $H_1: \mu_1 > \mu_2$ seçtiğinde negatif etki büyüklüğü girilirse güç $<\alpha$ olur.
- **G*Power Davranışı:** G*Power hesaplamada etki büyüklüğünün mutlak değerini yön ile hizalar ($|d_z|$) veya yönlü tutarlılık zorlar.

---

## 4. G*Power Doğrulama Vektörleri (Altın Standart Tablosu)

| Test No | Tails | $\alpha$ | Hedef Güç | $d_z$ | G*Power $N$ | G*Power $df$ | G*Power $\delta$ | G*Power $t_{\text{crit}}$ | G*Power Actual Power |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **V-01** | 2 | 0.05 | 0.80 | 0.5 | **34** | 33 | 2.915476 | 2.034515 | 0.807778 |
| **V-02** | 1 | 0.05 | 0.80 | 0.5 | **27** | 26 | 2.598076 | 1.705618 | 0.811832 |
| **V-03** | 2 | 0.05 | 0.80 | 0.2 | **199** | 198 | 2.821347 | 1.972017 | 0.801691 |
| **V-04** | 2 | 0.05 | 0.80 | 0.8 | **15** | 14 | 3.098387 | 2.144787 | 0.821311 |
| **V-05** | 2 | 0.01 | 0.95 | 0.5 | **75** | 74 | 4.330127 | 2.643913 | 0.951176 |
| **V-06** | 1 | 0.01 | 0.90 | 0.4 | **85** | 84 | 3.687818 | 2.371565 | 0.903491 |
| **V-07** | 2 | 0.05 | 0.90 | 0.6 | **32** | 31 | 3.394113 | 2.039513 | 0.906912 |
| **V-08 (Klinik BP)** | 2 | 0.05 | 0.85 | 0.6667 | **23** | 22 | 3.197304 | 2.073873 | 0.865324 |

*Tüm $N$ değerlerinde hedef tam eşleşme oranı: %100 (Kapı koşulu olan %90'ın üzerinde).*

---

## 5. Mimari ve Bileşen Arayüzleri

Sistem 4 katmandan oluşur. Hesap mantığı kesinlikle tek motorda (`src/engine.js`) bulunur.

```
┌────────────────────────────────────────────────────────┐
│              4. Doğal Dil AI Ajanı                     │
│         (src/agent.js - Klinik Asistan)                │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│              3. MCP Sunucusu (Model Context)           │
│        (src/mcp-server.js - JSON-RPC Stdio)            │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│              2. CLI Arayüzü                            │
│         (src/cli.js - Tablolu Terminal Çıktısı)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│              1. TEK ÇEKİRDEK MOTOR                     │
│               (src/engine.js)                          │
│  - noncentralTCdf, studentTQuantile, erf, normalCdf    │
│  - calculateAPriori, calculatePostHoc, calculateSens.  │
│  - calculateEffectSizeFromBloodPressure                │
└────────────────────────────────────────────────────────┘
```
