#!/usr/bin/env python3
"""实物感画法试画：滑轮、称重法两张（2026-10-24）。

用法：python3 scripts/figures/draw-style-pilot.py
坐标照抄 draw-opt-a.py 的 fixed-movable-pulleys、buoyancy-weighing，只改线宽、填充和支架画法，
规则见 course/FORMAT.md“实物感画法”。只写 output/preview/fig-review/style-pilot/，不接入讲义。
"""
from svgkit import *
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/style-pilot'
MAIN, THIN = 2.4, 1.6  # 主角轮廓、绳子与细部


def shape_fill(g, kind, color, opacity, attrs):
    g.raw(f'<{kind} {attrs} fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def box(g, x, y, w, h):
    """被提起、被称量的物体：黄色淡填充 + 灰色粗轮廓。"""
    g.rect(x, y, w, h, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', YELLOW, .18, f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"')
    g.rect(x, y, w, h, GRAY, MAIN, fill='none')


def wheel(g, cx, cy, r):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'circle', GRAY, .08, f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')
    g.circle(cx, cy, 4, GRAY, THIN, fill='#fff')


def mount(g, x1, x2, y):
    """固定横梁：粗线 + 上方一排 45° 短斜线。"""
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


def draw_pulleys():
    name = 'fixed-movable-pulleys'
    g = Fig(640, 390, 'pilot-' + name, '定滑轮和动滑轮的轴与物体',
            '左图定滑轮轴连接上方支架，物体挂在绳的一端，向下拉另一端。右图动滑轮轴连接物体，绳的一端固定上方，另一端向上拉，轴随物体一起上升。不标具体拉力或重量。（实物感画法试画版）')
    r = 28
    for cx in (160, 440):
        mount(g, cx - 62, cx + 62, 36)
    # 定滑轮：轴挂在支架上，绳绕上半周
    fx, fy = 160, 88
    g.line(fx, 36, fx, fy, GRAY, THIN)
    wheel(g, fx, fy, r)
    g.raw(f'<path d="M{fx-r} {fy}A{r} {r} 0 0 1 {fx+r} {fy}" stroke="{GRAY}" stroke-width="{THIN}"/>')
    g.line(fx - r, fy, fx - r, 258, GRAY, THIN)
    g.line(fx + r, fy, fx + r, 210, GRAY, THIN)
    g.arrow(fx + r, 210, fx + r, 262, BLUE, 2.6, 11)
    g.sym(fx + r + 15, 239, 'F', c=BLUE)
    box(g, fx - r - 24, 258, 48, 43)
    g.text(fx - r, 284, '物体', anchor='middle', size=13)
    g.text(68, 88, '轴固定', anchor='middle', size=13)
    g.line(101, 83, fx - 8, 83, GRAY, THIN)
    # 动滑轮：绳一端固定在支架，绕下半周，轴连物体
    mx, my = 440, 224
    g.line(mx - r, 36, mx - r, my, GRAY, THIN)
    g.line(mx + r, my, mx + r, 123, GRAY, THIN)
    g.arrow(mx + r, 123, mx + r, 66, BLUE, 2.6, 11)
    g.sym(mx + r + 15, 105, 'F', c=BLUE)
    wheel(g, mx, my, r)
    g.raw(f'<path d="M{mx-r} {my}A{r} {r} 0 0 0 {mx+r} {my}" stroke="{GRAY}" stroke-width="{THIN}"/>')
    g.line(mx, my + 5, mx, 294, GRAY, THIN)
    box(g, mx - 24, 294, 48, 43)
    g.text(mx, 320, '物体', anchor='middle', size=13)
    g.text(550, 216, '轴随物体', anchor='middle', size=13)
    g.line(mx + 9, my, 515, my, GRAY, THIN)
    g.arrow(549, 325, 549, 257, CORAL, 2.2, 10)
    g.text(567, 295, '上升', c=CORAL, size=13)
    g.text(160, 369, '定滑轮', anchor='middle')
    g.text(440, 369, '动滑轮', anchor='middle')
    return g.save(str(OUT / f'pilot-{name}.svg'))


def spring_scale(g, cx, top, end):
    # 吊环、外壳（灰淡填充）、白色刻度板、弹簧、指针、挂钩
    g.circle(cx, top - 9, 7, GRAY, THIN, fill='none')
    g.rect(cx - 18, top, 36, 126, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', GRAY, .08, f'x="{f(cx-18)}" y="{top}" width="36" height="126"')
    g.rect(cx + 5, top + 42, 12, 62, LIGHT, 1, fill='#fff')
    g.rect(cx - 18, top, 36, 126, GRAY, MAIN, fill='none')
    pts = [(cx, top + 8)]
    for i in range(9):
        pts.append((cx + (-6 if i % 2 == 0 else 6), top + 16 + (end - top - 24) * i / 8))
    pts.append((cx, end))
    g.poly(pts, w=THIN)
    g.line(cx, end, cx, top + 145, GRAY, THIN)
    for j in range(6):
        g.line(cx + 8, top + 48 + j * 10, cx + 15, top + 48 + j * 10, GRAY, THIN)
    g.line(cx - 13, end, cx - 5, end, CORAL, 1.8)
    g.raw(f'<path d="M{cx} {top+145}a7 7 0 1 1 -7 7" stroke="{GRAY}" stroke-width="{THIN}" fill="none"/>')


def draw_buoyancy():
    name = 'buoyancy-weighing'
    dy = 22  # 顶部加固定横梁，整图下移
    g = Fig(600, 365 + dy, 'pilot-' + name, '称重法测量浮力',
            '同一物体分别静止悬挂在空气中和浸没在液体中。测力计示数只用 G 和 F拉 标明，不标具体读数；液体中的物体不接触容器底或壁。（实物感画法试画版）')
    top = 39 + dy
    for i, cx in enumerate((155, 435)):
        mount(g, cx - 30, cx + 30, 14)
        g.line(cx, 14, cx, top - 16, GRAY, THIN)
        spring_scale(g, cx, top, (124 if i == 0 else 102) + dy)
        if i:
            cx0, half, ctop, bottom, surface = cx, 85, 197 + dy, 324 + dy, 223 + dy
            g.raw(f'<rect x="{cx0-half}" y="{surface}" width="{half*2}" height="{bottom-surface}" '
                  f'fill="{BLUE}" fill-opacity=".12" stroke="none"/>')
            g.poly([(cx0 - half, ctop), (cx0 - half, bottom), (cx0 + half, bottom), (cx0 + half, ctop)], w=MAIN)
            g.line(cx0 - half, surface, cx0 + half, surface, BLUE, 1.8)
        g.line(cx, top + 159, cx, 250 + dy, GRAY, THIN)
        box(g, cx - 24, 250 + dy, 48, 48)
        g.line(cx + 26, 111 + dy, cx + 59, 111 + dy, GRAY, THIN)
        g.sym(cx + 71, 117 + dy, 'G' if i == 0 else 'F', None if i == 0 else '拉', c=BLUE)
        g.text(cx, 350 + dy, '空气中' if i == 0 else '浸入液体', anchor='middle')
    return g.save(str(OUT / f'pilot-{name}.svg'))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (draw_pulleys(), draw_buoyancy()):
        print(p)
