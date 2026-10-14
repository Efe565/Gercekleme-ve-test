/**
 * ToS-Agent TR - Popup Kullanıcı Arayüzü Mantığı
 */

let currentAnalysisReport = null;
let currentTabId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const toggleDrawerBtn = document.getElementById('toggle-drawer-btn');
  const openOptionsBtn = document.getElementById('open-options-btn');
  const copyReportBtn = document.getElementById('copy-report-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const severityFilter = document.getElementById('severity-filter');

  // Aktif sekmeyi tespit et
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    currentTabId = tab.id;
  }

  // Ayarlar sayfası butonu
  openOptionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  // "Sayfayı Analiz Et" butonu
  analyzeBtn.addEventListener('click', async () => {
    await performAnalysis();
  });

  // "Sayfaya Sabitle" (In-Page Drawer) butonu
  toggleDrawerBtn.addEventListener('click', async () => {
    if (!currentTabId) return;
    if (!currentAnalysisReport) {
      await performAnalysis();
    }
    if (currentAnalysisReport) {
      chrome.tabs.sendMessage(currentTabId, {
        action: 'SHOW_INPAGE_DRAWER',
        report: currentAnalysisReport
      });
      window.close(); // Popup'ı kapat, kullanıcı sayfadaki paneli kullansın
    }
  });

  // Filtreleme
  severityFilter.addEventListener('change', () => {
    if (currentAnalysisReport) {
      renderClausesList(currentAnalysisReport.clauses, severityFilter.value);
    }
  });

  // Raporu Panoya Kopyala
  copyReportBtn.addEventListener('click', () => {
    if (!currentAnalysisReport) return;
    const md = generateMarkdownReport(currentAnalysisReport);
    navigator.clipboard.writeText(md).then(() => {
      const origText = copyReportBtn.innerText;
      copyReportBtn.innerText = '✓ Kopyalandı!';
      setTimeout(() => { copyReportBtn.innerText = origText; }, 2000);
    });
  });

  // JSON İndir
  exportJsonBtn.addEventListener('click', () => {
    if (!currentAnalysisReport) return;
    const blob = new Blob([JSON.stringify(currentAnalysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tos-risk-raporu-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

/**
 * Sayfayı analiz eden ana fonksiyon
 */
async function performAnalysis() {
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const initialState = document.getElementById('initial-state');
  const resultsContainer = document.getElementById('results-container');
  const analyzeBtnText = document.getElementById('analyze-btn-text');

  initialState.style.display = 'none';
  resultsContainer.style.display = 'none';
  errorState.style.display = 'none';
  loadingState.style.display = 'block';
  analyzeBtnText.innerText = 'Taranıyor...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('Aktif tarayıcı sekmesi bulunamadı.');
    }
    currentTabId = tab.id;

    // Content script'in yüklü olduğundan emin ol (gerekirse enjekte et)
    let pageData = null;
    try {
      pageData = await chrome.tabs.sendMessage(currentTabId, { action: 'EXTRACT_PAGE_CONTENT' });
    } catch (e) {
      // Content script yüklü değilse dinamik olarak enjekte et
      await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        files: ['content/page-agent-core.js', 'content/content-script.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: currentTabId },
        files: ['content/inpage-styles.css']
      });
      pageData = await chrome.tabs.sendMessage(currentTabId, { action: 'EXTRACT_PAGE_CONTENT' });
    }

    if (!pageData || !pageData.text || pageData.text.trim().length < 50) {
      throw new Error('Sayfada okunabilir bir kullanım koşulları veya gizlilik metni bulunamadı. Lütfen sözleşme metninin açık olduğu bir sayfayı deneyin.');
    }

    // Analiz Pipeline'ını çalıştır (LLM veya Yerel Deterministik Motor + Verifier)
    let analyzer = (typeof runCompleteAnalysis === 'function')
      ? runCompleteAnalysis
      : (window.TosLlmClient && window.TosLlmClient.runCompleteAnalysis);

    if (!analyzer && window.TosHeuristicAnalyzer) {
      analyzer = (txt, title) => {
        const raw = window.TosHeuristicAnalyzer.analyzeTosLocally(txt, title);
        return window.TosVerifier ? window.TosVerifier.verifyReportQuotes(raw, txt) : raw;
      };
    }

    const report = await analyzer(pageData.text, pageData.title || tab.title);
    currentAnalysisReport = report;

    // Sonuçları Ekrana Bas
    renderResults(report);

    loadingState.style.display = 'none';
    resultsContainer.style.display = 'block';
    analyzeBtnText.innerText = 'Yeniden Analiz Et';

  } catch (err) {
    console.error('[ToS-Agent Popup Error]:', err);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    document.getElementById('error-text').innerText = err.message || 'Analiz sırasında bir hata oluştu.';
    analyzeBtnText.innerText = 'Tekrar Dene';
  }
}

/**
 * Sonuçları Popup arayüzüne yerleştirir
 */
function renderResults(report) {
  const riskScoreNum = document.getElementById('risk-score-num');
  const riskLevelBadge = document.getElementById('risk-level-badge');
  const circleScoreVal = document.getElementById('circle-score-val');
  const scoreMeterCircle = document.getElementById('score-meter-circle');
  const docTitleDisplay = document.getElementById('doc-title-display');
  const summaryContent = document.getElementById('summary-content');
  const uncertaintyContent = document.getElementById('uncertainty-content');
  const clausesCount = document.getElementById('clauses-count');
  const injectionAlertBox = document.getElementById('injection-alert-box');
  const verificationText = document.getElementById('verification-text');

  // Skor ve Düzey
  const score = report.overall_risk_score;
  const level = report.risk_level;
  riskScoreNum.innerText = `${score}/100`;
  riskLevelBadge.innerText = level;
  circleScoreVal.innerText = score;
  docTitleDisplay.innerText = report.document_title || 'Belge Analizi';

  // Renk Kodu
  let color = '#22c55e'; // Yeşil (Düşük)
  if (score >= 76) color = '#ef4444'; // Kırmızı (Kritik)
  else if (score >= 51) color = '#f97316'; // Turuncu (Yüksek)
  else if (score >= 26) color = '#eab308'; // Sarı (Orta)

  scoreMeterCircle.style.borderColor = color;
  scoreMeterCircle.style.color = color;
  riskLevelBadge.style.color = color;

  // Prompt Injection Uyarısı
  if (report.prompt_injection_detected) {
    injectionAlertBox.style.display = 'flex';
    if (report.prompt_injection_details) {
      document.getElementById('injection-desc').innerText = report.prompt_injection_details;
    }
  } else {
    injectionAlertBox.style.display = 'none';
  }

  // Doğrulama Metriği
  if (report.verification_metrics) {
    verificationText.innerText = report.verification_metrics.verification_summary;
  }

  // Sade Türkçe Özet
  summaryContent.innerText = report.summary_tr;

  // Dürüst Belirsizlik Notu (Hocanın İsteri)
  uncertaintyContent.innerText = report.honesty_and_uncertainty_note;

  // Maddeler
  clausesCount.innerText = report.clauses ? report.clauses.length : 0;
  renderClausesList(report.clauses, 'ALL');
}

/**
 * Maddeler listesini filtreye göre HTML'e döker
 */
function renderClausesList(clauses, filter = 'ALL') {
  const container = document.getElementById('clauses-list');
  container.innerHTML = '';

  if (!clauses || clauses.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:12px;">Seçilen kritere uygun riskli madde bulunamadı.</div>';
    return;
  }

  const filtered = clauses.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'Kritik') return c.severity === 'Kritik';
    if (filter === 'Yüksek') return c.severity === 'Kritik' || c.severity === 'Yüksek';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:12px;">Bu filtrede riskli madde bulunamadı.</div>';
    return;
  }

  filtered.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'clause-card';

    const severityClass = c.severity === 'Kritik' ? 'severity-kritik' :
                          c.severity === 'Yüksek' ? 'severity-yuksek' :
                          c.severity === 'Orta' ? 'severity-orta' : 'severity-dusuk';

    card.innerHTML = `
      <div class="clause-top">
        <span class="clause-category">${c.category}</span>
        <span class="severity-pill ${severityClass}">${c.severity}</span>
      </div>
      <div class="clause-title">${c.title}</div>
      <div class="clause-explanation">
        <strong>Ne Anlama Geliyor?</strong> ${c.explanation_tr}
      </div>
      ${c.recommendation ? `
        <div style="font-size:11px; color:#38bdf8; margin-top:2px;">
          💡 <strong>Tavsiye:</strong> ${c.recommendation}
        </div>
      ` : ''}
      ${c.is_ambiguous && c.ambiguity_reason ? `
        <div style="font-size:10.5px; background:rgba(168,85,247,0.15); border-left:2px solid #c084fc; padding:4px 6px; border-radius:3px; color:#e9d5ff; margin-top:2px;">
          🔍 <em>Hukuki Belirsizlik: ${c.ambiguity_reason}</em>
        </div>
      ` : ''}
      <div class="clause-quote-box">
        "${escapeHtml(c.verbatim_quote)}"
      </div>
      <div class="clause-footer">
        <span class="verification-status">
          ${c.verified ? '✓ Orijinal Metinde Doğrulandı' : '⚠️ Doğrulanamayan Alıntı'}
        </span>
        <button class="jump-to-quote-btn" data-quote="${encodeURIComponent(c.verbatim_quote)}">
          Sayfada Gör ↗
        </button>
      </div>
    `;

    // "Sayfada Gör" butonu tıklandığında sayfaya kaydır ve vurgula
    const jumpBtn = card.querySelector('.jump-to-quote-btn');
    jumpBtn.addEventListener('click', () => {
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, {
          action: 'HIGHLIGHT_QUOTE',
          quote: c.verbatim_quote
        });
      }
    });

    container.appendChild(card);
  });
}

/**
 * Markdown formatında paylaşılabilir rapor üretir
 */
function generateMarkdownReport(report) {
  let md = `# ToS-Agent TR - Hüküm ve Koşul Risk Raporu\n\n`;
  md += `> **⚠️ Yasal Uyarı:** Bu rapor hukuki tavsiye niteliği taşımaz. Yalnızca bilgilendirme amaçlıdır.\n\n`;
  md += `**Belge:** ${report.document_title}\n`;
  md += `**Genel Risk Skoru:** ${report.overall_risk_score}/100 (${report.risk_level})\n`;
  md += `**Doğrulama Durumu:** ${report.verification_metrics?.verification_summary || 'Doğrulandı'}\n\n`;
  md += `## 📋 Sade Türkçe Özet\n${report.summary_tr}\n\n`;
  md += `## 🔍 Sistemin Dürüst Belirsizlik Notu\n${report.honesty_and_uncertainty_note}\n\n`;
  md += `## ⚠️ Riskli Maddeler ve Kanıtlar (${report.clauses.length})\n\n`;

  report.clauses.forEach((c, idx) => {
    md += `### ${idx + 1}. [${c.severity}] ${c.title}\n`;
    md += `- **Kategori:** ${c.category}\n`;
    md += `- **Sade Açıklama:** ${c.explanation_tr}\n`;
    if (c.recommendation) md += `- **Tavsiye:** ${c.recommendation}\n`;
    if (c.is_ambiguous) md += `- **Belirsizlik Açıklaması:** ${c.ambiguity_reason}\n`;
    md += `- **Orijinal Kanıt / Alıntı:** *"${c.verbatim_quote}"*\n`;
    md += `- **Doğrulama:** ${c.verified ? '✓ Orijinal metinde kelimesi kelimesine teyit edildi' : '✗ Doğrulanamadı'}\n\n`;
  });

  return md;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
