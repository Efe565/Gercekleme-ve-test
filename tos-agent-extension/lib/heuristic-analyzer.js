/**
 * ToS-Agent TR - Dahili Deterministik Kural ve Heuristic Risk Analizörü
 */

(function (root) {
  function getInjectionDetector() {
    if (typeof require !== 'undefined') {
      try { return require('./prompt-injection-guard').detectPromptInjection; } catch (e) {}
    }
    if (root && root.TosPromptInjectionGuard) {
      return root.TosPromptInjectionGuard.detectPromptInjection;
    }
    return null;
  }

  // Risk tanımları ve tespit kuralları
  const RISK_RULES = [
    {
      category: 'Tahkim ve Dava Hakkından Feragat',
      severity: 'Kritik',
      title: 'Mahkemeye Gitme ve Toplu Dava Hakkından Feragat',
      patterns: [
        /(?:bağlayıcı\s+tahkim|tahkim\s+yoluyla|tahkime\s+tabi|tahkim\s+heyeti)/i,
        /(?:toplu\s+dava\s+(?:açma|katılma)?\s*hakkınızdan\s+feragat|toplu\s+dava\s+feragati)/i,
        /(?:binding\s+arbitration|waive\s+(?:any\s+)?right\s+to\s+participate\s+in\s+a\s+class\s+action)/i
      ],
      explanation_tr: 'Bir anlaşmazlık durumunda tüketici mahkemelerine başvuramazsınız. Yalnızca masraflı özel tahkime gidebilir ve diğer mağdurlarla birlikte toplu dava açamazsınız.',
      recommendation: 'Tüketici hakem heyetleri ve Türk Tüketici Kanunu kapsamında bu tür ön feragatlerin geçersizliği ileri sürülebilir.',
      ambiguousCheck: /(?:makul\s+istisnalar|tarafların\s+anlaşması\s+halinde)/i,
      ambiguityReason: 'Zorunlu tahkim maddelerinin tüketici sözleşmelerindeki geçerliliği Türk Tüketici Mahkemeleri içtihatlarında tartışmalıdır.'
    },
    {
      category: 'Yapay Zeka Eğitimi İçin Veri Kullanımı',
      severity: 'Kritik',
      title: 'Kullanıcı Veri ve İçeriklerinin Yapay Zeka Modellerini Eğitmek İçin Kullanımı',
      patterns: [
        /(?:yapay\s+zeka|makine\s+öğrenimi|algoritmaları(?:mızı)?).{0,50}(?:eğitmek|geliştirmek|beslemek)/i,
        /(?:train|training)\s+(?:our\s+)?(?:artificial\s+intelligence|ai|machine\s+learning)\s+models/i,
        /(?:içeriklerinizi\s+yapay\s+zeka\s+modellerimizde|yapay\s+zeka\s+modelleri)/i
      ],
      explanation_tr: 'Platforma yüklediğiniz fotoğraflar, ses kayıtları, metinler veya özel veriler şirketin yapay zeka modellerini eğitmek ve geliştirmek için kullanılabilir.',
      recommendation: 'Gizlilik ayarlarından "Yapay zeka eğitimine veri paylaşımını kapat" (Opt-Out) seçeneğinin olup olmadığını kontrol edin.',
      ambiguousCheck: /(?:anonimleştirilmiş\s+olarak|kişisel\s+veri\s+içermeyen)/i,
      ambiguityReason: 'Verinin tam anonim hale getirilip getirilmediği teknik ve hukuki olarak belirsizdir.'
    },
    {
      category: 'Fikri Mülkiyet ve İçerik Hakları Devri',
      severity: 'Yüksek',
      title: 'Geniş Kapsamlı ve Süresiz İçerik Lisansı Devri',
      patterns: [
        /(?:dünya\s+çapında|telifsiz|süresiz|münhasır\s+olmayan|alt\s+lisanslanabilir).{0,60}lisans/i,
        /(?:worldwide|royalty-free|perpetual|irrevocable|sub-?licensable)\s+license/i,
        /(?:içeriklerinizi\s+kullanma,\s+çoğaltma|içeriğinizi\s+kullanma)/i,
        /(?:lisans\s+verirsiniz|lisans\s+vermiş\s+olursunuz)/i
      ],
      explanation_tr: 'Siteye yüklediğiniz fotoğraf, video veya yazılar üzerinde şirkete dünya genelinde, bedelsiz ve neredeyse sınırsız bir kullanım lisansı vermiş olursunuz.',
      recommendation: 'Hassas veya telif içeren şahsi çalışmalarınızı platforma yüklerken dikkatli olun.',
      ambiguousCheck: /(?:hizmeti\s+işletmek\s+ve\s+geliştirmek\s+amacıyla\s+sınırlı|makul\s+ölçüde)/i,
      ambiguityReason: 'Lisansın salt hizmetin teknik sunumu için mi yoksa ticari pazarlama için mi kullanıldığı belirsiz bırakılmıştır.'
    },
    {
      category: 'Otomatik Yenileme ve İptal Zorluğu',
      severity: 'Yüksek',
      title: 'Otomatik Yenilenen Abonelik ve Tahsilat Zorunluluğu',
      patterns: [
        /(?:otomatik\s+olarak\s+yenilenir|otomatik\s+yenileme)/i,
        /(?:iptal\s+edilmediği\s+sürece|iptal\s+etmediğiniz\s+sürece)/i,
        /(?:automatically\s+renews?|charged\s+automatically\s+unless\s+cancelled)/i,
        /(?:kayıtlı\s+kartınızdan\s+(?:otomatik\s+)?tahsil|otomatik\s+tahsil)/i
      ],
      explanation_tr: 'Deneme süresi bittiğinde veya abonelik dönemi dolduğunda sizden onay alınmaksızın kartınızdan otomatik para çekilir; iptal tarihi kaçırılırsa iade yapılmaz.',
      recommendation: 'Aboneliği başlattığınız anda takviminize hatırlatıcı kurun veya hemen ardından otomatik yenilemeyi kapatın.',
      ambiguousCheck: /(?:makul\s+bildirim|istisnai\s+hallerde\s+iade)/i,
      ambiguityReason: 'İptal sürecinin kaç aşamalı olduğu ve iade talebinin kabul şartları metinde açıkça belirtilmemiştir.'
    },
    {
      category: 'Tek Taraflı Değişiklik Hakkı',
      severity: 'Orta',
      title: 'Şartları ve Ücretleri Önceden Haber Vermeksizin Değiştirme Yetkisi',
      patterns: [
        /(?:önceden\s+bildirmeksizin|herhangi\s+bir\s+bildirimde\s+bulunmadan).{0,30}(?:değiştirme|güncelleme)\s+hakkı/i,
        /(?:dilediği\s+zaman\s+(?:abonelik\s+ücretlerini\s+ve\s+)?koşulları|şartlarımızı\s+dilediği\s+zaman)/i,
        /(?:at\s+our\s+sole\s+discretion|without\s+prior\s+notice)\s+(?:modify|update|change)/i,
        /(?:değişiklikler\s+(?:sitede\s+)?yayınlandığı\s+anda\s+yürürlüğe\s+girer)/i
      ],
      explanation_tr: 'Şirket kullanım koşullarını veya abonelik ücretini size özel bildirim yapmadan tek taraflı değiştirebilir. Siteyi kullanmaya devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.',
      recommendation: 'Periyodik olarak koşullar sayfasını kontrol etmek veya bildirim seçeneği talep etmek yararlı olabilir.',
      ambiguousCheck: /(?:önemli\s+değişikliklerde\s+makul\s+bildirim|e-posta\s+ile\s+bildirilebilir|önceden\s+bildirilir)/i,
      ambiguityReason: 'Neyin "önemli değişiklik" sayılacağı şirket takdirine bırakılmıştır.'
    },
    {
      category: 'Veri Paylaşımı ve Gizlilik',
      severity: 'Yüksek',
      title: 'Kişisel Verilerin Reklam Ortakları ve Üçüncü Taraflarla Paylaşımı',
      patterns: [
        /(?:üçüncü\s+taraf(?:lar)?la\s+paylaş(?:abiliriz|ılır)|iş\s+ortaklarımızla\s+paylaş)/i,
        /(?:hedefli\s+reklamcılık|reklam\s+ortakları|pazarlama\s+amaçlı\s+paylaşım)/i,
        /(?:share\s+(?:your\s+)?(?:personal\s+)?data\s+with\s+third\s+parties|advertising\s+partners)/i,
        /(?:bilgilerinizi\s+iştiraklerimiz\s+ve\s+ortaklarımızla)/i
      ],
      explanation_tr: 'Kişisel verileriniz, gezinme geçmişiniz ve profil bilgileriniz üçüncü taraf reklam şirketlerine ve iş ortaklarına aktarılabilir.',
      recommendation: 'Gizlilik panelinden kişiselleştirilmiş reklamları kapatın ve veri işleme iznini sınırlandırın.',
      ambiguousCheck: /(?:kanunun\s+izin\s+verdiği\s+ölçüde|makul\s+güvenlik\s+önlemleri)/i,
      ambiguityReason: 'Hangi üçüncü taraflarla ne tür verilerin paylaşıldığı genel ifadelerle geçiştirilmiştir.'
    },
    {
      category: 'Sorumsuzluk ve Tazminat Muafiyeti',
      severity: 'Orta',
      title: 'Hizmet Kesintisi ve Veri Kaybında Tam Sorumsuzluk ("Olduğu Gibi")',
      patterns: [
        /(?:olduğu\s+gibi|as-?is)\s+(?:sunulmaktadır|esas)/i,
        /(?:hiçbir\s+garanti\s+(?:verilmemektedir|olmaksızın)|açık\s+veya\s+zımni\s+hiçbir\s+garanti)/i,
        /(?:dolaylı|özel|arızi|cezai)?\s*zararlardan\s+sorumlu\s+tutulamaz/i,
        /(?:limitation\s+of\s+liability|disclaims?\s+all\s+warranties)/i
      ],
      explanation_tr: 'Platform çökerse, verileriniz silinirse veya güvenlik açığı nedeniyle zarara uğrarsanız, şirket herhangi bir tazminat veya sorumluluk kabul etmez.',
      recommendation: 'Platforma yüklediğiniz kritik verilerin her zaman yerel bir yedeğini tutun.',
      ambiguousCheck: /(?:yasaların\s+izin\s+verdiği\s+azami\s+ölçüde|ağır\s+kusur\s+hariç)/i,
      ambiguityReason: 'Türk Borçlar Kanunu md. 115 uyarınca ağır kusurdan sorumsuzluk sözleşmeleri hükümsüzdür.'
    },
    {
      category: 'Hesap Askıya Alma ve Fesih Yetkisi',
      severity: 'Orta',
      title: 'Gerekçe Göstermeksizin Hesabı Kapatma ve Erişimi Engelleme Yetkisi',
      patterns: [
        /(?:kendi\s+takdirimize\s+bağlı\s+olarak).{0,80}(?:askıya\s+alabilir|sonlandırabilir|kapatabilir)/i,
        /(?:herhangi\s+bir\s+zamanda\s+ve\s+herhangi\s+bir\s+nedenle).{0,50}(?:askıya\s+alabilir|sonlandırabilir)/i,
        /(?:terminate\s+or\s+suspend\s+your\s+account\s+at\s+any\s+time|sole\s+discretion)/i,
        /(?:hesabınızı\s+bildirimde\s+bulunmaksızın\s+kapatma)/i
      ],
      explanation_tr: 'Şirket dilediği zaman gerekçe belirtmeksizin veya önceden uyarmaksızın hesabınızı silebilir ve tüm birikiminizi dondurabilir.',
      recommendation: 'Tek bir platforma bağımlı kalmamaya ve hesabınızla ilişkili verileri düzenli dışa aktarmaya özen gösterin.',
      ambiguousCheck: /(?:şartların\s+ihlali\s+durumunda|makul\s+şüphe)/i,
      ambiguityReason: 'İhlalin ne olduğu ve savunma hakkı tanınıp tanınmayacağı netleştirilmemiştir.'
    }
  ];

  function splitIntoSentences(text) {
    if (!text) return [];
    return text
      .split(/(?<=[.!?:\n])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
  }

  function analyzeTosLocally(rawText, docTitle = 'Kullanım Koşulları Belgesi') {
    if (!rawText || typeof rawText !== 'string') {
      return {
        document_title: docTitle,
        document_type: 'other',
        overall_risk_score: 0,
        risk_level: 'Düşük',
        summary_tr: 'Analiz edilecek geçerli bir metin bulunamadı.',
        honesty_and_uncertainty_note: 'Metin boş veya okunamadı.',
        prompt_injection_detected: false,
        prompt_injection_details: null,
        clauses: []
      };
    }

    const detector = getInjectionDetector();
    const injection = detector ? detector(rawText) : { detected: false, matches: [] };

    const sentences = splitIntoSentences(rawText);
    const foundClauses = [];
    const matchedCategories = new Set();
    const ambiguityNotes = [];

    for (const rule of RISK_RULES) {
      let matchedSentence = null;

      for (const pattern of rule.patterns) {
        for (const sentence of sentences) {
          if (pattern.test(sentence)) {
            matchedSentence = sentence;
            break;
          }
        }
        if (matchedSentence) break;

        if (!matchedSentence) {
          const match = rawText.match(pattern);
          if (match) {
            const idx = match.index;
            const start = Math.max(0, rawText.lastIndexOf('.', Math.max(0, idx - 1)) + 1);
            let end = rawText.indexOf('.', idx + match[0].length);
            if (end === -1) end = Math.min(rawText.length, idx + match[0].length + 100);
            matchedSentence = rawText.substring(start, end + 1).trim();
            break;
          }
        }
      }

      if (matchedSentence && !matchedCategories.has(rule.category)) {
        matchedCategories.add(rule.category);

        let verbatimQuote = matchedSentence;
        if (!rawText.includes(verbatimQuote)) {
          const sub = verbatimQuote.substring(0, 80);
          if (rawText.includes(sub)) {
            verbatimQuote = sub;
          }
        }

        const hasAmbiguity = rule.ambiguousCheck ? rule.ambiguousCheck.test(matchedSentence) : false;
        const isAmbiguous = hasAmbiguity || rule.severity === 'Orta';

        if (isAmbiguous) {
          ambiguityNotes.push(`"${rule.title}" maddesinde yerel mevzuat ve şirket uygulamasına bağlı gri alan bulunmaktadır.`);
        }

        foundClauses.push({
          id: `clause_${foundClauses.length + 1}`,
          category: rule.category,
          severity: rule.severity,
          confidence: isAmbiguous ? 'Düşük (Yoruma Açık)' : 'Yüksek',
          title: rule.title,
          verbatim_quote: verbatimQuote,
          explanation_tr: rule.explanation_tr,
          recommendation: rule.recommendation,
          is_ambiguous: isAmbiguous,
          ambiguity_reason: isAmbiguous ? rule.ambiguityReason : null
        });
      }
    }

    if (injection.detected) {
      foundClauses.unshift({
        id: 'clause_security_injection',
        category: 'Diğer Riskli Hükümler',
        severity: 'Kritik',
        confidence: 'Yüksek',
        title: '🚨 Güvenlik Tehdidi: Prompt Injection ve Gizli Talimat Girişimi',
        verbatim_quote: injection.matches[0] || 'System override instruction detected',
        explanation_tr: 'Bu sayfada yapay zekayı yanıltmaya ve güvenlik kontrollerini atlatmaya yönelik gizli sistem talimatı tespit edildi. Metin yapay zekayı manipüle etmeye çalışmaktadır!',
        recommendation: 'Bu web sitesine güvenmeyin. Gizli yapay zeka talimatları içeren sözleşmeler yüksek aldatma riski taşır.',
        is_ambiguous: false,
        ambiguity_reason: null
      });
    }

    let score = 0;
    for (const c of foundClauses) {
      if (c.severity === 'Kritik') score += 25;
      else if (c.severity === 'Yüksek') score += 15;
      else if (c.severity === 'Orta') score += 8;
      else score += 3;
    }
    const overallRiskScore = Math.min(100, Math.max(0, score));

    let riskLevel = 'Düşük';
    if (overallRiskScore >= 76) riskLevel = 'Kritik';
    else if (overallRiskScore >= 51) riskLevel = 'Yüksek';
    else if (overallRiskScore >= 26) riskLevel = 'Orta';

    let summary = '';
    if (overallRiskScore >= 76) {
      summary = `Bu sözleşme tüketici aleyhine çok ciddi ve kritik riskler barındırmaktadır. Toplam ${foundClauses.length} adet riskli madde tespit edilmiştir. Özellikle tahkim zorunluluğu, geniş içerik lisansı devri veya yapay zeka eğitiminde veri kullanımı gibi kritik hususlar mevcuttur.`;
    } else if (overallRiskScore >= 51) {
      summary = `Bu belgede dikkat edilmesi gereken önemli riskler bulunmaktadır. Toplam ${foundClauses.length} adet riskli madde tespit edildi. Otomatik yenilenen abonelik ve üçüncü taraflarla veri paylaşımı maddelerine dikkat edilmelidir.`;
    } else if (overallRiskScore >= 26) {
      summary = `Bu sözleşmede orta düzeyde standart riskler mevcuttur (${foundClauses.length} madde). Hizmet kesintilerinde sorumsuzluk ve tek taraflı şart güncelleme gibi genel sektör uygulamaları yer almaktadır.`;
    } else {
      summary = `Bu metinde belirgin bir kritik tüketici riski tespit edilememiştir veya sözleşme standart tüketici haklarını gözetmektedir.`;
    }

    let uncertaintyNote = '';
    if (ambiguityNotes.length > 0) {
      uncertaintyNote = `Sistemin Dürüst İtirafı: Tespit edilen bazı maddelerde (${ambiguityNotes.length} adet) hukuki kesinlik iddia etmek yanıltıcı olur. Şirketin kullandığı 'makul önlemler' veya 'takdirimize bağlı' gibi muğlak ifadeler, Türk Borçlar Kanunu ve KVKK içtihatlarına göre mahkemeden mahkemeye farklı yorumlanabilir. Sistemimiz kesin bir ihlal hükmü vermek yerine bu maddeleri 'Yoruma Açık' olarak işaretlemiştir.`;
    } else {
      uncertaintyNote = `Sözleşme maddeleri standart kalıplarla yazılmıştır. Ancak her hukuki uyuşmazlığın somut olay adaletine göre değerlendirilmesi gerektiği unutulmamalıdır.`;
    }

    return {
      document_title: docTitle,
      document_type: 'terms_of_service',
      overall_risk_score: overallRiskScore,
      risk_level: riskLevel,
      summary_tr: summary,
      honesty_and_uncertainty_note: uncertaintyNote,
      prompt_injection_detected: injection.detected,
      prompt_injection_details: injection.detected ? `Tespit edilen saldırı kalıpları: ${injection.matches.join(', ')}` : null,
      clauses: foundClauses
    };
  }

  const exportObj = {
    analyzeTosLocally,
    RISK_RULES
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
  root.TosHeuristicAnalyzer = exportObj;
})(typeof globalThis !== 'undefined' ? globalThis : this);
