import assert from "node:assert/strict";
import { test } from "node:test";
import { plainMathTitle } from "../src/lib/plainMathTitle.mjs";

test("数学知识点标题转为浏览器可读的纯文本", () => {
  assert.equal(plainMathTitle("$y=a(x-h)^2+k$ 的图象"), "y=a(x-h)²+k 的图象");
  assert.equal(plainMathTitle("弧长公式 $l=\\frac{n\\pi R}{180}$"), "弧长公式 l=(nπ R)/(180)");
  assert.equal(plainMathTitle("抛物线与 $x$ 轴"), "抛物线与 x 轴");
  assert.equal(plainMathTitle("第二十九章 圆"), "第二十九章 圆");
});
