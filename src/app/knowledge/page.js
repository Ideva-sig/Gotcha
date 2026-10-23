import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "旧版页面已搬家" };

export default function OldKnowledgePage() {
  return (
    <ComingSoon
      heading="页面搬家了"
      tag="已搬家"
      tone="blue"
      actions={[
        { href: "/math/", label: "去数学首页", primary: true },
        { href: "/physics/", label: "去物理首页" },
      ]}
    >
      这个旧版页面已经不用了，新版内容在数学和物理里。
    </ComingSoon>
  );
}
