// 错题的复习节奏：只看作答记录算出来，不另存状态（备份、合并、重判都自动跟着对）。
// 做错过的题才进来：改对之后隔 1 天、3 天、7 天各考一次，三次都对才算掌握；中途做错从头来。
// 没到复习日就做对的不算数，也不扣分。“哪一天”按本机日历算，不按 24 小时算。

export const REVIEW_GAPS = [1, 3, 7];

const dayStart = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const addDays = (day, n) => {
  const d = new Date(day);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

const keyOf = (a) => `${a.questionId}:${a.part || ""}`;

/**
 * attempts：按时间先后的作答记录；now：当前时间（毫秒）。
 * 返回 Map(key → { questionId, part, kpId, chapterId, status, streak, dueDay, errorCount, lastWrong, latestAttempt })
 * status：wrong 要再练 / due 今天该复习 / waiting 等几天再考 / mastered 已掌握
 * streak：改对之后按时复习做对了几次（0~3）；dueDay：下次复习那天的 0 点（毫秒），wrong、mastered 时为 null
 */
export function reviewStates(attempts, now = Date.now()) {
  const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
  const states = new Map();
  for (const att of sorted) {
    const key = keyOf(att);
    let s = states.get(key);
    if (!s) {
      if (att.isCorrect) continue; // 第一次就做对的题不进错题本
      s = { questionId: att.questionId, part: att.part || null, kpId: att.kpId, chapterId: att.chapterId, errorCount: 0 };
      states.set(key, s);
    }
    s.kpId = att.kpId;
    s.chapterId = att.chapterId;
    s.latestAttempt = att;
    if (!att.isCorrect) {
      s.status = "wrong";
      s.streak = 0;
      s.dueDay = null;
      s.errorCount += 1;
      s.lastWrong = att;
      continue;
    }
    const day = dayStart(att.timestamp);
    if (s.status === "wrong") {
      s.status = "waiting";
      s.dueDay = addDays(day, REVIEW_GAPS[0]);
    } else if (s.status === "waiting" && day >= s.dueDay) {
      s.streak += 1;
      if (s.streak >= REVIEW_GAPS.length) {
        s.status = "mastered";
        s.dueDay = null;
      } else {
        s.dueDay = addDays(day, REVIEW_GAPS[s.streak]);
      }
    }
  }
  const today = dayStart(now);
  for (const s of states.values()) {
    if (s.status === "waiting" && s.dueDay <= today) s.status = "due";
  }
  return states;
}
