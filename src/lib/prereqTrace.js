// 错题“往前找找哪一步没跟上”的纯函数模型。
// 不碰浏览器、不碰 localStorage；所有函数都不改入参对象，返回新对象。

export const TRACE_CAP = 6;

// 某个知识点的前置 id 列表：hard 在前、soft 在后，同等强度保持图里的顺序
function prereqIds(graph, kpId) {
  const list = graph[kpId]?.prerequisites || [];
  const hard = list.filter((p) => p.strength !== 'soft');
  const soft = list.filter((p) => p.strength === 'soft');
  return [...hard, ...soft].map((p) => p.id).filter((id) => graph[id]);
}

// graph：getPrereqGraph 的结果；startKp：错题的知识点；reviewTarget：题目“前置”复习指向的知识点（可空）
export function startTrace(graph, startKp, { reviewTarget = null, cap = TRACE_CAP } = {}) {
  const queue = [];
  if (reviewTarget && reviewTarget !== startKp && graph[reviewTarget]) queue.push(reviewTarget);
  for (const id of prereqIds(graph, startKp)) if (!queue.includes(id)) queue.push(id);
  return {
    graph,
    startKp,
    queue,                       // 待查（先进先出，一层一层往前）
    seen: [startKp, ...queue],   // 已排过队或问过的，不再排
    asked: [],                   // [{ kp, verdict }]，按查的顺序
    limit: cap,                  // 本轮累计可查的个数
  };
}

// 下一个要查的知识点；没有了或到了本轮上限返回 null
export function nextKp(state) {
  if (state.asked.length >= state.limit) return null;
  return state.queue.length ? state.queue[0] : null;
}

// verdict: "right" | "wrong" | "dunno"。只有队列里的点才算数，否则原样返回
export function answerKp(state, kpId, verdict) {
  if (!state.queue.includes(kpId)) return state;
  const queue = state.queue.filter((id) => id !== kpId);
  const seen = [...state.seen];
  if (verdict !== 'right') {
    for (const id of prereqIds(state.graph, kpId)) {
      if (!seen.includes(id)) {
        seen.push(id);
        queue.push(id);
      }
    }
  }
  return { ...state, queue, seen, asked: [...state.asked, { kp: kpId, verdict }] };
}

// “接着往前查”：本轮上限再加 cap
export function extendTrace(state, cap = TRACE_CAP) {
  return { ...state, limit: state.limit + cap };
}

// 还有待查的点，但本轮已查满
export function canExtend(state) {
  return state.asked.length >= state.limit && state.queue.length > 0;
}

// 层数：没有前置为 0，否则 1 + 前置里最深的（越深越靠近小学基础）
function depthOf(graph, id, memo) {
  if (memo.has(id)) return memo.get(id);
  memo.set(id, 0); // 防环
  let d = 0;
  for (const p of graph[id]?.prerequisites || []) if (graph[p.id]) d = Math.max(d, 1 + depthOf(graph, p.id, memo));
  memo.set(id, d);
  return d;
}

// kpId 的全部祖先（含间接前置）
function ancestorsOf(graph, kpId) {
  const out = new Set();
  const stack = [kpId];
  while (stack.length) {
    const cur = stack.pop();
    for (const p of graph[cur]?.prerequisites || []) {
      if (graph[p.id] && !out.has(p.id)) {
        out.add(p.id);
        stack.push(p.id);
      }
    }
  }
  return out;
}

// 结果路线：没跟上的点（+ 错题本身的知识点）按“先学的在前”排好
export function traceResult(state) {
  const { graph, startKp } = state;
  const weakRaw = [];
  for (const a of state.asked) if (a.verdict !== 'right' && a.kp !== startKp && !weakRaw.includes(a.kp)) weakRaw.push(a.kp);

  // 拓扑排序（Kahn）：一个点必须等它在 weakRaw 里的全部祖先（含经过别的点的间接前置）排完才能出；
  // 同时可出的点里，层数浅的（更基础）在前，再相同按查的顺序
  const memo = new Map();
  const anc = new Map(weakRaw.map((id) => [id, ancestorsOf(graph, id)]));
  const remaining = [...weakRaw];
  const weak = [];
  while (remaining.length) {
    const ready = remaining.filter((id) => !remaining.some((o) => o !== id && anc.get(id).has(o)));
    const pool = ready.length ? ready : remaining; // 图里有环时兜底，不会死循环
    let best = pool[0];
    for (const id of pool) if (depthOf(graph, id, memo) < depthOf(graph, best, memo)) best = id;
    weak.push(best);
    remaining.splice(remaining.indexOf(best), 1);
  }

  return {
    path: [...weak, startKp],           // 错题本身的知识点永远排最后
    weak,
    reachedStart: state.queue.length === 0, // 前面该查的都查完了
    beyondJuniorHigh: weak.length > 0 && (graph[weak[0]]?.prerequisites || []).length === 0,
    checked: state.asked.length,
  };
}

// 这个知识点用什么来查：有题取第一道题（含第一问），没题给自查几条
// partsOf(q, qRef) 由调用方传入（界面里传 mathQuestionParts）
export function pickCheck(graph, kpId, questionsMap, partsOf) {
  const kp = graph[kpId];
  const qRef = kp?.questions?.[0];
  const q = qRef ? questionsMap?.[qRef.id] : null;
  if (qRef && q) {
    const parts = typeof partsOf === 'function' ? partsOf(q, qRef) : [];
    const first = parts && parts.length ? parts[0] : null;
    const part = first == null ? null : String(typeof first === 'object' ? first.part : first);
    return { kind: 'question', qRef, part };
  }
  return { kind: 'evidence', items: [...(kp?.evidence || [])] };
}
