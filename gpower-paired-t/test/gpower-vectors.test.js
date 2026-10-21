import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAPriori,
  calculatePostHoc,
  calculateSensitivity,
  calculateEffectSizeFromBloodPressure,
  analyzeBloodPressureStudy,
  computePower
} from '../src/engine.js';

describe('G*Power Official Reference Test Vectors Validation', () => {
  // V-01: Two-tailed, alpha=0.05, power=0.80, dz=0.5 -> N=34
  it('Vector V-01: dz=0.5, alpha=0.05, power=0.80, tails=2 => N=34', () => {
    const res = calculateAPriori({ effectSize: 0.5, alpha: 0.05, power: 0.80, tails: 2 });
    assert.equal(res.requiredN, 34);
    assert.equal(res.df, 33);
    assert.ok(Math.abs(res.criticalT - 2.034515) < 0.0001);
    assert.ok(Math.abs(res.nonCentralityParameter - 2.915476) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.807778) < 0.0001);
  });

  // V-02: One-tailed, alpha=0.05, power=0.80, dz=0.5 -> N=27
  it('Vector V-02: dz=0.5, alpha=0.05, power=0.80, tails=1 => N=27', () => {
    const res = calculateAPriori({ effectSize: 0.5, alpha: 0.05, power: 0.80, tails: 1 });
    assert.equal(res.requiredN, 27);
    assert.equal(res.df, 26);
    assert.ok(Math.abs(res.criticalT - 1.705618) < 0.0001);
    assert.ok(Math.abs(res.nonCentralityParameter - 2.598076) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.811832) < 0.0001);
  });

  // V-03: Two-tailed, alpha=0.05, power=0.80, dz=0.2 (small effect) -> N=199
  it('Vector V-03: dz=0.2, alpha=0.05, power=0.80, tails=2 => N=199', () => {
    const res = calculateAPriori({ effectSize: 0.2, alpha: 0.05, power: 0.80, tails: 2 });
    assert.equal(res.requiredN, 199);
    assert.equal(res.df, 198);
    assert.ok(Math.abs(res.criticalT - 1.972017) < 0.0001);
    assert.ok(Math.abs(res.nonCentralityParameter - 2.821347) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.801691) < 0.0001);
  });

  // V-04: Two-tailed, alpha=0.05, power=0.80, dz=0.8 (large effect) -> N=15
  it('Vector V-04: dz=0.8, alpha=0.05, power=0.80, tails=2 => N=15', () => {
    const res = calculateAPriori({ effectSize: 0.8, alpha: 0.05, power: 0.80, tails: 2 });
    assert.equal(res.requiredN, 15);
    assert.equal(res.df, 14);
    assert.ok(Math.abs(res.criticalT - 2.144787) < 0.0001);
    assert.ok(Math.abs(res.nonCentralityParameter - 3.098387) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.821311) < 0.0001);
  });

  // V-05: Two-tailed, alpha=0.01, power=0.95, dz=0.5 -> N=75
  it('Vector V-05: dz=0.5, alpha=0.01, power=0.95, tails=2 => N=75', () => {
    const res = calculateAPriori({ effectSize: 0.5, alpha: 0.01, power: 0.95, tails: 2 });
    assert.equal(res.requiredN, 75);
    assert.equal(res.df, 74);
    assert.ok(Math.abs(res.criticalT - 2.643913) < 0.0001);
    assert.ok(Math.abs(res.nonCentralityParameter - 4.330127) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.951176) < 0.0001);
  });

  // V-06: One-tailed, alpha=0.01, power=0.90, dz=0.4 -> N=85
  it('Vector V-06: dz=0.4, alpha=0.01, power=0.90, tails=1 => N=85', () => {
    const res = calculateAPriori({ effectSize: 0.4, alpha: 0.01, power: 0.90, tails: 1 });
    assert.equal(res.requiredN, 85);
    assert.equal(res.df, 84);
    assert.ok(Math.abs(res.criticalT - 2.371565) < 0.0001);
    assert.ok(Math.abs(res.actualPower - 0.903491) < 0.001);
  });

  // V-07: Two-tailed, alpha=0.05, power=0.90, dz=0.6 -> N=32
  it('Vector V-07: dz=0.6, alpha=0.05, power=0.90, tails=2 => N=32', () => {
    const res = calculateAPriori({ effectSize: 0.6, alpha: 0.05, power: 0.90, tails: 2 });
    assert.equal(res.requiredN, 32);
    assert.equal(res.df, 31);
    assert.ok(Math.abs(res.actualPower - 0.906912) < 0.001);
  });
});

describe('Clinical Blood Pressure Scenario & REA Evidence Checks', () => {
  it('[REA-EV-001] Enforces N >= 2 floor constraint', () => {
    assert.throws(() => {
      computePower(1, 0.5, 0.05, 2);
    }, /Sample size N must be at least 2/);
  });

  it('[REA-EV-002] Discrete integer stepping and actual power >= target power', () => {
    const res = calculateAPriori({ effectSize: 0.5, alpha: 0.05, power: 0.80, tails: 2 });
    assert.equal(res.requiredN, 34);
    assert.ok(res.actualPower >= 0.80);
    // If N was 33, power would be < 0.80
    const power33 = computePower(33, 0.5, 0.05, 2).power;
    assert.ok(power33 < 0.80);
  });

  it('[REA-EV-004] Blood pressure effect size drawer with correlation', () => {
    // Pre: 150 (SD=15), Post: 140 (SD=15), rho=0.5
    // Var = 225 + 225 - 2*0.5*15*15 = 225 => SDdiff = 15 => dz = 10/15 = 0.666667
    const eff = calculateEffectSizeFromBloodPressure(150, 15, 140, 15, 0.5);
    assert.equal(eff.meanDifference, 10);
    assert.equal(eff.sdDiff, 15);
    assert.ok(Math.abs(eff.dz - (2 / 3)) < 1e-6);
  });

  it('End-to-End Clinical Blood Pressure Study Analysis', () => {
    const report = analyzeBloodPressureStudy({
      preMean: 155,
      preSd: 14,
      postMean: 142,
      postSd: 13,
      rho: 0.6,
      alpha: 0.05,
      power: 0.85,
      tails: 2
    });

    assert.ok(report.powerAnalysis.requiredN > 0);
    assert.ok(report.recommendations.requiredPatients > 0);
    assert.ok(report.recommendations.dropoutBuffer15Pct > report.recommendations.requiredPatients);
    assert.match(report.recommendations.summary, /tansiyon düşüşünü/);
  });

  it('Post Hoc Analysis computes correct achieved power for N=34', () => {
    const postHoc = calculatePostHoc({ n: 34, effectSize: 0.5, alpha: 0.05, tails: 2 });
    assert.ok(Math.abs(postHoc.achievedPower - 0.807778) < 0.0001);
  });

  it('Sensitivity Analysis finds dz for N=34, alpha=0.05, power=0.80', () => {
    const sens = calculateSensitivity({ n: 34, alpha: 0.05, power: 0.80, tails: 2 });
    assert.ok(Math.abs(sens.minimumDetectableEffectSize - 0.493) < 0.01);
  });
});
