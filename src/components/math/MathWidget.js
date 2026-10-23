"use client";
import { useId, useMemo, useState } from "react";
import { CourseMarkdown } from "../CourseMarkdown";
import { circleGeometry, ghostCoefficients, sliderValues, validateFunctionWidget, lineFormula, lineQuadrantText, inverseFormula, inverseBranches, validateNumberLine, numberLineRelations, rayGeometry } from "@/lib/mathWidgets";
import styles from "./MathWidget.module.css";

const colors = { a: 'var(--course-blue)', h: 'var(--course-coral)', k: 'var(--course-green)' };
function Parabola({ config }) {
  const ticks = useMemo(() => Object.fromEntries(['a', 'h', 'k'].map((key) => [key, sliderValues(config[key])])), [config]);
  if (ticks.a.includes(0)) throw new Error('二次函数 a 必须跳过 0');
  const [values, setValues] = useState(() => ({ a: config.a.value, h: config.h.value, k: config.k.value }));
  const ghost = ghostCoefficients(config.ghost);
  const id = useId().replace(/:/g, '');
  const { a, h, k } = values;
  const px = (x) => 300 + x * 32;
  const py = (y) => 210 - y * 24;
  const curve = (v) => Array.from({ length: 361 }, (_, i) => {
    const x = -9 + i / 20;
    return `${i ? 'L' : 'M'}${px(x).toFixed(2)},${py(v.a * (x - v.h) ** 2 + v.k).toFixed(2)}`;
  }).join(' ');
  const n = (v, hex) => `\\textcolor{${hex}}{${Math.abs(v)}}`;
  const formula = `y=${a < 0 ? '-' : ''}${n(a, '#287fc4')}(x${h < 0 ? '+' : '-'}${n(h, '#c9554d')})^2${k < 0 ? '-' : '+'}${n(k, '#197a60')}`;
  return <div className={styles.widget} data-widget="parabola-explorer">
    <CourseMarkdown content={`$$${formula}$$`} />
    <svg viewBox="0 0 600 420" role="img" aria-label="抛物线与坐标系">
      <defs><clipPath id={id}><rect x="12" y="12" width="576" height="396" /></clipPath></defs>
      <g stroke="var(--border)" strokeWidth="1">{Array.from({ length: 17 }, (_, i) => i - 8).map((t) => <g key={t}><path d={`M${px(t)} 12V408 M12 ${py(t)}H588`} /></g>)}</g>
      <g stroke="var(--text-soft)" strokeWidth="1.5"><path d="M12 210H588 M300 408V12" /></g>
      <g fill="var(--text-soft)" fontSize="14"><text x="577" y="232">x</text><text x="311" y="24">y</text><text x="282" y="229">O</text>{[-6,-3,3,6].map((t) => <g key={t}><text x={px(t)-5} y="229">{t}</text><text x="308" y={py(t)+5}>{t}</text></g>)}</g>
      <g clipPath={`url(#${id})`} fill="none" strokeWidth="2.5">
        {ghost && <path d={curve(ghost)} stroke="var(--text-faint)" strokeDasharray="6 5" />}
        <path d={`M${px(h)} 12V408`} stroke={colors.h} strokeDasharray="6 5" />
        <path d={curve(values)} stroke={colors.a} />
        <circle cx={px(h)} cy={py(k)} r="5" fill={colors.k} stroke="var(--surface)" />
      </g>
      {(config.points || []).map((p, i) => {
        const y = p.y ?? a * (p.x - h) ** 2 + k;
        if (!Number.isFinite(p.x) || !Number.isFinite(y)) throw new Error('标记点无效');
        if (px(p.x) < 12 || px(p.x) > 588 || py(y) < 12 || py(y) > 408) return null;
        return <g key={i} fill="var(--text)"><circle cx={px(p.x)} cy={py(y)} r="4" /><text x={px(p.x) > 500 ? px(p.x)-9 : px(p.x)+9} textAnchor={px(p.x) > 500 ? 'end' : 'start'} y={py(y) < 32 ? py(y)+22 : py(y)-10} fontSize="16">{p.label || `(${p.x}, ${Number(y.toFixed(2))})`}</text></g>;
      })}
    </svg>
    <p className={styles.readout}>顶点 <strong style={{ color: colors.k }}>({h}, {k})</strong>；对称轴 <strong style={{ color: colors.h }}>x = {h}</strong></p>
    <div className={styles.sliders}>{['a', 'h', 'k'].map((key) => <label key={key} style={{ '--slider-color': colors[key] }}>
      <span>{key} = <output>{values[key]}</output></span>
      <input aria-label={key} type="range" min="0" max={ticks[key].length - 1} step="1" value={ticks[key].indexOf(values[key])} aria-valuetext={String(values[key])}
        onChange={(e) => setValues((v) => ({ ...v, [key]: ticks[key][Number(e.target.value)] }))} />
      <span className={styles.range}>{ticks[key][0]} 至 {ticks[key].at(-1)}{config[key].skip !== undefined ? `（跳过 ${config[key].skip}）` : ''}</span>
    </label>)}</div>
  </div>;
}

function CircleAngle({ config }) {
  const A = config.A || { angle: 0, draggable: false };
  const B = config.B || { angle: 100, draggable: true };
  const C = config.C || { angle: 230, draggable: true, range: 'opposite-arc' };
  if (![A.angle, B.angle, C.angle].every(Number.isFinite)) throw new Error('圆周点角度无效');
  const gap = config.gap ?? 8;
  if (config.radius !== undefined && (!Number.isFinite(config.radius) || config.radius <= 0)) throw new Error('半径无效');
  if (config.center && (!Array.isArray(config.center) || config.center.length !== 2 || !config.center.every(Number.isFinite))) throw new Error('圆心无效');
  if (!Number.isFinite(gap) || gap < 2 || gap > 30 || A.draggable === true || (C.range && C.range !== 'opposite-arc') || (C.arc && C.arc !== 'opposite')) throw new Error('圆周点范围无效');
  const [state, setState] = useState(() => circleGeometry(A.angle, B.angle, C.angle, gap));
  const point = (angle, r = 145) => [260 + r * Math.cos(angle * Math.PI / 180), 190 - r * Math.sin(angle * Math.PI / 180)];
  const move = (key, angle) => setState((s) => {
    let b = angle;
    if (key === 'B' && (B.min !== undefined || B.max !== undefined)) {
      b = ((angle % 360) + 360) % 360;
      b = Math.max((B.min ?? 0) + (B.minExclusive ? gap : 0), Math.min(B.max ?? 360, b));
    }
    return circleGeometry(s.a, key === 'B' ? b : s.b, key === 'C' ? angle : s.c, gap);
  });
  const drag = (event, key) => {
    const svg = event.currentTarget.ownerSVGElement;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    move(key, Math.atan2(190 - p.y, p.x - 260) * 180 / Math.PI);
  };
  const pa = point(state.a), pb = point(state.b), pc = point(state.c);
  const line = (p, q) => `M${p.join(',')}L${q.join(',')}`;
  return <div className={styles.widget} data-widget="circle-angle">
    <svg viewBox="0 0 520 380" aria-label="拖动 B、C，观察同弧所对的圆心角和圆周角">
      <circle cx="260" cy="190" r="145" fill="none" stroke="var(--text-soft)" strokeWidth="1.8" />
      <path d={`${line(pa, [260,190])}${line([260,190], pb)}`} stroke="var(--course-blue)" fill="none" strokeWidth="2.5" />
      <path d={`${line(pa, pc)}${line(pc, pb)}`} stroke="var(--course-green)" fill="none" strokeWidth="2.5" />
      <circle cx="260" cy="190" r="3" fill="var(--text)" /><text x="246" y="215" fill="var(--text)" fontSize="18">O</text>
      {['A','B','C'].map((key) => {
        const p = point(state[key.toLowerCase()]);
        const label = point(state[key.toLowerCase()], 171);
        const movable = key === 'B' ? B.draggable !== false : key === 'C' && C.draggable !== false;
        return <g key={key}>
          <text x={label[0]} y={label[1]+6} textAnchor="middle" fill="var(--text)" fontSize="18">{key}</text>
          <circle cx={p[0]} cy={p[1]} r="6" fill={key === 'C' ? 'var(--course-green)' : 'var(--course-blue)'} />
          {movable && <circle cx={p[0]} cy={p[1]} r="24" fill="transparent" className={styles.handle} tabIndex="0" role="slider"
            aria-label={`圆周点 ${key}`} aria-valuemin="0" aria-valuemax="360" aria-valuenow={Math.round(state[key.toLowerCase()])}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e, key); }}
            onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) drag(e, key); }}
            onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
            onKeyDown={(e) => { if (['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)) { e.preventDefault(); move(key, state[key.toLowerCase()] + (['ArrowLeft','ArrowDown'].includes(e.key) ? -2 : 2)); } }} />}
        </g>;
      })}
    </svg>
    <p className={styles.readout}><strong style={{ color: 'var(--course-blue)' }}>∠AOB = {Math.round(state.central)}°</strong>；<strong style={{ color: 'var(--course-green)' }}>∠ACB = {Math.round(state.inscribed)}°</strong></p>
    <p className={styles.hint}>{state.central === 180 ? 'AB 是直径，圆周角是 90°。' : '拖动 B 改变弧 AB；沿另一侧圆弧拖动 C，圆周角不变。'}</p>
  </div>;
}
const functionColors = { k: 'var(--course-blue)', b: 'var(--course-green)', x: 'var(--course-blue)' };
const graphX = (x) => 260 + x * 40;
const graphY = (y) => 260 - y * 40;
const inWindow = (x, y) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 6 && Math.abs(y) <= 6;
const numberText = (n) => String(Number(n.toFixed(2)));
const graphPath = (points) => points.map((p, i) => `${i ? 'L' : 'M'}${graphX(p.x).toFixed(2)},${graphY(p.y).toFixed(2)}`).join(' ');

function FunctionPlane({ label, children }) {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 520 520" role="img" aria-label={label}>
    <title>{label}</title>
    <desc>横纵坐标范围均为负 6 到 6，每格表示 1，横纵刻度等距。</desc>
    <defs><clipPath id={id}><rect x="20" y="20" width="480" height="480" /></clipPath></defs>
    <g stroke="var(--border)" strokeWidth="1">{Array.from({ length: 13 }, (_, i) => i - 6).map((t) =>
      <path key={t} d={`M${graphX(t)} 20V500 M20 ${graphY(t)}H500`} />)}</g>
    <g stroke="var(--text-soft)" strokeWidth="1.5"><path d="M20 260H500 M260 500V20" /></g>
    <g clipPath={`url(#${id})`}>{children}</g>
    <g fill="var(--text-soft)" fontSize="14">
      <text x="504" y="282">x</text><text x="272" y="16">y</text><text x="240" y="280">O</text>
      {[-4, -2, 2, 4].map((t) => <g key={t}><text x={graphX(t)} y="280" textAnchor="middle">{t}</text><text x="270" y={graphY(t) + 5}>{t}</text></g>)}
    </g>
  </svg>;
}

function FunctionPoint({ x, y, color, label }) {
  if (!inWindow(x, y)) return null;
  return <g fill={color}>
    <circle cx={graphX(x)} cy={graphY(y)} r="5" stroke="var(--surface)" strokeWidth="1.5" />
    {label && <text x={graphX(x) + (x > 3 ? -12 : 12)} y={graphY(y) + (y > 5 ? 22 : -12)}
      textAnchor={x > 3 ? 'end' : 'start'} fontSize="16">{label}</text>}
  </g>;
}

function FunctionSliders({ configs, values, onChange }) {
  const keys = Object.keys(configs);
  const ticks = useMemo(() => Object.fromEntries(keys.map((key) => [key, sliderValues(configs[key])])), [configs]);
  return <div className={`${styles.sliders} ${keys.length === 1 ? styles.singleSlider : styles.functionSliders}`}>
    {keys.map((key) => <label key={key} style={{ '--slider-color': functionColors[key] }}>
      <span>{key} = <output>{values[key]}</output></span>
      <input aria-label={key} type="range" min="0" max={ticks[key].length - 1} step="1"
        value={ticks[key].indexOf(values[key])} aria-valuetext={String(values[key])}
        onChange={(e) => onChange(key, ticks[key][Number(e.target.value)])} />
      <span className={styles.range}>{ticks[key][0]} 至 {ticks[key].at(-1)}{configs[key].skip !== undefined ? `（跳过 ${configs[key].skip}）` : ''}</span>
    </label>)}
  </div>;
}

function LineExplorer({ config }) {
  validateFunctionWidget(config);
  const [values, setValues] = useState(() => ({ k: config.k.value, b: config.b.value }));
  const { k, b } = values;
  const points = Array.from({ length: 241 }, (_, i) => { const x = -6 + i / 20; return { x, y: k * x + b }; });
  return <div className={styles.widget} data-widget="line-explorer">
    <CourseMarkdown content={`$$${lineFormula(k, b)}$$`} />
    <FunctionPlane label="直线与坐标系">
      <path d={graphPath(points)} fill="none" stroke={functionColors.k} strokeWidth="2.5" />
      {k !== 0 && <FunctionPoint x={-b / k} y={0} color={functionColors.k} />}
      <FunctionPoint x={0} y={b} color={functionColors.b} />
      {(config.points || []).map((p, i) => <FunctionPoint key={i} x={p.x} y={k * p.x + b}
        color={p.x === 0 ? functionColors.b : functionColors.k} label={p.label || `(${numberText(p.x)}, ${numberText(k * p.x + b)})`} />)}
    </FunctionPlane>
    <CourseMarkdown className={styles.readout} content={k > 0 ? '向上倾斜（$k>0$）' : k < 0 ? '向下倾斜（$k<0$）' : '水平（$k=0$）'} />
    <p className={styles.readout} aria-live="polite">{lineQuadrantText(k, b)}</p>
    <p className={styles.hint}>与 y 轴交于 <strong style={{ color: functionColors.b }}>(0, {b})</strong>
      {k !== 0 && <>；与 x 轴交于 <strong style={{ color: functionColors.k }}>({numberText(-b / k)}, 0)</strong></>}
      {k === 0 && b === 0 && '；直线与 x 轴重合'}</p>
    <FunctionSliders configs={{ k: config.k, b: config.b }} values={values}
      onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))} />
  </div>;
}

function InverseExplorer({ config }) {
  validateFunctionWidget(config);
  const [values, setValues] = useState(() => ({ k: config.k.value, ...(config.point ? { x: config.point.x } : {}) }));
  const { k, x } = values;
  const branches = useMemo(() => inverseBranches(k), [k]);
  const y = x === undefined ? undefined : k / x;
  const operand = (n) => n < 0 ? `(${numberText(n)})` : numberText(n);
  // 有限小数直接显示；循环小数用分数验证，避免把近似值写成等式。
  const frac = `${k * x < 0 ? '-' : ''}\\dfrac{${Math.abs(k)}}{${Math.abs(x)}}`;
  const yTerm = y === undefined ? '' : Math.abs(Number(numberText(y)) - y) < 1e-10
    ? operand(y) : `\\left(${frac}\\right)`;
  const configs = { k: config.k, ...(config.point ? { x: { ...config.point, value: config.point.x } } : {}) };
  return <div className={styles.widget} data-widget="inverse-explorer">
    <CourseMarkdown content={`$$${inverseFormula(k)}$$`} />
    <FunctionPlane label="反比例函数的两支曲线与坐标系">
      {branches.map((points, i) => <path key={i} d={graphPath(points)} fill="none" stroke={functionColors.k} strokeWidth="2.5" />)}
      {config.point && <FunctionPoint x={x} y={y} color={functionColors.k} label="P" />}
    </FunctionPlane>
    <CourseMarkdown className={styles.readout} content={k > 0
      ? '$k>0$：图象在第一、第三象限，横纵坐标同号'
      : '$k<0$：图象在第二、第四象限，横纵坐标异号'} />
    {config.point && <>
      <p className={styles.readout}>P({numberText(x)}, {numberText(y)}){!inWindow(x, y) && '（超出视窗）'}</p>
      <CourseMarkdown className={styles.readout} content={`$x\\cdot y=k$：$${operand(x)}\\times${yTerm}=\\textcolor{#287fc4}{${k}}$`} />
      <p className={styles.hint}>乘积不变，始终等于 k。坐标读数最多保留两位小数。</p>
    </>}
    <FunctionSliders configs={configs} values={values}
      onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))} />
  </div>;
}


const nl = { a: 'var(--course-blue)', h: 'var(--course-coral)', k: 'var(--course-green)' };
function NumberLine({ config }) {
  validateNumberLine(config);
  const { mode, min, max } = config;
  const step = config.step || 1;
  const [value, setValue] = useState(config.value);
  const [rel, setRel] = useState(config.rel || '>');
  const px = (x) => 40 + ((x - min) / (max - min)) * 520;
  const ticks = Array.from({ length: Math.floor(max - min) + 1 }, (_, i) => min + i);
  const showNum = (n) => String(Number(n.toFixed(2)));
  const axis = <g>
    <path d="M20 80H580" stroke="var(--text-soft)" strokeWidth="2" />
    <path d="M580 80l-9-5v10z" fill="var(--text-soft)" />
    {ticks.map((t) => <g key={t}>
      <path d={`M${px(t)} 74V86`} stroke="var(--text-soft)" strokeWidth="1.5" />
      <text x={px(t)} y="108" textAnchor="middle" fontSize="14" fill="var(--text-soft)">{t}</text>
    </g>)}
  </g>;
  if (mode === 'abs') {
    const x = value; const ax = Math.abs(x);
    return <div className={styles.widget} data-widget="number-line">
      <svg viewBox="0 0 600 150" role="img" aria-label="数轴上的一对相反数">
        {axis}
        {x !== 0 && <>
          <path d={`M${px(0)} 50H${px(x)}`} stroke={nl.k} strokeWidth="3" />
          <path d={`M${px(0)} 50H${px(-x)}`} stroke={nl.k} strokeWidth="3" />
        </>}
        <circle cx={px(x)} cy="80" r="7" fill={nl.a} stroke="var(--surface)" strokeWidth="1.5" />
        {x !== 0 && <circle cx={px(-x)} cy="80" r="7" fill={nl.h} stroke="var(--surface)" strokeWidth="1.5" />}
        <text x={px(x)} y="36" textAnchor="middle" fontSize="16" fill={nl.a}>{showNum(x)}</text>
        {x !== 0 && <text x={px(-x)} y="36" textAnchor="middle" fontSize="16" fill={nl.h}>{showNum(-x)}</text>}
      </svg>
      <p className={styles.readout} aria-live="polite">{showNum(x)} 与 {showNum(-x)} 是一对相反数，到原点的距离都是 <strong style={{ color: nl.k }}>{showNum(ax)}</strong></p>
      <CourseMarkdown className={styles.readout} content={`$|${showNum(x)}|=${showNum(ax)}$，$|${showNum(-x)}|=${showNum(ax)}$`} />
      <div className={styles.sliders}><label style={{ '--slider-color': nl.a }}>
        <span>点的位置 = <output>{showNum(x)}</output></span>
        <input aria-label="点的位置" type="range" min={min} max={max} step={step} value={x}
          aria-valuetext={showNum(x)} onChange={(e) => setValue(Number(e.target.value))} />
        <span className={styles.range}>{min} 至 {max}</span>
      </label></div>
    </div>;
  }
  const { closed, toRight } = rayGeometry(value, rel);
  const end = px(toRight ? max : min);
  const sym = { '>': '>', '>=': '\\geqslant', '<': '<', '<=': '\\leqslant' }[rel];
  return <div className={styles.widget} data-widget="number-line">
    <CourseMarkdown content={`$$x${sym}${showNum(value)}$$`} />
    <svg viewBox="0 0 600 150" role="img" aria-label="不等式解集在数轴上的表示">
      {axis}
      <path d={`M${px(value)} 80H${end}`} stroke={nl.a} strokeWidth="5" />
      <circle cx={px(value)} cy="80" r="8" fill={closed ? nl.a : 'var(--surface)'} stroke={nl.a} strokeWidth="3" />
    </svg>
    <p className={styles.readout} aria-live="polite">{closed ? '实心点：端点本身也是解' : '空心圆圈：端点本身不是解'}；{toRight ? '向右' : '向左'}画，表示比 {showNum(value)} {toRight ? '大' : '小'}的数</p>
    <div className={styles.sliders}>
      <div role="group" aria-label="不等号" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(numberLineRelations).map(([r, name]) => <button key={r} type="button" aria-pressed={rel === r}
          onClick={() => setRel(r)} className={rel === r ? 'island-btn island-btn--primary' : 'island-btn'}>{name}</button>)}
      </div>
      <label style={{ '--slider-color': nl.a }}>
        <span>端点 = <output>{showNum(value)}</output></span>
        <input aria-label="端点" type="range" min={min} max={max} step={step} value={value}
          aria-valuetext={showNum(value)} onChange={(e) => setValue(Number(e.target.value))} />
        <span className={styles.range}>{min} 至 {max}</span>
      </label>
    </div>
  </div>;
}

export default function MathWidget({ config }) {
  if (config.type === 'parabola-explorer') return <Parabola config={config} />;
  if (config.type === 'circle-angle') return <CircleAngle config={config} />;
  if (config.type === 'line-explorer') return <LineExplorer config={config} />;
  if (config.type === 'inverse-explorer') return <InverseExplorer config={config} />;
  if (config.type === 'number-line') return <NumberLine config={config} />;
  throw new Error('未知组件');
}
