import { mathQuestionParts } from './mathWidgets.js';
import { reviewStates } from './reviewSchedule.js';

export const STUDY_PAYLOAD_VERSION = 1;
export const EMPTY_PROGRESS = { completedTopicIds: [] };
export const EMPTY_SYNC_STATE = { deletedMistakes: {} };

const SUBJECTS = new Set(["math", "physics", "chemistry"]);
const STATUSES = new Set(["pending", "mastered"]);
const MAX_MISTAKES = 2_000;
const MAX_COMPLETED_TOPICS = 2_000;
const MAX_TEXT_LENGTH = 20_000;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function string(value, fallback = "", maxLength = MAX_TEXT_LENGTH) {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function inferSubject(item) {
  if (SUBJECTS.has(item.subject)) return item.subject;
  if (
    item.topicBasePath?.startsWith("/chemistry") ||
    item.topicId?.startsWith("chemistry-")
  ) {
    return "chemistry";
  }
  if (
    item.topicBasePath?.startsWith("/physics") ||
    item.topicId?.startsWith("physics-")
  ) {
    return "physics";
  }
  return "math";
}

function normalizeFigure(value) {
  if (!isObject(value) || typeof value.src !== "string") return null;
  return {
    src: string(value.src, "", 2_000),
    alt: string(value.alt, "题目配图", 1_000),
    caption: string(value.caption, "", 2_000),
  };
}

export function normalizeMistake(value) {
  if (!isObject(value)) return null;
  const exerciseId = string(value.exerciseId, "", 300).trim();
  const topicId = string(value.topicId, "", 300).trim();
  const topicSlug = string(value.topicSlug, "", 300).trim();
  if (!exerciseId || !topicId || !topicSlug) return null;

  const subject = inferSubject(value);
  const defaultBasePath =
    subject === "math" ? "/knowledge" : `/${subject}/knowledge`;
  const lastAttemptAt = validDate(value.lastAttemptAt)
    ? value.lastAttemptAt
    : null;
  const masteredAt = validDate(value.masteredAt) ? value.masteredAt : null;
  const updatedAt = validDate(value.updatedAt)
    ? value.updatedAt
    : masteredAt || lastAttemptAt || new Date(0).toISOString();

  return {
    exerciseId,
    subject,
    topicId,
    topicBasePath: string(value.topicBasePath, defaultBasePath, 300),
    topicSlug,
    topicTitle: string(value.topicTitle, "未命名知识点", 1_000),
    chapter: string(value.chapter, "", 1_000),
    prompt: string(value.prompt, "", MAX_TEXT_LENGTH),
    formula:
      typeof value.formula === "string"
        ? string(value.formula, "", MAX_TEXT_LENGTH)
        : null,
    figure: normalizeFigure(value.figure),
    answer: string(value.answer, "", MAX_TEXT_LENGTH),
    exerciseAnchor: string(value.exerciseAnchor, "examples", 100),
    sourceLabel: string(value.sourceLabel, "练习", 1_000),
    status: STATUSES.has(value.status) ? value.status : "pending",
    errorCount:
      Number.isSafeInteger(value.errorCount) && value.errorCount > 0
        ? value.errorCount
        : 1,
    lastAttemptAt,
    masteredAt,
    updatedAt,
  };
}

export function normalizeMistakes(value, { strict = false } = {}) {
  if (!Array.isArray(value) || value.length > MAX_MISTAKES) return null;
  const normalized = value.map(normalizeMistake);
  if (strict && normalized.some((item) => item === null)) return null;
  return normalized.filter(Boolean);
}

export function normalizeProgress(value) {
  if (!isObject(value) || !Array.isArray(value.completedTopicIds)) return null;
  if (value.completedTopicIds.length > MAX_COMPLETED_TOPICS) return null;
  const completedTopicIds = [
    ...new Set(
      value.completedTopicIds
        .filter((item) => typeof item === "string" && item.length <= 300)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
  if (completedTopicIds.length !== value.completedTopicIds.length) return null;

  return {
    ...value,
    completedTopicIds,
    lastTopicSlug: string(value.lastTopicSlug, "", 300) || undefined,
    updatedAt: validDate(value.updatedAt) ? value.updatedAt : undefined,
  };
}

export function normalizeSyncState(value) {
  if (value === undefined) return { ...EMPTY_SYNC_STATE };
  if (!isObject(value) || !isObject(value.deletedMistakes)) return null;
  const entries = Object.entries(value.deletedMistakes);
  if (entries.length > MAX_MISTAKES) return null;
  const deletedMistakes = {};
  for (const [exerciseId, deletedAt] of entries) {
    if (!exerciseId || exerciseId.length > 300 || !validDate(deletedAt)) {
      return null;
    }
    deletedMistakes[exerciseId] = deletedAt;
  }
  return { deletedMistakes };
}

export function normalizeCourseV3(value, { strict = false } = {}) {
  if (value === undefined) return undefined;
  if (!isObject(value)) return null;

  const visitedKps = Array.isArray(value.visitedKps)
    ? [
        ...new Set(
          value.visitedKps
            .filter((item) => typeof item === "string" && item.length <= 100)
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ]
    : [];

  const evidenceChecks = {};
  if (isObject(value.evidenceChecks)) {
    for (const [key, val] of Object.entries(value.evidenceChecks)) {
      if (typeof key === "string" && key.length <= 150 && Boolean(val)) {
        evidenceChecks[key] = true;
      }
    }
  }

  const attempts = [];
  if (Array.isArray(value.attempts)) {
    for (const att of value.attempts) {
      if (!isObject(att)) {
        if (strict) return null;
        continue;
      }
      const questionId = string(att.questionId, "", 100).trim();
      const kpId = string(att.kpId, "", 100).trim();
      if (!questionId || !kpId) {
        if (strict) return null;
        continue;
      }
      attempts.push({
        id: string(att.id, `att_${Date.now()}_${Math.random()}`, 100),
        questionId,
        part: typeof att.part === "string" ? string(att.part, "", 50) : null,
        kpId,
        chapterId: string(att.chapterId, "", 100),
        userAnswer: string(att.userAnswer, "", 500),
        isCorrect: Boolean(att.isCorrect),
        errorTag: typeof att.errorTag === "string" ? string(att.errorTag, "", 50) : null,
        timestamp: typeof att.timestamp === "number" ? att.timestamp : Date.now(),
        dateString: string(att.dateString, "", 50),
      });
    }
  }

  return {
    version: 3,
    visitedKps,
    evidenceChecks,
    attempts,
    updatedAt: validDate(value.updatedAt) ? value.updatedAt : undefined,
  };
}

export function normalizeStudyPayload(value, { strict = false } = {}) {
  if (!isObject(value) || value.version !== STUDY_PAYLOAD_VERSION) return null;
  const mistakes = normalizeMistakes(value.mistakes, { strict });
  const progress = normalizeProgress(value.progress);
  const syncState = normalizeSyncState(value.syncState);
  if (!mistakes || !progress || !syncState) return null;

  const result = {
    version: STUDY_PAYLOAD_VERSION,
    mistakes,
    progress,
    syncState,
  };

  if (value.courseV3 !== undefined) {
    const courseV3 = normalizeCourseV3(value.courseV3, { strict });
    if (strict && courseV3 === null) return null;
    if (courseV3) {
      result.courseV3 = courseV3;
    }
  }

  return result;
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function mistakeTimestamp(item) {
  return Math.max(
    timestamp(item.updatedAt),
    timestamp(item.masteredAt),
    timestamp(item.lastAttemptAt),
  );
}

export function mergeCourseV3(local, remote) {
  const lV3 = local || { visitedKps: [], evidenceChecks: {}, attempts: [] };
  const rV3 = remote || { visitedKps: [], evidenceChecks: {}, attempts: [] };

  const visitedKps = [
    ...new Set([...(lV3.visitedKps || []), ...(rV3.visitedKps || [])]),
  ];

  const evidenceChecks = {
    ...(lV3.evidenceChecks || {}),
    ...(rV3.evidenceChecks || {}),
  };

  const attemptMap = new Map();
  for (const att of [...(lV3.attempts || []), ...(rV3.attempts || [])]) {
    const key = att.id || `${att.questionId}:${att.part || ""}:${att.timestamp}:${att.userAnswer}`;
    if (!attemptMap.has(key)) {
      attemptMap.set(key, att);
    }
  }
  const attempts = [...attemptMap.values()].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
  );

  const v3UpdatedAt =
    timestamp(lV3.updatedAt) >= timestamp(rV3.updatedAt)
      ? lV3.updatedAt
      : rV3.updatedAt;

  return {
    version: 3,
    visitedKps,
    evidenceChecks,
    attempts,
    updatedAt: v3UpdatedAt || new Date().toISOString(),
  };
}

export function mergeStudyPayloads(localPayload, remotePayload) {
  const local = normalizeStudyPayload(localPayload) || {
    version: STUDY_PAYLOAD_VERSION,
    mistakes: [],
    progress: { ...EMPTY_PROGRESS },
    syncState: { ...EMPTY_SYNC_STATE },
  };
  const remote = normalizeStudyPayload(remotePayload) || {
    version: STUDY_PAYLOAD_VERSION,
    mistakes: [],
    progress: { ...EMPTY_PROGRESS },
    syncState: { ...EMPTY_SYNC_STATE },
  };
  const deletedMistakes = {
    ...remote.syncState.deletedMistakes,
    ...local.syncState.deletedMistakes,
  };
  for (const [exerciseId, deletedAt] of Object.entries(
    remote.syncState.deletedMistakes,
  )) {
    if (timestamp(deletedAt) > timestamp(deletedMistakes[exerciseId])) {
      deletedMistakes[exerciseId] = deletedAt;
    }
  }

  const byId = new Map();
  for (const item of [...remote.mistakes, ...local.mistakes]) {
    const current = byId.get(item.exerciseId);
    if (!current || mistakeTimestamp(item) >= mistakeTimestamp(current)) {
      byId.set(item.exerciseId, item);
    }
  }
  const mistakes = [...byId.values()].filter(
    (item) =>
      mistakeTimestamp(item) > timestamp(deletedMistakes[item.exerciseId]),
  );
  const progressUpdatedAt =
    timestamp(local.progress.updatedAt) >= timestamp(remote.progress.updatedAt)
      ? local.progress
      : remote.progress;

  const result = {
    version: STUDY_PAYLOAD_VERSION,
    mistakes,
    progress: {
      ...progressUpdatedAt,
      completedTopicIds: [
        ...new Set([
          ...remote.progress.completedTopicIds,
          ...local.progress.completedTopicIds,
        ]),
      ],
    },
    syncState: { deletedMistakes },
  };

  // Merge courseV3 if either local or remote has it
  if (local.courseV3 || remote.courseV3) {
    result.courseV3 = mergeCourseV3(local.courseV3, remote.courseV3);
  }

  return result;
}

export function safeFormatStudyDate(value, formatter) {
  if (!validDate(value)) return "暂无记录";
  return formatter.format(new Date(value));
}

// -------------------------------------------------------------
// V3 Physics Local Storage & Record Management (Client-Side)
// -------------------------------------------------------------

export const COURSE_V3_STORAGE_KEY = "study-course-v3";
const courseStores = new Map();
export function courseStorageKey(subject = "physics") {
  if (!["physics", "math", "chemistry"].includes(subject)) throw new Error("不支持的学科");
  return subject === "physics" ? COURSE_V3_STORAGE_KEY : `${COURSE_V3_STORAGE_KEY}-${subject}`;
}
function store(subject) {
  courseStorageKey(subject);
  if (!courseStores.has(subject)) courseStores.set(subject, { memory: null, listeners: new Set() });
  return courseStores.get(subject);
}

function isStorageAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__test_v3__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_) {
    return false;
  }
}

export function createEmptyCourseV3() {
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    visitedKps: [],
    evidenceChecks: {},
    attempts: [],
  };
}

// 存档读不懂时，先把原文另存一份再用空记录，免得下一次保存把孩子的记录覆盖掉
function stashUnreadable(key, raw) {
  try {
    window.localStorage.setItem(`${key}-unreadable-${Date.now()}`, raw);
  } catch (_) {
    // 存不下就算了，至少不影响页面继续用
  }
}

export function loadCourseV3Data(subject = "physics") {
  const state = store(subject);
  if (!isStorageAvailable()) {
    if (!state.memory) state.memory = createEmptyCourseV3();
    return state.memory;
  }

  const key = courseStorageKey(subject);
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (_) {
    return createEmptyCourseV3();
  }
  if (!raw) {
    const fresh = createEmptyCourseV3();
    saveCourseV3Data(fresh, subject);
    return fresh;
  }

  let normalized = null;
  try {
    normalized = normalizeCourseV3(JSON.parse(raw));
  } catch (_) {
    normalized = null;
  }
  if (normalized) return normalized;

  stashUnreadable(key, raw);
  const fresh = createEmptyCourseV3();
  saveCourseV3Data(fresh, subject);
  return fresh;
}

export function saveCourseV3Data(data, subject = "physics") {
  const normalized = normalizeCourseV3(data) || createEmptyCourseV3();
  normalized.updatedAt = new Date().toISOString();

  if (!isStorageAvailable()) {
    store(subject).memory = normalized;
    notifyCourseV3Listeners(subject);
    return false;
  }

  try {
    window.localStorage.setItem(courseStorageKey(subject), JSON.stringify(normalized));
    notifyCourseV3Listeners(subject);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(`${courseStorageKey(subject)}-updated`));
    }
    return true;
  } catch (e) {
    console.error("保存学习记录失败:", e);
    notifyCourseV3Listeners(subject);
    return false;
  }
}

function notifyCourseV3Listeners(subject) {
  const current = loadCourseV3Data(subject);
  store(subject).listeners.forEach((cb) => {
    try {
      cb(current);
    } catch (err) {
      console.error(err);
    }
  });
}

export function subscribeCourseV3(callback, subject = "physics") {
  store(subject).listeners.add(callback);
  return () => store(subject).listeners.delete(callback);
}

export function markKpVisited(kpId, subject = "physics") {
  if (!kpId) return;
  const data = loadCourseV3Data(subject);
  if (!data.visitedKps.includes(kpId)) {
    data.visitedKps.push(kpId);
    saveCourseV3Data(data, subject);
  }
}

export function setEvidenceCheck(kpId, evidenceIndex, isChecked, subject = "physics") {
  const data = loadCourseV3Data(subject);
  const key = `${kpId}:${evidenceIndex}`;
  if (isChecked) {
    data.evidenceChecks[key] = true;
  } else {
    delete data.evidenceChecks[key];
  }
  saveCourseV3Data(data, subject);
}

export function getEvidenceCheck(kpId, evidenceIndex, subject = "physics") {
  const data = loadCourseV3Data(subject);
  return Boolean(data.evidenceChecks[`${kpId}:${evidenceIndex}`]);
}

export function isAllEvidenceChecked(kp, studyData = null) {
  if (!kp || !Array.isArray(kp.evidence) || kp.evidence.length === 0) return true;
  const data = studyData || loadCourseV3Data();
  for (let i = 0; i < kp.evidence.length; i++) {
    if (!data.evidenceChecks[`${kp.id}:${i}`]) return false;
  }
  return true;
}

/**
 * 记录一次作答（防重复计数，修复旧版已知问题 #5）
 */
export function recordAttempt({
  questionId,
  part = null,
  kpId,
  chapterId,
  userAnswer,
  isCorrect,
  errorTag = null,
}, subject = "physics") {
  const data = loadCourseV3Data(subject);
  const now = new Date();

  const previousAttempts = data.attempts.filter(
    (a) => a.questionId === questionId && (a.part || null) === (part || null),
  );
  const lastAttempt =
    previousAttempts.length > 0 ? previousAttempts[previousAttempts.length - 1] : null;

  // 防重复连击判断：同一天里作答、对错、错因完全相同时不重复计数
  // （隔天再做同样的答案要记下来，复习节奏靠它往前走）
  if (
    lastAttempt &&
    new Date(lastAttempt.timestamp).toDateString() === now.toDateString() &&
    lastAttempt.userAnswer === userAnswer &&
    lastAttempt.isCorrect === Boolean(isCorrect) &&
    (lastAttempt.errorTag || null) === (errorTag || null)
  ) {
    return { isDuplicate: true, attempt: lastAttempt };
  }

  const newAttempt = {
    id: `att_${now.getTime()}_${Math.floor(Math.random() * 1000)}`,
    questionId,
    part: part || null,
    kpId,
    chapterId,
    userAnswer: String(userAnswer ?? ""),
    isCorrect: Boolean(isCorrect),
    errorTag: errorTag ? String(errorTag) : null,
    timestamp: now.getTime(),
    dateString: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };

  data.attempts.push(newAttempt);
  saveCourseV3Data(data, subject);
  return { isDuplicate: false, attempt: newAttempt };
}

export function getAttemptsForQuestion(questionId, part = null, subject = "physics") {
  const data = loadCourseV3Data(subject);
  return data.attempts.filter(
    (a) => a.questionId === questionId && (a.part || null) === (part || null),
  );
}

export function getLatestAttempt(questionId, part = null, subject = "physics") {
  const attempts = getAttemptsForQuestion(questionId, part, subject);
  return attempts.length > 0 ? attempts[attempts.length - 1] : null;
}

// 自动判分的选择题（或小问）：返回选项、正确选项和做错时的默认错因；其他题返回 null。
// 小问的字段合并方式同 PhysicsExercisePanel 的 questionForPart。
function choiceTarget(question, part) {
  if (!question) return null;
  const p = part ? (question.parts || []).find((x) => String(x.part) === part) : null;
  if (part && !p) return null;
  const type = p?.type || question.type;
  const grading = p?.grading || question.grading;
  const answer = p ? (p.answer ?? question.answer) : question.answer;
  const options = p?.options || question.options;
  if (type !== "选择" || grading !== "自动" || !answer?.key || !Array.isArray(options)) return null;
  const review = p?.review
    ? (Array.isArray(p.review) ? p.review : Object.entries(p.review).map(([tag]) => ({ tag })))
    : (question.review || []).filter((r) => !part || !r.part || String(r.part) === part);
  return {
    keys: options.map((o) => o.key),
    answerKey: answer.key,
    // 同作答面板：题目没写错因时默认“概念”（ERROR_TAGS 第一个）
    defaultTag: review[0]?.tag || "概念",
  };
}

/**
 * 选择题按题目里现在的答案重判旧记录：讲义改了答案后，错题本、过关进度跟着变。
 * 只动 questionsMap 里有的自动判分选择题；有改动才保存，返回改了几条。
 */
export function regradeChoiceAttempts(questionsMap, subject = "physics") {
  if (!questionsMap) return 0;
  const data = loadCourseV3Data(subject);
  let changed = 0;
  const attempts = data.attempts.map((att) => {
    const target = choiceTarget(questionsMap[att.questionId], att.part);
    if (!target || !target.keys.includes(att.userAnswer)) return att;
    const isCorrect = att.userAnswer === target.answerKey;
    if (isCorrect === att.isCorrect) return att;
    changed += 1;
    return { ...att, isCorrect, errorTag: isCorrect ? null : att.errorTag || target.defaultTag };
  });
  if (changed > 0) saveCourseV3Data({ ...data, attempts }, subject);
  return changed;
}

/**
 * 错题本里对不上题目的记录：题目删掉了或改了编号。按题目编号合并，返回 [{ questionId, kpId, chapterId, count }]。
 */
export function getOrphanMistakes(questionsMap, subject = "physics") {
  if (!questionsMap) return [];
  const byId = new Map();
  for (const m of getActiveMistakes(null, subject)) {
    if (questionsMap[m.questionId]) continue;
    const cur = byId.get(m.questionId) || { questionId: m.questionId, kpId: m.kpId, chapterId: m.chapterId, count: 0 };
    cur.count += 1;
    byId.set(m.questionId, cur);
  }
  return [...byId.values()];
}

/**
 * 判定知识点完成与掌握状态（修复旧版已知问题 #3）
 * 1. 已完成 = 打开过知识点页 + 练一练每题（每个小问）都作答过至少一次
 * 2. 已掌握 = evidence 全部自评“能做到” + 练一练每题（每个小问）最近一次都做对
 * 3. “了解”级知识点没有练一练，读过 + 自评即可判定已掌握；读过即算已完成
 * 4. 其余为“未开始”
 */
export function getKpStatus(kp, questionsMap, studyData = null) {
  if (!kp) return "未开始";
  const data = studyData || loadCourseV3Data();
  const isVisited = data.visitedKps.includes(kp.id);

  // 收集该知识点所属的所有练一练目标（含题目和多小问）
  const kpQuestionTargets = [];
  if (Array.isArray(kp.blocks)) {
    kp.blocks.forEach((b) => {
      if (b.heading === "练一练" && Array.isArray(b.questions)) {
        b.questions.forEach((qRef) => {
          const qId = qRef.id;
          const qObj = questionsMap ? questionsMap[qId] : null;
          const parts = kp.id.startsWith('MATH-') && qObj ? mathQuestionParts(qObj, qRef) : qObj?.parts || [];
          if (parts.length > 0) {
            parts.forEach((p) => {
              kpQuestionTargets.push({ questionId: qId, part: String(p.part) });
            });
          } else {
            kpQuestionTargets.push({ questionId: qId, part: null });
          }
        });
      }
    });
  }

  const allEvidenceDone = isAllEvidenceChecked(kp, data);

  // 针对“了解”级知识点或没有题目的知识点
  if (kpQuestionTargets.length === 0 || kp.weight === "了解") {
    if (!isVisited) return "未开始";
    if (allEvidenceDone) return "已掌握";
    return "已完成";
  }

  // 针对“重点”与“一般”知识点
  if (!isVisited) return "未开始";

  let allAnsweredAtLeastOnce = true;
  let allLatestCorrect = true;

  for (const target of kpQuestionTargets) {
    const attempts = data.attempts.filter(
      (a) =>
        a.questionId === target.questionId &&
        (a.part || null) === (target.part || null),
    );
    if (attempts.length === 0) {
      allAnsweredAtLeastOnce = false;
      allLatestCorrect = false;
      break;
    }
    const latest = attempts[attempts.length - 1];
    if (!latest.isCorrect) {
      allLatestCorrect = false;
    }
  }

  if (allLatestCorrect && allEvidenceDone) {
    return "已掌握";
  }

  if (allAnsweredAtLeastOnce) {
    return "已完成";
  }

  return "未开始";
}

/**
 * 获取物理当前错题列表（最近一次作答为做错的题）
 */
export function getActiveMistakes(questionsMap, subject = "physics") {
  const data = loadCourseV3Data(subject);
  const mistakeMap = new Map();

  for (const att of data.attempts) {
    const key = `${att.questionId}:${att.part || ""}`;
    if (!mistakeMap.has(key)) {
      mistakeMap.set(key, {
        questionId: att.questionId,
        part: att.part || null,
        kpId: att.kpId,
        chapterId: att.chapterId,
        errorCount: 0,
        latestAttempt: null,
      });
    }

    const item = mistakeMap.get(key);
    item.latestAttempt = att;
    if (!att.isCorrect) {
      item.errorCount += 1;
    }
  }

  const activeMistakes = [];
  for (const [, item] of mistakeMap.entries()) {
    if (item.latestAttempt && !item.latestAttempt.isCorrect) {
      const qObj = questionsMap ? questionsMap[item.questionId] : null;
      activeMistakes.push({
        ...item,
        question: qObj,
        errorTag: item.latestAttempt.errorTag || "未指定",
      });
    }
  }

  activeMistakes.sort((a, b) => {
    if (a.kpId !== b.kpId) return a.kpId.localeCompare(b.kpId);
    return (a.errorTag || "").localeCompare(b.errorTag || "");
  });

  return activeMistakes;
}

/**
 * 错题本今天的复习安排（规则见 reviewStates）。questionsMap 给了就挂上题目对象。
 * 返回 { wrong, due, waiting, mastered }，每组是 [{ questionId, part, kpId, chapterId, status, streak, dueDay, errorCount, errorTag, latestAttempt, question }]
 */
export function getReviewQueue(questionsMap, subject = "physics", now = Date.now()) {
  const data = loadCourseV3Data(subject);
  const groups = { wrong: [], due: [], waiting: [], mastered: [] };
  for (const s of reviewStates(data.attempts, now).values()) {
    groups[s.status].push({
      ...s,
      question: questionsMap ? questionsMap[s.questionId] : null,
      errorTag: s.lastWrong?.errorTag || "未指定",
    });
  }
  const byKp = (a, b) => a.kpId.localeCompare(b.kpId) || (a.errorTag || "").localeCompare(b.errorTag || "");
  groups.wrong.sort(byKp);
  groups.due.sort((a, b) => a.dueDay - b.dueDay || byKp(a, b));
  groups.waiting.sort((a, b) => a.dueDay - b.dueDay || byKp(a, b));
  return groups;
}
