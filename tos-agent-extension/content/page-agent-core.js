/**
 * ToS-Agent TR - Alibaba Page-Agent Tabanlı Sayfa İçi Ajan Çekirdeği (In-Page Agent Core)
 * Kaynak İlham: github.com/alibaba/page-agent
 * 
 * Bu modül web sayfasının içinde çalışır:
 * 1. DOM'u anlamsal bir metin ağacına dönüştürür (Perception / DOM Reader)
 * 2. Gürültüleri (reklam, navigasyon, script) ve gizli saldırıları temizler (Sanitization)
 * 3. Hukuki terimleri ve Türkçe doğal dil komutlarını işler (Action Execution)
 * 4. Rapordaki alıntıları DOM'da bulup sayfada sarı ile vurgular ve oraya kaydırır (Visual Grounding)
 */

class PageAgentCore {
  constructor() {
    this.extractedText = '';
    this.domIndex = [];
    this.activeHighlights = [];
    this.isDrawerOpen = false;
    this.currentReport = null;
  }

  /**
   * DOM'u tarar, gereksiz elemanları atar ve temizlenmiş metin indeksini çıkarır.
   * Alibaba page-agent 'DOM to Text/Tree' mantığının yerelleştirilmiş uygulamasıdır.
   * @returns {{ text: string, title: string, nodeCount: number }}
   */
  readAndIndexDOM() {
    const ignoredTags = new Set([
      'script', 'style', 'noscript', 'template', 'svg', 'iframe',
      'nav', 'footer', 'header', 'aside'
    ]);

    const meaningfulBlocks = [];
    this.domIndex = [];

    // Başlık tespiti
    const docTitle = document.title || 
                     document.querySelector('h1')?.innerText?.trim() || 
                     window.location.hostname;

    // Sayfa gövdesini dolaşan TreeWalker
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            if (ignoredTags.has(tag)) return NodeFilter.FILTER_REJECT;

            // Gizli eleman kontrolü (Adversarial / Hidden text)
            try {
              const style = window.getComputedStyle(node);
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                parseFloat(style.opacity) === 0 ||
                parseFloat(style.fontSize) === 0 ||
                style.textIndent === '-9999px'
              ) {
                return NodeFilter.FILTER_REJECT;
              }
            } catch (e) {}

            return NodeFilter.FILTER_ACCEPT;
          }

          if (node.nodeType === Node.TEXT_NODE) {
            const val = node.nodeValue.trim();
            if (val.length > 0) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let currentNode;
    let charOffset = 0;

    while ((currentNode = walker.nextNode())) {
      if (currentNode.nodeType === Node.TEXT_NODE) {
        const textSnippet = currentNode.nodeValue.replace(/\s+/g, ' ');
        const parentElem = currentNode.parentElement;

        if (textSnippet.trim().length > 0) {
          const start = charOffset;
          const end = start + textSnippet.length;

          meaningfulBlocks.push(textSnippet);
          this.domIndex.push({
            text: textSnippet,
            node: currentNode,
            element: parentElem,
            start,
            end
          });

          charOffset = end + 1;
        }
      }
    }

    this.extractedText = meaningfulBlocks.join(' ');

    return {
      text: this.extractedText,
      title: docTitle,
      nodeCount: this.domIndex.length
    };
  }

  /**
   * Sayfadaki bir alıntıyı bularak etrafını sarı ile vurgular (Highlight) ve sayfayı oraya kaydırır.
   * @param {string} quote Orijinal metinden birebir alıntı
   * @returns {boolean} Başarılı oldu mu?
   */
  highlightAndScrollToQuote(quote) {
    if (!quote || quote.trim().length < 5) return false;
    const cleanQuote = quote.trim();

    this.clearHighlights();

    // 1. Önce doğrudan DOM düğüm indeksinde ara
    for (const item of this.domIndex) {
      if (item.text.includes(cleanQuote) || cleanQuote.includes(item.text.trim())) {
        this.applyHighlightToElement(item.element, cleanQuote);
        return true;
      }
    }

    // 2. Paragraf ve başlık elementlerinde arama
    const candidateElements = document.querySelectorAll('p, li, div, h2, h3, h4, section, article');
    for (const el of candidateElements) {
      // Sadece en alt seviye içeren düğümlere bak
      if (el.children.length > 5) continue;
      const text = el.innerText || el.textContent || '';
      if (text.includes(cleanQuote) || cleanQuote.includes(text.trim())) {
        this.applyHighlightToElement(el, cleanQuote);
        return true;
      }
    }

    // 3. window.find API'si (Eğer destekleniyorsa en kesin tarayıcı içi bulucu)
    if (window.find && typeof window.find === 'function') {
      try {
        const found = window.find(cleanQuote.substring(0, 50), false, false, true, false, true, false);
        if (found) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const mark = document.createElement('mark');
            mark.className = 'tos-agent-highlight-pulse';
            mark.appendChild(range.extractContents());
            range.insertNode(mark);
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.activeHighlights.push(mark);
            return true;
          }
        }
      } catch (e) {}
    }

    return false;
  }

  /**
   * Elementi görsel olarak vurgular
   */
  applyHighlightToElement(element, quote) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('tos-agent-element-highlight');
    this.activeHighlights.push(element);

    // Yanıp sönen dikkat çekici bildirim
    const badge = document.createElement('div');
    badge.className = 'tos-agent-inpage-badge';
    badge.innerHTML = `⚠️ <strong>ToS-Agent TR:</strong> Tespit Edilen Risk Maddesi`;
    element.insertAdjacentElement('beforebegin', badge);
    this.activeHighlights.push(badge);

    setTimeout(() => {
      badge.style.opacity = '1';
    }, 10);
  }

  /**
   * Önceki tüm vurgulamaları temizler
   */
  clearHighlights() {
    for (const item of this.activeHighlights) {
      if (item.classList) {
        item.classList.remove('tos-agent-element-highlight');
        item.classList.remove('tos-agent-highlight-pulse');
      }
      if (item.classList && item.classList.contains('tos-agent-inpage-badge')) {
        item.remove();
      }
    }
    this.activeHighlights = [];
  }

  /**
   * Doğal Dil Komutu Yürütme (Alibaba Page-Agent Komut Arayüzü)
   * Kullanıcının girdiği "Tahkim maddesini göster", "Riskleri vurgula" gibi komutları icra eder.
   * @param {string} command
   * @returns {{ success: boolean, message: string }}
   */
  executeNaturalLanguageAction(command) {
    if (!command) return { success: false, message: 'Komut boş olamaz.' };
    const lower = command.toLowerCase().trim();

    if (lower.includes('tahkim') || lower.includes('dava')) {
      const clause = this.currentReport?.clauses?.find(c => c.category.includes('Tahkim'));
      if (clause) {
        this.highlightAndScrollToQuote(clause.verbatim_quote);
        return { success: true, message: `Tahkim maddesi bulundu ve sayfada vurgulandı: "${clause.title}"` };
      }
      return { success: false, message: 'Bu sözleşmede tahkim maddesi tespit edilemedi.' };
    }

    if (lower.includes('yapay zeka') || lower.includes('ai') || lower.includes('model eğit')) {
      const clause = this.currentReport?.clauses?.find(c => c.category.includes('Yapay Zeka'));
      if (clause) {
        this.highlightAndScrollToQuote(clause.verbatim_quote);
        return { success: true, message: `Yapay zeka eğitim maddesi bulundu: "${clause.title}"` };
      }
      return { success: false, message: 'Bu sözleşmede AI eğitimiyle ilgili açık bir madde bulunamadı.' };
    }

    if (lower.includes('iptal') || lower.includes('yenileme') || lower.includes('abonelik')) {
      const clause = this.currentReport?.clauses?.find(c => c.category.includes('Yenileme'));
      if (clause) {
        this.highlightAndScrollToQuote(clause.verbatim_quote);
        return { success: true, message: `Abonelik yenileme maddesi gösterildi: "${clause.title}"` };
      }
      return { success: false, message: 'Otomatik yenileme maddesi bulunamadı.' };
    }

    if (lower.includes('temizle') || lower.includes('vurguları kaldır')) {
      this.clearHighlights();
      return { success: true, message: 'Tüm vurgular temizlendi.' };
    }

    // İlk kritik veya yüksek riskli maddeye git
    const firstHighRisk = this.currentReport?.clauses?.find(c => c.severity === 'Kritik' || c.severity === 'Yüksek');
    if (firstHighRisk) {
      this.highlightAndScrollToQuote(firstHighRisk.verbatim_quote);
      return { success: true, message: `En yüksek riskli maddeye odaklanıldı: "${firstHighRisk.title}"` };
    }

    return { success: false, message: `"${command}" komutu için uygun bir sayfa aksiyonu bulunamadı.` };
  }
}

// Global olarak başlat veya dışa aktar
if (typeof window !== 'undefined') {
  window.pageAgent = new PageAgentCore();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageAgentCore };
}
