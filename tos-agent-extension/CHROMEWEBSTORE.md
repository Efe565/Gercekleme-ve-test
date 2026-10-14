# ToS-Agent TR - Chrome Web Mağazası Yayınlama Belgesi

Bu doküman, Chrome Web Mağazası geliştirici paneline girilecek tüm alanların, izin gerekçelerinin ve gizlilik beyanlarının tek kaynak noktasıdır (Single Source of Truth).

---

## 1. Temel Mağaza Bilgileri

| Alan | Değer |
| :--- | :--- |
| **Uzantı Adı** | ToS-Agent TR - Hüküm ve Koşul Risk Analizörü |
| **Kısa Açıklama** (Maks. 132 karakter) | Web sitelerindeki kullanım koşulları ve gizlilik şartlarını DOM üzerinden yakalayıp Türkçe risk raporu ve kanıt alıntıları sunar. |
| **Kategori** | Verimlilik / Gizlilik ve Güvenlik |
| **Sürüm** | 1.0.0 |
| **Manifest Sürümü** | Manifest V3 |
| **Varsayılan Dil** | Türkçe (tr) |

---

## 2. Detaylı Mağaza Açıklaması

```
ToS-Agent TR: İnternetteki Uzun ve Karmaşık Sözleşmeleri Okumaktan Kurtulun!

Bir uygulamaya kaydolurken veya bir web sitesini ziyaret ettiğinizde onlarca sayfalık kullanım koşullarını (Terms of Service), gizlilik politikasını veya abonelik şartlarını okumadan onaylamak zorunda kalmayın. 

ToS-Agent TR; Alibaba'nın açık kaynaklı sayfa içi ajan (page-agent) mimarisinden ilham alınarak geliştirilmiş, tamamen Türkçe hukuki terimler ve tüketici hakları için optimize edilmiş yeni nesil bir akıllı sözleşme denetçisidir.

ÖNE ÇIKAN ÖZELLİKLER:

🛡️ Yapılandırılmış Risk Raporu:
- 0 ile 100 arasında anlaşılır genel tüketici risk puanı.
- Kritik, Yüksek ve Orta risk seviyelerine göre kategorize edilmiş maddeler.

🔍 Deterministik Alıntı Doğrulama (Sıfır Halüsinasyon):
- Sistemimiz yapay zeka uydurmalarına (halüsinasyon) izin vermez!
- Raporlanan her bir riskli madde, orijinal web sayfasındaki metinden kelimesi kelimesine birebir alıntılanır ve arka planda doğrulanır.
- Tek bir tıkla sayfadaki ilgili cümleye kaydırabilir ve sarı renkle vurgulanmış kanıtı görebilirsiniz.

📋 Sade Türkçe Açıklamalar:
- Karmaşık hukuki jargonlar yerine herkesin anlayabileceği günlük dilde açıklamalar:
  * Verilerim kimlerle paylaşılıyor?
  * Kredi kartımdan otomatik para çekilecek mi?
  * Mahkemeye gitme hakkımdan feragat ediyor muyum?
  * Fotoğraflarım veya içeriklerim yapay zeka modellerini eğitmek için kullanılıyor mu?

⚖️ Şeffaf ve Dürüst Belirsizlik İtirafı:
- Sistemimiz her şeyi bildiğini iddia etmez!
- Hukuken muğlak bırakılmış, şirketin "makul önlemler" veya "kendi takdirine bağlı" dediği gri alanlarda kesin hüküm vermek yerine yoruma açık durumu dürüstçe belirtir.

🚨 Gelişmiş Güvenlik ve Prompt Injection Koruması:
- Sayfa içerisine gizlenmiş yapay zekayı aldatmaya yönelik kötü amaçlı gizli talimatları ve CSS hilelerini tespit eder, kullanıcıyı derhal uyarır.

🔑 Kendi Anahtarınızı Kullanın (BYOK) veya Çevrimdışı Çalışın:
- Dilerseniz Google Gemini veya OpenAI API anahtarınızı girerek en güncel modellerle çalışabilir, dilerseniz hiçbir API anahtarı girmeden dahili yerel kural motoruyla %100 çevrimdışı ve gizlilik odaklı kullanabilirsiniz.

---
⚠️ YASAL UYARI:
ToS-Agent TR ve sunduğu analizler hukuki tavsiye niteliği taşımaz. Sadece tüketici farkındalığı ve bilgilendirme amaçlıdır; hukuki uyuşmazlıklarda bir avukata danışınız.
```

---

## 3. İzinler ve İnceleme Ekibi Gerekçeleri (Permissions Justification)

Chrome Web Mağazası inceleme ekibi (Review Team) için sade ve net gerekçeler:

| İzin | Manifest Tanımı | İnceleme Ekibi İçin Gerekçe (Plain English) |
| :--- | :--- | :--- |
| `storage` | `"storage"` | To store the user's selected LLM provider, preferred analysis mode, and user's private API key securely on the client device. |
| `activeTab` | `"activeTab"` | Needed to extract the visible contract/terms text from the user's currently focused webpage when the user explicitly clicks the 'Sayfayı Analiz Et' (Analyze Page) button. |
| `tabs` | `"tabs"` | Used to query active tab title and URL to identify the domain being audited and coordinate in-page clause highlighting. |
| `scripting` | `"scripting"` | Used to dynamically inject the page-agent in-page DOM extractor and visual clause highlighter into the active tab upon user request. |
| `contextMenus` | `"contextMenus"` | Adds an optional right-click context menu item ('ToS-Agent ile Bu Sayfayı İncele') allowing users to trigger analysis directly from any legal webpage. |
| `host_permissions` | `["https://*/*", "http://*/*"]` | Required to read terms of service and privacy policy text across arbitrary websites on the internet upon user activation. |

---

## 4. Gizlilik ve Veri Güvenliği Beyanı (Privacy & Data Use)

- **Kişisel Veri Toplama:** Uzantı hiçbir kullanıcı kimliği, arama geçmişi veya kişisel veriyi merkezi bir sunucuya iletmez.
- **API Anahtarları:** Kullanıcının girdiği API anahtarları yalnızca kullanıcının kendi cihazında (`chrome.storage.local`) saklanır.
- **Üçüncü Taraf İletişimi:** Kullanıcı bir LLM sağlayıcısı (Gemini/OpenAI) seçtiğinde yalnızca o an incelenen sayfanın genel sözleşme metni analiz için ilgili sağlayıcıya iletilir; yerel motor seçildiğinde hiçbir veri tarayıcı dışına çıkmaz.
- **Satış / Reklam:** Kullanıcı verileri hiçbir şekilde satılmaz, reklam ağlarıyla paylaşılmaz.

---

## 5. Sürüm Geçmişi

- **v1.0.0 (14.10.2026):**
  - İlk kararlı sürüm.
  - Alibaba page-agent mimarisi ile DOM okuma ve sayfa içi alıntı vurgulama.
  - Deterministik alıntı doğrulama katmanı (%100 kanıt kontrolü).
  - 10 farklı hukuki risk kategorisi desteği.
  - Prompt injection savunma zırhı.
  - Dürüst belirsizlik (Honesty & Uncertainty) bölümü.
  - Cypress E2E testleri ve mini eval paketi entegrasyonu.
