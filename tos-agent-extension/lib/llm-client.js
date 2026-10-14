/**
 * ToS-Agent TR - Çoklu Sağlayıcı LLM İstemcisi
 */

(function (root) {
  function getSchemaValidator() {
    if (typeof require !== 'undefined') {
      try { return require('./schema').validateRiskReport; } catch (e) {}
    }
    if (root && root.TosSchema) return root.TosSchema.validateRiskReport;
    return null;
  }

  function getVerifier() {
    if (typeof require !== 'undefined') {
      try { return require('./verifier').verifyReportQuotes; } catch (e) {}
    }
    if (root && root.TosVerifier) return root.TosVerifier.verifyReportQuotes;
    return null;
  }

  function getPromptBuilder() {
    if (typeof require !== 'undefined') {
      try { return require('./prompt-injection-guard').buildDefensivePrompt; } catch (e) {}
    }
    if (root && root.TosPromptInjectionGuard) return root.TosPromptInjectionGuard.buildDefensivePrompt;
    return null;
  }

  function getLocalAnalyzer() {
    if (typeof require !== 'undefined') {
      try { return require('./heuristic-analyzer').analyzeTosLocally; } catch (e) {}
    }
    if (root && root.TosHeuristicAnalyzer) return root.TosHeuristicAnalyzer.analyzeTosLocally;
    return null;
  }

  async function getStoredConfig() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const config = await chrome.storage.local.get([
        'tos_provider',
        'tos_api_key',
        'tos_model',
        'tos_custom_url'
      ]);
      return {
        provider: config.tos_provider || 'local',
        apiKey: config.tos_api_key || '',
        model: config.tos_model || '',
        customUrl: config.tos_custom_url || 'http://localhost:11434/v1/chat/completions'
      };
    }
    return {
      provider: 'local',
      apiKey: '',
      model: '',
      customUrl: ''
    };
  }

  async function callGemini(apiKey, modelName, prompt) {
    const model = modelName || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Hatası (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) throw new Error('Gemini API boş yanıt döndürdü.');
    return textContent;
  }

  async function callOpenAI(apiKey, modelName, prompt, endpoint = 'https://api.openai.com/v1/chat/completions') {
    const model = modelName || 'gpt-4o-mini';
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const payload = {
      model,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'Sen Türkçe hukuki risk analizi yapan uzman bir asistansın. Çıktıyı SADECE geçerli JSON formatında döndür.' },
        { role: 'user', content: prompt }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Hatası (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const textContent = result?.choices?.[0]?.message?.content;
    if (!textContent) throw new Error('OpenAI API boş yanıt döndürdü.');
    return textContent;
  }

  async function runCompleteAnalysis(rawDocumentText, docTitle = 'Kullanım Koşulları', overrideConfig = null) {
    const config = overrideConfig || (await getStoredConfig());
    let reportJson = null;

    const buildPrompt = getPromptBuilder();
    const validate = getSchemaValidator();
    const localAnalyze = getLocalAnalyzer();
    const verifyQuotes = getVerifier();

    if (config.provider === 'gemini' && config.apiKey && buildPrompt) {
      try {
        const defensivePrompt = buildPrompt(rawDocumentText);
        const rawResponse = await callGemini(config.apiKey, config.model, defensivePrompt);
        if (validate) {
          const val = validate(rawResponse);
          if (val.valid) reportJson = val.data;
        }
      } catch (e) {
        console.warn('Gemini çağrısı başarısız, yerel motora dönülüyor:', e);
      }
    } else if (config.provider === 'openai' && config.apiKey && buildPrompt) {
      try {
        const defensivePrompt = buildPrompt(rawDocumentText);
        const rawResponse = await callOpenAI(config.apiKey, config.model, defensivePrompt);
        if (validate) {
          const val = validate(rawResponse);
          if (val.valid) reportJson = val.data;
        }
      } catch (e) {
        console.warn('OpenAI çağrısı başarısız, yerel motora dönülüyor:', e);
      }
    }

    if (!reportJson && localAnalyze) {
      reportJson = localAnalyze(rawDocumentText, docTitle);
    }

    if (verifyQuotes && reportJson) {
      reportJson = verifyQuotes(reportJson, rawDocumentText);
    }

    if (reportJson) {
      reportJson.document_title = docTitle || reportJson.document_title;
    }

    return reportJson;
  }

  const exportObj = {
    getStoredConfig,
    callGemini,
    callOpenAI,
    runCompleteAnalysis
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
  root.TosLlmClient = exportObj;
  root.runCompleteAnalysis = runCompleteAnalysis;
})(typeof globalThis !== 'undefined' ? globalThis : this);
