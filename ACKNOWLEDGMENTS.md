# 致谢

这个项目参考、借用或使用过下面这些作品和工具。每条写了名称、链接、用途和许可证。许可证一栏写“待核实”的，是还没有从原始出处确认。第三方许可全文和声明见 [NOTICE.md](./NOTICE.md)。

借了风格或想法、没有法律义务的，也一并列出。这里的列出，**不代表获得了对方的授权、合作或认可**。

## 1. 界面与设计参考

| 名称 | 链接 | 用途 | 许可证 |
| --- | --- | --- | --- |
| Animal Island UI（作者 guokaigdg，版本 2.1.1） | https://guokaigdg.github.io/animal-island-ui/ ；源码 https://github.com/guokaigdg/animal-island-ui | 界面“岛屿风”：13 色配色、三种标题款式、标签、卡片、进度条、页签、勾选、开关、折叠、通知等样式值，抄进了 `src/app/island.css` 和 `src/components/island/`。**不安装这个库**，但样式值是拷贝并改写的，所以按 MIT 要求保留版权声明 | MIT，Copyright (c) 2026 guokaigdg |
| omath.net | https://en.omath.net/ | 数学讲解的**呈现方式**参考：分步推导里着色、划掉、加框，例题变式，概念流程图，“必须先会 / 依赖 / 被用到”。只学手法，没有拷贝内容、图或代码 | 站点未见许可说明；因为没有复制任何内容，不影响使用 |
| WeduLab | https://wedulab.com/ | 示意图风格参考：极简线稿、少量颜色、一图一个意思、轻量动画。没有嵌入、没有拷贝其代码或图 | 站点未见许可说明，未见许可说明；未使用其内容 |
| Marble 的 Water Lab / Ecosystem Simulator | https://withmarble.com/water-lab ；https://withmarble.com/ecosystem-simulator | 物理“实验室”（物态变化、凸透镜、浮力、杠杆、欧姆定律、测小灯泡功率、液体压强、测密度、平面镜）的灵感来源。我们的实验室是自己用 SVG 和 React 写的，内容跟人教版课本走；只看过页面，没有拷贝代码、图或文案 | 站点未见许可说明，未见许可说明；未使用其内容 |
| Gotcha 标志 | 无 | `public/brand/gotcha.svg` 等，作者自有 | © 2026 ideva.sig；已开放，按 CC BY-NC-SA 4.0 提供 |

## 2. 图标与字体

| 名称 | 链接 | 用途 | 许可证 |
| --- | --- | --- | --- |
| naive-icons | https://www.npmjs.com/package/naive-icons ；GitHub https://github.com/guokaigdg/naive-icons | `public/icons/island/` 下 125 个彩色手绘 SVG 图标，从 animal-island-ui 的 npm 包导出为静态文件 | MIT，Copyright (c) 2026 Naive Icons；其 README 写明图标为原创作品。`public/icons/island/LICENSE.txt` 是 animal-island-ui 的 MIT 声明（guokaigdg），两者并列保留 |
| Nunito | https://fonts.google.com/specimen/Nunito | 拉丁字母和数字的圆体，字体文件放在仓库 `src/fonts/nunito/`（子集化的可变字体 woff2，附 OFL.txt）；中文用访问者设备自带字体 | SIL OFL 1.1（已核实：版权行 Copyright 2014 The Nunito Project Authors；设计者 Vernon Adams、Cyreal、Jacques Le Bailly；来源 https://github.com/google/fonts/tree/main/ofl/nunito） | |
| 本项目自绘线条图标 | 无 | `src/components/LineIcons.js` | 随代码，AGPL-3.0 |

## 3. 代码依赖

`package.json` 只有四个运行时依赖，没有开发依赖。

| 名称 | 版本 | 链接 | 用途 | 许可证 |
| --- | --- | --- | --- | --- |
| Next.js | 16.2.10 | https://nextjs.org | 站点框架，静态导出 | MIT |
| React / React DOM | 19.2.0 | https://react.dev/ | 界面 | MIT |
| KaTeX | 0.16.22 | https://katex.org | 公式渲染，含随包的 mhchem 扩展（化学式）和字体 | MIT，Copyright (c) 2013-2020 Khan Academy and other contributors；随包的 mhchem 扩展为 Apache-2.0，Copyright (c) 2011-2015 The MathJax Consortium、(c) 2015-2018 Martin Hensel |
| PyYAML、PyMuPDF（Python） | — | https://github.com/yaml/pyyaml ；https://pypi.org/project/PyMuPDF/ | 构建与素材脚本：把 `course/` 导出成 JSON、检查章节、读取 PDF | PyYAML：MIT 条文，(c) Ingy döt Net、Kirill Simonov；PyMuPDF：AGPL-3.0 或 Artifex 商业许可双许可；PyMuPDF 只在个别素材脚本里用 |

间接依赖的许可见 NOTICE.md。

## 4. 内容与创意参考

| 名称 | 链接 | 用途 | 许可证 |
| --- | --- | --- | --- |
| cn-math-taxonomy | https://github.com/xiaoyang111222/cn-math-taxonomy | 数学错题“前置回溯”的**创意来源**：做错题后沿知识点的前置关系往前查，找出没掌握的知识点。我们只借这个思路，具体规则（强前置在前、弱前置在后、逐层往前、一次最多 6 个、按拓扑排序给补课路线）是按本项目自己的知识点地图重新设计和写的代码，**没有拷贝其代码、数据、题库或界面** | CC BY-NC 4.0；未使用其数据 |
| Marble os-taxonomy | https://github.com/withmarbleapp/os-taxonomy | 知识点字段设计的启发：前置知识（强 / 弱和理由）、掌握证据。不导入其任何数据 | 数据库 ODbL-1.0；未使用其数据 |
| 广州市招考办《2026 年广州市初中学业水平考试物理实验操作考试范围》 | https://gzzk.gz.gov.cn/gkmlpt/content/10/10751/post_10751739.html | 物理实验室任务、操作要点的范围依据 | 政府公开文件；引用条件待核实 |
| 《义务教育物理 / 数学 / 化学课程标准（2022 年版）》（中华人民共和国教育部 制定，北京师范大学出版社，2022 年 4 月；ISBN 物理 978-7-303-27592-2、数学 978-7-303-27624-0、化学 978-7-303-27610-3） | 教育部通知（教材〔2022〕2 号）：http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html | 化学“怎么想”页的依据；`src/components/ThinkingPage.js` 里有一处标明出处的少量引文 | 教育部颁布；出版方待核实；引用限于标注出处的少量引用 |
| 《初中物理思想方法导引》（沈启正 主编，浙江大学出版社，2025 年 6 月第 1 版，ISBN 978-7-308-26192-0；一册，本地文件拆成上、下两份）、《初中数学思想方法导引》（孙厚康 著，浙江大学出版社，2015 年 6 月第 1 版，ISBN 978-7-308-14653-1） | 浙江大学出版社 | “怎么想”页的思想方法依据；少量“导引例题”按“导引原文”收入题库，来源在各章 `sources.md` 标明 | 商业出版物，版权归原权利人 |
| 网络流传的《中考状元笔记（物理）》文字稿 | 出版方和作者不详 | 只作线索（找考点、易错点），写法与课本冲突时以课本为准；不收录其题目和数值 | 商业出版物，版权归原权利人 |
| 公式手册和台词中的古诗、民谚 | 无 | 王安石《梅花》、陆游《村居书喜》、李白《望庐山瀑布》、王充《论衡》、新疆民谚，原句引用并写明出处 | 公有领域 |

## 5. 数据与素材

| 名称 | 链接 | 用途 | 许可证 |
| --- | --- | --- | --- |
| 元素周期表图示版（Keith Enevoldsen；中文版翻译 邹超、张凯博士，校对 余珊珊，平面 周娇娇） | https://elements.wlonk.com/ ；使用条款 https://elements.wlonk.com/ElementsTermsOfUse.html ；中文版列表 https://elements.wlonk.com/ElementsLinks.html | `public/periodic/` 下 118 张元素卡片、读图说明和文字版整页，从作者发布的中文版 PDF 裁切、转格式，未改内容；页面脚注已署名 | 页面与 `course/chemistry/periodic-credits.md` 写的是 CC BY-SA 4.0，© 2005–2016 Keith Enevoldsen。许可依据：官网首页写 “CC BY-SA Creative Commons Attribution-ShareAlike 4.0”，使用条款页说明适用于站内所有作品（含 PDF），允许翻译和改作，要求保留版权声明、注明改动、同许可共享。官网只署名译者邹超、张凯；校对、平面署名来自中文版 PDF 本身。这批图片按 CC BY-SA 4.0 单独提供，不并入本项目的 CC BY-NC-SA |
| 元素相对原子质量 | 无 | `course/chemistry/periodic.yml`：取自人教版九上附录Ⅱ（IUPAC 2021 标准相对原子质量），“初中取值”按课本习惯 | 事实性数据 |
| 角色头像（35 张） | 无 | `public/avatars/`：知识点页顶部“角色台词”的配图，是用 gpt-image-2 生成的卡通形象。**其中多个形象对应第三方知识产权角色**，见第 7 节 | AI 生成物；角色版权归原权利人 |
| 品牌横幅、首页插图 | 无 | `public/brand/banner-island.webp`、`banner-night.webp`、`home-hero.webp`、`gotcha-wordmark.webp` | 作者借助 AI 工具生成；按 CC BY-NC-SA 4.0 开放（著作权归属见 LICENSE-CONTENT.md） |
| 示意图（SVG） | 无 | 手写 SVG 脚本绘制，个别场景图用 gpt-image-2 生成并逐张人工核对。图的风格参考 WeduLab（见第 1 节）。“破题钥匙”小图有的是对照课本插图重画的 | © 2026 ideva.sig，随讲义许可 CC BY-NC-SA 4.0 |
| 动画 / 游戏角色台词 | 无 | 台词是改编（开玩笑），每条 note 写“改编自……”。涉及柯南、海绵宝宝、樱木花道、派蒙、哆啦A梦、灰太狼、光头强、熊大、黑猫警长、钢铁侠、蜘蛛侠、皮卡丘、艾莎、路飞、终结者、《赛车总动员》闪电麦坤、《光遇》、《第五人格》、《蛋仔派对》、《王者荣耀》鲁班七号、《时光代理人》等 | 版权和商标归原权利人 |
| PaddleOCR-VL-1.6 | https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6 | 制作过程中在本机把课本、真题 PDF 识别为 Markdown，再人工对照原页核对。识别结果不入库，工具不在发布物里 | Apache-2.0 |
| AI 协作工具 | 无 | 内容起草、代码、审阅用过多个 AI 助手 | **声明:本项目的部分内容与代码是在 AI 辅助下完成的**(起草、编程、审阅、部分图片),全部内容由作者审阅取舍,课本习题答案标注“待复核”或“已复核” |

## 6. 课程标准与教材

| 名称 | 链接 | 用途 | 版权 |
| --- | --- | --- | --- |
| 人教版《物理》八年级上册、八年级下册、九年级全一册（人民教育出版社 课程教材研究所 编著，根据 2022 年版课程标准修订） | 人民教育出版社 http://www.pep.com.cn | 物理全部章节的主线：章节划分、定义、公式、实验、课本习题 | 版权归人民教育出版社等权利人；本项目在课本原文基础上自行编写讲解，另外收录了课本习题 |
| 人教版《数学》七年级上下册、八年级上下册、九年级上册（根据 2022 年版课程标准修订） | 同上 | 数学 30 章的主线；课本习题 | 同上 |
| 人教版《化学》九年级上册（根据 2022 年版课程标准修订） | 同上 | 化学 7 个单元 | 同上 |

教材的版次、书号以课本版权页为准（本项目使用的电子版已不含版权页，未逐册列出）。

## 7. 真题来源与版权声明

**范围**：广东省卷（2022–2025）、广州市卷（2022–2025）、深圳市卷（2022–2024），物理、化学、数学三科按需选用。题干按原卷收录，不编题、不改题。答案和解析：真题的答案来自“精品解析”解析版（据记录该系列由学科网出品，待核实）；课本习题的答案由本项目编写，标注“待复核”或“已复核”。个别 2025 年真题来自第三方刷题平台的导出件，在题目中注明“待原卷核对”，带平台水印的图片不随仓库发布。题图用原卷截图，课本插图用课本截图。

**声明**：

> 本项目收录的中考真题、课本习题、课本插图和部分解析，版权归原权利人（各地招生考试机构、人民教育出版社、解析整理出版方等）所有，仅供个人学习与教学研究参考，不得用于商业用途，也不随本项目的开源许可证授权。如权利人认为收录不当，请按 [TAKEDOWN.md](./TAKEDOWN.md) 联系，我们将在核实后及时下架。

## 8. 风险项（客观说明）

以下内容涉及第三方权利，作者已知悉并接受相应风险，并公开说明如下，不回避也不夸大：

1. **角色头像和角色台词**：35 张头像是 AI 生成的卡通形象，其中多个对应第三方知识产权角色。AI 生成不等于没有版权问题。头像和台词仅作趣味配图，如权利人有异议，请联系，我们会下架相关头像和台词（见 TAKEDOWN.md）。
2. **课本习题和插图**：课本习题原文和插图截图的版权归人民教育出版社等权利人。课本整页扫描不随仓库发布。
3. **真题题干、题图和解析**：版权归考试机构；“精品解析”解析版为第三方商业产品，其解析文字的收录方式（原样引用或本项目改写）需逐项核对，发布前复查。
4. **参考书例题**：《思想方法导引》的少量例题以“导引原文”收入，版权归原权利人。
5. **周期表图片**：CC BY-SA 4.0，依据已核实（官网首页与使用条款页）。
6. **图标来源包的弃用提示**：animal-island-ui 在 npm 上把旧版本标为“包含因版权原因已移除的内容，请升级到 1.9.0 以上”，本项目用的图标取自 2.1.1，是否受影响未能确认；如有异议请联系，我们会替换。
7. **“破题钥匙”小图**：部分对照课本插图重画，是否构成衍生作品，由作者判断，必要时改为自绘构图。

