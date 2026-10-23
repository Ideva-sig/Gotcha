"use client";

// 岛屿风小组件，样式在 src/app/island.css。tone 取 13 色之一：
// green pink purple blue yellow orange teal leaf red lime lemon brown peach
import { useId, useState } from "react";
import { Icon } from "../Icon";

const cx = (...parts) => parts.filter(Boolean).join(" ");
const toneClass = (tone) => (tone ? `tone-${tone}` : "");

// 标题：variant = ribbon（飘带，每页一条）/ layer（叠层板，大区块）/ tab（折角标签，卡片小标题）
export function Title({ as: Tag = "h2", variant = "ribbon", tone = "green", size, className, children, ...rest }) {
  const sizeClass = size ? `isl-title--${size}` : "";
  return (
    <Tag className={cx("isl-title", `isl-title--${variant}`, sizeClass, toneClass(tone), className)} {...rest}>
      {variant === "ribbon" && (
        <span className="isl-ribbon">
          <span className="isl-ribbonBack isl-ribbonBackLeft" />
          <span className="isl-ribbonBack isl-ribbonBackRight" />
          <span className="isl-ribbonFold isl-ribbonFoldLeft" />
          <span className="isl-ribbonFold isl-ribbonFoldRight" />
          <span className="isl-ribbonFront" />
          <span className="isl-ribbonText">{children}</span>
        </span>
      )}
      {variant === "layer" && (
        <span className="isl-layer">
          <span className="isl-layerFront">{children}</span>
        </span>
      )}
      {variant === "tab" && (
        <span className="isl-tab">
          <span className="isl-tabText">{children}</span>
        </span>
      )}
    </Tag>
  );
}

// 标签：variant = soft（淡底，默认）/ solid / outlined / dashed
export function Tag({ tone, variant = "soft", size = "sm", className, children }) {
  return (
    <span className={cx("isl-tag", `isl-tag--${size}`, `isl-tag--${variant}`, toneClass(tone), className)}>
      {children}
    </span>
  );
}

// 卡片：variant = plain（白纸）/ dashed / pattern（点阵底纹，只用在外壳区）/ solid
export function Card({ variant = "plain", tone, hoverable, as: Tag = "div", className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "isl-card",
        variant !== "plain" && `isl-card--${variant}`,
        hoverable && "isl-card--hover",
        toneClass(tone),
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// 分隔线：variant = dashed（默认）/ thin / dotted / wave / squiggle
export function Divider({ variant = "dashed" }) {
  return <hr aria-hidden="true" className={cx("isl-divider", variant !== "dashed" && `isl-divider--${variant}`)} />;
}

// 进度条
export function Progress({ value, max = 100, size = "md", tone, label, ariaLabel }) {
  const ratio = max > 0 && Number.isFinite(value) ? value / max : 0;
  const percent = Math.max(0, Math.min(100, ratio * 100));
  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={Number.isFinite(value) ? value : 0}
      className={cx("isl-progress", `isl-progress--${size}`, toneClass(tone))}
      data-tone={tone}
      role="progressbar"
    >
      <div className="isl-progressTrack">
        <div className="isl-progressFill" data-done={percent >= 100 && !tone} style={{ width: `${percent}%` }} />
      </div>
      {label !== undefined && <span className="isl-progressInfo">{label}</span>}
    </div>
  );
}

// 页签。items = [{ key, label, icon?, leaf?, content }]；bare = 只有一排胶囊（用来做模式切换）
export function Tabs({ items, defaultKey, bare, onChange }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const current = items.find((item) => item.key === active);
  return (
    <div className={cx("isl-tabs", bare && "isl-tabs--bare")}>
      <div className="isl-tabList" role="tablist">
        {items.map((item) => (
          <button
            aria-selected={item.key === active}
            className="isl-tabItem"
            key={item.key}
            onClick={() => {
              setActive(item.key);
              onChange?.(item.key);
            }}
            role="tab"
            type="button"
          >
            {item.icon && <Icon name={item.icon} size={18} />}
            {item.label}
            {item.key === active && !bare && <Leaf />}
          </button>
        ))}
      </div>
      {!bare && current?.content && (
        <div className="isl-tabPanel" key={current.key} role="tabpanel">
          {current.content}
        </div>
      )}
    </div>
  );
}

function Leaf() {
  return (
    <svg aria-hidden="true" className="isl-tabLeaf" viewBox="0 0 24 24">
      <path d="M4 20C4 9 11 3 21 3c0 10-6 17-17 17z" fill="#6fba2c" stroke="#3f7f14" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M4 20 15 9" fill="none" stroke="#3f7f14" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

// 圆形勾选框（type="radio" 时是单选）
export function Check({ checked, defaultChecked, onChange, type = "checkbox", name, children }) {
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const on = checked ?? inner;
  return (
    <label className="isl-check" data-checked={on}>
      <span className="isl-checkBox">
        <input
          checked={on}
          name={name}
          onChange={(event) => {
            setInner(event.target.checked);
            onChange?.(event.target.checked);
          }}
          type={type}
        />
        <span className="isl-checkSplash" />
        <svg aria-hidden="true" className="isl-checkMark" viewBox="0 0 13 12">
          <path d="M1.5 6.5 5 10 11.5 2" />
        </svg>
      </span>
      <span className="isl-checkLabel">{children}</span>
    </label>
  );
}

export function Switch({ checked, defaultChecked, onChange, label }) {
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const on = checked ?? inner;
  return (
    <button
      aria-checked={on}
      aria-label={label}
      className="isl-switch"
      onClick={() => {
        setInner(!on);
        onChange?.(!on);
      }}
      role="switch"
      type="button"
    >
      <span className="isl-switchHandle" />
    </button>
  );
}

// 折叠
export function Collapse({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="isl-collapse">
      <button
        aria-controls={id}
        aria-expanded={open}
        className="isl-collapseHead"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="isl-collapseArrow">
          <svg aria-hidden="true" height="14" viewBox="0 0 14 14" width="14">
            <path d="M3 5l4 4 4-4" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
          </svg>
        </span>
        <span>{title}</span>
      </button>
      <div className="isl-collapseBody" data-open={open} id={id}>
        <div className="isl-collapseInner">{children}</div>
      </div>
    </div>
  );
}

const NOTICE_ICON = { success: "check", info: "bulb", warning: "flame", error: "close" };

// 通知条：type = success / info / warning / error
export function Notice({ type = "info", title, children, icon }) {
  return (
    <div className={cx("isl-notice", `isl-notice--${type}`)} role={type === "error" ? "alert" : "status"}>
      <span className="isl-noticeIcon">
        <Icon name={icon || NOTICE_ICON[type]} size={24} />
      </span>
      <span className="isl-noticeBody">
        <strong>{title}</strong>
        {children && <span>{children}</span>}
      </span>
    </div>
  );
}

// 徽标：贴在子元素右上角；count 不传就是小红点
export function Badge({ count, children }) {
  return (
    <span className="isl-badge">
      {children}
      {count !== 0 && (
        <span className={cx("isl-badgeDot", count === undefined && "isl-badgeDot--dot")}>
          {count === undefined ? null : count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

export function Avatar({ src, name, size = 40, square, tone = "teal" }) {
  return (
    <span
      className={cx("isl-avatar", square && "isl-avatar--square", toneClass(tone))}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? <img alt="" src={src} /> : name?.slice(0, 1)}
    </span>
  );
}

export function AvatarGroup({ children }) {
  return <span className="isl-avatarGroup">{children}</span>;
}

export function Skeleton({ width = "100%", height = 16, round }) {
  return <span aria-hidden="true" className="isl-skeleton" style={{ width, height, borderRadius: round ? "50%" : undefined }} />;
}

// 提示气泡：点一下（或键盘聚焦）显示，iPad 上也能用
export function Tip({ text, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="isl-tip"
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
      onPointerEnter={(event) => event.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setOpen(false)}
    >
      <button
        aria-describedby={open ? id : undefined}
        className="island-btn island-btn--sm"
        onClick={() => setOpen(!open)}
        type="button"
      >
        {children}
      </button>
      {open && (
        <span className="isl-tipBubble" id={id} role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

// 分页：圆形页码
export function Pager({ total, defaultPage = 1, onChange }) {
  const [page, setPage] = useState(defaultPage);
  const go = (next) => {
    const value = Math.max(1, Math.min(total, next));
    setPage(value);
    onChange?.(value);
  };
  return (
    <nav aria-label="分页" className="isl-pager">
      <button aria-label="上一页" className="isl-pagerItem" disabled={page === 1} onClick={() => go(page - 1)} type="button">
        <Icon name="chevron-left" size={18} />
      </button>
      {Array.from({ length: total }, (_, index) => index + 1).map((n) => (
        <button
          aria-current={n === page ? "page" : undefined}
          className="isl-pagerItem"
          key={n}
          onClick={() => go(n)}
          type="button"
        >
          {n}
        </button>
      ))}
      <button aria-label="下一页" className="isl-pagerItem" disabled={page === total} onClick={() => go(page + 1)} type="button">
        <Icon name="chevron-right" size={18} />
      </button>
    </nav>
  );
}
