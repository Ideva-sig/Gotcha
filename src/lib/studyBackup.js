// 统一备份：一份文件装下所有科目的学习记录。
// 浏览器里每科仍各存各的；这里只负责把它们打包成一份、再按科目合并回去。
import {
  loadCourseV3Data,
  mergeCourseV3,
  mergeStudyPayloads,
  normalizeCourseV3,
  normalizeMistakes,
  normalizeProgress,
  normalizeSyncState,
  courseStorageKey,
  saveCourseV3Data,
} from "./studyData.js";

export const BACKUP_FORMAT = "junior-high-study-backup";
export const BACKUP_VERSION = 2;
export const BACKUP_SUBJECTS = ["math", "physics", "chemistry"];

// 物理页最早（v1）留下的三份记录，仍随物理一起备份
const MISTAKES_V1_KEY = "study-mistakes-v1";
const PROGRESS_V1_KEY = "study-progress-v1";
const SYNC_STATE_V1_KEY = "study-sync-state-v1";

const ID_PREFIX = { math: { kp: "MATH-", question: "Q-MATH-" }, physics: { kp: "PHY-", question: "Q-PHY-" }, chemistry: { kp: "CHEM-", question: "Q-CHEM-" } };

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch (_) {
    return fallback;
  }
}

export function buildBackup() {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    subjects: {
      math: { courseV3: loadCourseV3Data("math") },
      chemistry: { courseV3: loadCourseV3Data("chemistry") },
      physics: {
        courseV3: loadCourseV3Data("physics"),
        mistakes: readJson(MISTAKES_V1_KEY, []),
        progress: readJson(PROGRESS_V1_KEY, { completedTopicIds: [] }),
        syncState: readJson(SYNC_STATE_V1_KEY, { deletedMistakes: {} }),
      },
    },
  };
}

// 旧备份（只含一科）整理成新格式；新备份原样返回
function toSubjects(backup) {
  if (!backup || backup.format !== BACKUP_FORMAT) throw new Error("不是备份文件");
  if (backup.version === BACKUP_VERSION) {
    if (!backup.subjects || typeof backup.subjects !== "object") throw new Error("备份内容缺失");
    return backup.subjects;
  }
  if (backup.version === 1) {
    if (backup.subject === "math") return { math: { courseV3: backup.courseV3 } };
    return {
      physics: {
        courseV3: backup.courseV3,
        mistakes: backup.mistakes,
        progress: backup.progress,
        syncState: backup.syncState,
      },
    };
  }
  throw new Error("备份版本不认识");
}

function checkSubjectIds(subject, data) {
  const { kp, question } = ID_PREFIX[subject];
  if (data.visitedKps.some((id) => !id.startsWith(kp))) throw new Error("记录和科目不符");
  if (data.attempts.some((a) => !a.questionId.startsWith(question))) throw new Error("记录和科目不符");
}

/**
 * 把备份合并进本机记录（不会覆盖本机已有的记录）。
 * 先全部检查通过，再一起写入；任何一科有问题就整份不导入。
 * 返回实际导入的科目列表。
 */
export function restoreBackup(backup) {
  const subjects = toSubjects(backup);
  const plan = [];
  for (const subject of BACKUP_SUBJECTS) {
    const part = subjects[subject];
    if (!part) continue;
    let remote = null;
    if (part.courseV3 !== undefined) {
      remote = normalizeCourseV3(part.courseV3, { strict: true });
      if (!remote) throw new Error("无效记录");
      checkSubjectIds(subject, remote);
    }
    const item = { subject, courseV3: remote };
    if (subject === "physics" && (part.mistakes || part.progress || part.syncState)) {
      // v1 的旧记录只是顺带保存：哪一份读不懂就跳过那一份，不影响整份备份
      item.v1 = {
        version: 1,
        mistakes: normalizeMistakes(part.mistakes ?? []) ?? [],
        progress: normalizeProgress(part.progress ?? {}) ?? { completedTopicIds: [] },
        syncState: normalizeSyncState(part.syncState ?? {}) ?? { deletedMistakes: {} },
      };
    }
    plan.push(item);
  }
  if (!plan.length) throw new Error("备份里没有可恢复的科目");

  // 写入阶段：先记下原来的内容，任何一步失败就全部还原，不留“只恢复了一半”
  const keys = [...(plan.some((p) => p.v1) ? [MISTAKES_V1_KEY, PROGRESS_V1_KEY, SYNC_STATE_V1_KEY] : []), ...plan.map((p) => courseStorageKey(p.subject))];
  const before = new Map();
  try {
    for (const k of keys) before.set(k, localStorage.getItem(k));
  } catch (_) {
    throw new Error("读不了本机记录");
  }
  try {
    for (const { subject, courseV3, v1 } of plan) {
      if (v1) {
        const merged = mergeStudyPayloads(
          {
            version: 1,
            mistakes: readJson(MISTAKES_V1_KEY, []),
            progress: readJson(PROGRESS_V1_KEY, { completedTopicIds: [] }),
            syncState: readJson(SYNC_STATE_V1_KEY, { deletedMistakes: {} }),
          },
          v1,
        );
        localStorage.setItem(MISTAKES_V1_KEY, JSON.stringify(merged.mistakes));
        localStorage.setItem(PROGRESS_V1_KEY, JSON.stringify(merged.progress));
        localStorage.setItem(SYNC_STATE_V1_KEY, JSON.stringify(merged.syncState));
      }
      // 即使只有 v1 记录，也保存一次学习记录，让页面刷新；保存失败会返回 false
      if (!saveCourseV3Data(mergeCourseV3(loadCourseV3Data(subject), courseV3), subject)) {
        throw new Error("保存失败");
      }
    }
  } catch (err) {
    let rolledBack = true;
    for (const [k, v] of before) {
      try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      } catch (_) {
        rolledBack = false;
      }
    }
    const failure = new Error(rolledBack ? "写入失败，已还原" : "写入失败，可能只恢复了一部分");
    failure.partial = !rolledBack;
    throw failure;
  }
  return plan.map((p) => p.subject);
}
