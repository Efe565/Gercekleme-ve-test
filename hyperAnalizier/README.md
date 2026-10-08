# Pango AI – E-Ticaret İçin Otonom İade, Değişim & Kargo Takip Ajanı (YC S26 Modeli)

**Pango AI**, Y Combinator **S26** döneminin en dikkat çeken e-ticaret operasyon ajanlarından esinlenerek geliştirilmiş, e-ticaret mağazalarının (Shopify, ikas, WooCommerce vb.) **arka ofis lojistik ve müşteri destek yükünü sıfırlayan otonom bir işletim sistemidir**.

---

## 🌟 Neden Bu Proje? (Problem & Çözüm)

* **Problem:** E-ticaret mağazalarının müşteri destek taleplerinin %40'tan fazlası *"Kargom nerede?"* (WISMO), *"Beden uymadı nasıl değiştiririm?"* ve *"İade kodu alabilir miyim?"* sorularından oluşur. Manuel müşteri temsilcileri mağazalara ciddi maliyet ve gecikme yaratır.
* **Pango AI Çözümü:**
  1. **12 Saniyede Otonom Çözüm:** Müşteri sipariş numarasını girdiği veya sorduğu anda kargo durumunu anlık haritalandırır.
  2. **Anında Beden Değişimi (Instant Exchange):** İadeyi bekletmeden depodaki yeni bedeni rezerve eder, nakit çıkışı önler.
  3. **%10 Sadakat Bonusu ile Hediye Çeki:** Nakit para iadesi isteyen müşterilere ekstra %10 cüzdan bakiyesi sunarak ciroyu mağazada tutar.
  4. **AI Hasarlı Ürün Denetimi:** Fotoğraf yükleme ile kumaş/dikiş hasarını saniyeler içinde doğrular ve kargo ile uğraşmadan direkt çözüm sunar.
  5. **Mağaza Yönetim Paneli & Kural Motoru:** İade sürelerini, oto-onay limitlerini ve bonus oranlarını belirleyen kural motoru.

---

## 🚀 Hızlı Başlangıç (Nasıl Çalıştırılır?)

Proje harici hiçbir ağır bağımlılık gerektirmez (saf Node.js ve modern web teknolojileri):

```bash
# 1. Proje dizininde sunucuyu başlatın:
node server.js

# VEYA
npm start
```

Tarayıcınızda açın:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🎯 Canlı Demo & Özellikler

Uygulama 3 ana panelden oluşur:

### 1. 🛍️ Müşteri Portalı & Otonom Ajan (Shopper View)
* **Canlı Kargo Takip Akışı:** Yurtiçi/Aras/MNG kargo hareketlerini adım adım takip eden zaman çizelgesi.
* **Akıllı Doğal Dil Ajanı:** *"Kargom nerede?"*, *"L bedenle değiştirmek istiyorum"*, *"Ürün hasarlı geldi"* gibi tüm ifadelere anında cevap veren, function-calling yetenekli yapay zeka.
* **Görsel Kusur Denetimi:** Hasarlı ürün fotoğrafını analiz edip iadeyi depoya göndermeden onaylayan akıllı modül.
* **Web Audio Haptic Sesler:** Kullanıcı deneyimini güçlendiren saf Web Audio efektleri.

### 2. 📊 Mağaza Yönetim Paneli (Merchant Command Center)
* **Otonom Çözüm Oranı:** %94.6 otonom kapatılan destek biletleri.
* **Kurtarılan Ciro:** Nakit iade yerine hediye çeki ve beden değişimine çevrilen tutar.
* **Tasarruf Edilen Destek Saati:** 180+ saat tasarruf ölçümü.
* **Canlı RMA Tablosu:** AI tarafından verilen kararların (Kargo kodları, beden rezervleri) gerçek zamanlı akışı.
* **Kural Motoru (Policy Engine):** Mağaza sahibinin oto-onay limitlerini (Örn: 750 TL altı direkt onay) tek tıkla değiştirebildiği ayarlar.

### 3. ⚡ API & Webhook Konsolu (Developer Hub)
* **Shopify `orders/create` Webhook Simülatörü:** Tek tıkla gelen siparişi tetikleyip Pango AI'ın aldığı kararları JSON formatında canlı izleme.
* **REST API Uç Noktaları:**
  * `GET /api/orders?q={no}`: Sipariş ve lojistik verisi.
  * `POST /api/orders/create`: Yeni kargo ve müşteri siparişi oluşturma.
  * `POST /api/chat`: Otonom ajan karar motoru.
  * `POST /api/returns/create`: Otonom iade/değişim ve kargo barkodu üretimi.
  * `GET /api/metrics`: Gerçek zamanlı performans metrikleri.

---

## 📁 Proje Mimarisi

```
hyperAnalizier/
├── index.html       # Semantik HTML5, modern <dialog>, erişilebilir yapı
├── style.css        # Özel tasarım sistemi, dark glassmorphism, responsive UI
├── app.js           # Reaktif istemci yönetimi, NLP niyet motoru, Web Audio sentezleyici
├── server.js        # Saf Node.js REST API ve statik sunucu (Zero-Dependency)
├── package.json     # Proje konfigürasyonu
└── README.md        # Dokümantasyon
```
