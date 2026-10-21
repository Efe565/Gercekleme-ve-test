#!/usr/bin/env node
/**
 * G*Power Clinical AI Agent
 * Natural Language Clinical Trial Consultation Layer over MCP & Calculation Engine
 * 
 * Complies with Teardown Sprint rules:
 * - Engine logic strictly isolated in src/engine.js
 * - Natural language to tool execution pipeline
 */

import {
  calculateAPriori,
  calculatePostHoc,
  calculateSensitivity,
  calculateEffectSizeFromBloodPressure,
  analyzeBloodPressureStudy
} from './engine.js';
import readline from 'node:readline';

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m"
};

/**
 * Natural Language Query Parser for Clinical Power Analysis
 * Extracts clinical and statistical intents and parameters from Turkish and English queries
 */
export function parseClinicalQuery(query) {
  const text = query.toLowerCase();

  // 1. Detect Analysis Type
  let mode = "apriori";
  if (text.includes("ulaştığımız güç") || text.includes("post hoc") || text.includes("posthoc") || text.includes("elde edilen güç") || text.includes("achieved power")) {
    mode = "posthoc";
  } else if (text.includes("duyarlılık") || text.includes("sensitivity") || text.includes("en küçük etki") || text.includes("minimum detectable")) {
    mode = "sensitivity";
  }

  // 2. Extract Significance Level Alpha (default: 0.05)
  let alpha = 0.05;
  const alphaMatch = text.match(/alfa\s*[=:]\s*([0-9.]+)|alpha\s*[=:]\s*([0-9.]+)|α\s*[=:]\s*([0-9.]+)/i);
  if (alphaMatch) {
    alpha = parseFloat(alphaMatch[1] || alphaMatch[2] || alphaMatch[3]);
  }

  // 3. Extract Statistical Power (default: 0.80)
  let power = 0.80;
  const powerMatch = text.match(/(?:güç|power)\s*[=:]\s*%?\s*([0-9.]+)|%\s*([0-9]+)\s*güç|([0-9.]+)\s*güç/i);
  if (powerMatch) {
    const rawPower = parseFloat(powerMatch[1] || powerMatch[2] || powerMatch[3]);
    power = rawPower > 1 ? rawPower / 100 : rawPower;
  }

  // 4. Extract Tails (1 or 2, default: 2)
  let tails = 2;
  if (text.includes("tek yönlü") || text.includes("one-tailed") || text.includes("one tailed") || text.includes("üstünlük")) {
    tails = 1;
  }

  // 5. Extract Effect Size dz
  let effectSize = null;
  const dzMatch = text.match(/dz\s*[=:]\s*([0-9.]+)|etki\s*büyüklüğü\s*[=:]\s*([0-9.]+)|effect\s*size\s*[=:]\s*([0-9.]+)/i);
  if (dzMatch) {
    effectSize = parseFloat(dzMatch[1] || dzMatch[2] || dzMatch[3]);
  }

  // 6. Extract Sample Size N (for posthoc or sensitivity)
  let sampleSize = null;
  const nMatch = text.match(/([0-9]+)\s*(?:kişilik|hasta|çift|denek|n\s*[=:]|sample)/i);
  if (nMatch) {
    sampleSize = parseInt(nMatch[1], 10);
  }

  // 7. Extract Blood Pressure Clinical Parameters
  // Pre-mean & Pre-SD: e.g., "tedavi öncesi 155 (ss=14)" or "öncesi ortalama 155, ss 14"
  let preMean = null;
  let preSd = null;
  let postMean = null;
  let postSd = null;
  let rho = 0.60; // Default correlation for repeated blood pressure measurements if not specified

  const preMatch = text.match(/öncesi[^\d]*(\d+(?:\.\d+)?)[^\d]*(?:ss|sd|standart sapma)?\s*[=:]?\s*(\d+(?:\.\d+)?)?/i) ||
                   text.match(/baseline[^\d]*(\d+(?:\.\d+)?)[^\d]*(?:ss|sd)?\s*[=:]?\s*(\d+(?:\.\d+)?)?/i);
  if (preMatch) {
    preMean = parseFloat(preMatch[1]);
    if (preMatch[2]) preSd = parseFloat(preMatch[2]);
  }

  const postMatch = text.match(/sonrası[^\d]*(\d+(?:\.\d+)?)[^\d]*(?:ss|sd|standart sapma)?\s*[=:]?\s*(\d+(?:\.\d+)?)?/i) ||
                    text.match(/post[^\d]*(\d+(?:\.\d+)?)[^\d]*(?:ss|sd)?\s*[=:]?\s*(\d+(?:\.\d+)?)?/i);
  if (postMatch) {
    postMean = parseFloat(postMatch[1]);
    if (postMatch[2]) postSd = parseFloat(postMatch[2]);
  }

  const rhoMatch = text.match(/korelasyon\s*[=:]\s*([0-9.]+)|rho\s*[=:]\s*([0-9.]+)|r\s*[=:]\s*([0-9.]+)/i);
  if (rhoMatch) {
    rho = parseFloat(rhoMatch[1] || rhoMatch[2] || rhoMatch[3]);
  }

  return {
    mode,
    alpha,
    power,
    tails,
    effectSize,
    sampleSize,
    preMean,
    preSd: preSd || (preMean ? 15 : null),
    postMean,
    postSd: postSd || (postMean ? 14 : null),
    rho
  };
}

/**
 * Execute Clinical Agent Consultation
 */
export async function consultAgent(query) {
  const parsed = parseClinicalQuery(query);

  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.bold}${colors.magenta}🤖 AI Klinik Danışman (G*Power Eşleştirilmiş t-Testi Motoru)${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\n${colors.bold}💬 Gelen Klinik Talep:${colors.reset} "${query}"`);
  console.log(`\n${colors.dim}🔍 Doğal Dil Çözümleme:${colors.reset}`);
  console.log(`   • Mod: ${parsed.mode.toUpperCase()}`);
  console.log(`   • Anlamlılık Düzeyi (α): ${parsed.alpha}`);
  console.log(`   • Hedef Güç (1-β): %${(parsed.power * 100).toFixed(0)}`);
  console.log(`   • Test Yönü: ${parsed.tails === 2 ? "Çift yönlü (Two-tailed)" : "Tek yönlü (One-tailed)"}`);

  if (parsed.preMean !== null && parsed.postMean !== null) {
    console.log(`   • Klinik Tansiyon Değerleri:`);
    console.log(`     - Tedavi Öncesi : ${parsed.preMean} ± ${parsed.preSd} mmHg`);
    console.log(`     - Tedavi Sonrası: ${parsed.postMean} ± ${parsed.postSd} mmHg`);
    console.log(`     - Korelasyon (r): ${parsed.rho}`);

    const bpAnalysis = analyzeBloodPressureStudy({
      preMean: parsed.preMean,
      preSd: parsed.preSd,
      postMean: parsed.postMean,
      postSd: parsed.postSd,
      rho: parsed.rho,
      alpha: parsed.alpha,
      power: parsed.power,
      tails: parsed.tails
    });

    console.log(`\n${colors.bold}${colors.green}📋 KLİNİK PROTOKOL VE İSTATİSTİKSEL GÜÇ RAPORU${colors.reset}`);
    console.log(`──────────────────────────────────────────────────────────────────────`);
    console.log(` ${colors.bold}1. Biyoistatistiksel Hesaplama (G*Power Eşdeğer Motor):${colors.reset}`);
    console.log(`    • Beklenen Ortalama Tansiyon Düşüşü: ${colors.bold}${bpAnalysis.bloodPressureParameters.meanDrop.toFixed(1)} mmHg${colors.reset}`);
    console.log(`    • Farkların Standart Sapması (SD_diff): ${bpAnalysis.bloodPressureParameters.sdDiff.toFixed(2)} mmHg`);
    console.log(`    • Cohen's dz Standartlaştırılmış Etki: ${colors.bold}${colors.cyan}${bpAnalysis.bloodPressureParameters.cohensDz.toFixed(4)}${colors.reset}`);
    console.log(`    • G*Power Non-Centrality Parametresi (δ): ${bpAnalysis.powerAnalysis.nonCentralityParameter.toFixed(4)}`);
    console.log(`    • Kritik t Değeri (t_crit): ${bpAnalysis.powerAnalysis.criticalT.toFixed(4)} (df = ${bpAnalysis.powerAnalysis.df})`);
    console.log(`──────────────────────────────────────────────────────────────────────`);
    console.log(` ${colors.bold}2. Nihai Örneklem Kararı:${colors.reset}`);
    console.log(`    • ${colors.bold}${colors.yellow}Asgari Gerekli Hasta Sayısı (N)     : ${bpAnalysis.powerAnalysis.requiredN} HASTA (ÇİFT)${colors.reset}`);
    console.log(`    • Ulaşılan Gerçekleşen Güç (Actual) : %${(bpAnalysis.powerAnalysis.actualPower * 100).toFixed(2)}`);
    console.log(`    • %15 Takip Kaybı (Dropout) Dahil   : ${colors.bold}${bpAnalysis.recommendations.dropoutBuffer15Pct} HASTA${colors.reset}`);
    console.log(`    • %20 Takip Kaybı (Dropout) Dahil   : ${colors.bold}${bpAnalysis.recommendations.dropoutBuffer20Pct} HASTA${colors.reset}`);
    console.log(`──────────────────────────────────────────────────────────────────────`);
    console.log(` ${colors.bold}3. Etik Kurul / Proje Başvuru Metni (G*Power Uyumlu):${colors.reset}`);
    console.log(`    "${bpAnalysis.recommendations.summary}"`);
    console.log(`──────────────────────────────────────────────────────────────────────\n`);
    return bpAnalysis;
  }

  // Effect size based fallback
  const dz = parsed.effectSize || 0.5;
  console.log(`   • Etki Büyüklüğü (Cohen's dz): ${dz}`);

  if (parsed.mode === "posthoc" && parsed.sampleSize) {
    const postHoc = calculatePostHoc({
      alpha: parsed.alpha,
      n: parsed.sampleSize,
      effectSize: dz,
      tails: parsed.tails
    });

    console.log(`\n${colors.bold}${colors.green}📋 POST HOC GÜÇ RAPORU${colors.reset}`);
    console.log(`──────────────────────────────────────────────────────────────────────`);
    console.log(`    • İncelenen Hasta Sayısı: ${postHoc.sampleSize}`);
    console.log(`    • Etki Büyüklüğü (dz)   : ${postHoc.effectSize}`);
    console.log(`    • Elde Edilen Güç (1-β) : ${colors.bold}${colors.green}%${(postHoc.achievedPower * 100).toFixed(2)}${colors.reset}`);
    console.log(`──────────────────────────────────────────────────────────────────────\n`);
    return postHoc;
  }

  const aPriori = calculateAPriori({
    alpha: parsed.alpha,
    power: parsed.power,
    effectSize: dz,
    tails: parsed.tails
  });

  console.log(`\n${colors.bold}${colors.green}📋 A PRİORİ ÖRNEKLEM BOYUTU RAPORU${colors.reset}`);
  console.log(`──────────────────────────────────────────────────────────────────────`);
  console.log(`    • Cohen's dz                  : ${aPriori.effectSize}`);
  console.log(`    • Gereken Asgari Hasta (N)    : ${colors.bold}${colors.yellow}${aPriori.requiredN} Çift${colors.reset}`);
  console.log(`    • Serbestlik Derecesi (df)    : ${aPriori.df}`);
  console.log(`    • Kritik t Değeri             : ${aPriori.criticalT.toFixed(4)}`);
  console.log(`    • Gerçekleşen Güç             : %${(aPriori.actualPower * 100).toFixed(2)}`);
  console.log(`──────────────────────────────────────────────────────────────────────\n`);
  return aPriori;
}

// Interactive CLI Loop if invoked directly without query args
async function main() {
  const queryArg = process.argv.slice(2).join(" ");
  if (queryArg.trim().length > 0) {
    await consultAgent(queryArg);
    return;
  }

  console.log(`
${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}
  ${colors.bold}${colors.magenta}G*Power Klinik AI Ajanı — İnteraktif Oturum${colors.reset}
  ${colors.dim}Klinik araştırmanızla ilgili sorunuzu doğal dilde sorabilirsiniz.${colors.reset}
  ${colors.dim}Örnek: "Tansiyon ilacı için öncesi 155 (ss=14), sonrası 142 (ss=13), r=0.6, %85 güçle kaç hasta gerekir?"${colors.reset}
  ${colors.dim}Çıkış için 'exit' veya 'q' yazın.${colors.reset}
${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    rl.question(`${colors.bold}${colors.yellow}Sorunuz > ${colors.reset}`, async (line) => {
      const trimmed = line.trim();
      if (trimmed === "exit" || trimmed === "q" || trimmed === "quit") {
        rl.close();
        return;
      }
      if (trimmed.length > 0) {
        try {
          await consultAgent(trimmed);
        } catch (e) {
          console.error(`${colors.red}Hata:${colors.reset} ${e.message}`);
        }
      }
      promptUser();
    });
  };

  promptUser();
}

if (process.argv[1] && process.argv[1].endsWith("agent.js")) {
  main().catch(console.error);
}
