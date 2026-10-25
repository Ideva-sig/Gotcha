import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeStudyPayloads,
  normalizeMistakes,
  normalizeStudyPayload,
  safeFormatStudyDate,
} from "../src/lib/studyData.js";

function mistake(exerciseId, updatedAt, overrides = {}) {
  return {
    exerciseId,
    subject: "math",
    topicId: "topic-1",
    topicBasePath: "/knowledge",
    topicSlug: "topic-1",
    topicTitle: "测试知识点",
    chapter: "21 测试章",
    prompt: "题目",
    formula: null,
    figure: null,
    answer: "1",
    exerciseAnchor: "examples",
    sourceLabel: "测试",
    status: "pending",
    errorCount: 1,
    lastAttemptAt: updatedAt,
    masteredAt: null,
    updatedAt,
    ...overrides,
  };
}

function payload(mistakes, syncState = { deletedMistakes: {} }) {
  return {
    version: 1,
    mistakes,
    progress: { completedTopicIds: [] },
    syncState,
  };
}

test("merges additions from two devices instead of overwriting either side", () => {
  const merged = mergeStudyPayloads(
    payload([mistake("local", "2026-07-19T01:00:00.000Z")]),
    payload([mistake("remote", "2026-07-19T02:00:00.000Z")]),
  );
  assert.deepEqual(
    merged.mistakes.map((item) => item.exerciseId).sort(),
    ["local", "remote"],
  );
});

test("keeps the newest record state and honors a newer deletion tombstone", () => {
  const merged = mergeStudyPayloads(
    payload(
      [mistake("deleted", "2026-07-19T01:00:00.000Z")],
      { deletedMistakes: { deleted: "2026-07-19T03:00:00.000Z" } },
    ),
    payload([
      mistake("deleted", "2026-07-19T02:00:00.000Z"),
      mistake("mastered", "2026-07-19T04:00:00.000Z", {
        status: "mastered",
      }),
    ]),
  );
  assert.equal(merged.mistakes.some((item) => item.exerciseId === "deleted"), false);
  assert.equal(
    merged.mistakes.find((item) => item.exerciseId === "mastered")?.status,
    "mastered",
  );
});

test("rejects malformed records and payload envelopes", () => {
  assert.equal(normalizeMistakes([null], { strict: true }), null);
  assert.equal(
    normalizeStudyPayload({ version: 1, mistakes: [], progress: null }),
    null,
  );
});

test("formats invalid dates without throwing", () => {
  const formatter = new Intl.DateTimeFormat("zh-CN");
  assert.equal(safeFormatStudyDate("not-a-date", formatter), "暂无记录");
});

test("normalizes and merges courseV3 payloads without breaking v1 schema", () => {
  const local = {
    version: 1,
    mistakes: [],
    progress: { completedTopicIds: [] },
    syncState: { deletedMistakes: {} },
    courseV3: {
      version: 3,
      visitedKps: ["PHY-9-13-1a"],
      evidenceChecks: { "PHY-9-13-1a:0": true },
      attempts: [
        {
          id: "att_1",
          questionId: "Q-1",
          kpId: "PHY-9-13-1a",
          chapterId: "PHY-9-13",
          userAnswer: "A",
          isCorrect: false,
          errorTag: "概念",
          timestamp: 1000,
        },
      ],
      updatedAt: "2026-10-05T10:00:00.000Z",
    },
  };

  const remote = {
    version: 1,
    mistakes: [],
    progress: { completedTopicIds: [] },
    syncState: { deletedMistakes: {} },
    courseV3: {
      version: 3,
      visitedKps: ["PHY-9-13-1b"],
      evidenceChecks: { "PHY-9-13-1b:0": true },
      attempts: [
        {
          id: "att_2",
          questionId: "Q-1",
          kpId: "PHY-9-13-1a",
          chapterId: "PHY-9-13",
          userAnswer: "B",
          isCorrect: true,
          errorTag: null,
          timestamp: 2000,
        },
      ],
      updatedAt: "2026-10-05T11:00:00.000Z",
    },
  };

  const merged = mergeStudyPayloads(local, remote);
  assert.equal(merged.version, 1);
  assert.ok(merged.courseV3);
  assert.deepEqual(merged.courseV3.visitedKps.sort(), ["PHY-9-13-1a", "PHY-9-13-1b"]);
  assert.equal(merged.courseV3.evidenceChecks["PHY-9-13-1a:0"], true);
  assert.equal(merged.courseV3.evidenceChecks["PHY-9-13-1b:0"], true);
  assert.equal(merged.courseV3.attempts.length, 2);
});


test("regrades choice attempts against the current answer key and lists orphaned mistakes", async () => {
  const study = await import("../src/lib/studyData.js");
  const subject = "chemistry";
  const choice = (key, extra = {}) => ({
    id: "Q1", type: "选择", grading: "自动",
    options: [{ key: "A", text: "a" }, { key: "B", text: "b" }],
    answer: { key }, review: [{ tag: "公式" }], ...extra,
  });
  const base = { kpId: "KP-1", chapterId: "C1" };
  // 旧答案是 A：选 B 判错；自评题和找不到的题照常记
  study.recordAttempt({ ...base, questionId: "Q1", userAnswer: "B", isCorrect: false, errorTag: "概念" }, subject);
  study.recordAttempt({ ...base, questionId: "Q2", userAnswer: "自评", isCorrect: false, errorTag: "计算" }, subject);
  study.recordAttempt({ ...base, questionId: "GONE", userAnswer: "A", isCorrect: false, errorTag: "审题" }, subject);

  // 答案改成 B：Q1 变成做对，错因清掉；自评题不动
  const map = { Q1: choice("B"), Q2: { id: "Q2", type: "计算", grading: "自评", answer: { text: "1" } } };
  assert.equal(study.regradeChoiceAttempts(map, subject), 1);
  const q1 = study.getLatestAttempt("Q1", null, subject);
  assert.equal(q1.isCorrect, true);
  assert.equal(q1.errorTag, null);
  assert.equal(study.getLatestAttempt("Q2", null, subject).isCorrect, false);
  assert.equal(study.regradeChoiceAttempts(map, subject), 0, "重判一次之后不再改动");

  // 答案又改回 A：Q1 回到做错，错因用题目的默认错因
  assert.equal(study.regradeChoiceAttempts({ ...map, Q1: choice("A") }, subject), 1);
  assert.equal(study.getLatestAttempt("Q1", null, subject).errorTag, "公式");

  // 小问：按小问自己的答案判
  study.recordAttempt({ ...base, questionId: "Q3", part: "1", userAnswer: "A", isCorrect: true }, subject);
  const q3 = { id: "Q3", type: "计算", grading: "自评", parts: [{ part: "1", ...choice("B"), id: undefined }] };
  assert.equal(study.regradeChoiceAttempts({ Q3: q3 }, subject), 1);
  assert.equal(study.getLatestAttempt("Q3", "1", subject).isCorrect, false);

  // 题目删掉或改了编号：列出来，不混进正常错题
  const orphans = study.getOrphanMistakes({ ...map, Q1: choice("A"), Q3: q3 }, subject);
  assert.deepEqual(orphans.map((o) => o.questionId), ["GONE"]);
  assert.equal(study.getActiveMistakes({ ...map, Q3: q3 }, subject).filter((m) => m.question).length, 3);
});
