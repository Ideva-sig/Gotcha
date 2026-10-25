import {
  Avatar, AvatarGroup, Badge, Card, Check, Collapse, Divider, Notice, Pager,
  Progress, Skeleton, Switch, Tabs, Tag, Tip, Title,
} from "@/components/island/Island";
import { TONES } from "@/components/island/tones";
import { Icon } from "@/components/Icon";
import styles from "./styleguide.module.css";

export const metadata = {
  title: "样式总表",
  robots: { index: false },
};

const TONE_NAMES = {
  green: "草绿", pink: "粉", purple: "紫", blue: "蓝", yellow: "黄", orange: "橙", teal: "青绿",
  leaf: "叶绿", red: "红", lime: "青柠", lemon: "柠黄", brown: "棕", peach: "蜜桃",
};

function Section({ title, note, children }) {
  return (
    <section className={styles.section}>
      <Title as="h2" tone="blue" variant="layer">{title}</Title>
      {note && <p className={styles.note}>{note}</p>}
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <main className="page-main">
      <div className={`page-container ${styles.page}`}>
        <Title as="h1" size="lg">样式总表</Title>
        <p className={styles.note}>内部样板页，不在导航里。照这里的款式和颜色统一全站；看完告诉我哪些要换、哪些不要。</p>

        <Section title="13 种颜色" note="每种颜色的面、背板、折角、字色成套使用。淡色底配棕字，深棕底配白字，对比度都在 4.5:1 以上。">
          <div className={styles.grid}>
            {TONES.map((tone) => (
              <div className={styles.cell} key={tone}>
                <Title as="div" tone={tone} variant="ribbon" size="sm">{TONE_NAMES[tone]}</Title>
              </div>
            ))}
          </div>
        </Section>

        <Section title="三种标题" note="飘带：每页一条，做主标题；叠层板：大区块标题；折角标签：卡片左上角的小标题。">
          <div className={styles.row}>
            <Title as="div" tone="green" variant="ribbon">第十三章 内能</Title>
            <Title as="div" tone="red" variant="ribbon">错题本</Title>
          </div>
          <div className={styles.row}>
            <Title as="div" tone="blue" variant="layer">本章知识关系</Title>
            <Title as="div" tone="orange" variant="layer">全部章节</Title>
          </div>
          <div className={styles.row}>
            <Title as="div" tone="yellow" variant="tab">本关要点</Title>
            <Title as="div" tone="lime" variant="tab">数形结合</Title>
            <Title as="div" tone="teal" variant="tab">跟着闯一遍</Title>
            <Title as="div" tone="pink" variant="tab">踩坑提醒</Title>
            <Title as="div" tone="purple" variant="tab">闯一关</Title>
            <Title as="div" tone="leaf" variant="tab">过关进度</Title>
            <Title as="div" tone="orange" variant="tab">通关自检</Title>
          </div>
        </Section>

        <Section title="按钮" note="立体按钮：按下会沉下去。主按钮青绿，危险操作红色。">
          <div className={styles.row}>
            <button className="island-btn island-btn--teal" type="button">主按钮</button>
            <button className="island-btn" type="button">奶油按钮</button>
            <button className="island-btn island-btn--danger" type="button">清空错题</button>
            <button className="island-btn island-btn--dashed" type="button">虚线</button>
            <button className="island-btn island-btn--ghost" type="button">描边</button>
            <button className="island-btn island-btn--link" type="button">文字链接</button>
            <button className="island-btn island-btn--loading" type="button">加载中</button>
          </div>
          <div className={styles.row}>
            <button className="island-btn island-btn--teal island-btn--sm" type="button">小</button>
            <button className="island-btn island-btn--teal" type="button">中</button>
            <button className="island-btn island-btn--teal island-btn--lg" type="button">
              大 <Icon name="arrow-right" size={20} />
            </button>
          </div>
        </Section>

        <Section title="标签" note="默认用淡底（对比度好）；需要强调才用实心。">
          <div className={styles.row}>
            {["red", "blue", "brown", "yellow", "leaf"].map((tone) => (
              <Tag key={tone} tone={tone}>{TONE_NAMES[tone]}</Tag>
            ))}
            <Tag tone="red" variant="solid">重点</Tag>
            <Tag tone="leaf" variant="solid">已掌握</Tag>
            <Tag tone="orange" variant="outlined">描边</Tag>
            <Tag tone="purple" variant="dashed">虚线</Tag>
            <Tag tone="teal" size="md">中号</Tag>
            <Tag tone="peach" size="lg">大号</Tag>
          </div>
        </Section>

        <Section title="卡片" note="白纸卡片放内容；虚线卡片放空状态；点阵底纹卡片只用在外壳区（首页、台词、总结）；实心卡片极少用。">
          <div className={styles.cards}>
            <Card><strong>白纸卡片</strong><p>讲义、题目、示意图所在的纸面，保持干净。</p></Card>
            <Card variant="dashed"><strong>虚线卡片</strong><p>还没有错题时显示这个。</p></Card>
            <Card variant="pattern" tone="teal"><strong>点阵底纹</strong><p>接着学、台词、总结用。</p></Card>
            <Card variant="pattern" tone="yellow"><strong>点阵底纹</strong><p>不同颜色表示不同含义。</p></Card>
            <Card variant="solid" tone="leaf"><strong>实心卡片</strong><p>只给最抢眼的小块。</p></Card>
            <Card hoverable><strong>可点击卡片</strong><p>悬停上浮，按下沉下。</p></Card>
          </div>
        </Section>

        <Section title="分隔线">
          <Divider /><Divider variant="thin" /><Divider variant="dotted" /><Divider variant="wave" /><Divider variant="squiggle" />
          <Divider icon="leaf" />
          <p>分工：页面大段落之间（外壳区）用黄色波浪或青色波纹；区块之间用虚线；列表行之间用点线；首页、庆祝等外壳区收尾可用图标串。讲义正文和题目区只用细线。</p>
        </Section>
        <Section title="进度条与页签">
          <div className={styles.stack}>
            <Progress label="3 / 8" size="sm" value={3} max={8} />
            <Progress label="60%" value={60} />
            <Progress label="完成" size="lg" value={100} />
            <Progress label="按颜色" tone="orange" value={45} />
          </div>
          <Tabs
            items={[
              { key: "a", label: "课本顺序", icon: "book", content: "按课本章节顺序排列。" },
              { key: "b", label: "按考频", icon: "flag", content: "按近四年真题考次排列。" },
              { key: "c", label: "我的错题", icon: "bookmark", content: "只看做错的知识点。" },
            ]}
          />
          <div className={styles.row}>
            <Tabs
              bare
              items={[
                { key: "a", label: "走一步" },
                { key: "b", label: "整段看" },
              ]}
            />
          </div>
        </Section>

        <Section title="勾选、单选、开关、折叠">
          <div className={styles.row}>
            <Check defaultChecked>能说出热量的单位是焦耳</Check>
            <Check>能算出吸收的热量</Check>
            <Check name="mode" type="radio" defaultChecked>课本顺序</Check>
            <Check name="mode" type="radio">按考频</Check>
            <Switch label="显示已掌握" defaultChecked />
            <Switch label="只看重点" />
          </div>
          <div className={styles.stack}>
            <Collapse defaultOpen title="知识关系">必须先会：温度计的使用；学会后会用到：计算吸收或放出的热量。</Collapse>
            <Collapse title="先看答案再看解析">折叠区点开后平滑展开。</Collapse>
            <Collapse bare title="看解析（3 步）">不带卡片底的款式，放在题目卡片里面。</Collapse>
          </div>
        </Section>

        <Section title="通知、徽标、头像、骨架屏、提示" note="回到顶部：长页面（如公式速查）往下读过一屏半后，右下角出现圆形按钮。">
          <div className={styles.stack}>
            <Notice type="success" title="改对了！">这道错题已经移出待复习。</Notice>
            <Notice type="info" title="小提示">比热容是物质自身的性质。</Notice>
            <Notice type="warning" title="再检查一下">单位有没有统一成千克？</Notice>
            <Notice type="error" title="这题错了">看看解析再试一次。</Notice>
          </div>
          <div className={styles.row}>
            <Badge count={3}><button className="island-btn" type="button">错题本</button></Badge>
            <Badge><button className="island-btn" type="button">新消息</button></Badge>
            <AvatarGroup>
              <Avatar name="物" tone="teal" />
              <Avatar name="数" tone="blue" />
              <Avatar name="化" tone="orange" />
            </AvatarGroup>
            <Avatar name="方" square tone="pink" />
            <Tip text="比热容：1 kg 物质温度升高 1 ℃ 吸收的热量">点我看提示</Tip>
          </div>
          <div className={styles.stack}>
            <Skeleton height={18} width="70%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="40%" />
          </div>
        </Section>

        <Section title="表格与分页">
          <table className="isl-table">
            <thead><tr><th>物质</th><th>比热容 c / [J/(kg·℃)]</th><th>说明</th></tr></thead>
            <tbody>
              <tr><td>水</td><td>4.2×10³</td><td>最大，常用来做冷却剂</td></tr>
              <tr><td>煤油</td><td>2.1×10³</td><td>约为水的一半</td></tr>
              <tr><td>干泥土</td><td>0.84×10³</td><td>白天升温快</td></tr>
            </tbody>
          </table>
          <div className={styles.row}><Pager total={5} /></div>
        </Section>
      </div>
    </main>
  );
}
