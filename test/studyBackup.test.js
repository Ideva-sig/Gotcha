import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCourseV3Data, markKpVisited, recordAttempt } from '../src/lib/studyData.js';
import { buildBackup, restoreBackup } from '../src/lib/studyBackup.js';

function freshStorage() {
  const mem = {};
  globalThis.window = { localStorage: { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } }, dispatchEvent() {} };
  globalThis.localStorage = window.localStorage;
  globalThis.Event = class {};
  return mem;
}
const wrong = (subject, id, kp) => recordAttempt({ questionId: id, kpId: kp, chapterId: 'c', userAnswer: 'x', isCorrect: false, errorTag: '概念' }, subject);

test('统一备份：数学、化学和物理一起导出，换设备后全部恢复', () => {
  freshStorage();
  markKpVisited('MATH-9A-26-2a', 'math'); wrong('math', 'Q-MATH-GZ2025-24', 'MATH-9A-26-2a');
  markKpVisited('PHY-9-13-1a', 'physics'); wrong('physics', 'Q-PHY-X-1', 'PHY-9-13-1a');
  markKpVisited('CHEM-9A-01-1a', 'chemistry'); wrong('chemistry', 'Q-CHEM-X-1', 'CHEM-9A-01-1a');
  const backup = JSON.parse(JSON.stringify(buildBackup()));
  assert.equal(backup.version, 2);
  assert.deepEqual(Object.keys(backup.subjects), ['math', 'chemistry', 'physics']);

  freshStorage(); // 另一台设备
  assert.deepEqual(restoreBackup(backup).sort(), ['chemistry', 'math', 'physics']);
  assert.deepEqual(loadCourseV3Data('math').visitedKps, ['MATH-9A-26-2a']);
  assert.equal(loadCourseV3Data('math').attempts.length, 1);
  assert.deepEqual(loadCourseV3Data('physics').visitedKps, ['PHY-9-13-1a']);
  assert.deepEqual(loadCourseV3Data('chemistry').visitedKps, ['CHEM-9A-01-1a']);
  assert.equal(loadCourseV3Data('chemistry').attempts.length, 1);
});

test('恢复是合并，不覆盖本机已有记录；重复恢复不会重复计数', () => {
  freshStorage();
  markKpVisited('MATH-9A-26-2a', 'math'); wrong('math', 'Q-MATH-A', 'MATH-9A-26-2a');
  const backup = JSON.parse(JSON.stringify(buildBackup()));
  freshStorage();
  markKpVisited('MATH-9A-29-1a', 'math'); wrong('math', 'Q-MATH-B', 'MATH-9A-29-1a');
  restoreBackup(backup); restoreBackup(backup);
  const m = loadCourseV3Data('math');
  assert.deepEqual([...m.visitedKps].sort(), ['MATH-9A-26-2a', 'MATH-9A-29-1a']);
  assert.equal(m.attempts.length, 2);
});

test('旧的单科备份仍能导入，且只动对应的科目', () => {
  freshStorage();
  markKpVisited('MATH-9A-26-2a', 'math');
  const oldMath = { format: 'junior-high-study-backup', subject: 'math', version: 1, courseV3: loadCourseV3Data('math') };
  const oldPhysics = { format: 'junior-high-study-backup', version: 1, courseV3: { version: 3, visitedKps: ['PHY-9-13-1a'], evidenceChecks: {}, attempts: [] }, mistakes: [], progress: {}, syncState: {} };
  freshStorage();
  assert.deepEqual(restoreBackup(oldMath), ['math']);
  assert.deepEqual(loadCourseV3Data('physics').visitedKps, []);
  assert.deepEqual(restoreBackup(oldPhysics), ['physics']);
  assert.deepEqual(loadCourseV3Data('physics').visitedKps, ['PHY-9-13-1a']);
});

test('科目对不上或格式不对：整份不导入，本机记录不变', () => {
  freshStorage();
  markKpVisited('MATH-9A-26-2a', 'math');
  const bad = { format: 'junior-high-study-backup', version: 2, subjects: {
    physics: { courseV3: { version: 3, visitedKps: ['PHY-9-13-1a'], evidenceChecks: {}, attempts: [] } },
    math: { courseV3: { version: 3, visitedKps: ['PHY-9-13-1a'], evidenceChecks: {}, attempts: [] } },
  } };
  assert.throws(() => restoreBackup(bad));
  assert.deepEqual(loadCourseV3Data('physics').visitedKps, []); // 前一科也没写入
  assert.throws(() => restoreBackup({ format: 'other' }));
  assert.throws(() => restoreBackup({ format: 'junior-high-study-backup', version: 9 }));
  assert.deepEqual(loadCourseV3Data('math').visitedKps, ['MATH-9A-26-2a']);
});

test('本机存档读不懂：原文另存一份，不会被空记录直接覆盖', () => {
  const mem = freshStorage();
  mem['study-course-v3-math'] = '{坏掉的存档';
  const key = Object.keys(mem)[0];
  assert.deepEqual(loadCourseV3Data('math').visitedKps, []);
  const stash = Object.keys(mem).filter((k) => k.startsWith(`${key}-unreadable-`));
  assert.equal(stash.length, 1);
  assert.equal(mem[stash[0]], '{坏掉的存档');
});

test('恢复备份写到一半失败：全部还原，并抛出错误', () => {
  const mem = freshStorage();
  markKpVisited('MATH-9A-26-2a', 'math');
  markKpVisited('PHY-9-13-1a', 'physics'); wrong('physics', 'Q-PHY-X-1', 'PHY-9-13-1a');
  const backup = JSON.parse(JSON.stringify(buildBackup()));
  freshStorage();
  const mem2 = freshStorage();
  markKpVisited('MATH-9A-29-1a', 'math');
  const snapshot = JSON.stringify(mem2);
  const real = window.localStorage.setItem;
  let calls = 0;
  window.localStorage.setItem = (k, v) => { if (++calls === 3) throw new Error('quota'); real(k, v); };
  assert.throws(() => restoreBackup(backup), /已还原/);
  window.localStorage.setItem = real;
  assert.equal(JSON.stringify(mem2), snapshot);
  void mem;
});
