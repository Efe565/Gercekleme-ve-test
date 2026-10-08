// Pango AI (YC S26) - Autonomous E-Commerce Operations OS
// Standalone lightweight Node server with zero required npm dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// In-Memory Database for Mock Orders, RMAs & Analytics
const db = {
  orders: [
    {
      id: "TR-89241",
      customerName: "Canberk Yıldız",
      email: "canberk@example.com",
      phone: "+90 532 555 0192",
      orderDate: "2026-10-02T14:30:00Z",
      status: "in_transit", // delivered, in_transit, processing, returned
      carrier: "Yurtiçi Kargo",
      trackingNumber: "YK-902183749",
      trackingUrl: "https://yurticikargo.com/track/YK-902183749",
      estimatedDelivery: "Bugün (16:00 - 18:00)",
      totalAmount: 1850,
      currency: "TL",
      shippingAddress: "Kadıköy, Caferağa Mah. Moda Cad. No:44 D:3, İstanbul",
      items: [
        {
          id: "prod-1",
          name: "Oversize Yün Örme Triko Kazak",
          variant: "Antrasit - Beden: M",
          sku: "SWTR-ANT-M",
          price: 1200,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=80",
          eligibleForReturn: true
        },
        {
          id: "prod-2",
          name: "Premium Pamuklu Basic Tişört",
          variant: "Ekru - Beden: M",
          sku: "TSH-EKR-M",
          price: 650,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80",
          eligibleForReturn: true
        }
      ],
      timeline: [
        { title: "Sipariş Onaylandı", time: "2 Eki 14:30", desc: "Ödeme alındı, fatura kesildi.", completed: true },
        { title: "Kargoya Verildi", time: "3 Eki 10:15", desc: "Kadıköy Dağıtım Merkezine ulaştı.", completed: true },
        { title: "Kurye Dağıtımda", time: "Bugün 09:20", desc: "Kurye teslimat için rotada.", completed: true, active: true },
        { title: "Teslim Edildi", time: "Tahmini 17:00", desc: "Adrese teslim edilecek.", completed: false }
      ]
    },
    {
      id: "TR-77402",
      customerName: "Selin Demir",
      email: "selin@example.com",
      phone: "+90 533 444 8812",
      orderDate: "2026-09-28T11:00:00Z",
      status: "delivered",
      carrier: "Aras Kargo",
      trackingNumber: "AR-44910283",
      trackingUrl: "https://araskargo.com/track/AR-44910283",
      estimatedDelivery: "Teslim Edildi (30 Eyl)",
      totalAmount: 2400,
      currency: "TL",
      shippingAddress: "Beşiktaş, Sinanpaşa Mah. Ihlamur Cad. No:12 D:5, İstanbul",
      items: [
        {
          id: "prod-3",
          name: "Hakiki Süet Chelsea Bot",
          variant: "Taba - Numara: 38",
          sku: "BOT-SUE-38",
          price: 2400,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80",
          eligibleForReturn: true
        }
      ],
      timeline: [
        { title: "Sipariş Oluşturuldu", time: "28 Eyl 11:00", desc: "Sipariş hazırlandı.", completed: true },
        { title: "Kargoya Verildi", time: "29 Eyl 15:40", desc: "Aras Kargo Beşiktaş Şubesi.", completed: true },
        { title: "Teslim Edildi", time: "30 Eyl 14:10", desc: "Alıcıya bizzat teslim edildi.", completed: true, active: true }
      ]
    },
    {
      id: "TR-65120",
      customerName: "Emre Kaya",
      email: "emre.kaya@example.com",
      phone: "+90 535 777 9021",
      orderDate: "2026-10-04T18:20:00Z",
      status: "processing",
      carrier: "MNG Kargo",
      trackingNumber: "MNG-Pending",
      estimatedDelivery: "Hazırlanıyor (1-2 iş günü)",
      totalAmount: 950,
      currency: "TL",
      shippingAddress: "Çankaya, Tunalı Hilmi Cad. No:88/4, Ankara",
      items: [
        {
          id: "prod-4",
          name: "Vintage Denim Ceket",
          variant: "Açık Mavi - Beden: L",
          sku: "JKT-DNM-L",
          price: 950,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80",
          eligibleForReturn: true
        }
      ],
      timeline: [
        { title: "Sipariş Alındı", time: "4 Eki 18:20", desc: "Stok rezerve edildi.", completed: true, active: true },
        { title: "Paketleniyor", time: "Bugün", desc: "Lojistik merkezinde toplanıyor.", completed: false },
        { title: "Kargoya Teslim", time: "Bekleniyor", desc: "Kargo etiketi oluşturulacak.", completed: false }
      ]
    }
  ],
  returns: [
    {
      id: "RMA-10492",
      orderId: "TR-77402",
      customerName: "Selin Demir",
      type: "exchange", // exchange, refund, store_credit
      reason: "Beden Küçük Geldi (38 yerine 39 talep edildi)",
      resolution: "Otomatik Yeni Beden Ayrıldı + İade Kodu Verildi",
      status: "waiting_package", // waiting_package, received, completed, rejected
      carrierCode: "YK-IADE-77402",
      storeCreditBonus: 0,
      createdAt: "2026-10-06T15:20:00Z",
      autonomousConfidence: 99.4
    },
    {
      id: "RMA-10488",
      orderId: "TR-54201",
      customerName: "Burak Yılmaz",
      type: "store_credit",
      reason: "Renk beklentiyi karşılamadı",
      resolution: "%10 Bonus Kuponla 1.100 TL Cüzdan Bakiyesi Tanımlandı",
      status: "completed",
      carrierCode: "ARAS-IADE-54201",
      storeCreditBonus: 100,
      createdAt: "2026-10-05T09:12:00Z",
      autonomousConfidence: 98.8
    }
  ],
  policies: {
    returnWindowDays: 14,
    autoApproveUnderTL: 750,
    storeCreditBonusPercentage: 10,
    instantExchangeEnabled: true,
    requirePhotoForDamaged: true,
    aiAutoResolutionThreshold: 85
  },
  metrics: {
    totalConversations: 1420,
    autonomousResolutionRate: 94.6,
    avgResolutionSeconds: 14.2,
    hoursSavedThisMonth: 184,
    retainedRevenuePercent: 38.5 // Changed returns to exchanges/store credit!
  }
};

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Endpoints
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname, url);
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end('<h1>404 Sayfa Bulunamadı</h1><p>Pango AI aradığınız sayfayı bulamadı.</p>');
      } else {
        res.writeHead(500);
        res.end(`Sunucu Hatası: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// API Request Handler
function handleApi(req, res, pathname, url) {
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');

  // GET /api/orders
  if (pathname === '/api/orders' && req.method === 'GET') {
    const q = url.searchParams.get('q');
    if (q) {
      const filtered = db.orders.filter(o => 
        o.id.toLowerCase().includes(q.toLowerCase()) || 
        o.customerName.toLowerCase().includes(q.toLowerCase()) ||
        o.phone.includes(q) ||
        o.email.toLowerCase().includes(q.toLowerCase())
      );
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: filtered }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: db.orders }));
    return;
  }

  // GET /api/orders/:id
  if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
    const id = pathname.replace('/api/orders/', '').toUpperCase();
    const order = db.orders.find(o => o.id.toUpperCase() === id);
    if (order) {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: order }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, message: 'Sipariş bulunamadı. Örnek: TR-89241' }));
    }
    return;
  }

  // POST /api/orders/create - Add New Shipment/Order
  if (pathname === '/api/orders/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawId = (payload.id || '').trim().toUpperCase();
        const orderId = rawId || `TR-${Math.floor(10000 + Math.random() * 90000)}`;

        const carrier = payload.carrier || 'Yurtiçi Kargo';
        const carrierPrefixMap = {
          'Yurtiçi Kargo': 'YK-',
          'Aras Kargo': 'AR-',
          'MNG Kargo': 'MNG-',
          'HepsiJet': 'HJ-',
          'Trendyol Express': 'TEX-',
          'Sürat Kargo': 'SRT-',
          'Kolay Gelsin': 'KG-',
          'DHL Express': 'DHL-'
        };
        const prefix = carrierPrefixMap[carrier] || 'CARRIER-';
        const trackingNumber = payload.trackingNumber || `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
        const status = payload.status || 'in_transit';

        let timeline = [];
        if (status === 'in_transit') {
          timeline = [
            { title: "Sipariş Onaylandı", time: "Dün 14:00", desc: "Ödeme alındı, fatura kesildi.", completed: true },
            { title: "Kargoya Verildi", time: "Bugün 08:30", desc: `${carrier} transfer merkezine ulaştı.`, completed: true },
            { title: "Kurye Dağıtımda", time: "Bugün 10:15", desc: `${carrier} kuryesi teslimat için rotada.`, completed: true, active: true },
            { title: "Teslim Edildi", time: "Tahmini Bugün", desc: "Adrese teslim edilecek.", completed: false }
          ];
        } else if (status === 'delivered') {
          timeline = [
            { title: "Sipariş Oluşturuldu", time: "2 Gün Önce", desc: "Sipariş hazırlandı.", completed: true },
            { title: "Kargoya Verildi", time: "Dün 11:00", desc: `${carrier} dağıtım şubesi.`, completed: true },
            { title: "Teslim Edildi", time: "Bugün 13:45", desc: "Alıcıya bizzat teslim edildi.", completed: true, active: true }
          ];
        } else {
          timeline = [
            { title: "Sipariş Alındı", time: "Bugün 10:00", desc: "Stok rezerve edildi, faturalandırıldı.", completed: true, active: true },
            { title: "Paketleniyor", time: "İşlemde", desc: "Depo operasyon merkezinde toplanıyor.", completed: false },
            { title: "Kargoya Teslim", time: "Bekleniyor", desc: `${carrier} etiketleme bekleniyor.`, completed: false }
          ];
        }

        const newOrder = {
          id: orderId,
          customerName: payload.customerName || "Yeni Müşteri",
          email: payload.email || "musteri@example.com",
          phone: payload.phone || "+90 532 000 0000",
          orderDate: payload.orderDate || new Date().toISOString(),
          status: status,
          carrier: carrier,
          trackingNumber: trackingNumber,
          trackingUrl: payload.trackingUrl || `https://kargotakip.com/${trackingNumber}`,
          estimatedDelivery: payload.estimatedDelivery || (status === 'delivered' ? 'Teslim Edildi' : 'Bugün (16:00 - 18:00)'),
          totalAmount: Number(payload.totalAmount) || 1250,
          currency: "TL",
          shippingAddress: payload.shippingAddress || "Kadıköy, İstanbul",
          items: payload.items && payload.items.length > 0 ? payload.items : [
            {
              id: `prod-${Math.floor(100 + Math.random() * 900)}`,
              name: payload.productName || "Seçilen E-Ticaret Ürünü",
              variant: payload.productVariant || "Standart Beden",
              sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              price: Number(payload.totalAmount) || 1250,
              quantity: 1,
              image: payload.productImage || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80",
              eligibleForReturn: true
            }
          ],
          timeline: timeline
        };

        db.orders.unshift(newOrder);

        res.writeHead(201);
        res.end(JSON.stringify({ 
          success: true, 
          data: newOrder,
          message: `${newOrder.id} numaralı kargo başarıyla sisteme eklendi ve takip başlatıldı.` 
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'Geçersiz veri: ' + e.message }));
      }
    });
    return;
  }

  // GET /api/returns
  if (pathname === '/api/returns' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: db.returns }));
    return;
  }

  // GET /api/metrics
  if (pathname === '/api/metrics' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: db.metrics, policies: db.policies }));
    return;
  }

  // POST /api/returns/create
  if (pathname === '/api/returns/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newRmaId = `RMA-${Math.floor(10000 + Math.random() * 90000)}`;
        const carrierCode = `YK-IADE-${Math.floor(100000 + Math.random() * 900000)}`;

        const newRma = {
          id: newRmaId,
          orderId: payload.orderId || "TR-89241",
          customerName: payload.customerName || "Değerli Müşteri",
          type: payload.type || "refund",
          reason: payload.reason || "Müşteri talebi",
          resolution: payload.type === 'exchange' 
            ? `Otomatik Yeni Beden Rezervi Yapıldı (${payload.exchangeItem || 'Yeni Varyant'})`
            : payload.type === 'store_credit' 
              ? `%10 Bonus ile Hediye Çeki Bakiye Kodu Oluşturuldu: PANGO-${Math.floor(1000 + Math.random() * 9000)}`
              : "İade Onaylandı, Ücret Orijinal Ödeme Yöntemine Aktarılacak",
          status: "waiting_package",
          carrierCode: carrierCode,
          storeCreditBonus: payload.type === 'store_credit' ? 10 : 0,
          createdAt: new Date().toISOString(),
          autonomousConfidence: 98.7
        };

        db.returns.unshift(newRma);
        db.metrics.totalConversations += 1;
        db.metrics.hoursSavedThisMonth += 0.2;

        res.writeHead(201);
        res.end(JSON.stringify({ 
          success: true, 
          data: newRma,
          message: "İade/Değişim talebi Pango AI tarafından otonom olarak onaylandı."
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'Geçersiz veri' }));
      }
    });
    return;
  }

  // POST /api/chat - Autonomous Agent Decision Engine
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let parsed = {};
        if (body && body.trim()) {
          try {
            parsed = JSON.parse(body);
          } catch (jsonErr) {
            console.warn("JSON parse warning, raw body:", body);
          }
        }
        const { message, orderId, context } = parsed;
        const response = processAutonomousAgentMessage(message, orderId, context);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: true, ...response }));
      } catch (e) {
        console.error("Chat engine error:", e);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({ success: false, message: 'İşlem hatası: ' + e.message }));
      }
    });
    return;
  }

  // POST /api/policies/update
  if (pathname === '/api/policies/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newPolicies = JSON.parse(body || '{}');
        Object.assign(db.policies, newPolicies);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, policies: db.policies }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, message: 'Geçersiz veri' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint bulunamadı' }));
}

// Autonomous Agent NLP & Function Calling Engine
function processAutonomousAgentMessage(msg, orderId, context = {}) {
  const text = (msg || '').toLowerCase().trim();
  
  // Extract potential order ID from message if not provided
  let detectedOrder = null;
  const match = text.match(/tr[-_\s]?\d{5}/i);
  if (match) {
    const rawId = match[0].toUpperCase().replace(/\s|_/g, '-');
    detectedOrder = db.orders.find(o => o.id === rawId || o.id.replace('-', '') === rawId.replace('-', ''));
  }
  
  const currentOrder = detectedOrder || (orderId ? db.orders.find(o => o.id === orderId) : db.orders[0]);

  // 1. Where Is My Order (WISMO) / Kargo Nerede
  if (text.includes('kargo') || text.includes('nerede') || text.includes('takip') || text.includes('teslim') || text.includes('gelmedi') || text.includes('ulaşmadı')) {
    if (!currentOrder) {
      return {
        reply: "Siparişinizi anında kontrol edebilmem için lütfen 5 haneli sipariş numaranızı (örnek: **TR-89241**) veya siparişteki telefon numaranızı yazar mısınız?",
        actionRequired: "ask_order_id",
        suggestions: ["TR-89241", "TR-77402", "TR-65120"]
      };
    }

    let statusDesc = "";
    if (currentOrder.status === 'in_transit') {
      statusDesc = `🚚 **Kargonuz şu an dağıtımda!**\n\n**${currentOrder.carrier}** kuryesi paketinizle yola çıktı. Tahmini teslimat saati: **${currentOrder.estimatedDelivery}**.\n\nKargo Takip No: \`${currentOrder.trackingNumber}\`\nTeslimat Adresi: ${currentOrder.shippingAddress}`;
    } else if (currentOrder.status === 'delivered') {
      statusDesc = `✅ **Siparişiniz Teslim Edildi!**\n\nPaketiniz **${currentOrder.estimatedDelivery}** tarihinde adresinize teslim edilmiştir.\n\nEğer paketi almadıysanız veya ürünle ilgili bir sorun varsa hemen size yardımcı olabilirim.`;
    } else {
      statusDesc = `📦 **Siparişiniz Hazırlanıyor.**\n\nÜrünleriniz lojistik merkezimizde paketleniyor. En geç yarın kargoya teslim edilecektir.`;
    }

    return {
      reply: `Harika, **${currentOrder.id}** numaralı siparişinizi inceledim:\n\n${statusDesc}`,
      action: "order_lookup",
      orderData: currentOrder,
      suggestions: ["Ürünü İade Etmek İstiyorum", "Farklı Bedenle Değiştirebilir miyim?", "Kargo Takip Linki"]
    };
  }

  // 2. Return / İade Talebi
  if (text.includes('iade') || text.includes('vazgeçtim') || text.includes('geri vermek')) {
    if (!currentOrder) {
      return {
        reply: "İade işleminizi 10 saniyede başlatabilirim! Lütfen sipariş numaranızı belirtin (Örn: **TR-89241**).",
        actionRequired: "ask_order_id"
      };
    }

    return {
      reply: `**${currentOrder.id}** siparişiniz için 14 günlük yasal iade süresi içerisindesiniz. 🙌\n\nSize 2 avantajlı seçenek sunabilirim:\n\n1. **%10 Ekstra Hediye Çeki (Önerilen ⚡):** İade tutarınıza ek %10 bonus kupon anında hesabınıza tanımlanır ve kargo beklemeden hemen alışverişe devam edebilirsiniz.\n2. **Orijinal Karta İade:** Ücretsiz Yurtiçi Kargo iade kodu oluşturulur, ürün depomuza ulaştığında kartınıza yansır.\n\nHangi seçeneği tercih edersiniz?`,
      action: "return_options_prompted",
      orderData: currentOrder,
      suggestions: ["%10 Bonus Hediye Çeki İstiyorum", "Karta Para İadesi Yapılsın", "Sadece Beden Değişimi İstiyorum"]
    };
  }

  // 3. Exchange / Beden Değişimi
  if (text.includes('değişim') || text.includes('beden') || text.includes('büyük') || text.includes('küçük') || text.includes('numara')) {
    const item = currentOrder ? currentOrder.items[0] : null;
    return {
      reply: `Tabii ki! **${item ? item.name : 'Ürününüz'}** için anında **ücretsiz beden değişimi** yapabiliriz. 👗👕\n\nDepo stoğumuzu kontrol ettim; bir büyük ve bir küçük beden şu an rafta hazır!\n\nSiz kargoyu teslim ettiğiniz anda beklemeden yeni bedeni adresinize çıkartıyoruz. Yeni bedeninizi belirtmeniz yeterli!`,
      action: "exchange_prompted",
      orderData: currentOrder,
      suggestions: ["Bir Büyük Beden Gönderin (L)", "Bir Küçük Beden Gönderin (S)", "Farklı Renk İstiyorum"]
    };
  }

  // 4. Damaged / Broken Product / Hasarlı Ürün
  if (text.includes('hasar') || text.includes('kırık') || text.includes('yırtık') || text.includes('defolu') || text.includes('bozuk') || text.includes('leke')) {
    return {
      reply: `Çok özür dileriz! 😔 Yaşadığınız bu deneyimi hemen telafi edelim.\n\nMağazamızın akıllı garantisi kapsamında hasarlı ürünlerde prosedürle vakit kaybetmiyoruz:\n\nLütfen aşağıdan **hasarlı kısmın hızlı bir fotoğrafını yükleyin** veya tarif edin. AI Görsel Denetim sistemimiz onayladığı anda ürünü geri göndermenize bile gerek kalmadan **ücretsiz yenisini gönderebilir** veya **ücretinizi anında iade edebiliriz!**`,
      action: "damaged_photo_request",
      orderData: currentOrder,
      suggestions: ["📸 Fotoğraf Yükle", "Yenisini Ücretsiz Gönderin", "Para İadesi Yapılsın"]
    };
  }

  // 5. Store Credit Confirmation
  if (text.includes('hediye çeki') || text.includes('bonus') || text.includes('cüzdan') || text.includes('kupon')) {
    const bonusAmount = currentOrder ? (currentOrder.totalAmount * 0.1).toFixed(0) : 185;
    const totalCredit = currentOrder ? (currentOrder.totalAmount * 1.1).toFixed(0) : 2035;
    const promoCode = `PANGO-GIFT-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      reply: `🎉 **Tebrikler! Hediye Çekiniz Anında Tanımlandı.**\n\n• Toplam Alışveriş Tutarı: **${currentOrder ? currentOrder.totalAmount : 1850} TL**\n• Pango %10 Sadakat Bonusu: **+${bonusAmount} TL**\n• Kullanılabilir Toplam Bakiye: **${totalCredit} TL**\n\nKupon Kodunuz: **\`${promoCode}\`**\nBu kod 1 yıl boyunca tüm koleksiyonda geçerlidir. İade kargosuyla uğraşmanıza gerek kalmadı!`,
      action: "store_credit_issued",
      code: promoCode,
      orderData: currentOrder,
      suggestions: ["Yeni Sezon Ürünleri Göster", "Kuponu Kopyala", "Teşekkürler!"]
    };
  }

  // 6. Return Label Generation Confirmation
  if (text.includes('karta para') || text.includes('kod oluştur') || text.includes('iade kodu') || text.includes('kartıma')) {
    const rmaCode = `YK-IADE-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      reply: `✅ **İade Başvurunuz Otonom Olarak Onaylandı!**\n\n📦 **Yurtiçi Kargo İade Anlaşma Kodu:** \`#${rmaCode}\`\n\n**Nasıl Göndereceksiniz?**\n1. Ürünü orijinal ambalajına koyun.\n2. En yakın Yurtiçi Kargo şubesine gidip yukarıdaki iade kodunu söyleyin (Kargo ücreti tamamen mağazamıza aittir).\n3. Dilerseniz kapıdan kurye çağırma talebiniz de oluşturulmuştur.\n\nPaket depoya ulaştığında bankanıza iade talimatı otomatik geçilecektir.`,
      action: "return_label_generated",
      rmaCode: rmaCode,
      orderData: currentOrder,
      suggestions: ["İade Kodunu SMS Gönder", "Kapıdan Kurye Çağır", "Farklı Bir Sorun Var"]
    };
  }

  // Default Greeting / Intelligent Fallback
  return {
    reply: `Merhaba! Ben **Pango AI**, mağazanızın otonom operasyon ve müşteri asistanıyım. 🤖✨\n\nSize şu konularda 10 saniyede yardımcı olabilirim:\n• 📍 **Kargo ve Sipariş Durumu Sorgulama**\n• 🔄 **Anında Ücretsiz Beden Değişimi**\n• 💰 **%10 Bonuslu Hediye Çeki veya Kart İadesi**\n• 📸 **Hasarlı/Kusurlu Ürün Anında Telafi**\n\nLütfen sipariş numaranızı (Örn: **TR-89241**) veya sorunuzu yazın.`,
    action: "welcome",
    orderData: currentOrder,
    suggestions: ["TR-89241 Siparişim Nerede?", "Ürünümü İade Etmek İstiyorum", "Beden Değişimi Yapabilir miyim?"]
  };
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Pango AI (YC S26) - Autonomous E-Commerce Operations OS`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🛒 Shopper Self-Service Portal & Merchant Command Hub`);
  console.log(`=======================================================`);
});
