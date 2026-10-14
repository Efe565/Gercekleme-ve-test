/**
 * ToS-Agent TR - Deterministik Alıntı Doğrulama & Puanlama Motoru
 */

(function (root) {
  function normalizeForMatching(str) {
    if (!str) return '';
    return str
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function findQuoteInText(originalText, quote) {
    if (!originalText || !quote) {
      return { found: false, exact: false, startOffset: -1, endOffset: -1, matchedSnippet: null };
    }

    const cleanQuote = quote.trim();
    if (cleanQuote.length < 3) {
      return { found: false, exact: false, startOffset: -1, endOffset: -1, matchedSnippet: null };
    }

    const exactIndex = originalText.indexOf(cleanQuote);
    if (exactIndex !== -1) {
      return {
        found: true,
        exact: true,
        startOffset: exactIndex,
        endOffset: exactIndex + cleanQuote.length,
        matchedSnippet: cleanQuote
      };
    }

    const normOriginal = normalizeForMatching(originalText);
    const normQuote = normalizeForMatching(cleanQuote);

    const normIndex = normOriginal.indexOf(normQuote);
    if (normIndex !== -1) {
      return {
        found: true,
        exact: false,
        startOffset: normIndex,
        endOffset: normIndex + cleanQuote.length,
        matchedSnippet: cleanQuote
      };
    }

    const strippedQuote = normQuote.replace(/^\.{3}\s*|\s*\.{3}$/g, '').trim();
    if (strippedQuote.length >= 10) {
      const strippedIndex = normOriginal.indexOf(strippedQuote);
      if (strippedIndex !== -1) {
        return {
          found: true,
          exact: false,
          startOffset: strippedIndex,
          endOffset: strippedIndex + strippedQuote.length,
          matchedSnippet: strippedQuote
        };
      }
    }

    return {
      found: false,
      exact: false,
      startOffset: -1,
      endOffset: -1,
      matchedSnippet: null
    };
  }

  function verifyReportQuotes(report, originalText) {
    if (!report || !Array.isArray(report.clauses)) {
      return report;
    }

    const verifiedClauses = [];
    const disqualifiedClauses = [];

    let totalScore = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;

    for (const clause of report.clauses) {
      const match = findQuoteInText(originalText, clause.verbatim_quote);

      const verifiedClause = {
        ...clause,
        verified: match.found,
        verification_status: match.found
          ? (match.exact ? 'DOGRULANDI_BIREBIR' : 'DOGRULANDI_NORMALIZE')
          : 'GECERSIZ_ALINTI_BULUNAMADI',
        verification_details: match.found
          ? 'Alıntı orijinal kaynak metinde birebir doğrulandı.'
          : 'UYARI: Bu iddiaya ait alıntı orijinal metinde bulunamadı. Halüsinasyon veya çarpıtma riski nedeniyle geçersiz sayıldı.',
        match_offset: match.found ? { start: match.startOffset, end: match.endOffset } : null
      };

      if (match.found) {
        verifiedCount++;
        switch (clause.severity) {
          case 'Kritik': totalScore += 25; break;
          case 'Yüksek': totalScore += 15; break;
          case 'Orta':   totalScore += 8;  break;
          case 'Düşük':  totalScore += 3;  break;
          default:       totalScore += 5;
        }
        verifiedClauses.push(verifiedClause);
      } else {
        rejectedCount++;
        disqualifiedClauses.push(verifiedClause);
      }
    }

    const calculatedRiskScore = Math.min(100, Math.max(0, totalScore));

    let calculatedRiskLevel = 'Düşük';
    if (calculatedRiskScore >= 76) calculatedRiskLevel = 'Kritik';
    else if (calculatedRiskScore >= 51) calculatedRiskLevel = 'Yüksek';
    else if (calculatedRiskScore >= 26) calculatedRiskLevel = 'Orta';

    let verificationSummaryNote = '';
    if (rejectedCount > 0) {
      verificationSummaryNote = `⚠️ Dikkat: Yapay zeka tarafından öne sürülen ${rejectedCount} adet madde orijinal metinde doğrulanamadığı için geçersiz kabul edildi. Yalnızca kaynakta teyit edilen ${verifiedCount} madde risk skoruna dahil edildi.`;
    } else {
      verificationSummaryNote = `✓ Tüm riskli maddeler (${verifiedCount}/${verifiedCount}) orijinal metindeki kanıtlarıyla %100 deterministik olarak doğrulandı.`;
    }

    return {
      ...report,
      overall_risk_score: calculatedRiskScore,
      risk_level: calculatedRiskLevel,
      clauses: verifiedClauses,
      disqualified_clauses: disqualifiedClauses,
      verification_metrics: {
        total_clauses: report.clauses.length,
        verified_clauses: verifiedCount,
        disqualified_clauses: rejectedCount,
        verification_rate: report.clauses.length > 0 ? Math.round((verifiedCount / report.clauses.length) * 100) : 100,
        verification_summary: verificationSummaryNote
      }
    };
  }

  const exportObj = {
    findQuoteInText,
    verifyReportQuotes,
    normalizeForMatching
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
  root.TosVerifier = exportObj;
})(typeof globalThis !== 'undefined' ? globalThis : this);
