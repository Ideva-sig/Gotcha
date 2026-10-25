// 实验台对课本例题：把例题里的数代进实验台的计算，结果要和课本答案一样。
// 改了实验台的计算或参数，先跑这里，把“看起来顺”和“算得对”分开查。
// 数值、页码都对照过课本 PDF 原页（2022 年版课标修订，印刷页）。
// 杠杆（大象例题槽钢 12 m）、电功率（电热水壶）的例题套不进实验台，没有配；凸透镜、平面镜、物态变化没有计算例题。
import assert from 'node:assert/strict';
import test from 'node:test';
import { resistanceOf, solveCircuit } from '../src/lib/ohmLab.js';
import { buoyancyOf, floatDepth, liquidOf, volumeOf, weightOf, G_N_PER_KG } from '../src/lib/buoyancyLab.js';
import { deltaH, RHO_U } from '../src/lib/liquidPressureLab.js';
import { stoneResult } from '../src/lib/densityLab.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

test('欧姆定律实验台 · 九年级全一册 17.2 例题（p.99）', () => {
  // 电阻器两端电压 6 V，电流 0.3 A：R = 20 Ω
  close(resistanceOf(6, 0.3), 20);
  // 把 20 Ω 接进实验台电路（不接变阻器），6 V 时电流 0.3 A
  const R20 = { type: 'R', R: 20 };
  const s1 = solveCircuit({ Us: 6, Rp: 0, load: R20, closed: true });
  close(s1.I, 0.3);
  // 电压变为原来的 2 倍，电流也是原来的 2 倍
  const s2 = solveCircuit({ Us: 12, Rp: 0, load: R20, closed: true });
  close(s2.I / s1.I, 2);
});

test('液体压强实验台 · 八年级下册 9.2 例题（p.48）', () => {
  // 万米深处海水：ρ = 1×10³ kg/m³，h = 10⁴ m，p = ρgh = 10⁸ Pa
  // 实验台用 U 形管里水柱的高度差 Δh 表示压强：p = ρ水 g Δh
  const sea = { rho: 1000 };
  close(RHO_U * G_N_PER_KG * deltaH(sea, 1e4), 1e8, 1e-3);
});

test('浮力实验台 · 八年级下册 10.2 例题（p.71）', () => {
  // 塑料块重 0.22 N，密度 1.1×10³ kg/m³，体积 2×10⁻⁵ m³ = 20 cm³（实验台体积用 cm³）
  const block = { rho: 1100, area: 4, height: 5 };
  close(volumeOf(block), 20);
  close(weightOf(block), 0.22);
  // （1）浸没在水中，浮力 0.2 N
  close(buoyancyOf(liquidOf('water'), volumeOf(block)), 0.2);
  // （2）漂浮在盐水里、浸入 90%，盐水密度 1.22×10³ kg/m³（课本答案取三位）：
  // 实验台算出的浸入比例取两位是 0.90，浮力取两位等于重力 0.22 N
  const brine = { rho: 1220 };
  close(floatDepth(block, brine) / block.height, 0.9, 0.005);
  close(buoyancyOf(brine, 0.9 * volumeOf(block)), 0.22, 0.005);
});

test('密度实验台 · 八年级上册 6.2 例题（p.147）', () => {
  // 铝棒体积取 0.02 m³ = 20 000 cm³，质量 54 kg = 54 000 g，密度 2.7 g/cm³（即 2.7×10³ kg/m³）
  const r = stoneResult({ stone: { m: 54000, V1: 0, V2: 20000 } });
  close(r.V, 20000);
  close(r.rho, 2.7);
});
