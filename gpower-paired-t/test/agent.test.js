import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseClinicalQuery, consultAgent } from '../src/agent.js';

describe('AI Agent Query Parser & Execution Tests', () => {
  it('Parses natural language blood pressure clinical trial query', () => {
    const q = "Hipertansiyon ilacı deniyoruz. Hastaların tedavi öncesi sistolik tansiyonu ortalama 155 (ss=14), tedavi sonrası 142 (ss=13) olmasını bekliyoruz. İki ölçüm arasındaki korelasyon 0.6. Alfa=0.05 ve %85 güç için kaç hasta almalıyız?";
    const parsed = parseClinicalQuery(q);

    assert.equal(parsed.mode, "apriori");
    assert.equal(parsed.alpha, 0.05);
    assert.equal(parsed.power, 0.85);
    assert.equal(parsed.tails, 2);
    assert.equal(parsed.preMean, 155);
    assert.equal(parsed.preSd, 14);
    assert.equal(parsed.postMean, 142);
    assert.equal(parsed.postSd, 13);
    assert.equal(parsed.rho, 0.6);
  });

  it('Parses direct dz query and executes consultation', async () => {
    const q = "Eşleştirilmiş t-testi ile Cohen's dz=0.5 için %80 güç ve alfa=0.05 ile örneklem boyutu ne olmalı?";
    const result = await consultAgent(q);

    assert.equal(result.requiredN, 34);
    assert.equal(result.df, 33);
    assert.ok(result.actualPower >= 0.80);
  });

  it('Parses post-hoc power query', async () => {
    const q = "34 kişilik tansiyon çalışmamızda dz=0.5 için elde edilen güç nedir?";
    const result = await consultAgent(q);

    assert.equal(result.sampleSize, 34);
    assert.ok(Math.abs(result.achievedPower - 0.807778) < 0.001);
  });
});
