import CourseChapterPage from "@/app/physics/chapter/[id]/page";
import { getAvailablePhysicsChapters, getPhysicsChapter } from "@/lib/courseV3";
import { plainMathTitle } from "@/lib/plainMathTitle.mjs";
export const dynamicParams = false;
export function generateStaticParams() { return getAvailablePhysicsChapters("math").map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${plainMathTitle(getPhysicsChapter(id, "math")?.title || "章节未找到")} · 初中数学` };
}
export default function MathChapterPage({ params }) { return <CourseChapterPage params={params} subject="math" />; }
