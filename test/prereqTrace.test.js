import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { packPath } from '../src/lib/contentPack.mjs';
import { TRACE_CAP, startTrace, nextKp, answerKp, extendTrace, canExtend, traceResult, pickCheck } from '../src/lib/prereqTrace.js';

// 手写小图辅助：spec 形如 { A: [['B','hard'],['C','soft']] }
const mk = (spec) => Object.fromEntries(Object.entries(spec).map(([id, ps]) => [id, {
  title: id, chapter: 'C', prerequisites: ps.map(([pid, strength]) => ({ id: pid, strength })), questions: [], evidence: ['自查'],
}]));

// 按顺序回答，直到 nextKp 为 null
function run(state, verdictOf) {
  const asked = [];
  for (let k = nextKp(state); k; k = nextKp(state)) {
    asked.push(k);
    state = answerKp(state, k, verdictOf(k));
  }
  return { state, asked };
}

function assertTopo(graph, path) {
  const pos = new Map(path.map((id, i) => [id, i]));
  for (const id of path) for (const p of graph[id].prerequisites) {
    if (pos.has(p.id)) assert.ok(pos.get(p.id) < pos.get(id), `${p.id} 应排在 ${id} 前面`);
  }
}

test('hard 在前、soft 在后', () => {
  const g = mk({ S: [['s1', 'soft'], ['h1', 'hard'], ['h2', 'hard']], s1: [], h1: [], h2: [] });
  assert.deepEqual(run(startTrace(g, 'S'), () => 'right').asked, ['h1', 'h2', 's1']);
});

test('right 不再往前走', () => {
  const g = mk({ S: [['A', 'hard']], A: [['B', 'hard']], B: [] });
  const right = run(startTrace(g, 'S'), () => 'right');
  assert.deepEqual(right.asked, ['A']);
  const wrong = run(startTrace(g, 'S'), () => 'wrong');
  assert.deepEqual(wrong.asked, ['A', 'B']);
});

test('不改旧 state', () => {
  const g = mk({ S: [['A', 'hard']], A: [['B', 'hard']], B: [] });
  const s0 = startTrace(g, 'S');
  const snap = JSON.stringify({ ...s0, graph: null });
  answerKp(s0, 'A', 'wrong');
  extendTrace(s0);
  assert.equal(JSON.stringify({ ...s0, graph: null }), snap);
});

test('菱形里共同祖先只问一次', () => {
  const g = mk({ S: [['L', 'hard'], ['R', 'hard']], L: [['T', 'hard']], R: [['T', 'hard']], T: [] });
  const { asked, state } = run(startTrace(g, 'S'), () => 'wrong');
  assert.deepEqual(asked, ['L', 'R', 'T']);
  assert.equal(new Set(asked).size, asked.length);
  const r = traceResult(state);
  assert.deepEqual(r.path, ['T', 'L', 'R', 'S']);
});

test('上限：到了 nextKp 为 null，canExtend 为真；extendTrace 继续', () => {
  const spec = { S: [['P1', 'hard']] };
  for (let i = 1; i <= 9; i++) spec[`P${i}`] = i < 9 ? [[`P${i + 1}`, 'hard']] : [];
  const g = mk(spec);
  let { state, asked } = run(startTrace(g, 'S', { cap: 3 }), () => 'wrong');
  assert.equal(asked.length, 3);
  assert.equal(nextKp(state), null);
  assert.equal(canExtend(state), true);
  state = extendTrace(state, 3);
  assert.equal(canExtend(state), false);
  assert.equal(nextKp(state), 'P4');
  ({ state, asked } = run(state, () => 'dunno'));
  assert.equal(asked.length, 3);
  state = extendTrace(state, 3);
  ({ state } = run(state, () => 'wrong'));
  assert.equal(canExtend(state), false); // 队列空了，不再有可扩的
  assert.equal(nextKp(state), null);
  assert.equal(traceResult(state).checked, 9);
  assert.equal(TRACE_CAP, 6);
});

test('刚好查满且队列空时 canExtend 为假', () => {
  const g = mk({ S: [['A', 'hard']], A: [] });
  const { state } = run(startTrace(g, 'S', { cap: 1 }), () => 'wrong');
  assert.equal(canExtend(state), false);
});

test('reviewTarget 先查；等于 startKp 或不存在则忽略', () => {
  const g = mk({ S: [['A', 'hard']], A: [], X: [] });
  assert.equal(nextKp(startTrace(g, 'S', { reviewTarget: 'X' })), 'X');
  assert.deepEqual(run(startTrace(g, 'S', { reviewTarget: 'X' }), () => 'right').asked, ['X', 'A']);
  assert.equal(nextKp(startTrace(g, 'S', { reviewTarget: 'S' })), 'A');
  assert.equal(nextKp(startTrace(g, 'S', { reviewTarget: 'nope' })), 'A');
  // reviewTarget 恰好也是前置时不重复
  assert.deepEqual(run(startTrace(g, 'S', { reviewTarget: 'A' }), () => 'right').asked, ['A']);
});

test('path 是拓扑顺序，不是查询顺序的倒序', () => {
  // 广度优先查的顺序是 B, C, D；但 D 是 B 的前置，C 无关
  const g = mk({ S: [['B', 'hard'], ['C', 'hard']], B: [['D', 'hard']], C: [['E', 'hard']], D: [], E: [] });
  const { state, asked } = run(startTrace(g, 'S'), (k) => (k === 'E' ? 'right' : 'wrong'));
  assert.deepEqual(asked, ['B', 'C', 'D', 'E']);
  const r = traceResult(state);
  assert.deepEqual(r.weak, ['D', 'B', 'C']); // D 最基础(层数0)先；B、C 同为 1 层按查的顺序；D 必须在 B 前
  assertTopo(g, r.path);
  assert.equal(r.path.at(-1), 'S');
  assert.notDeepEqual(r.path, [...asked].reverse());
});

test('间接前置（中间那个做对了）也要排在前面', () => {
  // S <- M <- A，M 做对（A 不再查），但 A 也直接是 S 的前置：A 与 B 的间接关系
  const g = mk({ S: [['B', 'hard'], ['M', 'hard']], B: [['M', 'hard']], M: [['A', 'hard']], A: [] });
  // B wrong -> M 已排；M right；A 从未排。再构造 A 是 S 直接前置且 A 是 B 的间接祖先
  const g2 = mk({ S: [['B', 'hard'], ['A', 'hard']], B: [['M', 'hard']], M: [['A', 'hard']], A: [] });
  const { state } = run(startTrace(g2, 'S'), (k) => (k === 'M' ? 'right' : 'wrong'));
  const r = traceResult(state);
  assert.deepEqual(r.weak, ['A', 'B']);
  assert.ok(g);
});

test('beyondJuniorHigh', () => {
  const g = mk({ S: [['A', 'hard']], A: [['B', 'hard']], B: [] });
  assert.equal(traceResult(run(startTrace(g, 'S'), () => 'wrong').state).beyondJuniorHigh, true);
  assert.equal(traceResult(run(startTrace(g, 'S'), () => 'right').state).beyondJuniorHigh, false);
  // 最早的没跟上的点还有前置（没查到）时为假
  const s = answerKp(startTrace(g, 'S'), 'A', 'wrong');
  assert.equal(traceResult(s).beyondJuniorHigh, false);
  assert.equal(traceResult(s).reachedStart, false);
  // 全对：路线只有错题本身
  const r = traceResult(run(startTrace(g, 'S'), () => 'right').state);
  assert.deepEqual(r.path, ['S']);
  assert.deepEqual(r.weak, []);
  assert.equal(r.reachedStart, true);
});

test('pickCheck：有题取第一题和第一问，找不到题或没有题给自查', () => {
  const g = mk({ S: [], T: [] });
  g.S.questions = [{ id: 'q1', note: '' }, { id: 'q2', note: '' }];
  const qm = { q1: { id: 'q1' }, q2: { id: 'q2' } };
  assert.deepEqual(pickCheck(g, 'S', qm, () => []), { kind: 'question', qRef: g.S.questions[0], part: null });
  assert.deepEqual(pickCheck(g, 'S', qm, () => [{ part: '2' }, { part: '3' }]), { kind: 'question', qRef: g.S.questions[0], part: '2' });
  assert.deepEqual(pickCheck(g, 'S', qm), { kind: 'question', qRef: g.S.questions[0], part: null });
  assert.deepEqual(pickCheck(g, 'S', {}, () => []), { kind: 'evidence', items: ['自查'] });
  assert.deepEqual(pickCheck(g, 'T', qm, () => []), { kind: 'evidence', items: ['自查'] });
});

// ---------- 真实数据 ----------
const dataDir = packPath('math');
const index = JSON.parse(fs.readFileSync(path.join(dataDir, 'index.json'), 'utf8'));
const chapters = {};
const questionsMap = {};
for (const f of fs.readdirSync(path.join(dataDir, 'chapters'))) {
  const c = JSON.parse(fs.readFileSync(path.join(dataDir, 'chapters', f), 'utf8'));
  chapters[c.id] = c;
  Object.assign(questionsMap, c.questions || {});
}
// 和 getPrereqGraph 相同的规则
const graph = {};
for (const [id, kp] of Object.entries(index.kps)) {
  if (!kp.available) continue;
  const full = (chapters[kp.chapter]?.kps || []).find((k) => k.id === id);
  const questions = [];
  for (const b of full?.blocks || []) if (b.heading === '练一练') for (const q of b.questions || []) questions.push({ id: q.id, note: q.note || '' });
  graph[id] = { title: kp.title, chapter: kp.chapter, prerequisites: kp.prerequisites.map((p) => ({ id: p.id, strength: p.strength })), questions, evidence: full?.evidence || [] };
}
const partsOf = (q) => (q.parts?.length ? q.parts : []);

test('真实数据：每个知识点都有题或自查', () => {
  const ids = Object.keys(graph);
  assert.ok(ids.length > 100);
  for (const id of ids) {
    const c = pickCheck(graph, id, questionsMap, partsOf);
    if (c.kind === 'question') {
      assert.ok(questionsMap[c.qRef.id], `${id} 的题 ${c.qRef.id} 不存在`);
      assert.ok(c.part === null || typeof c.part === 'string');
    } else {
      assert.ok(c.items.length > 0, `${id} 既没题也没自查`);
    }
  }
});

test('真实数据：每个点都答“不会”，反复扩展一定结束，每点最多问一次，路线合法', () => {
  for (const id of Object.keys(graph)) {
    let state = startTrace(graph, id);
    const asked = [];
    let rounds = 0;
    for (;;) {
      for (let k = nextKp(state); k; k = nextKp(state)) {
        asked.push(k);
        state = answerKp(state, k, 'dunno');
      }
      if (!canExtend(state)) break;
      state = extendTrace(state);
      assert.ok(++rounds < 100, `${id} 没有结束`);
    }
    assert.equal(new Set(asked).size, asked.length, `${id} 有重复`);
    assert.ok(!asked.includes(id));
    const r = traceResult(state);
    assert.equal(r.checked, asked.length);
    assert.equal(r.reachedStart, true);
    assert.equal(r.path.at(-1), id);
    assert.equal(new Set(r.path).size, r.path.length);
    assertTopo(graph, r.path);
    if (r.weak.length) assert.equal(r.beyondJuniorHigh, graph[r.weak[0]].prerequisites.length === 0);
  }
});

test('真实数据：每次只查 TRACE_CAP 个', () => {
  const deep = Object.keys(graph).find((id) => canExtend(run(startTrace(graph, id), () => 'dunno').state));
  assert.ok(deep);
  const { state, asked } = run(startTrace(graph, deep), () => 'dunno');
  assert.equal(asked.length, TRACE_CAP);
  assert.equal(canExtend(state), true);
});
