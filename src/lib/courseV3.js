import fs from 'node:fs';
import path from 'node:path';
import { packPath } from './contentPack.mjs';

const root = process.cwd();
const dataDir = (subject) => packPath(subject);
const cachedIndexes = new Map();
const cachedChapters = new Map();

export * from "./courseV3Client";

/**
 * 获取物理全科目录索引（index.json）
 */
export function getPhysicsIndex(subject = 'physics') {
  if (cachedIndexes.has(subject)) return cachedIndexes.get(subject);
  const filePath = path.join(dataDir(subject), 'index.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到课程索引文件: ${filePath}，请先运行 npm run build:course`);
  }
  const index = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  cachedIndexes.set(subject, index);
  return index;
}

/**
 * 获取全部 22 章
 */
export function getPhysicsChapters(subject = 'physics') {
  const index = getPhysicsIndex(subject);
  return index.chapters || [];
}

/**
 * 获取已开放编写的章节（如 PHY-9-13, PHY-9-14）
 */
export function getAvailablePhysicsChapters(subject = 'physics') {
  const chapters = getPhysicsChapters(subject);
  return chapters.filter((c) => Boolean(c.available));
}

/**
 * 获取单章完整内容
 */
export function getPhysicsChapter(chapterId, subject = 'physics') {
  const key = `${subject}:${chapterId}`;
  if (cachedChapters.has(key)) {
    return cachedChapters.get(key);
  }
  const filePath = path.join(dataDir(subject), `chapters/${chapterId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  cachedChapters.set(key, data);
  return data;
}

/**
 * 获取所有已开放章节的知识点扁平列表（用于静态路由 generateStaticParams 等）
 */
export function getAllPhysicsKps(subject = 'physics') {
  const chapters = getAvailablePhysicsChapters(subject);
  const allKps = [];

  for (const chInfo of chapters) {
    const chapterData = getPhysicsChapter(chInfo.id, subject);
    if (!chapterData || !Array.isArray(chapterData.kps)) continue;

    for (const kp of chapterData.kps) {
      allKps.push({
        ...kp,
        chapterId: chapterData.id,
        chapterTitle: chapterData.title,
        chapterPdf: chapterData.pdf,
        code: kp.id.replace(/^(?:MATH|CHEM)-[^-]+-/, '').replace(/^PHY-9-/, '').replace(/^PHY-/, ''),
      });
    }
  }

  return allKps;
}

/**
 * 获取单个知识点详情及前后导航
 */
export function getPhysicsKp(kpId, subject = 'physics') {
  const chapters = getAvailablePhysicsChapters(subject);

  for (const chInfo of chapters) {
    const chapterData = getPhysicsChapter(chInfo.id, subject);
    if (!chapterData || !Array.isArray(chapterData.kps)) continue;

    const idx = chapterData.kps.findIndex((k) => k.id === kpId);
    if (idx !== -1) {
      const kp = chapterData.kps[idx];
      const prevKp = idx > 0 ? chapterData.kps[idx - 1] : null;
      const nextKp = idx < chapterData.kps.length - 1 ? chapterData.kps[idx + 1] : null;

      return {
        kp: {
          ...kp,
          code: kp.id.replace(/^(?:MATH|CHEM)-[^-]+-/, '').replace(/^PHY-9-/, '').replace(/^PHY-/, ''),
        },
        chapter: chapterData,
        prevKp: prevKp ? { ...prevKp, code: prevKp.id.replace(/^(?:MATH|CHEM)-[^-]+-/, '').replace(/^PHY-9-/, '').replace(/^PHY-/, '') } : null,
        nextKp: nextKp ? { ...nextKp, code: nextKp.id.replace(/^(?:MATH|CHEM)-[^-]+-/, '').replace(/^PHY-9-/, '').replace(/^PHY-/, '') } : null,
        questionsMap: chapterData.questions || {},
      };
    }
  }

  return null;
}

/**
 * 获取所有已开放章节的题目字典
 */
export function getAllPhysicsQuestions(subject = 'physics') {
  const chapters = getAvailablePhysicsChapters(subject);
  const map = {};

  for (const chInfo of chapters) {
    const chapterData = getPhysicsChapter(chInfo.id, subject);
    if (chapterData && chapterData.questions) {
      Object.assign(map, chapterData.questions);
    }
  }

  return map;
}

/**
 * 角色头像：只返回 public/avatars 里真有图片的（没有图的角色显示名字第一个字）
 */
export function getPhysicsAvatars(subject = 'physics') {
  const map = getPhysicsIndex(subject).fun_lines?.avatars || {};
  const result = {};
  for (const [who, slug] of Object.entries(map)) {
    if (fs.existsSync(path.join(root, 'public/avatars', `${slug}.png`))) result[who] = slug;
  }
  return result;
}

/**
 * 前置知识点图（构建时用）：只收已开放的知识点。
 * 返回 { [kpId]: { title, chapter, prerequisites: [{id, strength}], questions: [{id, note}], evidence: [文字] } }
 * questions 取自该知识点所在章“练一练”块里的题，顺序照原样。
 */
export function getPrereqGraph(subject = 'physics') {
  const index = getPhysicsIndex(subject);
  const graph = {};
  for (const [id, kp] of Object.entries(index.kps || {})) {
    if (!kp.available) continue;
    const chapter = getPhysicsChapter(kp.chapter, subject);
    const full = (chapter?.kps || []).find((k) => k.id === id);
    const questions = [];
    for (const block of full?.blocks || []) {
      if (block.heading !== '练一练') continue;
      for (const q of block.questions || []) questions.push({ id: q.id, note: q.note || '' });
    }
    graph[id] = {
      title: kp.title,
      chapter: kp.chapter,
      prerequisites: (kp.prerequisites || []).map((p) => ({ id: p.id, strength: p.strength })),
      questions,
      evidence: full?.evidence || [],
    };
  }
  return graph;
}
