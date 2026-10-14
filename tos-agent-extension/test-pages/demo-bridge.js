/**
 * ToS-Agent TR - Cypress & Demo Test Köprüsü (Bridge)
 * iframe içindeki hedef sayfa ile sağdaki uzantı arayüzü arasında çift yönlü etkileşimi sağlar.
 */

let currentAnalysisReport = null;

document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('web-view-frame');
  const scenarioSelector = document.getElementById('scenario-selector');
  const urlDisplay = document.getElementById('current-url-display');
  const inpageDrawerBtn = document.getElementById('inpage-drawer-btn');
  const analyzeBtn = document.getElementById('analyze-btn');
  const toggleDrawerBtn = document.getElementById('toggle-drawer-btn');
  const severityFilter = document.getElementById('severity-filter');
  const copyReportBtn = document.getElementById('copy-report-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');

  // Senaryo Değişimi
  scenarioSelector.addEventListener('change', () => {
    const val = scenarioSelector.value;
    iframe.src = val;

    if (val === 'spotify-terms.html') {
      urlDisplay.innerText = 'https://spotify.com/legal/terms';
    } else if (val === 'honest-uncertainty-terms.html') {
      urlDisplay.innerText = 'https://cloud-storage.com/legal/terms (Dürüst Belirsizlik)';
    } else if (val === 'adversarial-injection.html') {
      urlDisplay.innerText = 'https://untrusted-site.com/tos (Prompt Injection)';
    }

    // Arayüzü sıfırla
    document.getElementById('initial-state').style.display = 'block';
    document.getElementById('results-container').style.display = 'none';
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('injection-alert-box').style.display = 'none';
    currentAnalysisReport = null;
  });

  // Sayfayı Analiz Et Butonu
  analyzeBtn.addEventListener('click', async () => {
    await runAnalysisOnIframe();
  });

  // Çekmeceyi Aç
  inpageDrawerBtn.addEventListener('click', async () => {
    if (!currentAnalysisReport) {
      await runAnalysisOnIframe();
    }
    const win = iframe.contentWindow;
    if (win && win.pageAgent) {
      const renderDrawer = win.document.getElementById('tos-agent-inpage-drawer');
      // Content script üzerinden drawer çağır
      win.postMessage({ action: 'SHOW_INPAGE_DRAWER', report: currentAnalysisReport }, '*');
    }
  });

  toggleDrawerBtn.addEventListener('click', async () => {
    inpageDrawerBtn.click();
  });

  // Filtreleme
  severityFilter.addEventListener('change', () => {
    if (currentAnalysisReport) {
      renderClausesList(currentAnalysisReport.clauses, severityFilter.value);
    }
  });

  // Kopyalama
  copyReportBtn.addEventListener('click', () => {
    if (!currentAnalysisReport) return;
    navigator.clipboard.writeText(JSON.stringify(currentAnalysisReport, null, 2)).then(() => {
      copyReportBtn.innerText = '✓ Kopyalandı!';
      setTimeout(() => { copyReportBtn.innerText = '📋 Raporu Panoya Kopyala'; }, 2000);
    });
  });

  // JSON İndir
  exportJsonBtn.addEventListener('click', () => {
    if (!currentAnalysisReport) return;
    const blob = new Blob([JSON.stringify(currentAnalysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tos-eval-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

async function runAnalysisOnIframe() {
  const iframe = document.getElementById('web-view-frame');
  const loadingState = document.getElementById('loading-state');
  const initialState = document.getElementById('initial-state');
  const resultsContainer = document.getElementById('results-container');
  const errorState = document.getElementById('error-state');
  const analyzeBtnText = document.getElementById('analyze-btn-text');

  initialState.style.display = 'none';
  resultsContainer.style.display = 'none';
  errorState.style.display = 'none';
  loadingState.style.display = 'block';
  analyzeBtnText.innerText = 'Taranıyor...';

  // Gerçekçi animasyon için kısa bekleme
  await new Promise(r => setTimeout(r, 400));

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const win = iframe.contentWindow;

    let rawText = '';
    let docTitle = doc.title || 'Sözleşme Metni';

    if (win.pageAgent) {
      const data = win.pageAgent.readAndIndexDOM();
      rawText = data.text;
      docTitle = data.title;
    } else {
      rawText = doc.body.innerText || doc.body.textContent;
    }

    // Analiz motorunu çağır
    let analyzer = (typeof runCompleteAnalysis === 'function')
      ? runCompleteAnalysis
      : (window.TosLlmClient && window.TosLlmClient.runCompleteAnalysis);

    if (!analyzer && window.TosHeuristicAnalyzer) {
      analyzer = (txt, title) => {
        const raw = window.TosHeuristicAnalyzer.analyzeTosLocally(txt, title);
        return window.TosVerifier ? window.TosVerifier.verifyReportQuotes(raw, txt) : raw;
      };
    }

    const report = await analyzer(rawText, docTitle);
    currentAnalysisReport = report;

    // Sayfa içindeki sayfa ajanına raporu ata
    if (win.pageAgent) {
      win.pageAgent.currentReport = report;
    }

    renderResults(report);

    loadingState.style.display = 'none';
    resultsContainer.style.display = 'block';
    analyzeBtnText.innerText = 'Yeniden Analiz Et';
  } catch (err) {
    console.error('Demo bridge error:', err);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    document.getElementById('error-text').innerText = err.message;
    analyzeBtnText.innerText = 'Tekrar Dene';
  }
}

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

  const score = report.overall_risk_score;
  const level = report.risk_level;
  riskScoreNum.innerText = `${score}/100`;
  riskLevelBadge.innerText = level;
  circleScoreVal.innerText = score;
  docTitleDisplay.innerText = report.document_title || 'Belge Analizi';

  let color = '#22c55e';
  if (score >= 76) color = '#ef4444';
  else if (score >= 51) color = '#f97316';
  else if (score >= 26) color = '#eab308';

  scoreMeterCircle.style.borderColor = color;
  scoreMeterCircle.style.color = color;
  riskLevelBadge.style.color = color;

  if (report.prompt_injection_detected) {
    injectionAlertBox.style.display = 'flex';
    if (report.prompt_injection_details) {
      document.getElementById('injection-desc').innerText = report.prompt_injection_details;
    }
  } else {
    injectionAlertBox.style.display = 'none';
  }

  if (report.verification_metrics) {
    verificationText.innerText = report.verification_metrics.verification_summary;
  }

  summaryContent.innerText = report.summary_tr;
  uncertaintyContent.innerText = report.honesty_and_uncertainty_note;

  clausesCount.innerText = report.clauses ? report.clauses.length : 0;
  renderClausesList(report.clauses, 'ALL');
}

function renderClausesList(clauses, filter = 'ALL') {
  const container = document.getElementById('clauses-list');
  container.innerHTML = '';

  if (!clauses || clauses.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:12px;">Risk maddesi bulunamadı.</div>';
    return;
  }

  const filtered = clauses.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'Kritik') return c.severity === 'Kritik';
    if (filter === 'Yüksek') return c.severity === 'Kritik' || c.severity === 'Yüksek';
    return true;
  });

  filtered.forEach(c => {
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
          ${c.verified ? '✓ Orijinal Metinde Doğrulandı' : '⚠️ Doğrulanamadı'}
        </span>
        <button class="jump-to-quote-btn" data-quote="${encodeURIComponent(c.verbatim_quote)}">
          Sayfada Gör ↗
        </button>
      </div>
    `;

    // "Sayfada Gör" tıklanınca iframe içindeki sayfada vurgula ve kaydır
    const jumpBtn = card.querySelector('.jump-to-quote-btn');
    jumpBtn.addEventListener('click', () => {
      const iframe = document.getElementById('web-view-frame');
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument || (win && win.document);
      if (win && win.pageAgent) {
        win.pageAgent.highlightAndScrollToQuote(c.verbatim_quote);
      }
      if (doc) {
        const arb = doc.getElementById('clause-arbitration');
        if (arb) {
          arb.classList.add('tos-agent-element-highlight');
        } else {
          const allP = doc.querySelectorAll('p');
          if (allP.length > 0) allP[0].classList.add('tos-agent-element-highlight');
        }
      }
    });

    container.appendChild(card);
  });
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
