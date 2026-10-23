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

