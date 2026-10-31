import { circleReflectSetup } from './circleReflectMin.js';
import { rotaryHeaterSetup } from './rotaryHeater.js';
import { weighbridgeSetup } from './weighbridge.js';
import { atomIonSetup } from './atomIon.js';
import { rotationSetup } from './rotationExplorer.js';
import { leverSetup } from './lever.js';
import { buoyancySetup } from './buoyancyDensity.js';
import { mirrorSetup } from './mirrorImage.js';
import { seriesSetup } from './seriesLamps.js';
import { lineCircleSetup } from './lineCircle.js';
import { fourStrokeSetup } from './fourStroke.js';
import { reactionSetup } from './reactionMicro.js';
import { lensSetup } from './lensImaging.js';

// 数学题没有 parts 元数据时，按题干行首小问号分开记录；不改写题干与答案。
export function mathQuestionParts(question, ref = {}) {
  const selected = String(ref.note || question?.do || '').match(/只做第（([1-9])）问/);
  if (question?.parts?.length) return selected ? question.parts.filter((p) => String(p.part) === selected[1]) : question.parts;
  const stem = (question?.stem || []).filter((block) => block.type === 'md').map((block) => block.text).join('\n');
  const numbers = [...new Set([...stem.matchAll(/(?:^|\n)（([1-9])）/g)].map((m) => m[1]))];
  if (selected) return [{ part: selected[1] }];
  return numbers.length > 1 ? numbers.map((part) => ({ part })) : [];
}

// Deliberately small, non-executable YAML subset: flat keys and JSON-like flow values.
// No eval, YAML tags, aliases, nested indentation, or arbitrary expressions.
export function parseWidget(source) {
  function value(raw) {
    const tokens = raw.match(/"(?:\\.|[^"\\])*"|'[^']*'|[{}\[\],:]|[^\s{}\[\],:]+/g) || [];
    let i = 0;
    function next() {
      const t = tokens[i++];
      if (t === '{') {
        const out = {};
        while (tokens[i] !== '}') {
          const key = tokens[i++];
          if (!key || tokens[i++] !== ':') throw new Error('参数格式错误');
          out[key.replace(/^["']|["']$/g, '')] = next();
          if (tokens[i] !== ',') break;
          i++;
        }
        if (tokens[i++] !== '}') throw new Error('参数格式错误');
        return out;
      }
      if (t === '[') {
        const out = [];
        while (tokens[i] !== ']') {
          out.push(next());
          if (tokens[i] !== ',') break;
          i++;
        }
        if (tokens[i++] !== ']') throw new Error('参数格式错误');
        return out;
      }
      if (!t) throw new Error('缺少参数值');
      if (t.startsWith('"')) return JSON.parse(t);
      if (t.startsWith("'")) return t.slice(1, -1);
      if (t === 'true' || t === 'false') return t === 'true';
      if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
      return t;
    }
    const result = next();
    if (i !== tokens.length) throw new Error('参数格式错误');
    return result;
  }
  const config = {};
  for (const line of source.split('\n')) {
    const clean = line.replace(/\s+#.*$/, '').trim();
    if (!clean || clean.startsWith('#')) continue;
    const m = clean.match(/^(\w+):\s*(.+)$/);
    if (!m) throw new Error('组件仅支持单行参数');
    config[m[1]] = value(m[2]);
  }
  if (!['parabola-explorer', 'circle-angle', 'line-explorer', 'inverse-explorer', 'number-line', 'circle-reflect-min', 'rotary-heater', 'reaction-micro', 'lens-imaging', 'weighbridge', 'atom-ion', 'rotation-explorer', 'lever', 'buoyancy-density', 'mirror-image', 'series-lamps', 'line-circle', 'four-stroke'].includes(config.type)) throw new Error('未知组件');
  if (config.type === 'circle-reflect-min') circleReflectSetup(config);
  if (config.type === 'rotary-heater') rotaryHeaterSetup(config);
  if (config.type === 'weighbridge') weighbridgeSetup(config);
  if (config.type === 'atom-ion') atomIonSetup(config);
  if (config.type === 'rotation-explorer') rotationSetup(config);
  if (config.type === 'lever') leverSetup(config);
  if (config.type === 'buoyancy-density') buoyancySetup(config);
  if (config.type === 'mirror-image') mirrorSetup(config);
  if (config.type === 'series-lamps') seriesSetup(config);
  if (config.type === 'line-circle') lineCircleSetup(config);
  if (config.type === 'four-stroke') fourStrokeSetup(config);
  if (config.type === 'reaction-micro') reactionSetup(config);
  if (config.type === 'lens-imaging') lensSetup(config);
  if (config.type === 'number-line') validateNumberLine(config);
  if (['line-explorer', 'inverse-explorer'].includes(config.type)) validateFunctionWidget(config);
  return config;
}

export function sliderValues(config) {
  if (!config || !['min', 'max', 'step', 'value'].every((k) => Number.isFinite(config[k])) || config.step <= 0 || config.max <= config.min) throw new Error('滑块参数无效');
  const count = Math.floor((config.max - config.min) / config.step + 1e-8);
  if (count > 1000) throw new Error('滑块步数过多');
  const skip = Array.isArray(config.skip) ? config.skip : [config.skip];
  const values = Array.from({ length: count + 1 }, (_, i) => Number((config.min + i * config.step).toFixed(8))).filter((n) => !skip.includes(n));
  if (values.length < 2 || !values.includes(config.value)) throw new Error('滑块初值无效');
  return values;
}

export function ghostCoefficients(ghost) {
  if (!ghost) return null;
  if (typeof ghost === 'object' && ['a', 'h', 'k'].every((key) => Number.isFinite(ghost[key]))) return ghost;
  const m = String(ghost).replace(/\s/g, '').match(/^y=([+-]?(?:\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)?)\(x([+-]\d+(?:\.\d+)?)?\)\^2([+-]\d+(?:\.\d+)?)?$/);
  if (!m) throw new Error('参照曲线需用顶点式或 {a,h,k}');
  const [n, d = 1] = (m[1] === '-' ? '-1' : m[1] === '' || m[1] === '+' ? '1' : m[1]).split('/').map(Number);
  if (!d) throw new Error('分母不能为零');
  return { a: n / d, h: -Number(m[2] || 0), k: Number(m[3] || 0) };
}

// 新函数组件沿用离散滑块；提前验证，让无效参数回退到静态图。
export function validateFunctionWidget(config) {
  function validateSlider(slider, name, excludeZero = false) {
    const ticks = sliderValues(slider);
    const skip = slider.skip === undefined ? [] : Array.isArray(slider.skip) ? slider.skip : [slider.skip];
    if (!skip.every((n) => Number.isFinite(n) && n >= slider.min && n <= slider.max &&
      Math.abs((n - slider.min) / slider.step - Math.round((n - slider.min) / slider.step)) < 1e-8)) {
      throw new Error(`${name} 的 skip 必须是范围内的步长网格值`);
    }
    if (excludeZero && (!skip.includes(0) || ticks.includes(0))) throw new Error(`${name} 必须跳过 0`);
  }
  validateSlider(config.k, 'k', config.type === 'inverse-explorer');
  if (config.type === 'line-explorer') {
    validateSlider(config.b, 'b');
    if (config.points !== undefined && (!Array.isArray(config.points) || !config.points.every((p) =>
      p && Number.isFinite(p.x) && p.y === undefined && (p.label === undefined || typeof p.label === 'string')))) {
      throw new Error('直线标记点需提供 x，不能提供 y');
    }
  } else if (config.type === 'inverse-explorer') {
    if (config.point !== undefined) validateSlider({ ...config.point, value: config.point?.x }, '点的 x', true);
  } else throw new Error('未知函数组件');
  return config;
}

export function lineQuadrants(k, b) {
  if (k === 0) return b > 0 ? [1, 2] : b < 0 ? [3, 4] : [];
  if (b === 0) return k > 0 ? [1, 3] : [2, 4];
  return k > 0 ? (b > 0 ? [1, 2, 3] : [1, 3, 4]) : (b > 0 ? [1, 2, 4] : [2, 3, 4]);
}

export function lineQuadrantText(k, b) {
  const names = ['一', '二', '三', '四'];
  const quadrants = lineQuadrants(k, b);
  if (!quadrants.length) return '图象与 x 轴重合，不经过任何象限';
  return `${b === 0 ? '经过原点和' : '经过'}第${quadrants.map((q) => names[q - 1]).join('、')}象限`;
}

const blueNumber = (n) => `\\textcolor{#287fc4}{${n}}`;
const greenNumber = (n) => `\\textcolor{#197a60}{${n}}`;
export function lineFormula(k, b) {
  if (k === 0) return `y=${greenNumber(b)}`;
  const term = k === 1 ? 'x' : k === -1 ? `${blueNumber('-')}x` : `${blueNumber(k)}x`;
  return `y=${term}${b === 0 ? '' : `${b < 0 ? '-' : '+'}${greenNumber(Math.abs(b))}`}`;
}

export function inverseFormula(k) {
  if (!Number.isFinite(k) || k === 0) throw new Error('反比例函数 k 不能为 0');
  return `y=${k < 0 ? '-' : ''}\\dfrac{${blueNumber(Math.abs(k))}}{x}`;
}

// 仅采样视窗内的两支；离轴最近的横坐标由 |k| / limit 决定。
export function inverseBranches(k, limit = 6, samples = 121) {
  if (!Number.isFinite(k) || k === 0 || !Number.isFinite(limit) || limit <= 0 ||
    !Number.isInteger(samples) || samples < 80) throw new Error('反比例曲线参数无效');
  const start = Math.abs(k) / limit;
  if (start > limit) return [[], []];
  return [-1, 1].map((sign) => Array.from({ length: samples }, (_, i) => {
    const x = sign * (start + (limit - start) * i / (samples - 1));
    return { x, y: k / x };
  }));
}

export const mod = (n) => ((n % 360) + 360) % 360;
export function circleGeometry(a, b, c, gap = 8) {
  let delta = mod(b - a);
  delta = Math.max(gap, Math.min(360 - gap, delta));
  if (Math.abs(delta - 180) < 3) delta = 180;
  const sign = delta <= 180 ? 1 : -1;
  const central = Math.min(delta, 360 - delta);
  const relativeC = Math.max(central + gap, Math.min(360 - gap, mod((c - a) * sign)));
  return { a: mod(a), b: mod(a + delta), c: mod(a + relativeC * sign), central, inscribed: central / 2 };
}

// 数轴组件：abs 看相反数与绝对值；ray 看不等式解集的端点与方向。
export const numberLineRelations = { '>': '大于', '>=': '大于等于', '<': '小于', '<=': '小于等于' };
export function validateNumberLine(config) {
  const { mode, min, max, value } = config;
  if (!['abs', 'ray'].includes(mode)) throw new Error('数轴模式无效');
  if (![min, max, value].every(Number.isFinite) || min >= max || value < min || value > max) throw new Error('数轴范围无效');
  if (config.step !== undefined && !(Number.isFinite(config.step) && config.step > 0)) throw new Error('数轴步长无效');
  if (mode === 'abs' && (min !== -max)) throw new Error('数轴需关于原点对称');
  if (mode === 'ray' && config.rel !== undefined && !(config.rel in numberLineRelations)) throw new Error('不等号无效');
  return config;
}
export function rayGeometry(value, rel) {
  return { closed: rel === '>=' || rel === '<=', toRight: rel === '>' || rel === '>=' };
}
