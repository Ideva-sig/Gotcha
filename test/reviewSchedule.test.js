import assert from "node:assert/strict";
import test from "node:test";
import { REVIEW_GAPS, reviewStates } from "../src/lib/reviewSchedule.js";

// 以本机日历的某一天为第 0 天；at(d, h) = 第 d 天 h 点
const DAY0 = new Date(2026, 9, 1).getTime();
const at = (d, h = 10) => {
  const t = new Date(DAY0);
  t.setDate(t.getDate() + d);
  t.setHours(h);
  return t.getTime();
};
const day = (d) => at(d, 0);
const att = (d, isCorrect, extra = {}) => ({
  questionId: "Q1", part: null, kpId: "KP-1", chapterId: "C1",
  isCorrect, errorTag: isCorrect ? null : "计算", timestamp: at(d, extra.h ?? 10), ...extra,
});
const stateOf = (attempts, now, key = "Q1:") => reviewStates(attempts, now).get(key);

test("间隔是 1、3、7 天", () => {
  assert.deepEqual(REVIEW_GAPS, [1, 3, 7]);
});

test("第一次就做对的题不进错题本", () => {
  assert.equal(reviewStates([att(0, true), att(1, true)], at(5)).size, 0);
});

test("做错：今天就要再练", () => {
  const s = stateOf([att(0, false)], at(0, 11));
  assert.equal(s.status, "wrong");
  assert.equal(s.errorCount, 1);
  assert.equal(s.dueDay, null);
});

test("当天改对只算改对，明天再考", () => {
  const list = [att(0, false), att(0, true, { h: 11 })];
  const today = stateOf(list, at(0, 12));
  assert.equal(today.status, "waiting");
  assert.equal(today.streak, 0);
  assert.equal(today.dueDay, day(1));
  assert.equal(stateOf(list, at(1, 0)).status, "due", "第二天 0 点就到期");
});

test("按时做对三次才算掌握，间隔 1、3、7 天", () => {
  const list = [att(0, false), att(0, true, { h: 11 }), att(1, true)];
  let s = stateOf(list, at(1, 12));
  assert.equal(s.streak, 1);
  assert.equal(s.dueDay, day(4));
  list.push(att(4, true));
  s = stateOf(list, at(4, 12));
  assert.equal(s.streak, 2);
  assert.equal(s.dueDay, day(11));
  list.push(att(11, true));
  s = stateOf(list, at(11, 12));
  assert.equal(s.status, "mastered");
  assert.equal(s.streak, 3);
});

test("晚几天来复习也算，下一次从复习那天往后排", () => {
  const s = stateOf([att(0, false), att(0, true, { h: 11 }), att(5, true)], at(5, 12));
  assert.equal(s.streak, 1);
  assert.equal(s.dueDay, day(8));
});

test("没到复习日就做对：不算数，也不扣", () => {
  const list = [att(0, false), att(0, true, { h: 11 }), att(1, true), att(2, true)];
  const s = stateOf(list, at(2, 12));
  assert.equal(s.streak, 1);
  assert.equal(s.dueDay, day(4));
  assert.equal(s.status, "waiting");
});

test("复习时做错：从头再来", () => {
  const list = [att(0, false), att(0, true, { h: 11 }), att(1, true), att(4, false, { errorTag: "审题" })];
  let s = stateOf(list, at(4, 12));
  assert.equal(s.status, "wrong");
  assert.equal(s.streak, 0);
  assert.equal(s.errorCount, 2);
  assert.equal(s.lastWrong.errorTag, "审题");
  list.push(att(4, true, { h: 13 }));
  s = stateOf(list, at(4, 14));
  assert.equal(s.streak, 0);
  assert.equal(s.dueDay, day(5));
});

test("小问各算各的；记录顺序乱了也按时间排", () => {
  const list = [
    att(0, true, { part: "1", h: 11 }), att(0, false, { part: "1" }),
    att(0, false, { part: "2" }),
  ];
  const states = reviewStates(list, at(0, 12));
  assert.equal(states.get("Q1:1").status, "waiting");
  assert.equal(states.get("Q1:2").status, "wrong");
});

test("隔天再交同样的答案要记下来，同一天的连点不重复记", async () => {
  const study = await import("../src/lib/studyData.js");
  const subject = "math";
  const base = { questionId: "R1", kpId: "KP-1", chapterId: "C1", userAnswer: "B" };
  const data = study.loadCourseV3Data(subject);
  const yesterday = Date.now() - 86_400_000;
  data.attempts.push(
    { ...base, id: "a1", part: null, isCorrect: false, errorTag: "概念", timestamp: yesterday - 60_000, dateString: "" },
    { ...base, id: "a2", part: null, isCorrect: true, errorTag: null, timestamp: yesterday, dateString: "" },
  );
  study.saveCourseV3Data(data, subject);
  assert.equal(study.recordAttempt({ ...base, isCorrect: true }, subject).isDuplicate, false);
  assert.equal(study.recordAttempt({ ...base, isCorrect: true }, subject).isDuplicate, true);

  const queue = study.getReviewQueue(null, subject);
  assert.equal(queue.waiting.length, 1);
  assert.equal(queue.waiting[0].streak, 1);
  assert.equal(queue.waiting[0].errorTag, "概念");
});
