import CourseKpPage from "@/app/physics/kp/[id]/page";
import { getAllPhysicsKps, getPhysicsKp } from "@/lib/courseV3";
import { plainMathTitle } from "@/lib/plainMathTitle.mjs";
export const dynamicParams = false;
export function generateStaticParams() { return getAllPhysicsKps("math").map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${plainMathTitle(getPhysicsKp(id, "math")?.kp.title || "知识点未找到")} · 初中数学` };
}
export default function MathKpPage({ params }) { return <CourseKpPage params={params} subject="math" />; }
