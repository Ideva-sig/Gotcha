// 原子得失电子互动图对真题：2022 广州第 4 题（Q-CHEM-GZ2022-04）。铷原子 37 个质子，各层 2、8、18、8、1。
// 答案 D：氯化铷是 RbCl，不是 RbCl₂，因为 Rb 失去 1 个电子变 Rb⁺。
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseWidget } from '../src/lib/mathWidgets.js';
import { atomIonSetup, atomIonAt, atomIonLayout } from '../src/lib/atomIon.js';

const setup = atomIonSetup(parseWidget('type: atom-ion\nsymbol: Rb\nZ: 37\nshells: "2 8 18 8 1"\n'));

test('2022 广州第 4 题 · 铷原子：核内 37 个质子、5 层电子、最外层 1 个，容易失去 1 个', () => {
  assert.equal(setup.rings.length, 5);
  assert.equal(setup.last, 1);
  assert.equal(setup.mode, 'lose');
  assert.equal(setup.max, 1);
});

test('2022 广州第 4 题 · 失去 1 个电子变 Rb⁺：质子数不变，电子 36 个，带 1 个单位正电荷，剩 4 层', () => {
  const ion = atomIonAt(setup, 1);
  assert.equal(ion.protons, 37);
  assert.equal(ion.electrons, 36);
  assert.equal(ion.charge, 1);
  assert.equal(ion.name, 'Rb⁺');
  assert.deepEqual(ion.shells, [2, 8, 18, 8]);
  assert.equal(atomIonAt(setup, 0).name, 'Rb');
});

test('得到电子：氯原子 2、8、7 得 1 个变 Cl⁻（2、8、8）；镁失去 2 个变 Mg²⁺', () => {
  const cl = atomIonSetup({ symbol: 'Cl', Z: 17, shells: '2 8 7' });
  assert.equal(cl.mode, 'gain');
  assert.deepEqual(atomIonAt(cl, 1).shells, [2, 8, 8]);
  assert.equal(atomIonAt(cl, 1).name, 'Cl⁻');
  const mg = atomIonSetup({ symbol: 'Mg', Z: 12, shells: '2 8 2' });
  assert.equal(atomIonAt(mg, 2).name, 'Mg²⁺');
  assert.equal(atomIonAt(mg, 2).electrons, 10);
});

test('版面：电子点的个数等于电子数；失去的电子排到右边；参数不对报错', () => {
  const atom = atomIonLayout(setup, 0), ion = atomIonLayout(setup, 1);
  assert.equal(atom.dots.length, 37);
  assert.equal(ion.dots.length, 36);
  assert.equal(ion.side.length, 1);
  assert.equal(ion.ringsShown[4], false);
  assert.throws(() => atomIonSetup({ symbol: 'Rb', Z: 37, shells: '2 8 18 8' }));
  assert.throws(() => atomIonSetup({ symbol: 'C', Z: 6, shells: '2 4' }));
});
