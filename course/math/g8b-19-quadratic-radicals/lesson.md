---
id: MATH-8B-19
subject: math
title: 第十九章 二次根式
textbook: 人教版数学八年级下册（根据2022年版课程标准修订），印刷p.1–21
order: 有意义 → 非负与绝对值 → 先化简再运算
weight_basis: 9套有效卷按主要考点保守归类；易错风险和新版新增内容单独说明，见sources.md
status: 初稿，待Claude审核
updated: '2026-10-13'
---

# 第十九章 二次根式

这一章把“根号里的数”变成能检查、能计算的式子。先确认式子有意义，再决定用哪条运算规律。

## 本章前置自查

先检查三件事：能算平方；知道算术平方根非负；会用绝对值表示数到零的距离。

## 19.1a 先检查根式有意义的条件

```yaml
id: MATH-8B-19-1a
weight: 一般
textbook: 八下 19.1，印刷p.2、p.5
prerequisites: []
evidence:
- 能列出被开方数非负的条件
- 能合并根号和分母的限制
figure: 不需要
weight_note: 基础步骤容易得分，保留一题核验
sources:
- TB8B-19.1
method: [MG16 数形结合]
```

### 本次只学

写出根号和分母对字母的限制。

### 先认住

- 在实数范围内，$\sqrt a$ 有意义的条件是 $a\geq0$。
- 分母不能为零；同一式子的所有条件必须同时满足。

### 数形结合

```bridge
mode: cards
式: $\sqrt S$
图: sq-root
形: 面积为 $S>0$ 的正方形，边长是正数 $\sqrt S$
色: blue
结: $a=0$ 时 $\sqrt a=0$，画不成正方形。
```

### 容易错

- 根号内可以为零，但根号在分母时不能为零。

### 练一练

- `Q-MATH-GZ2025-13`

## 19.1b 区分开方与平方的顺序

```yaml
id: MATH-8B-19-1b
weight: 重点
textbook: 八下 19.1，印刷p.3–4
prerequisites:
- id: MATH-8B-19-1a
  strength: hard
  reason: 先检查根式是否有意义
evidence:
- 能区分先开方后平方与先平方后开方
- 能保留根号外的负号
- 能根据数值正负正确去掉绝对值
figure: 不需要
weight_note: 9套卷有条件化简；开方顺序和根号外负号是常见陷阱
sources:
- TB8B-19.1
```

### 本次只学

先看根号在哪里，再处理符号。

### 先认住

- $(\sqrt a)^2=a$，条件为 $a\geq0$。
- **补充**（课本没有讲，做真题时常用）：$\sqrt{a^2}=|a|$，对所有实数 $a$ 成立。
- $\sqrt a$ 非负（$\sqrt a\geq0$），表示 $a$ 的算术平方根。
- **补充**（课本没有讲，做真题时常用）：$\sqrt a$ 不是方程 $x^2=a$ 的全部解（$a>0$ 时方程有两个根 $\pm\sqrt a$）。

### 走一遍

计算 $\sqrt{(-10)^2}$。

先平方：$(-10)^2=100$。

再取非负的算术平方根：$\sqrt{\textcolor{#287fc4}{100}}=\boxed{10}$。

也可直接用公式：$\sqrt{(-10)^2}=|\textcolor{#287fc4}{-10}|=\boxed{10}$。

根号开出来的结果非负，不能保留 $-10$。

### 容易错

- $\sqrt{a^2}$ 不一定等于 $a$。
- 根号外的负号不能丢。

### 练一练

- `Q-MATH-TB8B-19.1-2`

  本章只做第（2）（7）（8）问
- `Q-MATH-GZ2023-10`

## 19.2a 二次根式的乘除

```yaml
id: MATH-8B-19-2a
weight: 一般
textbook: 八下 19.2，印刷p.6–8
prerequisites:
- id: MATH-8B-19-1a
  strength: hard
  reason: 确认参与运算的根式都有意义
evidence:
- 能理解乘除公式的非负与非零条件
- 能运用乘法公式将根式乘积化简
figure: 不需要
weight_note: 基础步骤容易得分，保留一题核验
sources:
- TB8B-19.2
method: [MG16 数形结合]
```

### 本次只学

使用乘除公式，并保留适用条件。

### 先认住

- $\sqrt a\sqrt b=\sqrt{ab}$，其中 $a\geq0,b\geq0$。
- $\dfrac{\sqrt a}{\sqrt b}=\sqrt{\dfrac ab}$，其中 $a\geq0,b>0$。

### 数形结合

```bridge
mode: cards
式: $\sqrt a\cdot\sqrt b$
形: 长方形的长与宽分别用根式表示时，面积就是两个根式的乘积
色: blue
```

### 容易错

- 乘除规律不能搬到加减法中。

### 练一练

- `Q-MATH-GD2023-12`

## 19.2b 化成最简二次根式

```yaml
id: MATH-8B-19-2b
weight: 一般
textbook: 八下 19.2，印刷p.8–10
prerequisites:
- id: MATH-8B-19-1b
  strength: hard
  reason: 提取平方因子时确定符号
- id: MATH-8B-19-2a
  strength: hard
  reason: 使用根式乘除公式
evidence:
- 能提取数的平方因子
- 理解提取字母平方因子时需要确定符号
- 能使分母不含根号
figure: 不需要
weight_note: 基础步骤容易得分，保留一题核验
sources:
- TB8B-19.2
method: []
```

### 本次只学

把能开方的因数移出根号，并处理分母。

### 先认住

- 最简二次根式的被开方数不含分母，也不含能开得尽方的因数或因式。
- 提取字母平方因子时用 $\sqrt{a^2}=|a|$；若题目已注明字母表示正数或按课本正数约定，则开方后直接写该正数。
- 分母有理化时，分子与分母必须同乘一个非零式子。

### 容易错

- 化简后还要检查分母和根号内是否最简。

### 练一练

- `Q-MATH-TB8B-19.2-4`

## 19.3a 先化简，再合并同类根式

```yaml
id: MATH-8B-19-3a
weight: 重点
textbook: 八下 19.3，印刷p.13–14
prerequisites:
- id: MATH-8B-19-2b
  strength: hard
  reason: 先完成各项的最简化
evidence:
- 能先化简再判断是否可合并
- 能正确去掉带负号的括号
- 能保留不能合并的项
figure: 不需要
weight_note: GZ2025-03直接检查同类根式加法；后续代数计算反复使用
sources:
- TB8B-19.3
method: [MG16 数形结合]
```

### 本次只学

只合并化简后被开方数相同的项。

### 先认住

- 先把各项化成最简二次根式，再合并被开方数相同的项。
- 合并时只加减系数，根号内的数不变。
- 去括号时，括号前的负号作用于每一项。

### 数形结合

```bridge
mode: cards
式: $\sqrt8+\sqrt{18}=5\sqrt2$
形: 两块正方形沿木板长边并排摆放，所需长度是各取一条边的长度之和，不是两块图形的总周长
色: blue
```

### 走一遍

计算 $\sqrt{80}-\sqrt{45}$。

提取平方因子：$\sqrt{80}=\sqrt{\textcolor{#287fc4}{16}\times5}=4\sqrt5$。

同样，$\sqrt{45}=\sqrt{\textcolor{#287fc4}{9}\times5}=3\sqrt5$。

合并系数：$4\sqrt5-3\sqrt5=(\textcolor{#287fc4}{4}-\textcolor{#287fc4}{3})\sqrt5=\boxed{\sqrt5}$。

### 容易错

- 根号内不同的数不能直接相加。
- 原式看着不同，化简后可能是同类项。

### 练一练

- `Q-MATH-TB8B-19.3-2`
- `Q-MATH-GZ2025-03`

## 19.3b 根式混合运算与乘法公式

```yaml
id: MATH-8B-19-3b
weight: 重点
textbook: 八下 19.3，印刷p.14–15
prerequisites:
- id: MATH-8B-19-2a
  strength: hard
  reason: 处理相乘的根式
- id: MATH-8B-19-3a
  strength: hard
  reason: 合并展开后的同类项
evidence:
- 能判断是否适用平方差或完全平方
- 能完整写出展开步骤
- 能把结果化为最简形式
figure: 不需要
weight_note: GZ2025-23（1）使用共轭根式乘法；公式误用是常见陷阱
sources:
- TB8B-19.3
method: []
```

### 本次只学

按运算顺序展开，再化简。

### 先认住

- 先括号、后乘除、再加减；分配律和整式乘法公式仍适用。
- $(u+v)(u-v)=u^2-v^2$；$(u+v)^2=u^2+2uv+v^2$。
- 每次展开后先化简根式，最后合并同类项。

### 走一遍

计算 $(\sqrt5+\sqrt3)(\sqrt5-\sqrt3)$。

两因式只有中间的符号不同，可用平方差公式。

$(\sqrt5+\sqrt3)(\sqrt5-\sqrt3)=(\sqrt5)^2-(\sqrt3)^2$。

$=\textcolor{#287fc4}{5}-\textcolor{#287fc4}{3}=\boxed{2}$。

### 容易错

- 完全平方的中间项不能漏。
- 平方差只能用于互为共轭的两项式。

### 练一练

- `Q-MATH-TB8B-19.3-3`
- `Q-MATH-GZ2025-19`
