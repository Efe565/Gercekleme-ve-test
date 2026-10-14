/**
 * ToS-Agent TR - Ayarlar Sayfası Mantığı
 */

document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider-select');
  const apiKeyGroup = document.getElementById('api-key-group');
  const apiKeyInput = document.getElementById('api-key-input');
  const modelGroup = document.getElementById('model-group');
  const modelInput = document.getElementById('model-input');
  const customUrlGroup = document.getElementById('custom-url-group');
  const customUrlInput = document.getElementById('custom-url-input');
  const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
  const settingsForm = document.getElementById('settings-form');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const statusMessage = document.getElementById('status-message');

  // Mevcut ayarları yükle
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const data = await chrome.storage.local.get([
      'tos_provider',
      'tos_api_key',
      'tos_model',
      'tos_custom_url'
    ]);

    if (data.tos_provider) providerSelect.value = data.tos_provider;
    if (data.tos_api_key) apiKeyInput.value = data.tos_api_key;
    if (data.tos_model) modelInput.value = data.tos_model;
    if (data.tos_custom_url) customUrlInput.value = data.tos_custom_url;
  }

  updateVisibility();

  // Sağlayıcı değiştiğinde arayüzü güncelle
  providerSelect.addEventListener('change', () => {
    updateVisibility();
    updatePlaceholders();
  });

  // Şifre Göster / Gizle
  toggleKeyVisibility.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleKeyVisibility.innerText = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleKeyVisibility.innerText = '👁️';
    }
  });

  // Ayarları Kaydet
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim();
    const customUrl = customUrlInput.value.trim();

    if (provider !== 'local' && provider !== 'custom' && !apiKey) {
      showStatus('Lütfen seçtiğiniz sağlayıcı için geçerli bir API anahtarı giriniz.', 'error');
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        tos_provider: provider,
        tos_api_key: apiKey,
        tos_model: model,
        tos_custom_url: customUrl
      });
      showStatus('✓ Ayarlar başarıyla kaydedildi!', 'success');
    } else {
      showStatus('✓ Ayarlar kaydedildi (Demo / Önizleme modu).', 'success');
    }
  });

  // Bağlantı Testi
  testConnectionBtn.addEventListener('click', async () => {
    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const customUrl = customUrlInput.value.trim();

    if (provider === 'local') {
      showStatus('✓ Dahili Deterministik Motor aktiftir. Herhangi bir internet bağlantısı veya API anahtarına gerek olmadan yerel olarak çalışır.', 'success');
      return;
    }

    if (!apiKey && provider !== 'custom') {
      showStatus('Test etmek için lütfen bir API anahtarı giriniz.', 'error');
      return;
    }

    showStatus('Bağlantı test ediliyor, lütfen bekleyin...', 'info');

    try {
      if (provider === 'gemini') {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping: Sadece "OK" yaz.' }] }]
          })
        });

        if (res.ok) {
          showStatus('✓ Google Gemini API bağlantısı başarılı!', 'success');
        } else {
          const err = await res.text();
          showStatus(`Gemini Bağlantı Hatası (${res.status}): API anahtarınızı kontrol edin.`, 'error');
        }
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (res.ok) {
          showStatus('✓ OpenAI API bağlantısı başarılı!', 'success');
        } else {
          showStatus(`OpenAI Bağlantı Hatası (${res.status}): API anahtarınızı kontrol edin.`, 'error');
        }
      } else if (provider === 'custom') {
        const endpoint = customUrl || 'http://localhost:11434/v1/chat/completions';
        showStatus(`Özel endpoint adresine (${endpoint}) istek atılıyor...`, 'info');
        const res = await fetch(endpoint.replace('/chat/completions', '/models'), {
          method: 'GET'
        });
        if (res.ok) {
          showStatus('✓ Özel API endpoint bağlantısı başarılı!', 'success');
        } else {
          showStatus(`Özel endpoint yanıt vermedi (${res.status}). Sunucunun açık olduğundan emin olun.`, 'error');
        }
      }
    } catch (err) {
      showStatus(`Bağlantı hatası: ${err.message}`, 'error');
    }
  });

  function updateVisibility() {
    const val = providerSelect.value;
    if (val === 'local') {
      apiKeyGroup.style.display = 'none';
      modelGroup.style.display = 'none';
      customUrlGroup.style.display = 'none';
    } else if (val === 'custom') {
      apiKeyGroup.style.display = 'flex';
      modelGroup.style.display = 'flex';
      customUrlGroup.style.display = 'flex';
    } else {
      apiKeyGroup.style.display = 'flex';
      modelGroup.style.display = 'flex';
      customUrlGroup.style.display = 'none';
    }
  }

  function updatePlaceholders() {
    const val = providerSelect.value;
    if (val === 'gemini') {
      modelInput.placeholder = 'Varsayılan: gemini-1.5-flash';
    } else if (val === 'openai') {
      modelInput.placeholder = 'Varsayılan: gpt-4o-mini';
    } else if (val === 'custom') {
      modelInput.placeholder = 'Varsayılan: llama3 veya mistral';
    }
  }

  function showStatus(text, type) {
    statusMessage.style.display = 'block';
    statusMessage.innerText = text;
    statusMessage.className = `status-msg status-${type}`;
  }
});
