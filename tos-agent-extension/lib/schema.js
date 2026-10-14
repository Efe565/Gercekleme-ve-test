/**
 * ToS-Agent TR - JSON Şema ve Doğrulama Modülü
 */

(function (root) {
  const RISK_CATEGORIES = [
    'Veri Paylaşımı ve Gizlilik',
    'Tek Taraflı Değişiklik Hakkı',
    'Otomatik Yenileme ve İptal Zorluğu',
    'Tahkim ve Dava Hakkından Feragat',
    'Fikri Mülkiyet ve İçerik Hakları Devri',
    'Yapay Zeka Eğitimi İçin Veri Kullanımı',
    'Sorumsuzluk ve Tazminat Muafiyeti',
    'Hesap Askıya Alma ve Fesih Yetkisi',
    'Kullanıcı Takibi ve Konum Paylaşımı',
    'Diğer Riskli Hükümler'
  ];

  const RISK_LEVELS = ['Düşük', 'Orta', 'Yüksek', 'Kritik'];
  const SEVERITY_LEVELS = ['Düşük', 'Orta', 'Yüksek', 'Kritik'];
  const CONFIDENCE_LEVELS = ['Yüksek', 'Orta', 'Düşük (Yoruma Açık)'];

  const TosRiskReportSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'TosRiskReport',
    type: 'object',
    required: [
      'document_title',
      'document_type',
      'overall_risk_score',
      'risk_level',
      'summary_tr',
      'honesty_and_uncertainty_note',
      'clauses',
      'prompt_injection_detected'
    ],
    properties: {
      document_title: { type: 'string' },
      document_type: {
        type: 'string',
        enum: ['terms_of_service', 'privacy_policy', 'subscription_terms', 'cookie_policy', 'other']
      },
      overall_risk_score: { type: 'integer', minimum: 0, maximum: 100 },
      risk_level: { type: 'string', enum: RISK_LEVELS },
      summary_tr: { type: 'string' },
      honesty_and_uncertainty_note: { type: 'string' },
      prompt_injection_detected: { type: 'boolean' },
      prompt_injection_details: { type: ['string', 'null'] },
      clauses: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'id', 'category', 'severity', 'confidence', 'title',
            'verbatim_quote', 'explanation_tr', 'recommendation', 'is_ambiguous'
          ],
          properties: {
            id: { type: 'string' },
            category: { type: 'string', enum: RISK_CATEGORIES },
            severity: { type: 'string', enum: SEVERITY_LEVELS },
            confidence: { type: 'string', enum: CONFIDENCE_LEVELS },
            title: { type: 'string' },
            verbatim_quote: { type: 'string', minLength: 3 },
            explanation_tr: { type: 'string' },
            recommendation: { type: 'string' },
            is_ambiguous: { type: 'boolean' },
            ambiguity_reason: { type: ['string', 'null'] }
          }
        }
      }
    }
  };

  function validateRiskReport(rawInput) {
    const errors = [];
    let parsed = null;

    if (typeof rawInput === 'string') {
      let cleanStr = rawInput.trim();
      if (cleanStr.startsWith('```')) {
        cleanStr = cleanStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      try {
        parsed = JSON.parse(cleanStr);
      } catch (e) {
        return { valid: false, data: null, errors: [`JSON ayrıştırma hatası: ${e.message}`] };
      }
    } else if (typeof rawInput === 'object' && rawInput !== null) {
      parsed = JSON.parse(JSON.stringify(rawInput));
    } else {
      return { valid: false, data: null, errors: ['Girdi geçerli bir JSON nesnesi değil.'] };
    }

    for (const field of TosRiskReportSchema.required) {
      if (parsed[field] === undefined || parsed[field] === null) {
        errors.push(`Eksik zorunlu alan: "${field}"`);
      }
    }

    if (typeof parsed.overall_risk_score !== 'number' || isNaN(parsed.overall_risk_score)) {
      errors.push('overall_risk_score sayısal bir değer olmalıdır.');
    } else {
      parsed.overall_risk_score = Math.max(0, Math.min(100, Math.round(parsed.overall_risk_score)));
    }

    if (!RISK_LEVELS.includes(parsed.risk_level)) {
      if (parsed.overall_risk_score >= 76) parsed.risk_level = 'Kritik';
      else if (parsed.overall_risk_score >= 51) parsed.risk_level = 'Yüksek';
      else if (parsed.overall_risk_score >= 26) parsed.risk_level = 'Orta';
      else parsed.risk_level = 'Düşük';
    }

    if (typeof parsed.summary_tr !== 'string' || parsed.summary_tr.trim().length === 0) {
      errors.push('summary_tr boş olmayan bir metin olmalıdır.');
    }

    if (!Array.isArray(parsed.clauses)) {
      errors.push('clauses bir dizi olmalıdır.');
    } else {
      parsed.clauses.forEach((clause, index) => {
        const prefix = `clauses[${index}]`;
        if (!clause || typeof clause !== 'object') {
          errors.push(`${prefix} geçerli bir nesne değil.`);
          return;
        }
        if (!clause.id) clause.id = `clause_${index + 1}`;
        if (!clause.title || typeof clause.title !== 'string') errors.push(`${prefix}.title eksik.`);
        if (!clause.verbatim_quote || typeof clause.verbatim_quote !== 'string' || clause.verbatim_quote.trim().length < 3) {
          errors.push(`${prefix}.verbatim_quote orijinal metinden birebir alıntı içermelidir.`);
        }
        if (!clause.explanation_tr || typeof clause.explanation_tr !== 'string') {
          errors.push(`${prefix}.explanation_tr sade Türkçe açıklama içermelidir.`);
        }
        if (!clause.category) clause.category = 'Diğer Riskli Hükümler';
        if (!SEVERITY_LEVELS.includes(clause.severity)) clause.severity = 'Orta';
        if (!CONFIDENCE_LEVELS.includes(clause.confidence)) {
          clause.confidence = clause.is_ambiguous ? 'Düşük (Yoruma Açık)' : 'Yüksek';
        }
        clause.is_ambiguous = Boolean(clause.is_ambiguous);
        if (clause.is_ambiguous && !clause.ambiguity_reason) {
          clause.ambiguity_reason = 'Madde kapsamı yerel hukuk açısından yoruma bağlıdır.';
        }
      });
    }

    return {
      valid: errors.length === 0,
      data: errors.length === 0 ? parsed : null,
      errors
    };
  }

  const exportObj = {
    TosRiskReportSchema,
    RISK_CATEGORIES,
    RISK_LEVELS,
    SEVERITY_LEVELS,
    CONFIDENCE_LEVELS,
    validateRiskReport
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
  root.TosSchema = exportObj;
})(typeof globalThis !== 'undefined' ? globalThis : this);
