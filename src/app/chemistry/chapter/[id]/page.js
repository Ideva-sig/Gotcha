import CourseChapterPage from "@/app/physics/chapter/[id]/page";
import { getAvailablePhysicsChapters, getPhysicsChapter } from "@/lib/courseV3";
export const dynamicParams = false;
export function generateStaticParams() { return getAvailablePhysicsChapters("chemistry").map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${getPhysicsChapter(id, "chemistry")?.title || "单元未找到"} · 初中化学` };
}
export default function ChemistryChapterPage({ params }) { return <CourseChapterPage params={params} subject="chemistry" />; }
