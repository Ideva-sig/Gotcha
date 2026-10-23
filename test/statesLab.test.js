import assert from 'node:assert/strict';
import test from 'node:test';
import { initialLab, stepLab, phaseOf, plateaus, heatRate, MAX_BOIL_LOSS } from '../src/lib/statesLab.js';

function run(mode, minutes, s = initialLab(), pts = []) {
  for (let i = 0; i < minutes / 0.05; i++) {
    s = stepLab(s, mode, 0.05);
    pts.push({ t: s.t, T: s.T, phase: phaseOf(s, mode), q: heatRate(s, mode) });
  }
  return { s, pts };
}

test('heating ice: warms, melts at 0 °C, warms, boils at 100 °C', () => {
  const { s, pts } = run('heat', 22);
  const kinds = plateaus(pts).map((p) => p.kind);
  assert.deepEqual(kinds, ['熔化', '沸腾']);
  for (const p of pts) if (p.phase === 'mixed') assert.equal(p.T, 0);
  for (const p of pts) if (p.phase === 'boiling') assert.equal(p.T, 100);
  assert.ok(s.boiled > 0 && s.boiled < MAX_BOIL_LOSS);
});

test('ice warms faster than water under the same flame (比热容 冰 < 水)', () => {
  const { pts } = run('heat', 20);
  const slope = (lo, hi) => {
    const a = pts.find((p) => p.T >= lo), b = pts.find((p) => p.T >= hi);
    return (hi - lo) / (b.t - a.t);
  };
  assert.ok(slope(-18, -2) > 1.6 * slope(2, 18));
});

test('stopping the flame ends boiling at once; freezer freezes at 0 °C', () => {
  let { s } = run('heat', 21);
  assert.equal(phaseOf(s, 'heat'), 'boiling');
  assert.notEqual(phaseOf(s, 'stop'), 'boiling');
  s = stepLab(s, 'stop', 0.5);
  assert.ok(s.T < 100);
  const { s: cold, pts } = run('freezer', 40, s);
  assert.ok(plateaus(pts).some((p) => p.kind === '凝固'));
  assert.equal(cold.water, 0);
  assert.ok(cold.T < -15 && cold.T >= -20);
});
