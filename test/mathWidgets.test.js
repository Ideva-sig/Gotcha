import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { packPath } from '../src/lib/contentPack.mjs';
import { parseWidget, sliderValues, ghostCoefficients, circleGeometry, mod, mathQuestionParts, lineQuadrants, lineQuadrantText, lineFormula, inverseFormula, inverseBranches, rayGeometry } from '../src/lib/mathWidgets.js';
import { createEmptyCourseV3, saveCourseV3Data, loadCourseV3Data, markKpVisited, setEvidenceCheck, recordAttempt, getActiveMistakes, getKpStatus, courseStorageKey } from '../src/lib/studyData.js';

test('real lesson widget parameters parse and slider grids skip zero', () => {
  let count = 0;
  for (const folder of ['g9a-26-quadratic-functions', 'g9a-29-circle']) {
    const lesson = fs.readFileSync(`course/math/${folder}/lesson.md`, 'utf8');
    for (const match of lesson.matchAll(/```widget\n([\s\S]*?)```/g)) {
      const config = parseWidget(match[1]); count++;
      if (config.type === 'parabola-explorer') {
        for (const key of ['a','h','k']) {
          const ticks = sliderValues(config[key]);
          assert.ok(ticks.includes(config[key].value));
          assert.equal(ticks[0], config[key].min);
          assert.equal(ticks.at(-1), config[key].max);
        }
        assert.ok(!sliderValues(config.a).includes(0));
      } else {
        assert.equal(circleGeometry(config.A.angle, config.B.angle, config.C.angle).central, 100);
      }
    }
  }
  assert.equal(count, 3);
});
test('widget parsing fails safely and ghost parsing never executes expressions', () => {
  assert.throws(() => parseWidget('type: unknown'));
  assert.throws(() => sliderValues({min:-1,max:1,step:0,value:0}));
  assert.throws(() => sliderValues({min:-1,max:1,step:1,value:0,skip:0}));
  assert.deepEqual(ghostCoefficients('y=-1/2(x+1)^2-1'), {a:-0.5,h:-1,k:-1});
  assert.throws(() => ghostCoefficients('globalThis.alert(1)'));
});
test('circle geometry stays on the opposite arc, excludes endpoints and matches actual angles', () => {
  for (let a=0; a<360; a+=30) for(let b=0;b<360;b+=7) for(let c=0;c<360;c+=17) {
    const g=circleGeometry(a,b,c); const sign=mod(g.b-g.a)<=180?1:-1;
    assert.ok(mod((g.c-g.a)*sign)>=g.central+8-1e-9);
    assert.ok(mod((g.c-g.a)*sign)<=352+1e-9);
    const point=t=>[Math.cos(t*Math.PI/180),Math.sin(t*Math.PI/180)];
    const A=point(g.a), B=point(g.b), C=point(g.c);
    const u=A.map((v,i)=>v-C[i]),v=B.map((n,i)=>n-C[i]);
    const angle=Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;
    assert.ok(Math.abs(angle-g.inscribed)<1e-6);
  }
  assert.equal(circleGeometry(0,179,230).inscribed,90);
});
test('real math multi-part questions track each numbered item, respecting selected parts', () => {
  const chapter = JSON.parse(fs.readFileSync(packPath('math', 'chapters', 'MATH-9A-26.json'), 'utf8'));
  const q = chapter.questions['Q-MATH-TB9A-26.1P-1'];
  assert.deepEqual(mathQuestionParts(q).map((p) => p.part), ['1', '2', '3', '4']);
  const selected = chapter.questions['Q-MATH-GZ2025-24-2'];
  assert.deepEqual(mathQuestionParts(selected, {note: '本章只做第（2）问'}).map((p) => p.part), ['2']);
  const kp = chapter.kps.find((k) => k.id === 'MATH-9A-26-1a');
  const data = createEmptyCourseV3(); data.visitedKps = [kp.id];
  data.attempts = ['1','2','3'].map((part) => ({questionId: q.id || 'Q-MATH-TB9A-26.1P-1', part, isCorrect: true}));
  assert.equal(getKpStatus(kp, chapter.questions, data), '未开始');
  data.attempts.push({questionId: 'Q-MATH-TB9A-26.1P-1', part: '4', isCorrect: true});
  assert.equal(getKpStatus(kp, chapter.questions, data), '已完成');
});
test('math attempts, evidence, multi-part completion and mistakes are isolated from physics', () => {
  for (const subject of ['physics','math']) saveCourseV3Data(createEmptyCourseV3(),subject);
  markKpVisited('PHY-9-13-1c'); const physics=JSON.stringify(loadCourseV3Data());
  const kp={id:'MATH-9A-26-1a',weight:'重点',evidence:['能做到'],blocks:[{heading:'练一练',questions:[{id:'Q-MATH-TEST'}]}]};
  const qs={'Q-MATH-TEST':{parts:[{part:1},{part:2}]}};
  markKpVisited(kp.id,'math');setEvidenceCheck(kp.id,0,true,'math');
  const attempt={questionId:'Q-MATH-TEST',kpId:kp.id,chapterId:'MATH-9A-26',userAnswer:'自评做错',isCorrect:false,errorTag:'计算'};
  recordAttempt({...attempt,part:'1'},'math');
  assert.equal(getKpStatus(kp,qs,loadCourseV3Data('math')),'未开始');
  recordAttempt({...attempt,part:'2',isCorrect:true},'math');
  assert.equal(getKpStatus(kp,qs,loadCourseV3Data('math')),'已完成');
  assert.equal(getActiveMistakes(qs,'math')[0].part,'1');
  recordAttempt({...attempt,part:'1',isCorrect:true},'math');
  assert.equal(getKpStatus(kp,qs,loadCourseV3Data('math')),'已掌握');
  assert.equal(getActiveMistakes(qs,'math').length,0);
  assert.equal(JSON.stringify(loadCourseV3Data()),physics);
  assert.notEqual(courseStorageKey('math'),courseStorageKey('physics'));
});

test('line quadrants cover all nine signs of k and b, including the axes', () => {
  const cases = [
    [2, 1, [1,2,3]], [2, -1, [1,3,4]], [2, 0, [1,3]],
    [-2, 1, [1,2,4]], [-2, -1, [2,3,4]], [-2, 0, [2,4]],
    [0, 1, [1,2]], [0, -1, [3,4]], [0, 0, []],
  ];
  for (const [k, b, expected] of cases) {
    assert.deepEqual(lineQuadrants(k, b), expected);
    // 在整条直线上取点独立核对，不依赖画面视窗。
    const observed = new Set();
    for (let x = -20; x <= 20; x += 0.25) {
      const y = k * x + b;
      if (x !== 0 && y !== 0) observed.add(x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3));
    }
    assert.deepEqual([...observed].sort(), expected);
  }
  assert.equal(lineQuadrantText(2, 0), '经过原点和第一、三象限');
  assert.equal(lineQuadrantText(-2, 0), '经过原点和第二、四象限');
  assert.equal(lineQuadrantText(0, 0), '图象与 x 轴重合，不经过任何象限');
});

test('function formula strings simplify unit slopes and zero intercepts with consistent colors', () => {
  assert.equal(lineFormula(1, 0), 'y=x');
  assert.equal(lineFormula(-1, 0), 'y=\\textcolor{#287fc4}{-}x');
  assert.equal(lineFormula(0, -2), 'y=\\textcolor{#197a60}{-2}');
  assert.equal(lineFormula(0, 0), 'y=\\textcolor{#197a60}{0}');
  assert.equal(lineFormula(2, -1), 'y=\\textcolor{#287fc4}{2}x-\\textcolor{#197a60}{1}');
  assert.equal(lineFormula(-0.5, 3), 'y=\\textcolor{#287fc4}{-0.5}x+\\textcolor{#197a60}{3}');
  assert.equal(inverseFormula(3), 'y=\\dfrac{\\textcolor{#287fc4}{3}}{x}');
  assert.equal(inverseFormula(-3), 'y=-\\dfrac{\\textcolor{#287fc4}{3}}{x}');
  assert.throws(() => inverseFormula(0), /不能为 0/);
});

const lineSource = 'type: line-explorer\nk: {min: -3, max: 3, step: 0.5, value: 2}\nb: {min: -4, max: 4, step: 1, value: -1}\npoints: [{x: 1}, {x: 0}]';
const inverseSource = 'type: inverse-explorer\nk: {min: -6, max: 6, step: 1, value: 3, skip: 0}\npoint: {x: 2, min: -6, max: 6, step: 0.5, skip: 0} # 可选';
test('function widgets parse optional points and discrete sliders skip forbidden values', () => {
  const line = parseWidget(lineSource);
  assert.deepEqual(line.points, [{x:1}, {x:0}]);
  assert.ok(sliderValues(line.k).includes(0));
  assert.ok(!sliderValues(parseWidget(lineSource.replace('value: 2}', 'value: 2, skip: [0, 0.5]}')).k).includes(0.5));
  const inverse = parseWidget(inverseSource);
  assert.equal(inverse.point.x, 2);
  assert.deepEqual(sliderValues(inverse.k), [-6,-5,-4,-3,-2,-1,1,2,3,4,5,6]);
  assert.ok(!sliderValues({...inverse.point, value: inverse.point.x}).includes(0));
  assert.equal(parseWidget(inverseSource.split('\npoint:')[0]).point, undefined);
  assert.equal(parseWidget(lineSource.replace('value: 2}', 'value: 0}')).k.value, 0);
});

test('new widget parsing rejects zero inverse coefficients, off-grid initials, invalid ranges and skips', () => {
  assert.throws(() => parseWidget(inverseSource.replace('value: 3', 'value: 0')), /初值无效/);
  assert.throws(() => parseWidget(inverseSource.replace(', skip: 0}', '}')), /必须跳过 0/);
  assert.throws(() => parseWidget(inverseSource.replace('x: 2', 'x: 0')), /初值无效/);
  assert.throws(() => parseWidget(inverseSource.replace('x: 2', 'x: 2.1')), /初值无效/);
  assert.throws(() => parseWidget(inverseSource.replace('step: 1', 'step: 0')), /参数无效/);
  assert.throws(() => parseWidget(lineSource.replace('value: 2', 'value: 2.1')), /初值无效/);
  assert.throws(() => parseWidget(lineSource.replace('value: -1', 'value: 5')), /初值无效/);
  assert.throws(() => parseWidget(lineSource.replace('max: 4', 'max: -4')), /参数无效/);
  assert.throws(() => parseWidget(lineSource.replace('value: 2}', 'value: 2, skip: 0.1}')), /skip/);
  assert.throws(() => parseWidget(lineSource.replace('value: 2}', 'value: 2, skip: foo}')), /skip/);
  assert.throws(() => parseWidget(lineSource.replace('value: 2}', 'value: 2, skip: 10}')), /skip/);
  assert.throws(() => parseWidget(lineSource.replace('{x: 1}', '{x: 1, y: 2}')), /不能提供 y/);
  assert.throws(() => parseWidget(lineSource.replace('{x: 1}', '{x: foo}')), /标记点/);
});

test('inverse branches are separate, sufficiently sampled, clipped and never reach x = 0', () => {
  for (const k of [-6,-3,-1,-0.01,0.01,1,3,6,36]) {
    const branches = inverseBranches(k);
    assert.equal(branches.length, 2);
    for (const [i, points] of branches.entries()) {
      assert.ok(points.length >= 80);
      for (const { x, y } of points) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        assert.ok(i === 0 ? x < 0 : x > 0);
        assert.ok(Math.abs(x) >= Math.abs(k) / 6 - 1e-12);
        assert.ok(Math.abs(x) <= 6 && Math.abs(y) <= 6 + 1e-12);
        assert.ok(Math.abs(x * y - k) < 1e-10);
        assert.equal(Math.sign(x * y), Math.sign(k));
      }
    }
  }
  assert.deepEqual(inverseBranches(40), [[], []]);
  assert.throws(() => inverseBranches(0));
  assert.throws(() => inverseBranches(NaN));
  assert.throws(() => inverseBranches(3, 6, 79));
});

test('number-line widget validates mode, range and relation', () => {
  const ok = parseWidget('type: number-line\nmode: abs\nmin: -6\nmax: 6\nvalue: 2\nstep: 0.5');
  assert.equal(ok.mode, 'abs');
  assert.ok(parseWidget('type: number-line\nmode: ray\nmin: -5\nmax: 5\nvalue: 2\nrel: ">="').rel === '>=');
  assert.throws(() => parseWidget('type: number-line\nmode: foo\nmin: -6\nmax: 6\nvalue: 2'), /模式/);
  assert.throws(() => parseWidget('type: number-line\nmode: abs\nmin: -6\nmax: 4\nvalue: 2'), /对称/);
  assert.throws(() => parseWidget('type: number-line\nmode: ray\nmin: -5\nmax: 5\nvalue: 9'), /范围/);
  assert.throws(() => parseWidget('type: number-line\nmode: ray\nmin: -5\nmax: 5\nvalue: 1\nrel: "="'), /不等号/);
  assert.deepEqual(rayGeometry(1, '>'), { closed: false, toRight: true });
  assert.deepEqual(rayGeometry(1, '<='), { closed: true, toRight: false });
});
