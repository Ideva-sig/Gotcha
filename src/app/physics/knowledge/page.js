import { Redirect } from "@/components/Redirect";

export const metadata = { title: "页面搬家了" };

export default function PhysicsKnowledgePage() {
  return <Redirect to="/physics/">知识卡片已并入物理首页，正在带你过去。</Redirect>;
}
