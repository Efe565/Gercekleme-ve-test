#!/usr/bin/env node
/**
 * G*Power Paired t-Test CLI
 * Clean-Room Implementation
 * 
 * Clinical Focus: Pre/Post Blood Pressure (Anti-hypertensive Study)
 */

import {
  calculateAPriori,
  calculatePostHoc,
  calculateSensitivity,
  calculateEffectSizeFromBloodPressure,
  analyzeBloodPressureStudy
} from './engine.js';

// Simple ANSI color helpers
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

function printBanner() {
  console.log(`
${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}
  ${colors.bold}${colors.magenta}G*Power CLI${colors.reset} — ${colors.bold}Eşleştirilmiş t-Testi Güç Analizi (Matched Pairs)${colors.reset}
  ${colors.dim}Klinik Modül: Tedavi Öncesi ve Sonrası Kan Basıncı (Tansiyon) Analizi${colors.reset}
${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
}

function printHelp() {
  printBanner();
  console.log(`
${colors.bold}KULLANIM:${colors.reset}
  gpower-paired-t [seçenekler]

${colors.bold}ANALİZ TİPLERİ (--mode):${colors.reset}
  ${colors.green}apriori${colors.reset}      (Varsayılan) Hedef güç ve etki büyüklüğü ile gereken N sayısını hesaplar.
  ${colors.green}posthoc${colors.reset}      Belirli bir örneklem büyüklüğü (N) ile elde edilen gücü hesaplar.
  ${colors.green}sensitivity${colors.reset}  Belirli N ve güç için tespit edilebilecek en küçük etki büyüklüğünü bulur.

${colors.bold}STANDART PARAMETRELER:${colors.reset}
  -d, --effect-size <değer>   Cohen's dz etki büyüklüğü (örn: 0.5)
  -a, --alpha <değer>         I. Tip hata olasılığı α (Varsayılan: 0.05)
  -p, --power <değer>         Hedef istatistiksel güç 1-β (Varsayılan: 0.80)
  -t, --tails <1|2>           Kuyruk sayısı: 1 (tek yönlü) veya 2 (çift yönlü, Varsayılan: 2)
  -n, --sample-size <değer>   Örneklem büyüklüğü (posthoc ve sensitivity için)

${colors.bold}KLİNİK TANSİYON PARAMETRELERİ (Determine Drawer):${colors.reset}
  --pre-mean <mmHg>           Tedavi öncesi sistolik/diyastolik ortalama (örn: 155)
  --pre-sd <mmHg>             Tedavi öncesi standart sapma (örn: 14)
  --post-mean <mmHg>          Tedavi sonrası ortalama (örn: 142)
  --post-sd <mmHg>            Tedavi sonrası standart sapma (örn: 13)
  --rho <değer>               İki ölçüm arasındaki Pearson korelasyonu (örn: 0.60)

${colors.bold}ÇIKTI FORMATLARI:${colors.reset}
  --json                      Sonuçları makine tarafından okunabilir JSON formatında verir.
  -h, --help                  Bu yardım menüsünü görüntüler.

${colors.bold}ÖRNEKLER:${colors.reset}
  ${colors.yellow}1) Standart A Priori hesaplama:${colors.reset}
     gpower-paired-t --effect-size 0.5 --power 0.80 --alpha 0.05

  ${colors.yellow}2) Klinik Tansiyon Değerleriyle A Priori Hesaplama:${colors.reset}
     gpower-paired-t --pre-mean 155 --pre-sd 14 --post-mean 142 --post-sd 13 --rho 0.6 --power 0.85

  ${colors.yellow}3) Post Hoc Güç Analizi (30 hasta ile elde edilen güç):${colors.reset}
     gpower-paired-t --mode posthoc --effect-size 0.5 --sample-size 30

  ${colors.yellow}4) JSON Çıktısı:${colors.reset}
     gpower-paired-t --effect-size 0.5 --json
`);
}

function parseArgs(args) {
  const options = {
    mode: "apriori",
    tails: 2,
    alpha: 0.05,
    power: 0.80,
    effectSize: null,
    sampleSize: null,
    preMean: null,
    preSd: null,
    postMean: null,
    postSd: null,
    rho: null,
    json: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "-m" || arg === "--mode") {
      options.mode = args[++i]?.toLowerCase();
    } else if (arg === "-t" || arg === "--tails") {
      options.tails = parseInt(args[++i], 10);
    } else if (arg === "-a" || arg === "--alpha") {
      options.alpha = parseFloat(args[++i]);
    } else if (arg === "-p" || arg === "--power") {
      options.power = parseFloat(args[++i]);
    } else if (arg === "-d" || arg === "--effect-size") {
      options.effectSize = parseFloat(args[++i]);
    } else if (arg === "-n" || arg === "--sample-size") {
      options.sampleSize = parseInt(args[++i], 10);
    } else if (arg === "--pre-mean") {
      options.preMean = parseFloat(args[++i]);
    } else if (arg === "--pre-sd") {
      options.preSd = parseFloat(args[++i]);
    } else if (arg === "--post-mean") {
      options.postMean = parseFloat(args[++i]);
    } else if (arg === "--post-sd") {
      options.postSd = parseFloat(args[++i]);
    } else if (arg === "--rho") {
      options.rho = parseFloat(args[++i]);
    }
  }

  return options;
}

export function runCli(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);

  if (options.help || argv.length === 0) {
    printHelp();
    return;
  }

  try {
    // Check if blood pressure parameters provided
    const hasBpParams = options.preMean !== null &&
      options.preSd !== null &&
      options.postMean !== null &&
      options.postSd !== null &&
      options.rho !== null;

    if (hasBpParams) {
      const bpAnalysis = analyzeBloodPressureStudy({
        preMean: options.preMean,
        preSd: options.preSd,
        postMean: options.postMean,
        postSd: options.postSd,
        rho: options.rho,
        alpha: options.alpha,
        power: options.power,
        tails: options.tails
      });

      if (options.json) {
        console.log(JSON.stringify(bpAnalysis, null, 2));
        return;
      }

      printBanner();
      console.log(`\n${colors.bold}${colors.green}📋 KLİNİK TANSİYON PROTOKOLÜ VE GÜÇ ANALİZİ SONUCU${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(` ${colors.bold}Girdi Parametreleri:${colors.reset}`);
      console.log(`   • Tedavi Öncesi Tansiyon  : ${bpAnalysis.bloodPressureParameters.preMean} ± ${bpAnalysis.bloodPressureParameters.preSd} mmHg`);
      console.log(`   • Tedavi Sonrası Tansiyon : ${bpAnalysis.bloodPressureParameters.postMean} ± ${bpAnalysis.bloodPressureParameters.postSd} mmHg`);
      console.log(`   • Beklenen Düşüş          : ${bpAnalysis.bloodPressureParameters.meanDrop.toFixed(2)} mmHg`);
      console.log(`   • Ölçümler Arası Korelasyon (r) : ${bpAnalysis.bloodPressureParameters.rho}`);
      console.log(`   • Farkların Standart Sapması   : ${bpAnalysis.bloodPressureParameters.sdDiff.toFixed(3)} mmHg`);
      console.log(`   • Hesaplanan Cohen's dz        : ${colors.bold}${colors.cyan}${bpAnalysis.bloodPressureParameters.cohensDz.toFixed(4)}${colors.reset}`);
      console.log(`   • Anlamlılık Düzeyi (α)        : ${bpAnalysis.powerAnalysis.alpha}`);
      console.log(`   • Hedef İstatistiksel Güç      : %${(bpAnalysis.powerAnalysis.targetPower * 100).toFixed(0)}`);
      console.log(`   • Hipotez Testi Yönü           : ${bpAnalysis.powerAnalysis.tails === 2 ? "Çift Yönlü (Two-tailed)" : "Tek Yönlü (One-tailed)"}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(` ${colors.bold}${colors.yellow}📊 G*Power Eşdeğer Hesaplama Çıktıları:${colors.reset}`);
      console.log(`   • ${colors.bold}Gereken Örneklem Boyutu (N) : ${colors.bold}${colors.green}${bpAnalysis.powerAnalysis.requiredN} ÇİFT (HASTA)${colors.reset}`);
      console.log(`   • Serbestlik Derecesi (df)    : ${bpAnalysis.powerAnalysis.df}`);
      console.log(`   • Non-Centrality Parametresi δ: ${bpAnalysis.powerAnalysis.nonCentralityParameter.toFixed(6)}`);
      console.log(`   • Kritik t Değeri (t_crit)    : ${bpAnalysis.powerAnalysis.criticalT.toFixed(6)}`);
      console.log(`   • Gerçekleşen Güç (Actual)    : ${colors.bold}%${(bpAnalysis.powerAnalysis.actualPower * 100).toFixed(4)}${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(` ${colors.bold}💡 Klinik Çalışma Önerisi:${colors.reset}`);
      console.log(`   ${bpAnalysis.recommendations.summary}`);
      console.log(`   • %15 Dropout/Kayıp ile Hedef : ${colors.bold}${bpAnalysis.recommendations.dropoutBuffer15Pct} hasta${colors.reset}`);
      console.log(`   • %20 Dropout/Kayıp ile Hedef : ${colors.bold}${bpAnalysis.recommendations.dropoutBuffer20Pct} hasta${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────\n`);
      return;
    }

    // Standard mode without BP parameters
    if (options.mode === "apriori") {
      if (options.effectSize === null) {
        throw new Error("Lütfen bir etki büyüklüğü girin (-d <dz>) veya klinik tansiyon parametrelerini sağlayın (--pre-mean vb.)");
      }

      const res = calculateAPriori({
        alpha: options.alpha,
        power: options.power,
        effectSize: options.effectSize,
        tails: options.tails
      });

      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
        return;
      }

      printBanner();
      console.log(`\n${colors.bold}${colors.green}📋 A PRİORİ GÜÇ ANALİZİ SONUCU (G*POWER EŞLEŞTİRİLMİŞ T-TESTİ)${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(` ${colors.bold}Girdi Parametreleri:${colors.reset}`);
      console.log(`   • Test Ailesi             : ${res.testFamily}`);
      console.log(`   • İstatistiksel Test      : ${res.statisticalTest}`);
      console.log(`   • Kuyruk (Tails)          : ${res.tails === 2 ? "Çift yönlü (2)" : "Tek yönlü (1)"}`);
      console.log(`   • Etki Büyüklüğü (dz)     : ${res.effectSize}`);
      console.log(`   • Hata Olasılığı (α)      : ${res.alpha}`);
      console.log(`   • Hedef Güç (1 - β)       : ${res.targetPower}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(` ${colors.bold}${colors.yellow}Çıktı Parametreleri:${colors.reset}`);
      console.log(`   • ${colors.bold}Toplam Örneklem (N)     : ${colors.bold}${colors.green}${res.requiredN} Çift${colors.reset}`);
      console.log(`   • Serbestlik Derecesi (df): ${res.df}`);
      console.log(`   • Non-Centrality Param (δ): ${res.nonCentralityParameter.toFixed(6)}`);
      console.log(`   • Kritik t Değeri         : ${res.criticalT.toFixed(6)}`);
      console.log(`   • Gerçekleşen Güç (Actual): ${colors.bold}%${(res.actualPower * 100).toFixed(4)}${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────\n`);
      return;
    }

    if (options.mode === "posthoc") {
      if (options.sampleSize === null || options.effectSize === null) {
        throw new Error("Post hoc analiz için hem --sample-size (-n) hem de --effect-size (-d) gereklidir.");
      }

      const res = calculatePostHoc({
        alpha: options.alpha,
        n: options.sampleSize,
        effectSize: options.effectSize,
        tails: options.tails
      });

      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
        return;
      }

      printBanner();
      console.log(`\n${colors.bold}${colors.green}📋 POST HOC GÜÇ ANALİZİ SONUCU${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(`   • Örneklem Büyüklüğü (N)  : ${res.sampleSize} Çift`);
      console.log(`   • Etki Büyüklüğü (dz)     : ${res.effectSize}`);
      console.log(`   • Kritik t Değeri         : ${res.criticalT.toFixed(6)}`);
      console.log(`   • Elde Edilen Güç         : ${colors.bold}${colors.green}%${(res.achievedPower * 100).toFixed(4)}${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────\n`);
      return;
    }

    if (options.mode === "sensitivity") {
      if (options.sampleSize === null) {
        throw new Error("Duyarlılık (Sensitivity) analizi için --sample-size (-n) gereklidir.");
      }

      const res = calculateSensitivity({
        alpha: options.alpha,
        power: options.power,
        n: options.sampleSize,
        tails: options.tails
      });

      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
        return;
      }

      printBanner();
      console.log(`\n${colors.bold}${colors.green}📋 DUYARLILIK (SENSITIVITY) ANALİZİ SONUCU${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────`);
      console.log(`   • Sabit Örneklem (N)      : ${res.sampleSize} Çift`);
      console.log(`   • Hedef Güç               : ${res.targetPower}`);
      console.log(`   • Tespit Edilebilir Asgari dz: ${colors.bold}${colors.green}${res.minimumDetectableEffectSize.toFixed(4)}${colors.reset}`);
      console.log(`──────────────────────────────────────────────────────────────────────\n`);
      return;
    }

    throw new Error(`Bilinmeyen mod: ${options.mode}. Geçerli modlar: apriori, posthoc, sensitivity.`);
  } catch (err) {
    if (options.json) {
      console.error(JSON.stringify({ error: err.message }));
    } else {
      console.error(`\n${colors.bold}${colors.red}❌ HATA:${colors.reset} ${err.message}\n`);
    }
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("cli.js")) {
  runCli();
}
