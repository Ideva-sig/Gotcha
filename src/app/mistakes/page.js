import { getAllPhysicsQuestions, getPhysicsAvatars, getPhysicsIndex, getPrereqGraph } from "@/lib/courseV3";
import { UnifiedMistakes } from "./UnifiedMistakes";

export const metadata = {
  title: "错题本",
  description: "数学、物理、化学的错题本放在一起，按科目分标签页，一份备份装下所有科目。",
};

function subjectProps(subject) {
  const index = getPhysicsIndex(subject);
  const kpTitles = {};
  for (const [id, kp] of Object.entries(index.kps)) kpTitles[id] = kp.title;
  return {
    avatars: getPhysicsAvatars(subject),
    kpTitles,
    lines: index.fun_lines?.mistakes || {},
    questionsMap: getAllPhysicsQuestions(subject),
    // 只有数学有“往前找找”
    ...(subject === "math" ? { prereqGraph: getPrereqGraph("math") } : {}),
  };
}

export default function MistakesPage() {
  return <UnifiedMistakes subjects={{ math: subjectProps("math"), physics: subjectProps("physics"), chemistry: subjectProps("chemistry") }} />;
}
