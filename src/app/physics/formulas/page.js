import { FormulaHandbook } from "@/components/FormulaHandbook";

export const metadata = {
  title: "物理公式速查",
  description: "按章节整理中考常用公式、物理量和单位，做题时随手查。",
};

const SECTION_LINKS = [
  { id: "mechanics", label: "力学", tone: "blue" },
  { id: "heat", label: "热学", tone: "red" },
  { id: "electricity", label: "电学", tone: "yellow" },
  { id: "sound-light", label: "声光", tone: "purple" },
  { id: "constants", label: "常量", tone: "teal" },
  { id: "units", label: "单位", tone: "leaf" },
  { id: "conditions", label: "隐含条件", tone: "pink" },
];

export default function PhysicsFormulasPage() {
  return <FormulaHandbook subject="physics" sectionLinks={SECTION_LINKS} />;
}
