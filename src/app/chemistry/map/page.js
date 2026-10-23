import { KnowledgeMap } from "@/components/KnowledgeMap";
import { Title } from "@/components/island/Island";
import { getPhysicsIndex } from "@/lib/courseV3";

export const metadata = {
  title: "化学知识地图",
  description: "化学知识点之间谁要先学、谁通向谁，一张图看清。",
};

export default function ChemistryMapPage() {
  const index = getPhysicsIndex("chemistry");
  const chapters = index.chapters.map((c) => ({ id: c.id, title: c.title, book: c.book, kpIds: c.kp_ids || [] }));
  const kps = {};
  for (const [id, kp] of Object.entries(index.kps)) {
    kps[id] = {
      title: kp.title,
      chapter: kp.chapter,
      weight: kp.weight,
      available: Boolean(kp.available),
      prerequisites: (kp.prerequisites || []).map((p) => ({ id: p.id, strength: p.strength })),
    };
  }
  return (
    <main className="page-main">
      <div className="page-container">
        <header style={{ marginBottom: 18 }}>
          <Title as="h1" tone="green">化学知识地图</Title>
        </header>
        <KnowledgeMap chapters={chapters} kps={kps} />
      </div>
    </main>
  );
}
