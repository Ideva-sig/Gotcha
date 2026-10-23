import { PhysicsHome } from "@/components/PhysicsHome";
import {
  getAllPhysicsKps,
  getAllPhysicsQuestions,
  getPhysicsIndex,
} from "@/lib/courseV3";

export const metadata = {
  title: "初中物理",
  description: "中考物理复习：讲解、动态示意图、练习与错题本。",
};

export default function PhysicsHomePage({ subject = "physics" }) {
  const index = getPhysicsIndex(subject);

  const chapters = index.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    book: ch.book,
    available: Boolean(ch.available),
    kpIds: ch.kp_ids || [],
    examHits: ch.exam_hits || 0,
  }));

  const kpIndex = {};
  for (const [id, kp] of Object.entries(index.kps)) {
    kpIndex[id] = {
      title: kp.title,
      weight: kp.weight,
      chapter: kp.chapter,
      sectionTitle: kp.section_title,
      examHits: kp.exam_hits || 0,
      available: Boolean(kp.available),
    };
  }

  return (
    <main className="page-main">
      <div className="page-container">
        <PhysicsHome
          availableKps={getAllPhysicsKps(subject)}
          chapters={chapters}
          kpIndex={kpIndex}
          questionsMap={getAllPhysicsQuestions(subject)}
        />
      </div>
    </main>
  );
}
