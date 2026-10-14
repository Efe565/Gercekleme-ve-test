/**
 * ToS-Agent TR - Sayfa İçi İçerik Betiği (Content Script)
 * Tarayıcı sekmesi ile uzantı popup/background arasında köprü kurar.
 */

(function () {
  // Çoklu enjeksiyonu önle
  if (window.__TOS_AGENT_INITIALIZED__) return;
  window.__TOS_AGENT_INITIALIZED__ = true;

  console.log('[ToS-Agent TR] Sayfa içi ajan yüklendi.');

  // Mesaj Dinleyicisi (Chrome Extension ortamı)
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleAgentMessage(request, sendResponse);
      return true; // Asenkron yanıt için kanalı açık tut
    });
  }

  // Sayfa içi postMessage dinleyicisi (Cypress / Test ortamı)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action) {
      handleAgentMessage(event.data, (res) => {
        if (event.source) {
          event.source.postMessage({ responseTo: event.data.action, result: res }, '*');
        }
      });
    }
  });

  async function handleAgentMessage(request, sendResponse) {
    try {
      switch (request.action) {
          case 'EXTRACT_PAGE_CONTENT': {
            if (!window.pageAgent) {
              window.pageAgent = new PageAgentCore();
            }
            const data = window.pageAgent.readAndIndexDOM();
            sendResponse({
              success: true,
              text: data.text,
              title: data.title,
              nodeCount: data.nodeCount,
              url: window.location.href
            });
            break;
          }

          case 'HIGHLIGHT_QUOTE': {
            if (!window.pageAgent) {
              window.pageAgent = new PageAgentCore();
            }
            const found = window.pageAgent.highlightAndScrollToQuote(request.quote);
            sendResponse({ success: found });
            break;
          }

          case 'CLEAR_HIGHLIGHTS': {
            if (window.pageAgent) {
              window.pageAgent.clearHighlights();
            }
            sendResponse({ success: true });
            break;
          }

          case 'EXECUTE_AGENT_COMMAND': {
            if (!window.pageAgent) {
              window.pageAgent = new PageAgentCore();
            }
            if (request.report) {
              window.pageAgent.currentReport = request.report;
            }
            const result = window.pageAgent.executeNaturalLanguageAction(request.command);
            sendResponse(result);
            break;
          }

          case 'SHOW_INPAGE_DRAWER': {
            renderInPageDrawer(request.report);
            sendResponse({ success: true });
            break;
          }

          default:
            sendResponse({ success: false, error: 'Bilinmeyen aksiyon' });
        }
      } catch (err) {
        console.error('[ToS-Agent TR] Hata:', err);
        if (typeof sendResponse === 'function') {
          sendResponse({ success: false, error: err.message });
        }
      }
    }

  /**
   * Sayfa üzerinde doğrudan görüntülenebilen zengin analiz çekmecesini oluşturur
   */
  function renderInPageDrawer(report) {
    if (!report) return;
    if (window.pageAgent) window.pageAgent.currentReport = report;

    let drawer = document.getElementById('tos-agent-inpage-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'tos-agent-inpage-drawer';
      document.body.appendChild(drawer);
    }

    const scoreColor = report.overall_risk_score >= 76 ? '#ef4444' :
                       report.overall_risk_score >= 51 ? '#f97316' :
                       report.overall_risk_score >= 26 ? '#eab308' : '#22c55e';

    let clausesHtml = '';
    if (report.clauses && report.clauses.length > 0) {
      clausesHtml = report.clauses.map((c, i) => `
        <div class="tos-drawer-card" style="background:#1e293b; border-radius:8px; padding:12px; margin-bottom:12px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;">${c.category}</span>
            <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; background:${c.severity === 'Kritik' ? '#7f1d1d' : c.severity === 'Yüksek' ? '#7c2d12' : '#713f12'}; color:#fff;">
              ${c.severity} Risk
            </span>
          </div>
          <div style="font-size:13px; font-weight:600; color:#f8fafc; margin-bottom:6px;">${c.title}</div>
          <div style="font-size:12px; color:#cbd5e1; line-height:1.4; margin-bottom:8px;">${c.explanation_tr}</div>
          
          <div style="background:#0f172a; border-left:3px solid #38bdf8; padding:6px 10px; font-size:11px; color:#94a3b8; font-style:italic; margin-bottom:8px;">
            "${c.verbatim_quote}"
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:#22c55e;">
              ${c.verified ? '✓ Orijinal Metinde Doğrulandı' : '⚠️ Doğrulanamadı'}
            </span>
            <button class="tos-jump-btn" data-quote="${encodeURIComponent(c.verbatim_quote)}" style="background:#38bdf8; color:#0f172a; border:none; border-radius:4px; font-size:11px; font-weight:600; padding:4px 8px; cursor:pointer;">
              Metinde Gör ↗
            </button>
          </div>
        </div>
      `).join('');
    } else {
      clausesHtml = '<div style="color:#94a3b8; font-size:12px;">Önemli bir risk maddesi tespit edilmedi.</div>';
    }

    drawer.innerHTML = `
      <div class="tos-drawer-header">
        <div class="tos-drawer-title">
          🛡️ ToS-Agent TR <span style="font-size:12px; font-weight:400; color:#94a3b8;">(In-Page)</span>
        </div>
        <button class="tos-drawer-close" id="tos-drawer-close-btn">&times;</button>
      </div>

      <div class="tos-legal-disclaimer-banner">
        ⚠️ <strong>Hukuki Uyarı:</strong> Bu uygulama hukuki tavsiye vermez. Üretilen analizler yalnızca tüketici farkındalığı amaçlıdır.
      </div>

      <div class="tos-drawer-body">
        <!-- Skor Kartı -->
        <div style="display:flex; align-items:center; justify-content:space-between; background:#1e293b; border-radius:8px; padding:14px; margin-bottom:14px;">
          <div>
            <div style="font-size:11px; color:#94a3b8; text-transform:uppercase;">Genel Risk Düzeyi</div>
            <div style="font-size:22px; font-weight:800; color:${scoreColor};">${report.risk_level} (${report.overall_risk_score}/100)</div>
          </div>
          <div style="width:48px; height:48px; border-radius:50%; border:4px solid ${scoreColor}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">
            ${report.overall_risk_score}
          </div>
        </div>

        <!-- Doğal Dil Komut Çubuğu -->
        <div class="tos-command-bar">
          <input type="text" id="tos-inpage-command-input" class="tos-command-input" placeholder="Örn: 'Tahkim maddesini göster', 'Temizle'" />
          <button id="tos-inpage-command-btn" class="tos-command-btn">Çalıştır</button>
        </div>
        <div id="tos-command-feedback" style="font-size:11px; color:#38bdf8; margin-top:-10px; margin-bottom:12px; min-height:16px;"></div>

        <!-- Sade Türkçe Özet -->
        <div style="background:#1e293b; border-radius:8px; padding:12px; margin-bottom:14px; font-size:12px; line-height:1.5; color:#e2e8f0;">
          <div style="font-weight:700; color:#38bdf8; margin-bottom:4px;">📋 Sade Türkçe Özet</div>
          ${report.summary_tr}
        </div>

        <!-- Dürüst Belirsizlik İtirafı -->
        <div style="background:#1e293b; border-left:3px solid #a855f7; border-radius:8px; padding:12px; margin-bottom:14px; font-size:12px; line-height:1.5; color:#e9d5ff;">
          <div style="font-weight:700; color:#c084fc; margin-bottom:4px;">🔍 Sistemin Dürüst Belirsizlik Notu</div>
          ${report.honesty_and_uncertainty_note}
        </div>

        <!-- Riskli Maddeler Listesi -->
        <div style="font-weight:700; font-size:13px; color:#f8fafc; margin-bottom:8px;">
          Riskli Maddeler ve Kanıtlar (${report.clauses ? report.clauses.length : 0})
        </div>
        ${clausesHtml}
      </div>
    `;

    // Etkinlik Dinleyicileri
    document.getElementById('tos-drawer-close-btn').addEventListener('click', () => {
      drawer.classList.remove('tos-open');
    });

    const commandInput = document.getElementById('tos-inpage-command-input');
    const commandBtn = document.getElementById('tos-inpage-command-btn');
    const feedback = document.getElementById('tos-command-feedback');

    const runCmd = () => {
      const text = commandInput.value.trim();
      if (!text) return;
      const res = window.pageAgent.executeNaturalLanguageAction(text);
      feedback.textContent = res.message;
      feedback.style.color = res.success ? '#22c55e' : '#f87171';
    };

    commandBtn.addEventListener('click', runCmd);
    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runCmd();
    });

    // "Metinde Gör" butonları
    drawer.querySelectorAll('.tos-jump-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const quote = decodeURIComponent(e.target.getAttribute('data-quote'));
        window.pageAgent.highlightAndScrollToQuote(quote);
      });
    });

    // Aç
    requestAnimationFrame(() => {
      drawer.classList.add('tos-open');
    });
  }
})();
