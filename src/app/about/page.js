import Link from "next/link";
import { Card, Title } from "@/components/island/Island";

export const metadata = { title: "关于与版权" };

const paragraph = { margin: "0 0 12px", lineHeight: 1.8 };
const list = { margin: "0 0 12px", paddingLeft: 22, lineHeight: 1.8 };

export default function AboutPage() {
  return (
    <main className="page-main">
      <div className="page-container">
        <Title as="h1" tone="green">关于与版权</Title>

        <section style={{ marginTop: 28 }}>
          <Title as="h2" tone="blue" variant="layer">这是什么</Title>
          <Card style={{ marginTop: 16, padding: "20px 24px" }}>
            <p style={paragraph}>
              Gotcha 是给初中生准备中考复习的学习网站，覆盖物理、化学、数学。学习记录只保存在使用者自己的浏览器里，不上传。
            </p>
            <p style={{ ...paragraph, marginBottom: 0 }}>
              本站供学习参考，不得商用。
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 28 }}>
          <Title as="h2" tone="blue" variant="layer">许可说明</Title>
          <Card style={{ marginTop: 16, padding: "20px 24px" }}>
            <ul style={list}>
              <li>网站代码：AGPL-3.0。</li>
              <li>本项目编写的讲义文字和示意图（SVG）：CC BY-NC-SA 4.0，署名、非商业使用、相同方式共享。</li>
              <li>元素周期表图示版：原作者 Keith Enevoldsen，按 CC BY-SA 4.0 单独声明，不并入上面的非商业许可。</li>
              <li>课本、真题及其插图、解析：版权归原权利人，不在本项目的开源授权范围内。</li>
              <li>角色头像：AI 生成的卡通形象，角色版权归原权利人。</li>
            </ul>
            <p style={{ ...paragraph, marginBottom: 0 }}>版权所有 © 2026 ideva.sig（自有部分）。</p>
          </Card>
        </section>

        <section style={{ marginTop: 28 }}>
          <Title as="h2" tone="blue" variant="layer">第三方内容</Title>
          <Card style={{ marginTop: 16, padding: "20px 24px" }}>
            <p style={paragraph}>
              站内收录的课本习题、课本插图、中考真题和相关解析，版权归各自的权利人所有（教材出版方、各地考试机构、解析整理方等）。题目都标有来源，仅供个人学习和教学研究参考，不得用于商业用途。
            </p>
            <p style={{ ...paragraph, marginBottom: 0 }}>
              界面风格、图标、字体和依赖库的出处与许可，见仓库里的 ACKNOWLEDGMENTS.md 和 NOTICE.md。
            </p>
          </Card>
        </section>

        <section style={{ marginTop: 28 }}>
          <Title as="h2" tone="blue" variant="layer">下架与更正</Title>
          <Card style={{ marginTop: 16, padding: "20px 24px" }}>
            <p style={paragraph}>
              如果你是权利人，认为站内某项内容收录不当，或者发现内容有误，请联系 idesia.work@gmail.com。请写明页面地址、涉及的内容和权利依据。我们核实后会及时下架或更正。流程见仓库里的 TAKEDOWN.md。
            </p>
            <p style={{ ...paragraph, marginBottom: 0 }}>
              <Link href="/">回到首页</Link>
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
