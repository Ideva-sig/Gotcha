import { notFound } from "next/navigation";
import { getAllPhysicsKps, getPhysicsAvatars, getPhysicsIndex, getPhysicsKp } from "@/lib/courseV3";
import { plainMathTitle } from "@/lib/plainMathTitle.mjs";
import { KpView } from "./KpView";

export const dynamicParams = false;

export function generateStaticParams() {
  const allKps = getAllPhysicsKps();
  return allKps.map((k) => ({ id: k.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = getPhysicsKp(id);
  if (!result) return { title: "知识点未找到" };
  const { kp, chapter } = result;
  const title = plainMathTitle(kp.title);
  return {
    title: `${kp.code} ${title} · ${chapter.title} · 初中物理`,
    description: `初中物理 ${chapter.title} - ${title}：核心概念、公式、图示与中考考点习题。`,
  };
}

function shortCode(kpId) {
  const parts = kpId.split("-");
  return `${Number(parts[parts.length - 2])}-${parts[parts.length - 1]}`;
}

// 重点知识点：取“先认住”里第一条独立公式放在页头
function signatureFormula(kp) {
  if (kp.weight !== "重点") return null;
  const block = (kp.blocks || []).find((b) => b.heading === "先认住");
  for (const item of block?.body || []) {
    if (item.type !== "md") continue;
    const m = item.text.match(/\$\$([\s\S]+?)\$\$/);
    if (m) return m[1].trim();
  }
  return null;
}

export default async function PhysicsKpPage({ params, subject = "physics" }) {
  const { id } = await params;
  const result = getPhysicsKp(id, subject);
  if (!result) notFound();

  const { kp, chapter, prevKp, nextKp, questionsMap } = result;
  const index = getPhysicsIndex(subject);
  const entry = index.kps[kp.id] || {};

  const usedBy = (entry.used_by || []).map((u) => {
    const target = index.kps[u.id] || {};
    return {
      id: u.id,
      code: shortCode(u.id),
      title: target.title || u.id,
      available: Boolean(target.available),
      strength: u.strength,
      reason: u.reason || "",
    };
  });

  return (
    <KpView
      chapter={chapter}
      examHits={entry.exam_hits ?? 0}
      formula={signatureFormula(kp)}
      kp={kp}
      lines={index.fun_lines?.kps?.[kp.id] || []}
      masteredLines={index.fun_lines?.mastered || []}
      avatars={getPhysicsAvatars(subject)}
      nextKp={nextKp}
      prevKp={prevKp}
      questionsMap={questionsMap}
      usedBy={usedBy}
    />
  );
}
