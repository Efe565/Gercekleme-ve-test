/**
 * Pango AI (YC S26) – Autonomous E-Commerce Operations OS
 * Client-side Reactive Controller & Simulation Engine
 */

// Application State
const state = {
  currentOrder: null,
  allOrders: [],
  returns: [],
  metrics: {
    totalConversations: 1420,
    autonomousResolutionRate: 94.6,
    avgResolutionSeconds: 14.2,
    hoursSavedThisMonth: 184,
    retainedRevenuePercent: 38.5
  },
  soundEnabled: true,
  audioCtx: null,
  activeTab: 'customer-view'
};

// Web Audio API Sound Synthesizer (Zero external dependencies)
function playHapticSound(type = 'click') {
  if (!state.soundEnabled) return;
  try {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) state.audioCtx = new AudioContext();
    }
    if (!state.audioCtx) return;

    const ctx = state.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    // Audio context may require user gesture on some browsers
  }
}

// Toast Notifications
function showToast(message, icon = '✨') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  playHapticSound('pop');

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch Initial Data
async function loadInitialData() {
  try {
    const resOrders = await fetch('/api/orders');
    if (resOrders.ok) {
      const data = await resOrders.json();
      state.allOrders = data.data || [];
      if (state.allOrders.length > 0) {
        renderOrder(state.allOrders[0]);
      }
      renderQuickExamples();
    }

    const resMetrics = await fetch('/api/metrics');
    if (resMetrics.ok) {
      const mData = await resMetrics.json();
      state.metrics = mData.data || state.metrics;
      renderMetrics();
    }

    const resReturns = await fetch('/api/returns');
    if (resReturns.ok) {
      const rData = await resReturns.json();
      state.returns = rData.data || [];
      renderMerchantRmaTable();
    }
  } catch (err) {
    console.warn("Local API not reached, using default local state:", err);
    useFallbackData();
  }
}

function useFallbackData() {
  state.allOrders = [
    {
      id: "TR-89241",
      customerName: "Canberk Yıldız",
      orderDate: "2026-10-02T14:30:00Z",
      status: "in_transit",
      carrier: "Yurtiçi Kargo",
      trackingNumber: "YK-902183749",
      estimatedDelivery: "Bugün (16:00 - 18:00)",
      totalAmount: 1850,
      currency: "TL",
      shippingAddress: "Kadıköy, Moda Cad. No:44, İstanbul",
      items: [
        {
          id: "prod-1",
          name: "Oversize Yün Örme Triko Kazak",
          variant: "Antrasit - Beden: M",
          price: 1200,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=80"
        },
        {
          id: "prod-2",
          name: "Premium Pamuklu Basic Tişört",
          variant: "Ekru - Beden: M",
          price: 650,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80"
        }
      ],
      timeline: [
        { title: "Sipariş Onaylandı", time: "2 Eki 14:30", desc: "Ödeme alındı, fatura kesildi.", completed: true },
        { title: "Kargoya Verildi", time: "3 Eki 10:15", desc: "Kadıköy Dağıtım Merkezine ulaştı.", completed: true },
        { title: "Kurye Dağıtımda", time: "Bugün 09:20", desc: "Kurye teslimat için rotada.", completed: true, active: true },
        { title: "Teslim Edildi", time: "Tahmini 17:00", desc: "Adrese teslim edilecek.", completed: false }
      ]
    }
  ];
  renderOrder(state.allOrders[0]);
  renderQuickExamples();
}

// Render Order Details in Customer View
function renderOrder(order) {
  state.currentOrder = order;

  // Header badges
  const orderIdEl = document.getElementById('display-order-id');
  const statusBadge = document.getElementById('display-order-status');
  const customerNameEl = document.getElementById('display-customer-name');
  const orderDateEl = document.getElementById('display-order-date');
  const orderTotalEl = document.getElementById('display-order-total');

  if (orderIdEl) orderIdEl.textContent = `Sipariş #${order.id}`;
  if (customerNameEl) customerNameEl.textContent = order.customerName;
  if (orderDateEl) orderDateEl.textContent = new Date(order.orderDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  if (orderTotalEl) orderTotalEl.textContent = `${order.totalAmount.toLocaleString('tr-TR')} ${order.currency || 'TL'}`;

  // Status Badge Class & Text
  if (statusBadge) {
    statusBadge.className = 'status-badge';
    if (order.status === 'in_transit') {
      statusBadge.classList.add('badge-transit');
      statusBadge.textContent = '🚚 Kurye Dağıtımda';
    } else if (order.status === 'delivered') {
      statusBadge.classList.add('badge-delivered');
      statusBadge.textContent = '✅ Teslim Edildi';
    } else {
      statusBadge.classList.add('badge-processing');
      statusBadge.textContent = '📦 Hazırlanıyor';
    }
  }

  // Items List
  const itemsContainer = document.getElementById('display-items-list');
  if (itemsContainer) {
    itemsContainer.innerHTML = order.items.map(item => `
      <div class="product-item-row">
        <div class="item-left">
          <img src="${item.image}" alt="${item.name}" class="item-thumb" onerror="this.src='https://via.placeholder.com/60'">
          <div>
            <div class="item-title">${item.name}</div>
            <div class="item-variant">${item.variant}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="item-price">${item.price.toLocaleString('tr-TR')} TL</div>
          <div class="item-qty">${item.quantity} Adet</div>
        </div>
      </div>
    `).join('');
  }

  // Logistics & Timeline
  const carrierEl = document.getElementById('display-carrier');
  const trackingNoEl = document.getElementById('display-tracking-no');
  const timelineEl = document.getElementById('display-timeline');

  if (carrierEl) carrierEl.textContent = order.carrier || 'Yurtiçi Kargo';
  if (trackingNoEl) trackingNoEl.textContent = order.trackingNumber || 'YK-902183749';

  if (timelineEl && order.timeline) {
    timelineEl.innerHTML = order.timeline.map((step, idx) => `
      <div class="step-node ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}">
        <div class="step-indicator">${step.completed ? '✓' : (idx + 1)}</div>
        <div class="step-content">
          <div class="step-header">
            <span class="step-title">${step.title}</span>
            <span class="step-time">${step.time}</span>
          </div>
          <div class="step-desc">${step.desc}</div>
        </div>
      </div>
    `).join('');
  }
}

// Render Metrics in Merchant Dashboard
function renderMetrics() {
  const m = state.metrics;
  const resRateEl = document.getElementById('metric-resolution-rate');
  const hoursSavedEl = document.getElementById('metric-hours-saved');
  const avgTimeEl = document.getElementById('metric-avg-time');
  const retainedEl = document.getElementById('metric-retained-revenue');

  if (resRateEl) resRateEl.textContent = `%${m.autonomousResolutionRate || '94.6'}`;
  if (hoursSavedEl) hoursSavedEl.textContent = `${Math.round(m.hoursSavedThisMonth || 184)} Saat`;
  if (avgTimeEl) avgTimeEl.textContent = `${m.avgResolutionSeconds || '14.2'} sn`;
  if (retainedEl) retainedEl.textContent = `₺246.800`;
}

// Render RMA Table in Merchant Dashboard
function renderMerchantRmaTable() {
  const tbody = document.getElementById('merchant-rma-tbody');
  if (!tbody) return;

  if (state.returns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px;">Henüz iade/değişim talebi bulunmuyor.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.returns.map(rma => {
    let typeClass = 'type-refund';
    let typeLabel = 'Para İadesi';
    if (rma.type === 'exchange') {
      typeClass = 'type-exchange';
      typeLabel = 'Beden Değişimi';
    } else if (rma.type === 'store_credit') {
      typeClass = 'type-credit';
      typeLabel = '%10 Bonus Kupon';
    }

    return `
      <tr>
        <td><strong style="color: #fff; font-family: var(--font-mono);">${rma.id}</strong></td>
        <td><span style="color: #fb923c; font-family: var(--font-mono);">${rma.orderId}</span></td>
        <td>${rma.customerName}</td>
        <td><span class="type-pill ${typeClass}">${typeLabel}</span></td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${rma.reason}">${rma.reason}</td>
        <td style="color: #34d399; font-weight: 600;">${rma.resolution}</td>
        <td><span class="badge-pill green">%${rma.autonomousConfidence || 99.1}</span></td>
      </tr>
    `;
  }).join('');
}

// Chat Engine & Agent Messages
const chatMessagesContainer = document.getElementById('chat-messages');
const chatSuggestionsContainer = document.getElementById('chat-suggestions');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');

function addChatMessage(sender, text, meta = '') {
  if (!chatMessagesContainer) return;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${sender}`;

  // Simple Markdown parsing for bold, code, line breaks
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  bubble.innerHTML = `
    <div class="bubble-content">${formattedText}</div>
    <div class="bubble-meta">${meta || (sender === 'agent' ? 'Pango AI • ' + timeStr : timeStr)}</div>
  `;

  chatMessagesContainer.appendChild(bubble);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

  if (sender === 'agent') {
    playHapticSound('pop');
  }
}

function showTypingIndicator() {
  const typing = document.createElement('div');
  typing.id = 'typing-indicator-node';
  typing.className = 'typing-bubble';
  typing.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  chatMessagesContainer.appendChild(typing);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const node = document.getElementById('typing-indicator-node');
  if (node) node.remove();
}

function renderSuggestions(suggestions = []) {
  if (!chatSuggestionsContainer) return;
  chatSuggestionsContainer.innerHTML = '';

  suggestions.forEach(item => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-suggestion';
    chip.textContent = item;
    chip.addEventListener('click', () => {
      playHapticSound('click');
      handleUserSendMessage(item);
    });
    chatSuggestionsContainer.appendChild(chip);
  });
}

// Send Message Handler
async function handleUserSendMessage(messageText) {
  const msg = (messageText || '').trim();
  if (!msg) return;

  // Clear input
  if (chatInput) chatInput.value = '';

  // Add User Bubble
  addChatMessage('user', msg);
  playHapticSound('click');

  showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        orderId: state.currentOrder ? state.currentOrder.id : "TR-89241"
      })
    });

    const data = await res.json();
    setTimeout(() => {
      hideTypingIndicator();
      if (data && data.reply) {
        addChatMessage('agent', data.reply);
        renderSuggestions(data.suggestions || []);

        if (data.action === 'store_credit_issued') {
          playHapticSound('success');
          showToast(`Hediye Çeki Tanımlandı: ${data.code}`, '🎁');
          // Add to returns state
          recordRMA("store_credit", "Müşteri %10 bonus hediye çeki tercih etti", `%10 Bonus ile Kupon Verildi: ${data.code}`);
        } else if (data.action === 'return_label_generated') {
          playHapticSound('success');
          showToast(`Yurtiçi İade Kodu: ${data.rmaCode}`, '📦');
          recordRMA("refund", "Müşteri yasal iade talebinde bulundu", `Yurtiçi Kargo İade Kodu Verildi (${data.rmaCode})`);
        } else if (data.action === 'exchange_prompted') {
          // Record exchange intent
        }
      }
    }, 600);

  } catch (err) {
    setTimeout(() => {
      hideTypingIndicator();
      // Client-side fallback response
      addChatMessage('agent', `Siparişiniz **${state.currentOrder ? state.currentOrder.id : 'TR-89241'}** incelendi. Talebiniz doğrultusunda 14 günlük iade/değişim güvencemiz geçerlidir.`);
      renderSuggestions(["%10 Bonus Hediye Çeki İstiyorum", "Karta Para İadesi Yapılsın", "Farklı Beden İstiyorum"]);
    }, 600);
  }
}

// Record Autonomous RMA action into DB & UI
async function recordRMA(type, reason, resolution) {
  const payload = {
    orderId: state.currentOrder ? state.currentOrder.id : "TR-89241",
    customerName: state.currentOrder ? state.currentOrder.customerName : "Canberk Yıldız",
    type: type,
    reason: reason,
    resolution: resolution
  };

  try {
    const res = await fetch('/api/returns/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      state.returns.unshift(data.data);
      renderMerchantRmaTable();
      state.metrics.hoursSavedThisMonth += 0.2;
      renderMetrics();
    }
  } catch (err) {
    // Local fallback insert
    const fakeRma = {
      id: `RMA-${Math.floor(10000 + Math.random() * 90000)}`,
      orderId: payload.orderId,
      customerName: payload.customerName,
      type: payload.type,
      reason: payload.reason,
      resolution: payload.resolution,
      autonomousConfidence: 99.2
    };
    state.returns.unshift(fakeRma);
    renderMerchantRmaTable();
  }
}

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      playHapticSound('click');

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        state.activeTab = targetId;
      }
    });
  });
}

// Global Search Order Functionality
function performSearch(val) {
  const query = (val || '').trim().toUpperCase();
  if (!query) return;

  playHapticSound('click');
  const found = state.allOrders.find(o => 
    o.id.toUpperCase() === query || 
    (o.customerName && o.customerName.toLowerCase().includes(query.toLowerCase())) ||
    (o.trackingNumber && o.trackingNumber.toUpperCase() === query)
  );

  if (found) {
    renderOrder(found);
    showToast(`${found.id} (${found.carrier || 'Kargo'}) siparişi getirildi.`, '📦');
    
    // Update chat context
    const statusText = found.status === 'in_transit' ? 'Dağıtımda' : (found.status === 'delivered' ? 'Teslim Edildi' : 'Hazırlanıyor');
    addChatMessage('agent', `**${found.id}** numaralı siparişinizi ekrana getirdim.\n\n• Taşıyıcı: **${found.carrier || 'Yurtiçi Kargo'}** (\`${found.trackingNumber || 'Takip No'}\`)\n• Müşteri: **${found.customerName}**\n• Durum: **${statusText}**\n\nSize kargo takibi, beden değişimi veya iade konusunda nasıl yardımcı olabilirim?`);
    renderSuggestions(["Kargom Nerede?", "Beden Değişimi Yap", "İade Etmek İstiyorum"]);
  } else {
    showToast(`Sipariş ${query} bulunamadı.`, '⚠️');
    addChatMessage('agent', `Aradığınız **${query}** numaralı siparişi sistemde bulamadım. Lütfen sipariş numaranızı kontrol edin veya kayıtlı e-posta adresinizi yazın.`);
  }
}

// Render Dynamic Quick Examples Chips
function renderQuickExamples() {
  const container = document.getElementById('quick-examples-container');
  if (!container) return;

  container.innerHTML = state.allOrders.slice(0, 6).map(o => {
    let icon = '🚚';
    let label = 'Dağıtımda';
    if (o.status === 'delivered') {
      icon = '✅';
      label = 'Teslim Edildi';
    } else if (o.status === 'processing') {
      icon = '📦';
      label = 'Hazırlanıyor';
    }
    const carrierName = o.carrier ? `(${o.carrier})` : '';
    return `<button class="pill-chip" data-search="${o.id}">${icon} ${o.id} - ${label} ${carrierName}</button>`;
  }).join('');

  container.querySelectorAll('.pill-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const code = chip.dataset.search;
      const searchInput = document.getElementById('order-search-input');
      if (searchInput) searchInput.value = code;
      performSearch(code);
    });
  });
}

function initSearch() {
  const searchBtn = document.getElementById('btn-search-order');
  const searchInput = document.getElementById('order-search-input');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch(searchInput.value);
    });
  }

  renderQuickExamples();
}

// Quick Action Buttons on Order Card
function initQuickActions() {
  const btnExchange = document.getElementById('btn-quick-exchange');
  const btnReturn = document.getElementById('btn-quick-return');
  const btnDamage = document.getElementById('btn-quick-damage');
  const btnCopy = document.getElementById('btn-copy-tracking');
  const trackingCodeEl = document.getElementById('display-tracking-no');

  if (btnExchange) {
    btnExchange.addEventListener('click', () => {
      playHapticSound('click');
      handleUserSendMessage("Siparişimdeki ürünün bedenini değiştirmek istiyorum.");
    });
  }

  if (btnReturn) {
    btnReturn.addEventListener('click', () => {
      playHapticSound('click');
      handleUserSendMessage("Ürünü iade etmek ve geri göndermek istiyorum.");
    });
  }

  if (btnDamage) {
    btnDamage.addEventListener('click', () => {
      playHapticSound('click');
      openDamageModal();
    });
  }

  if (btnCopy && trackingCodeEl) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(trackingCodeEl.textContent).then(() => {
        playHapticSound('success');
        showToast("Takip numarası panoya kopyalandı!", "📋");
      });
    });
  }
}

// Damage Photo Upload Modal Handling
const damageModal = document.getElementById('damage-modal');
const btnCloseDamageModal = document.getElementById('btn-close-damage-modal');
const btnCancelUpload = document.getElementById('btn-cancel-upload');
const btnConfirmDamage = document.getElementById('btn-confirm-damage');
const dropzone = document.getElementById('upload-dropzone');
const fileInput = document.getElementById('damage-file-input');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const analysisStatusText = document.getElementById('analysis-status-text');

function openDamageModal() {
  if (damageModal && typeof damageModal.showModal === 'function') {
    // Reset state
    if (previewArea) previewArea.classList.add('hidden');
    if (dropzone) dropzone.style.display = 'block';
    if (btnConfirmDamage) btnConfirmDamage.disabled = true;
    damageModal.showModal();
  }
}

function closeDamageModal() {
  if (damageModal && typeof damageModal.close === 'function') {
    damageModal.close();
  }
}

function initDamageModal() {
  if (btnCloseDamageModal) btnCloseDamageModal.addEventListener('click', closeDamageModal);
  if (btnCancelUpload) btnCancelUpload.addEventListener('click', closeDamageModal);

  // Close on backdrop click (Light Dismiss)
  if (damageModal) {
    damageModal.addEventListener('click', (e) => {
      const rect = damageModal.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!inDialog) closeDamageModal();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelected);

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--primary)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(139, 92, 246, 0.35)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(139, 92, 246, 0.35)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        simulatePhotoAnalysis(e.dataTransfer.files[0]);
      }
    });
  }

  if (btnConfirmDamage) {
    btnConfirmDamage.addEventListener('click', () => {
      closeDamageModal();
      playHapticSound('success');
      showToast("Hasar Onaylandı! Yeni ürün kargoya hazırlandı.", "🛡️");

      addChatMessage('agent', `🔍 **Hasar Analizi Sonucu: Onaylandı (%99.4 Güven)**\n\nYüklediğiniz görselde dikiş/kumaş kusuru tespit edilmiştir. Mağaza güvencemiz gereğince eski ürünü geri göndermenize gerek kalmadan **ücretsiz yenisini adresinize çıkartıyoruz!**\n\nEk olarak mağduriyetiniz için sonraki siparişinize **150 TL indirim kuponu** hesabınıza tanımlandı.`);
      renderSuggestions(["Yeni Sipariş Takip Numarası", "Teşekkür Ederim!", "Temsilciye Bağlan"]);

      recordRMA("exchange", "Kumaş kusuru (AI Görsel Denetimle Doğrulandı)", "Ürün İadesi İstenmeden Yeni Ürün Gönderildi");
    });
  }
}

function handleFileSelected(e) {
  if (e.target.files && e.target.files[0]) {
    simulatePhotoAnalysis(e.target.files[0]);
  }
}

function simulatePhotoAnalysis(file) {
  if (!dropzone || !previewArea || !previewImage) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    dropzone.style.display = 'none';
    previewArea.classList.remove('hidden');

    if (analysisStatusText) analysisStatusText.textContent = "AI Görsel Model Kusuru İnceliyor (%45)...";

    setTimeout(() => {
      if (analysisStatusText) analysisStatusText.textContent = "Kumaş/Dikiş Kusuru Tespit Edildi (%99.4 Güven)";
      playHapticSound('pop');
      if (btnConfirmDamage) btnConfirmDamage.disabled = false;
    }, 1500);
  };
  reader.readAsDataURL(file);
}

// New Order & Shipment Creation Modal Controller
function initNewOrderModal() {
  const modal = document.getElementById('new-order-modal');
  const btnOpen = document.getElementById('btn-open-new-order-modal');
  const btnClose = document.getElementById('btn-close-new-order-modal');
  const btnCancel = document.getElementById('btn-cancel-new-order');
  const form = document.getElementById('new-order-form');
  const btnGenOrderId = document.getElementById('btn-generate-order-id');
  const btnGenTracking = document.getElementById('btn-generate-tracking');
  const orderIdInput = document.getElementById('new-order-id');
  const carrierSelect = document.getElementById('new-order-carrier');
  const trackingInput = document.getElementById('new-order-tracking');

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

  function genOrderId() {
    return `TR-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  function genTracking(carrierName) {
    const prefix = carrierPrefixMap[carrierName] || 'YK-';
    return `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  if (btnGenOrderId && orderIdInput) {
    btnGenOrderId.addEventListener('click', () => {
      playHapticSound('click');
      orderIdInput.value = genOrderId();
    });
  }

  if (btnGenTracking && trackingInput && carrierSelect) {
    btnGenTracking.addEventListener('click', () => {
      playHapticSound('click');
      trackingInput.value = genTracking(carrierSelect.value);
    });
  }

  if (carrierSelect && trackingInput) {
    carrierSelect.addEventListener('change', () => {
      trackingInput.value = genTracking(carrierSelect.value);
    });
  }

  function openModal() {
    if (modal && typeof modal.showModal === 'function') {
      if (orderIdInput && !orderIdInput.value) {
        orderIdInput.value = genOrderId();
      }
      if (trackingInput && !trackingInput.value && carrierSelect) {
        trackingInput.value = genTracking(carrierSelect.value);
      }
      playHapticSound('pop');
      modal.showModal();
    }
  }

  function closeModal() {
    if (modal && typeof modal.close === 'function') {
      modal.close();
    }
  }

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!inDialog) closeModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      playHapticSound('click');

      const submitBtn = document.getElementById('btn-submit-new-order');
      if (submitBtn) submitBtn.disabled = true;

      const payload = {
        id: (orderIdInput.value || '').trim().toUpperCase(),
        status: document.getElementById('new-order-status').value,
        carrier: carrierSelect.value,
        trackingNumber: (trackingInput.value || '').trim(),
        customerName: (document.getElementById('new-order-customer').value || '').trim(),
        phone: (document.getElementById('new-order-phone').value || '').trim(),
        email: (document.getElementById('new-order-email').value || '').trim(),
        productName: (document.getElementById('new-order-product-name').value || '').trim(),
        productVariant: (document.getElementById('new-order-product-variant').value || '').trim(),
        totalAmount: Number(document.getElementById('new-order-price').value) || 1500,
        estimatedDelivery: (document.getElementById('new-order-delivery-time').value || '').trim(),
        shippingAddress: (document.getElementById('new-order-address').value || '').trim()
      };

      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.data) {
          const newOrder = data.data;
          state.allOrders.unshift(newOrder);

          closeModal();
          playHapticSound('success');
          showToast(`Kargo ${newOrder.id} (${newOrder.carrier}) oluşturuldu!`, '🚀');

          renderQuickExamples();
          renderOrder(newOrder);

          // Switch tab to customer view so user can immediately see the new shipment live!
          const customerTabBtn = document.getElementById('tab-btn-customer');
          if (customerTabBtn) customerTabBtn.click();

          const searchInput = document.getElementById('order-search-input');
          if (searchInput) searchInput.value = newOrder.id;

          addChatMessage('agent', `🎉 **Yeni Kargo Canlıya Alındı!**\n\nSipariş No: **${newOrder.id}**\nTaşıyıcı: **${newOrder.carrier}** (\`${newOrder.trackingNumber}\`)\nMüşteri: **${newOrder.customerName}**\nDurum: **${newOrder.status === 'in_transit' ? 'Dağıtımda' : (newOrder.status === 'delivered' ? 'Teslim Edildi' : 'Hazırlanıyor')}**\n\nBu kargo için anında kargo takibi, beden değişimi veya iade talebinde bulunabilirsiniz!`);
          renderSuggestions(["Kargom Nerede?", "Beden Değişimi Yap", "İade Kodu Al"]);
        } else {
          showToast(data.message || 'Hata oluştu', '⚠️');
        }
      } catch (err) {
        console.error("Order creation failed:", err);
        showToast("Sunucu hatası: Kargo eklenemedi", '❌');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

// Merchant Policy Form Handling
function initPolicyForm() {
  const form = document.getElementById('policy-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    playHapticSound('click');

    const updated = {
      returnWindowDays: parseInt(document.getElementById('policy-return-window').value, 10),
      autoApproveUnderTL: parseInt(document.getElementById('policy-auto-approve-limit').value, 10),
      storeCreditBonusPercentage: parseInt(document.getElementById('policy-bonus-credit').value, 10),
      instantExchangeEnabled: document.getElementById('policy-instant-exchange').checked,
      requirePhotoForDamaged: document.getElementById('policy-require-photo').checked
    };

    try {
      const res = await fetch('/api/policies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        playHapticSound('success');
        showToast("İade politikası kuralları canlıya alındı!", "💾");
      }
    } catch (err) {
      playHapticSound('success');
      showToast("Kurallar başarıyla kaydedildi.", "💾");
    }
  });

  const btnRefreshRma = document.getElementById('btn-refresh-rma');
  if (btnRefreshRma) {
    btnRefreshRma.addEventListener('click', async () => {
      playHapticSound('click');
      showToast("RMA Akışı Yenilendi", "🔄");
      try {
        const res = await fetch('/api/returns');
        if (res.ok) {
          const data = await res.json();
          state.returns = data.data || [];
          renderMerchantRmaTable();
        }
      } catch (e) {}
    });
  }
}

// Developer Console & Webhook Simulator
function initDeveloperConsole() {
  const btnSimulate = document.getElementById('btn-simulate-webhook');
  const codeDecision = document.getElementById('code-agent-decision');

  if (btnSimulate && codeDecision) {
    btnSimulate.addEventListener('click', () => {
      playHapticSound('click');
      showToast("Shopify orders/create webhook tetiklendi!", "⚡");

      codeDecision.textContent = `// İstek İşleniyor... (Pango AI Execution)`;

      setTimeout(() => {
        playHapticSound('success');
        const simulatedOutput = {
          agent: "PangoOps-v2",
          autonomous_resolution: true,
          confidence_score: 0.994,
          timestamp: new Date().toISOString(),
          actions_taken: [
            {
              type: "CARRIER_INTEGRATION_SYNC",
              carrier: "Yurtici_Kargo",
              tracking_no: "YK-" + Math.floor(100000000 + Math.random() * 900000000),
              status: "REGISTERED_FOR_PICKUP"
            },
            {
              type: "INSTANT_EXCHANGE_RESERVATION",
              reserved_sku: "SWTR-ANT-L",
              status: "STOCK_ALLOCATED"
            },
            {
              type: "CUSTOMER_NOTIFICATION_SENT",
              channel: "SMS_AND_WHATSAPP",
              message: "Pango AI siparişinizi teslim aldı ve takip kodunuzu oluşturdu."
            }
          ]
        };
        codeDecision.textContent = JSON.stringify(simulatedOutput, null, 2);
      }, 700);
    });
  }
}

// Sound Toggle Button
function initSoundToggle() {
  const btn = document.getElementById('btn-sound-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    btn.textContent = state.soundEnabled ? '🔊' : '🔇';
    btn.title = state.soundEnabled ? 'Ses Açık' : 'Ses Kapalı';
    showToast(state.soundEnabled ? 'Ses efektleri açıldı' : 'Ses kapatıldı', state.soundEnabled ? '🔊' : '🔇');
  });
}

// Chat Form Listener
function initChat() {
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserSendMessage(chatInput.value);
    });
  }

  const btnClearChat = document.getElementById('btn-clear-chat');
  if (btnClearChat && chatMessagesContainer) {
    btnClearChat.addEventListener('click', () => {
      playHapticSound('click');
      chatMessagesContainer.innerHTML = '';
      addInitialAgentGreeting();
    });
  }

  addInitialAgentGreeting();
}

function addInitialAgentGreeting() {
  addChatMessage('agent', `Merhaba! Ben **Pango AI**, mağazanızın otonom operasyon asistanıyım. 🤖✨\n\nSiparişinizi inceledim (**TR-89241**). Kargonuz şu an dağıtımda görünüyor. İade, beden değişimi veya kargo takibi hakkında ne yapmak istersiniz?`);
  renderSuggestions([
    "🚚 Kargo Detaylarını Göster",
    "🔄 Beden Değişimi Yapmak İstiyorum",
    "💰 %10 Bonus Hediye Çeki Nasıl Alınır?",
    "📸 Ürünüm Kusurlu Geldi"
  ]);
}

// Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearch();
  initQuickActions();
  initDamageModal();
  initNewOrderModal();
  initPolicyForm();
  initDeveloperConsole();
  initSoundToggle();
  initChat();
  loadInitialData();
});
