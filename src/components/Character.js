"use client";

import Link from "./CourseLink";
import { useEffect, useState } from "react";
import { CourseMarkdown } from "./CourseMarkdown";
import { ArrowRight, Close } from "./LineIcons";
import styles from "./Character.module.css";

// 角色台词：头像 + 气泡。台词和头像对应关系来自 course/physics/fun-lines.yml

const TONES = ["blue", "coral", "yellow", "green"];

function toneOf(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export function pickLine(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function Avatar({ who, avatars = {}, cheer = false, size = 48 }) {
  const slug = avatars[who];
  const [broken, setBroken] = useState(false);
  const name = who.replace(/《.*$/, "");
  const showImage = slug && !broken;

  return (
    <div
      className={`${styles.avatar} ${cheer ? styles.avatarCheer : ""}`}
      data-tone={cheer ? "green" : toneOf(name)}
      style={{ "--size": `${size}px` }}
    >
      {showImage ? (
        <img alt="" onError={() => setBroken(true)} src={`/avatars/${slug}.png`} />
      ) : (
        <span>{[...name][0] || "?"}</span>
      )}
      {cheer && (
        <span aria-hidden="true" className={styles.burst}>
          {Array.from({ length: 12 }, (_, i) => (
            <i data-c={i % 4} key={i} style={{ "--a": `${i * 30}deg` }} />
          ))}
        </span>
      )}
    </div>
  );
}

export function SpeechBubble({ line, avatars, cheer = false, onNext, nextLabel = "换一句", className = "" }) {
  if (!line) return null;
  return (
    <section
      aria-label="角色台词"
      className={`${styles.quote} ${cheer ? styles.quoteCheer : ""} ${className}`}
    >
      <Avatar avatars={avatars} cheer={cheer} key={`${line.who}-${line.line}`} who={line.who} />
      <div className={styles.bubble} key={`b-${line.line}`}>
        <p className={styles.line}>
          <CourseMarkdown content={line.line} inline />
        </p>
        <p className={`${styles.who} ${onNext ? styles.whoWithNext : ""}`}>
          <span>—— {line.who}</span>
          {line.note && <span className={styles.note}>{line.note}</span>}
        </p>
        {onNext && (
          <button className={styles.next} onClick={onNext} type="button">
            {nextLabel}
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </section>
  );
}

// 屏幕下方弹出的庆祝条，几秒后自己收起
export function CheerToast({ line, avatars, actionHref, actionLabel, duration = 6000, onClose }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(true);
    const timer = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [line, duration, onClose]);
  if (!open || !line) return null;
  return (
    <div className={styles.toast} role="status">
      <Avatar avatars={avatars} cheer who={line.who} />
      <div className={styles.toastText}>
        <p className={styles.line}>
          <CourseMarkdown content={line.line} inline />
        </p>
        <p className={styles.who}>
          <span>—— {line.who}</span>
          {actionHref && (
            <Link className={styles.toastLink} href={actionHref}>
              {actionLabel} <ArrowRight size={12} />
            </Link>
          )}
        </p>
      </div>
      <button
        aria-label="关闭"
        className={styles.toastClose}
        onClick={() => {
          setOpen(false);
          onClose?.();
        }}
        type="button"
      >
        <Close size={16} />
      </button>
    </div>
  );
}
