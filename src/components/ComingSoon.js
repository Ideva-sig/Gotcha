import Link from "next/link";
import { Card, Tag, Title } from "./island/Island";

// “建设中 / 已搬家”占位页：虚线空状态卡片 + 一句话 + 返回按钮
export function ComingSoon({
  heading = "建设中",
  tag = "建设中",
  tone = "brown",
  children = "这部分内容还在建设中，先去别的地方逛逛吧。",
  actions = [{ href: "/", label: "回到首页", primary: true }],
}) {
  return (
    <main className="page-main">
      <div className="page-container">
        <Title tone={tone}>{heading}</Title>
        <Card variant="dashed" tone={tone} style={{ marginTop: 24, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px" }}>
            <Tag tone={tone} variant="solid" size="md">{tag}</Tag>
          </p>
          <p style={{ margin: "0 0 20px" }}>{children}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {actions.map((a) => (
              <Link
                className={`island-btn${a.primary ? " island-btn--teal" : ""}`}
                href={a.href}
                key={a.href}
              >
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
