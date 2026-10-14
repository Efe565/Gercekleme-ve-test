/**
 * ToS-Agent TR - Background Service Worker (Manifest V3)
 * Arka plan servis çalışanı: Yaşam döngüsü, bağlam menüsü (context menu) ve mesaj yönlendirme.
 */

// Eklenti yüklendiğinde bağlam menüsünü ve varsayılan ayarları oluştur
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ToS-Agent TR] Servis çalışanı başlatıldı. Sebep:', details.reason);

  // Varsayılan ayarları kaydet
  const existing = await chrome.storage.local.get(['tos_provider']);
  if (!existing.tos_provider) {
    await chrome.storage.local.set({
      tos_provider: 'local', // Varsayılan olarak dahili motor seçili (sıfır kurulum engeli)
      tos_api_key: '',
      tos_model: '',
      tos_custom_url: ''
    });
  }

  // Sağ tık bağlam menüsü ekle
  chrome.contextMenus.create({
    id: 'tos-agent-analyze-page',
    title: '🛡️ ToS-Agent TR ile Bu Sayfayı İncele',
    contexts: ['page', 'selection']
  });
});

// Sağ tık menüsü tıklandığında
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'tos-agent-analyze-page' && tab && tab.id) {
    try {
      // Content script'e sayfayı taranıp çekmece panelini açmasını bildir
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/page-agent-core.js', 'content/content-script.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/inpage-styles.css']
      });

      // Sayfa verisini çek
      const pageData = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_CONTENT' });
      if (pageData && pageData.text) {
        // Doğrudan sayfa içi çekmecede açmak için mesaj gönder
        chrome.tabs.sendMessage(tab.id, {
          action: 'SHOW_INPAGE_DRAWER',
          report: null // Content script yerel analiz ile dolduracak
        });
      }
    } catch (err) {
      console.error('[ToS-Agent Context Menu Error]:', err);
    }
  }
});

// Dinleyici: Diğer scriptlerden gelen arka plan mesajları
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_EXTENSION_INFO') {
    sendResponse({
      name: 'ToS-Agent TR',
      version: '1.0.0',
      status: 'active'
    });
  }
  return true;
});
