/**
 * G*Power Paired t-Test (Means: Difference between two dependent means / matched pairs)
 * Core Calculation Engine (Clean-Room Implementation from SPEC.md)
 * 
 * Complies with [REA-EV-001] through [REA-EV-006].
 */

/**
 * Standard Error Function approximation (Abramowitz & Stegun 7.1.26)
 * Error < 1.5e-7
 */
export function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  if (absX > 8.0) return sign;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(x)
 */
export function normalCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * Inverse Normal Cumulative Distribution Function (Acklam's Algorithm)
 * Relative error < 1.15e-9
 */
export function normalQuantile(p) {
  if (p <= 0 || p >= 1) {
    throw new RangeError("Probability p must be in (0, 1)");
  }

  const a = [
    -3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,
     1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,
     6.680131188771972e+01, -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00
  ];
  const d = [
     7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,
     3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
          ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

/**
 * Natural log of the Gamma function via Lanczos approximation (g=7, n=9)
 */
export function logGamma(z) {
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.138571095856205,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) {
    x += c[i] / (z + i);
  }
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Regularized Incomplete Beta function I_x(a, b) using continued fractions
 */
export function incompleteBeta(a, b, x) {
  if (x === 0) return 0;
  if (x === 1) return 1;
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(b, a, 1 - x);
  }

  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)) / a;
  const maxIter = 200;
  const eps = 1e-15;
  let c = 1.0;
  let d = 1.0 - (a + b) * x / (a + 1.0);
  if (Math.abs(d) < eps) d = eps;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1.0 + num * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1.0 + num / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1.0 / d;
    h *= d * c;

    num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1.0 + num * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1.0 + num / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1.0 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < eps) break;
  }
  return factor * h;
}

/**
 * Student's t Cumulative Distribution Function (Central)
 */
export function studentTCdf(t, nu) {
  if (nu <= 0) throw new RangeError("Degrees of freedom must be > 0");
  const x = nu / (nu + t * t);
  const ib = incompleteBeta(nu / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

/**
 * Student's t Probability Density Function (Central)
 */
export function studentTPdf(t, nu) {
  if (nu <= 0) throw new RangeError("Degrees of freedom must be > 0");
  const logVal = logGamma((nu + 1) / 2) - logGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (t * t) / nu);
  return Math.exp(logVal);
}

/**
 * Inverse Student's t Cumulative Distribution Function (Quantile)
 * Uses Cornish-Fisher asymptotic expansion followed by Newton-Raphson refinement
 */
export function studentTQuantile(p, nu) {
  if (p <= 0 || p >= 1) throw new RangeError("p must be in (0, 1)");
  if (nu <= 0) throw new RangeError("Degrees of freedom must be > 0");
  if (p === 0.5) return 0;
  if (p < 0.5) return -studentTQuantile(1 - p, nu);

  const z = normalQuantile(p);
  if (nu > 2000) return z;

  const z2 = z * z, z3 = z2 * z, z5 = z3 * z2, z7 = z5 * z2, z9 = z7 * z2;
  let t = z + (z3 + z) / (4 * nu)
    + (5 * z5 + 16 * z3 + 3 * z) / (96 * nu * nu)
    + (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * nu * nu * nu)
    + (79 * z9 + 776 * z7 + 1482 * z5 - 1920 * z3 - 945 * z) / (92160 * Math.pow(nu, 4));

  for (let iter = 0; iter < 12; iter++) {
    const cdf = studentTCdf(t, nu);
    const pdf = studentTPdf(t, nu);
    const err = cdf - p;
    if (Math.abs(err) < 1e-13) break;
    t -= err / pdf;
  }
  return t;
}

/**
 * Non-Central Student's t Cumulative Distribution Function F(t; nu, delta)
 * Integrates: E_chi2[ Phi(t * sqrt(Y/nu) - delta) ]
 * Complies with [REA-EV-005] numerical precision
 */
export function noncentralTCdf(t, nu, delta) {
  if (nu <= 0) throw new RangeError("Degrees of freedom must be > 0");
  if (delta === 0) return studentTCdf(t, nu);

  const logCoeff = Math.log(2) - (nu / 2) * Math.LN2 - logGamma(nu / 2);
  const uCenter = Math.sqrt(nu);
  const uMax = Math.max(10, uCenter + 6 * Math.max(2, Math.sqrt(nu)));
  const n = 1000;
  const h = uMax / n;
  let s = 0;

  for (let i = 1; i < n; i++) {
    const u = i * h;
    const phi = normalCdf(t * u / Math.sqrt(nu) - delta);
    const logVal = (nu - 1) * Math.log(u) - (u * u) / 2 + logCoeff;
    if (logVal > -80) {
      const w = i % 2 === 0 ? 2 : 4;
      s += w * phi * Math.exp(logVal);
    }
  }
  return (h / 3) * s;
}

/**
 * Computes statistical power for paired t-test given sample size N
 * Complies with [REA-EV-001], [REA-EV-003], [REA-EV-006]
 */
export function computePower(n, dz, alpha, tails = 2) {
  if (n < 2) {
    throw new RangeError("[REA-EV-001] Sample size N must be at least 2 (df >= 1)");
  }
  if (alpha <= 0 || alpha >= 1) {
    throw new RangeError("Alpha must be between 0 and 1");
  }
  if (dz === 0) {
    return { n, df: n - 1, delta: 0, tCrit: 0, power: alpha };
  }

  const absDz = Math.abs(dz);
  const df = n - 1;
  const delta = absDz * Math.sqrt(n);
  const effectiveAlpha = tails === 2 ? alpha / 2 : alpha;
  const tCrit = studentTQuantile(1 - effectiveAlpha, df);

  let power;
  if (tails === 2) {
    // Upper and lower tail integration [REA-EV-003]
    const pUpper = 1 - noncentralTCdf(tCrit, df, delta);
    const pLower = noncentralTCdf(-tCrit, df, delta);
    power = pUpper + pLower;
  } else {
    power = 1 - noncentralTCdf(tCrit, df, delta);
  }

  // Bound power to [0, 1]
  power = Math.max(0, Math.min(1, power));

  return {
    n,
    df,
    delta,
    tCrit,
    power
  };
}

/**
 * Calculate Cohen's dz from pre- and post-intervention blood pressure statistics
 * Complies with [REA-EV-004] (Determine Drawer)
 * 
 * @param {number} preMean - Baseline blood pressure mean (mmHg)
 * @param {number} preSd - Baseline blood pressure standard deviation (mmHg)
 * @param {number} postMean - Post-treatment blood pressure mean (mmHg)
 * @param {number} postSd - Post-treatment blood pressure standard deviation (mmHg)
 * @param {number} rho - Pearson correlation between pre and post measurements (-1 < rho < 1)
 */
export function calculateEffectSizeFromBloodPressure(preMean, preSd, postMean, postSd, rho) {
  if (preSd <= 0 || postSd <= 0) {
    throw new RangeError("Standard deviations must be strictly positive");
  }
  if (rho <= -1 || rho >= 1) {
    throw new RangeError("Correlation rho must be strictly between -1 and 1");
  }

  const meanDifference = Math.abs(preMean - postMean);
  const diffVariance = (preSd * preSd) + (postSd * postSd) - (2 * rho * preSd * postSd);
  if (diffVariance <= 0) {
    throw new Error("Calculated variance of differences must be strictly positive");
  }

  const sdDiff = Math.sqrt(diffVariance);
  const dz = meanDifference / sdDiff;

  return {
    meanDifference,
    sdDiff,
    dz,
    varianceDiff: diffVariance,
    preMean,
    preSd,
    postMean,
    postSd,
    rho
  };
}

/**
 * A Priori Power Analysis: Compute required sample size N
 * Given alpha, target power, effect size dz, tails
 * Complies with [REA-EV-001], [REA-EV-002], [REA-EV-005]
 */
export function calculateAPriori({
  alpha = 0.05,
  power = 0.80,
  effectSize,
  tails = 2,
  maxN = 100000
}) {
  if (effectSize <= 0) {
    throw new RangeError("Effect size dz must be strictly positive");
  }
  if (alpha <= 0 || alpha >= 1) {
    throw new RangeError("Alpha must be in (0, 1)");
  }
  if (power <= 0 || power >= 1) {
    throw new RangeError("Power must be in (0, 1)");
  }
  if (tails !== 1 && tails !== 2) {
    throw new RangeError("Tails must be 1 or 2");
  }

  const targetPower = power;
  const tolerance = 1e-7;

  // Discrete integer search from N = 2 upwards [REA-EV-001, REA-EV-002]
  // Start with normal approximation for quick bracket
  const zAlpha = normalQuantile(1 - (tails === 2 ? alpha / 2 : alpha));
  const zBeta = normalQuantile(targetPower);
  const roughN = Math.max(2, Math.floor(Math.pow((zAlpha + zBeta) / effectSize, 2)));

  let startN = Math.max(2, roughN - 10);
  for (let n = startN; n <= maxN; n++) {
    const res = computePower(n, effectSize, alpha, tails);
    if (res.power >= targetPower - tolerance) {
      return {
        analysisType: "A priori",
        testFamily: "t tests",
        statisticalTest: "Means: Difference between two dependent means (matched pairs)",
        tails,
        alpha,
        targetPower,
        effectSize,
        requiredN: n,
        totalSampleSize: n,
        df: res.df,
        nonCentralityParameter: res.delta,
        criticalT: res.tCrit,
        actualPower: res.power
      };
    }
  }

  throw new Error(`Sample size computation exceeded maximum limit of ${maxN}`);
}

/**
 * Post Hoc Power Analysis: Compute achieved power
 * Given alpha, sample size N, effect size dz, tails
 */
export function calculatePostHoc({
  alpha = 0.05,
  n,
  effectSize,
  tails = 2
}) {
  if (n < 2) {
    throw new RangeError("Sample size N must be at least 2");
  }
  if (effectSize <= 0) {
    throw new RangeError("Effect size dz must be strictly positive");
  }

  const res = computePower(n, effectSize, alpha, tails);
  return {
    analysisType: "Post hoc",
    testFamily: "t tests",
    statisticalTest: "Means: Difference between two dependent means (matched pairs)",
    tails,
    alpha,
    sampleSize: n,
    effectSize,
    df: res.df,
    nonCentralityParameter: res.delta,
    criticalT: res.tCrit,
    achievedPower: res.power
  };
}

/**
 * Sensitivity Analysis: Compute minimum detectable effect size dz
 * Given alpha, power, sample size N, tails
 */
export function calculateSensitivity({
  alpha = 0.05,
  power = 0.80,
  n,
  tails = 2,
  tolerance = 1e-6
}) {
  if (n < 2) {
    throw new RangeError("Sample size N must be at least 2");
  }

  // Binary search for dz in [0.001, 10.0]
  let low = 0.0001;
  let high = 10.0;
  let mid = (low + high) / 2;

  for (let iter = 0; iter < 100; iter++) {
    mid = (low + high) / 2;
    const res = computePower(n, mid, alpha, tails);
    if (Math.abs(res.power - power) < tolerance) {
      break;
    }
    if (res.power < power) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const finalRes = computePower(n, mid, alpha, tails);
  return {
    analysisType: "Sensitivity",
    testFamily: "t tests",
    statisticalTest: "Means: Difference between two dependent means (matched pairs)",
    tails,
    alpha,
    targetPower: power,
    sampleSize: n,
    minimumDetectableEffectSize: mid,
    df: finalRes.df,
    nonCentralityParameter: finalRes.delta,
    criticalT: finalRes.tCrit,
    actualPower: finalRes.power
  };
}

/**
 * Complete Clinical Blood Pressure Study Analysis
 * Integrates Determine Drawer with A Priori / Post Hoc calculation
 */
export function analyzeBloodPressureStudy({
  preMean,
  preSd,
  postMean,
  postSd,
  rho,
  alpha = 0.05,
  power = 0.80,
  tails = 2
}) {
  const effectDetails = calculateEffectSizeFromBloodPressure(preMean, preSd, postMean, postSd, rho);
  const aPrioriResult = calculateAPriori({
    alpha,
    power,
    effectSize: effectDetails.dz,
    tails
  });

  return {
    clinicalStudy: "Antihipertansif Tedavi Öncesi ve Sonrası Kan Basıncı (Tansiyon) Güç Analizi",
    bloodPressureParameters: {
      preMean,
      preSd,
      postMean,
      postSd,
      rho,
      meanDrop: effectDetails.meanDifference,
      sdDiff: effectDetails.sdDiff,
      cohensDz: effectDetails.dz
    },
    powerAnalysis: aPrioriResult,
    recommendations: {
      requiredPatients: aPrioriResult.requiredN,
      dropoutBuffer15Pct: Math.ceil(aPrioriResult.requiredN / 0.85),
      dropoutBuffer20Pct: Math.ceil(aPrioriResult.requiredN / 0.80),
      summary: `Antihipertansif tedavide ortalama ${effectDetails.meanDifference.toFixed(1)} mmHg'lik bir tansiyon düşüşünü ` +
        `(%${(power * 100).toFixed(0)} güç ve α=${alpha} seviyesinde) istatistiksel olarak anlamlı tespit edebilmek için ` +
        `en az ${aPrioriResult.requiredN} eşleştirilmiş hasta gerekmektedir. %15 takip kaybı (loss-to-follow-up) payı ile ` +
        `çalışmaya ${Math.ceil(aPrioriResult.requiredN / 0.85)} hasta alınması önerilir.`
    }
  };
}
