import { HomeView } from "@/components/HomeView";
import { getPhysicsIndex } from "@/lib/courseV3";
import { plainMathTitle } from "@/lib/plainMathTitle.mjs";

export const metadata = {
  title: "Gotcha 中考复习",
  description: "初中中考复习：数学、物理、化学的讲解、练习、错题本和站内搜索。",
};

// 每科的外观和快捷入口；章节、知识点数量从课程数据里数，不写死
const SUBJECTS = [
  {
    key: "math", href: "/math/", title: "数学", icon: "compass", tone: "teal",
    text: "七年级到九年级上册，代数、几何、函数与统计。",
    tools: [
      { href: "/math/thinking/", label: "思维提升" },
      { href: "/math/map/", label: "知识地图" },
      { href: "/math/formulas/", label: "公式速查" },
    ],
  },
  {
    key: "physics", href: "/physics/", title: "物理", icon: "magnet", tone: "blue",
    text: "八年级上下册和九年级全册，力热光电声。",
    tools: [
      { href: "/physics/thinking/", label: "思维提升" },
      { href: "/physics/map/", label: "知识地图" },
      { href: "/physics/formulas/", label: "公式速查" },
    ],
  },
  {
    key: "chemistry", href: "/chemistry/", title: "化学", icon: "water-cup", tone: "brown",
    text: "九年级上册七个单元，从物质构成到化学反应。",
    tools: [
      { href: "/chemistry/thinking/", label: "思维提升" },
      { href: "/chemistry/map/", label: "知识地图" },
      { href: "/chemistry/formulas/", label: "公式速查" },
      { href: "/chemistry/periodic/", label: "元素周期表" },
    ],
  },
];

// 常搜词：都确认过在索引里搜得到
const HOT_QUERIES = ["密度", "二次函数", "化学方程式", "欧姆定律", "勾股定理", "化合价"];

function summarize(subject) {
  const index = getPhysicsIndex(subject.key);
  const chapters = index.chapters.filter((ch) => ch.available);
  const kps = chapters.flatMap((ch) =>
    (ch.kp_ids || [])
      .filter((id) => index.kps[id]?.available)
      .map((id) => ({ id, title: plainMathTitle(index.kps[id].title) })),
  );
  return { ...subject, chapterCount: chapters.length, kps };
}

export default function HomePage() {
  return <HomeView hotQueries={HOT_QUERIES} subjects={SUBJECTS.map(summarize)} />;
}
