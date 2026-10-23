import { ISLAND_ICONS } from "./iconNames";

// 旧图标名 → 岛屿风彩色图标
const ALIAS = {
  "circle-check": "check",
  x: "close",
  "menu-2": "menu",
  "cloud-check": "cloud",
  cards: "book",
  notebook: "bookmark",
  "player-play": "play",
  "target-arrow": "flag",
  "list-details": "file",
  "list-numbers": "file",
  "math-function": "compass",
  "flask-2": "water-cup",
  "send-2": "mail",
};

// 彩色图标自带颜色；找不到对应的老图标退回单色（跟随文字颜色）。
export function Icon({ name, size = 20, className = "", decorative = true }) {
  const island = ISLAND_ICONS.has(name) ? name : ALIAS[name];
  if (island) {
    return (
      <img
        alt={decorative ? "" : name}
        aria-hidden={decorative ? "true" : undefined}
        className={`icon-art ${className}`}
        height={size}
        src={`/icons/island/${island}.svg`}
        width={size}
      />
    );
  }
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : name}
      className={`icon ${className}`}
      role={decorative ? undefined : "img"}
      style={{ width: size, height: size, WebkitMaskImage: url, maskImage: url }}
    />
  );
}
