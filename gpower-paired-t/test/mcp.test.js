import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAPriori,
  calculatePostHoc,
  calculateSensitivity,
  calculateEffectSizeFromBloodPressure,
  analyzeBloodPressureStudy
} from '../src/engine.js';

describe('MCP Server Registered Tool Logic Tests', () => {
  it('Tool calculate_apriori_sample_size matches G*Power vector', () => {
    const res = calculateAPriori({ effectSize: 0.5, alpha: 0.05, power: 0.80, tails: 2 });
    assert.equal(res.requiredN, 34);
    assert.equal(res.df, 33);
    assert.ok(Math.abs(res.criticalT - 2.034515) < 0.0001);
  });

  it('Tool calculate_posthoc_power returns accurate power', () => {
    const res = calculatePostHoc({ n: 34, effectSize: 0.5, alpha: 0.05, tails: 2 });
    assert.ok(Math.abs(res.achievedPower - 0.807778) < 0.0001);
  });

  it('Tool calculate_sensitivity returns detectable dz', () => {
    const res = calculateSensitivity({ n: 34, alpha: 0.05, power: 0.80, tails: 2 });
    assert.ok(Math.abs(res.minimumDetectableEffectSize - 0.493) < 0.01);
  });

  it('Tool calculate_blood_pressure_effect_size computes correct covariance & dz', () => {
    const res = calculateEffectSizeFromBloodPressure(150, 15, 140, 15, 0.5);
    assert.equal(res.meanDifference, 10);
    assert.equal(res.sdDiff, 15);
    assert.ok(Math.abs(res.dz - (2 / 3)) < 1e-6);
  });

  it('Tool analyze_blood_pressure_study returns complete clinical protocol', () => {
    const res = analyzeBloodPressureStudy({
      preMean: 155,
      preSd: 14,
      postMean: 142,
      postSd: 13,
      rho: 0.6,
      alpha: 0.05,
      power: 0.85,
      tails: 2
    });
    assert.equal(res.powerAnalysis.requiredN, 10);
    assert.equal(res.recommendations.requiredPatients, 10);
    assert.equal(res.recommendations.dropoutBuffer15Pct, 12);
    assert.equal(res.recommendations.dropoutBuffer20Pct, 13);
  });
});
