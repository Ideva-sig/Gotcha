import { FormulaHandbook } from "@/components/FormulaHandbook";

export const metadata = {
  title: "化学公式速查",
  description: "按九上七个单元整理化学用语、方程式、计算和实验结论，做题时随手查，也能打印。",
};

const SECTION_LINKS = [
  { id: "language", label: "化学用语与化合价", tone: "blue" },
  { id: "structure", label: "物质构成与周期表", tone: "purple" },
  { id: "reaction", label: "反应与方程式", tone: "red" },
  { id: "calc", label: "计算", tone: "yellow" },
  { id: "gas", label: "气体制取与检验", tone: "teal" },
  { id: "property", label: "性质与现象", tone: "leaf" },
  { id: "pitfalls", label: "易错与避坑", tone: "pink" },
];

export default function ChemistryFormulasPage() {
  return <FormulaHandbook subject="chemistry" sectionLinks={SECTION_LINKS} />;
}
