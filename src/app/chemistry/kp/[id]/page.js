import CourseKpPage from "@/app/physics/kp/[id]/page";
import { getAllPhysicsKps, getPhysicsKp } from "@/lib/courseV3";
export const dynamicParams = false;
export function generateStaticParams() { return getAllPhysicsKps("chemistry").map(({ id }) => ({ id })); }
export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `${getPhysicsKp(id, "chemistry")?.kp.title || "知识点未找到"} · 初中化学` };
}
export default function ChemistryKpPage({ params }) { return <CourseKpPage params={params} subject="chemistry" />; }
