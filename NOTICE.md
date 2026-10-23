# 第三方许可声明（NOTICE）

本项目自己的许可见 [LICENSE](./LICENSE)（代码，AGPL-3.0）和 [LICENSE-CONTENT.md](./LICENSE-CONTENT.md)（讲义和示意图，CC BY-NC-SA 4.0）。版权行：© 2026 ideva.sig。

下面是随本项目使用或分发的第三方内容及其许可。标“待核实”的条目，许可信息尚未从原始出处确认，发布前需要核对。完整的出处与用途说明见 [ACKNOWLEDGMENTS.md](./ACKNOWLEDGMENTS.md)。

## 1. 随仓库分发的第三方内容

| 名称 | 位置 | 许可 | 说明 |
| --- | --- | --- | --- |
| Animal Island UI（作者 guokaigdg） | 样式值抄入 `src/app/island.css` 和 `src/components/island/` | MIT，Copyright (c) 2026 guokaigdg | 不安装该库，但配色、标题、标签、卡片、进度条等样式值是拷贝并改写的，按 MIT 要求保留版权声明和许可全文（见下） |
| naive-icons | `public/icons/island/` 下 125 个彩色 SVG 图标 | MIT，Copyright (c) 2026 Naive Icons（https://github.com/guokaigdg/naive-icons ；其 README 写明图标为原创作品） | 图标从 animal-island-ui 的 npm 包导出为静态文件。`public/icons/island/LICENSE.txt` 为 animal-island-ui 的 MIT 声明（Copyright (c) 2026 guokaigdg），与 naive-icons 的声明并列保留 |
| 元素周期表图示版（Keith Enevoldsen） | `public/periodic/` | CC BY-SA 4.0（页面与 `course/chemistry/periodic-credits.md` 的说法；依据：官网首页与使用条款页 https://elements.wlonk.com/ElementsTermsOfUse.html ） | 单独保留该许可，不并入 CC BY-NC-SA。署名与改动说明见网站页面脚注 |
| 角色头像 | `public/avatars/` | 不授予许可 | AI 生成的卡通形象，对应的角色版权归原权利人，见 [TAKEDOWN.md](./TAKEDOWN.md) |
| 课本、真题、解析及其插图和截图 | `course/**/figures/`、各章题目 | 不授予许可 | 版权归原权利人，供学习参考，不得商用 |

## 2. 运行时依赖（`package.json`）

| 名称 | 版本 | 许可 |
| --- | --- | --- |
| Next.js | 16.2.10 | MIT，Copyright (c) 2025 Vercel, Inc. |
| React / React DOM | 19.2.0 | MIT，Copyright (c) Meta Platforms, Inc. and affiliates |
| KaTeX（含随包发布的 mhchem 扩展、`katex.min.css` 与字体） | 0.16.22 | MIT，Copyright (c) 2013-2020 Khan Academy and other contributors；其中随包的 mhchem 扩展（`contrib/mhchem.js`）为 Apache-2.0，Copyright (c) 2011-2015 The MathJax Consortium、(c) 2015-2018 Martin Hensel（上游 https://github.com/mhchem/MhchemParser ，许可全文 https://www.apache.org/licenses/LICENSE-2.0 ） |

这四个包又带来一批间接依赖（见 `package-lock.json`）。在本机 `node_modules` 实测的许可为 MIT、ISC、Apache-2.0、BSD-3-Clause、0BSD、CC-BY-4.0（caniuse-lite），另有 `@img/sharp-libvips-*`（LGPL-3.0-or-later，sharp 的可选二进制）。本站使用 `images.unoptimized`，静态导出的站点不含它，但以源码形式分发时请留意。

## 3. 字体

| 名称 | 用途 | 许可 |
| --- | --- | --- |
| Nunito | 拉丁字母和数字的圆体；设计者 Vernon Adams、Cyreal、Jacques Le Bailly（据 Google Fonts 元数据）。版权行：Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)。字体文件已放入仓库 `src/fonts/nunito/`（子集化为拉丁字符的可变字体 woff2），随静态站点分发，构建时不联网 | SIL Open Font License 1.1，全文见 `src/fonts/nunito/OFL.txt`（官方副本：https://github.com/google/fonts/blob/main/ofl/nunito/OFL.txt）。该文件未声明保留字体名称 |
| 系统中文字体 | 中文正文使用访问者设备自带字体，不打包 | 不适用 |

## 4. 构建与制作工具（不随站点分发）

| 名称 | 用途 | 许可 |
| --- | --- | --- |
| PyYAML | 内容导出与检查脚本 | MIT 条文，Copyright (c) 2017-2021 Ingy döt Net、(c) 2006-2016 Kirill Simonov（https://github.com/yaml/pyyaml ） |
| PyMuPDF | 个别素材脚本读取 PDF | AGPL-3.0 或 Artifex 商业许可双许可，Artifex Software, Inc.（https://pypi.org/project/PyMuPDF/ ） |
| PaddleOCR-VL-1.6 | 制作过程中识别课本、真题 PDF，识别结果不入库 | Apache-2.0（https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6 ） |

## Animal Island UI 许可全文

```
MIT License

Copyright (c) 2026 guokaigdg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## KaTeX 许可全文

```
The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
