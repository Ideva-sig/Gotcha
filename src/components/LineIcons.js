// 线条小图标：跟随文字颜色（currentColor），深浅色主题都不用额外处理

function Svg({ size, children, className, strokeWidth = 2 }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function ArrowRight({ size = 16, className }) {
  return (
    <Svg className={className} size={size}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeft({ size = 16, className }) {
  return (
    <Svg className={className} size={size}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function Check({ size = 14, className }) {
  return (
    <Svg className={className} size={size} strokeWidth={2.4}>
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
    </Svg>
  );
}

export function Cross({ size = 14, className }) {
  return (
    <Svg className={className} size={size} strokeWidth={2.4}>
      <path d="M7 7l10 10M17 7L7 17" pathLength="1" />
    </Svg>
  );
}

export function Chevron({ size = 16, className }) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function Play({ size = 14, className }) {
  return (
    <svg aria-hidden="true" className={className} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

export function Pause({ size = 14, className }) {
  return (
    <svg aria-hidden="true" className={className} height={size} viewBox="0 0 24 24" width={size}>
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
    </svg>
  );
}

export function Expand({ size = 14, className }) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </Svg>
  );
}

export function Close({ size = 18, className }) {
  return (
    <Svg className={className} size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}
