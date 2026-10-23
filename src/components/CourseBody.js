"use client";
import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { CourseMarkdown } from './CourseMarkdown';
import { CourseFigure } from './CourseFigure';
import { useCourseSubject } from './CourseSubject';
import { parseWidget } from '@/lib/mathWidgets';
import { parseBridge } from '@/lib/bridgeCards';
import { parseThink, findThink } from '@/lib/thinkCards';
import { ThinkCard } from '@/components/physics/ThinkCard';
import BridgeCards from './math/BridgeCards';

const MathWidget = lazy(() => import('./math/MathWidget'));
class WidgetBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function WidgetSlot({ source, figure }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setEnabled(!media.matches);
    change(); media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  const fallback = figure ? <CourseFigure figure={figure} /> : <p>互动图暂不可用。</p>;
  let config;
  try { config = parseWidget(source); } catch { return fallback; }
  return <>
    <div className="course-widget-screen">
      {enabled ? <WidgetBoundary fallback={fallback}><Suspense fallback={fallback}><MathWidget config={config} /></Suspense></WidgetBoundary> : fallback}
    </div>
    <div className="course-widget-print">{fallback}</div>
  </>;
}

export function CourseBody({ body }) {
  const subject = useCourseSubject();
  const nodes = [];
  for (let i = 0; i < body.length; i++) {
    const item = body[i];
    if (item.type === 'figure') { nodes.push(<CourseFigure figure={item} key={i} />); continue; }
    if (item.type !== 'md') continue;
    const think = (subject === 'physics' || subject === 'chemistry') && findThink(item.text);
    if (think) {
      let config = null;
      try { config = parseThink(think.source); } catch { /* 格式错误时只显示前后文字，检查脚本会拦下 */ }
      const before = item.text.slice(0, think.index);
      const after = item.text.slice(think.index + think.length);
      nodes.push(<div key={i}>
        {before.trim() && <CourseMarkdown content={before} />}
        {config && <ThinkCard config={config} />}
        {after.trim() && <CourseMarkdown content={after} />}
      </div>);
      continue;
    }
    const bridge = subject === 'math' && item.text.match(/```bridge\s*\n([\s\S]*?)```/);
    if (bridge) {
      let config = null;
      try { config = parseBridge(bridge[1]); } catch { /* 格式错误时只显示前后文字，检查脚本会拦下 */ }
      const before = item.text.slice(0, bridge.index);
      const after = item.text.slice(bridge.index + bridge[0].length);
      nodes.push(<div key={i}>
        {before.trim() && <CourseMarkdown content={before} />}
        {config && <BridgeCards config={config} />}
        {after.trim() && <CourseMarkdown content={after} />}
      </div>);
      continue;
    }
    const match = subject === 'math' && item.text.match(/```widget\s*\n([\s\S]*?)```/);
    if (!match) { nodes.push(<CourseMarkdown content={item.text} key={i} />); continue; }
    const before = item.text.slice(0, match.index);
    const after = item.text.slice(match.index + match[0].length);
    // Exporter separates the following SVG into a figure block; only consume an adjacent fallback.
    const figure = !after.trim() && body[i + 1]?.type === 'figure' ? body[i + 1] : null;
    nodes.push(<div key={i}>
      {before.trim() && <CourseMarkdown content={before} />}
      <WidgetSlot source={match[1]} figure={figure} />
      {after.trim() && <CourseMarkdown content={after} />}
    </div>);
    if (figure) i++;
  }
  return nodes;
}
