import { FormulaHandbook } from "@/components/FormulaHandbook";

export const metadata = {
  title: "数学公式速查",
  description: "按板块整理中考常用公式、结论和易错点，做题时随手查，也能打印。",
};

const SECTION_LINKS = [
  { id: "number-expr", label: "数与式", tone: "blue" },
  { id: "equation", label: "方程与不等式", tone: "yellow" },
  { id: "function", label: "函数", tone: "red" },
  { id: "geometry", label: "图形的性质", tone: "purple" },
  { id: "measure", label: "图形的度量", tone: "teal" },
  { id: "stats", label: "数据的统计", tone: "leaf" },
  { id: "pitfalls", label: "易错与避坑", tone: "pink" },
];

export default function MathFormulasPage() {
  return <FormulaHandbook subject="math" sectionLinks={SECTION_LINKS} />;
}
