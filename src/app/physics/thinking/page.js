import { ThinkingPage } from "@/components/ThinkingPage";

export const metadata = {
  title: "思维提升",
  description: "遇到物理题，先把现象想成图，再把图写成式子。",
};

export default function PhysicsThinkingPage() {
  return <ThinkingPage subject="physics" />;
}
