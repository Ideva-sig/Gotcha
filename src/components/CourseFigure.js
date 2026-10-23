"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCourseSubject } from "./CourseSubject";
import { Close, Expand, Pause, Play } from "./LineIcons";
import styles from "./CourseFigure.module.css";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.__forceReducedMotion === true)
  );
}

// 支持 View Transitions 的浏览器里，放大图从原位置平滑展开；不支持时退回淡入缩放
function withTransition(update) {
  if (typeof document !== "undefined" && document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

function resolveSrc(src, subject) {
  if (/^(https?:)?\//.test(src)) return src;
  return `/app-data/${subject}/${src}`;
}

export function CourseFigure({ figure, className = "" }) {
  const subject = useCourseSubject();
  const containerRef = useRef(null);
  const [step, setStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const steps = subject === "math" ? [...new Set([...((figure?.svg || '').matchAll(/<g\b[^>]*\bdata-step=["'](\d+)["']/g))].map((m) => Number(m[1])))].sort((a, b) => a - b) : [];
  const count = steps.length;
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReduced(mql.matches); if (mql.matches) { setPlaying(false); setStep(null); } };
    const print = () => { setPlaying(false); setStep(null); };
    change();
    mql.addEventListener('change', change);
    window.addEventListener('beforeprint', print);
    return () => { mql.removeEventListener('change', change); window.removeEventListener('beforeprint', print); };
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setTimeout(() => {
      const next = (step ?? 0) + 1;
      setStep(next);
      if (next >= count) setPlaying(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [playing, reduced, step, count]);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSvgAnimation, setHasSvgAnimation] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const transitionName = `fig-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return undefined;

    setHasSvgAnimation(
      svg.querySelectorAll("animate, animateTransform, animateMotion, set").length > 0,
    );

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      if (!prefersReducedMotion()) return;
      try {
        svg.pauseAnimations?.();
        svg.setCurrentTime?.(0);
        setIsPaused(true);
      } catch (_) {}
    };
    applyMotionPreference();
    mql.addEventListener("change", applyMotionPreference);
    return () => mql.removeEventListener("change", applyMotionPreference);
  }, [figure]);

  const togglePause = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    try {
      if (isPaused) {
        svg.unpauseAnimations?.();
        setIsPaused(false);
      } else {
        // 停在第 0 秒：和打印出来的那一帧一致
        svg.pauseAnimations?.();
        svg.setCurrentTime?.(0);
        setIsPaused(true);
      }
    } catch (_) {}
  };

  const open = () => withTransition(() => setZoomed(true));
  const close = useCallback(() => withTransition(() => setZoomed(false)), []);

  useEffect(() => {
    if (!zoomed) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [zoomed, close]);

  if (!figure) return null;

  const captionText = figure.alt || figure.caption;
  const isSvg = figure.format === "svg" && figure.svg;
  if (!isSvg && !figure.src) return null;

  const steppedSvg = isSvg && step !== null ? figure.svg.replace(/<g\b([^>]*\bdata-step=["'](\d+)["'][^>]*)>/g,
    (tag, attrs, n) => steps.indexOf(Number(n)) >= step ? `<g ${attrs} data-step-hidden="true">` : tag) : figure.svg;
  const art = isSvg ? (
    <div className={`${styles.svgArt} course-figure-svg`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: steppedSvg }} />
  ) : (
    <img alt={captionText || "题目配图"} loading="lazy" src={resolveSrc(figure.src, subject)} />
  );

  return (
    <figure className={`${styles.figure} ${className}`} data-course-subject={subject}>
      <div
        className={styles.paper}
        ref={containerRef}
        style={{ viewTransitionName: zoomed ? "none" : transitionName }}
      >
        <div className={styles.artButton} onClick={open}>{art}</div>
        <div className={styles.tools}>
          {hasSvgAnimation && (
            <button
              aria-label={isPaused ? "播放动画" : "暂停，停在第一帧"}
              className={styles.tool}
              onClick={togglePause}
              title={isPaused ? "播放动画" : "暂停（停在第一帧）"}
              type="button"
            >
              {isPaused ? <Play /> : <Pause />}
            </button>
          )}
          <button
            aria-label="放大查看"
            className={styles.tool}
            onClick={open}
            title="放大查看"
            type="button"
          >
            <Expand />
          </button>
        </div>
      </div>
      {count > 0 && <div className="course-step-controls" role="group" aria-label="图解步骤">
        <button className="ui-command" disabled={reduced} onClick={() => { setStep(0); setPlaying(true); }} type="button">播放</button>
        <button className="ui-command" disabled={step === 0} onClick={() => { setPlaying(false); setStep(Math.max(0, (step ?? count) - 1)); }} type="button">上一步</button>
        <button className="ui-command" disabled={step === null || step >= count} onClick={() => { setPlaying(false); setStep(Math.min(count, step + 1)); }} type="button">下一步</button>
        <span aria-live="polite">{step === null || step === count ? "全部步骤" : `${step} / ${count} 步`}{reduced ? "（仅单步）" : ""}</span>
      </div>}
      {captionText && isSvg && <figcaption className={styles.caption}>{captionText}</figcaption>}

      {zoomed &&
        createPortal(
          <div className={styles.lightbox} onClick={close} role="presentation">
            <div
              aria-label={captionText || "放大的示意图"}
              aria-modal="true"
              className={styles.lightboxPaper}
              data-course-subject={subject}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              style={{ viewTransitionName: transitionName }}
            >
              {art}
              <button
                aria-label="关闭"
                autoFocus
                className={styles.lightboxClose}
                onClick={close}
                type="button"
              >
                <Close />
              </button>
            </div>
            {captionText && <p className={styles.lightboxCaption}>{captionText}</p>}
          </div>,
          document.body,
        )}
    </figure>
  );
}
