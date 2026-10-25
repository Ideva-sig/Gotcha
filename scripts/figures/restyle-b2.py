#!/usr/bin/env python3
"""实物感画法重画 b2 批：sink-float-forces、pendulum-energy、crowbar-lever-arms、pulley-rope-count。
坐标照抄 draw-ch8b.py（只读，未运行），只写 output/preview/fig-review/restyle/。
用法：python3 scripts/figures/restyle-b2.py
"""
import math
from pathlib import Path
from svgkit import *

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/restyle'
MAIN, THIN = 2.4, 1.6


def shape_fill(g, kind, color, opacity, attrs):
    g.raw(f'<{kind} {attrs} fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def box(g, x, y, w, h):
    g.rect(x, y, w, h, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'rect', YELLOW, .18, f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"')
    g.rect(x, y, w, h, GRAY, MAIN, fill='none')


def ball(g, cx, cy, r):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'circle', YELLOW, .18, f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')


def wheel(g, cx, cy, r):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    shape_fill(g, 'circle', GRAY, .08, f'cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')
    g.circle(cx, cy, 4, GRAY, THIN, fill='#fff')


def mount(g, x1, x2, y):
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


def sink_float():
    g = Fig(660, 300, "fl", "浮力与重力比较：上浮、悬浮、下沉、漂浮",
            "四个烧杯中物体受到竖直向上的浮力 F浮 和竖直向下的重力 G，线段长短表示力的大小。浸没的物体：F浮 大于 G 上浮，等于 G 悬浮，小于 G 下沉；漂浮在液面静止时 F浮 等于 G。静态图。")
    cases = [("上浮", 52, 34), ("悬浮", 44, 44), ("下沉", 34, 52), ("漂浮", 40, 40)]
    for k, (cap, fu, gw) in enumerate(cases):
        cx = 88 + k * 162; top = 40; bot = 230; L = 60
        surf = 80
        g.rect(cx - L + 1.2, surf, 2 * L - 2.4, bot - surf - 1.2, c="none", sw=0, fill=WATER)
        g.raw(f'<path d="M{cx-L} {top}V{bot}H{cx+L}V{top}" stroke="{GRAY}" stroke-width="{MAIN}" fill="none"/>')
        g.line(cx - L, surf, cx + L, surf, BLUE, THIN)
        oy = 160 if k < 3 else surf + 2
        if k < 3:
            box(g, cx - 17, oy - 17, 34, 34)
        else:
            box(g, cx - 17, oy - 22, 34, 34)
        c0 = (cx, oy) if k < 3 else (cx, oy - 5)
        g.arrow(c0[0], c0[1], c0[0], c0[1] - fu - 8, BLUE, 2.6, 11)
        g.arrow(c0[0], c0[1], c0[0], c0[1] + gw + 8, CORAL, 2.6, 11)
        g.dot(*c0, 3, INK)
        g.sym(c0[0] + 8, c0[1] - fu - 2, "F", sub="浮", c=BLUE, size=16)
        g.sym(c0[0] + 8, c0[1] + gw + 8, "G", c=CORAL, size=16)
        g.text(cx, 260, cap, anchor="middle")
        op = [">", "=", "<", "="][k]
        g.raw(f'<text class="fl-sy" x="{cx}" y="284" text-anchor="middle" style="fill:{SOFT};font-size:16px">F<tspan font-size="11" dy="3" font-style="normal">浮</tspan><tspan dy="-3" font-style="normal"> {op} </tspan>G</text>')
    return g.save(str(OUT / 'sink-float-forces.svg'))


def pendulum():
    g = Fig(560, 320, "pen", "摆动中动能和重力势能相互转化",
            "铁锁用细绳挂在 O 点，从 A 点由静止释放，摆到最低点 B 再摆到 C 点。A 到 B 重力势能转化为动能，B 到 C 动能转化为重力势能；忽略空气阻力时机械能守恒，C 与 A 一样高。静态图。")
    O = (280, 30); L = 210; th = math.radians(42)
    A = (O[0] - L * math.sin(th), O[1] + L * math.cos(th)); B = (O[0], O[1] + L); C = (O[0] + L * math.sin(th), O[1] + L * math.cos(th))
    mount(g, 220, 340, 30)
    g.raw(f'<path d="M{f(A[0])} {f(A[1])}A{L} {L} 0 0 0 {f(C[0])} {f(C[1])}" stroke="{LIGHT}" stroke-width="1.6" stroke-dasharray="6 5" fill="none"/>')
    for P_ in (A, C): g.line(*O, *P_, LIGHT, THIN, "5 4")
    g.line(*O, *B, GRAY, THIN)
    for P_ in (A, B, C): ball(g, P_[0], P_[1], 11)
    g.line(A[0] - 40, A[1], C[0] + 40, C[1], SOFT, THIN, "5 4")
    g.sym(O[0] + 8, O[1] + 52, "O", size=16)
    g.sym(A[0] - 22, A[1] - 14, "A", size=17); g.sym(B[0], B[1] + 34, "B", size=17, anchor="middle"); g.sym(C[0] + 16, C[1] - 14, "C", size=17)
    g.text(A[0] - 14, A[1] + 34, "势能最大", anchor="middle", c=BLUE, size=13)
    g.text(B[0], B[1] + 58, "动能最大", anchor="middle", c=CORAL, size=13)
    g.text(C[0] + 14, C[1] + 34, "与 A 一样高", anchor="middle", c=SOFT, size=13, weight=500)
    a21 = math.radians(21); g.text(O[0] - (L - 44) * math.sin(a21), A[1] + 30, "势能→动能", anchor="middle", size=13, c=INK, weight=500)
    g.text(O[0] + (L - 44) * math.sin(a21), C[1] + 30, "动能→势能", anchor="middle", size=13, c=INK, weight=500)
    return g.save(str(OUT / 'pendulum-energy.svg'))


def crowbar():
    g = Fig(640, 280, "lv", "撬棒的支点、动力、阻力和力臂",
            "撬棒绕支点 O 转动。动力 F1 竖直向下作用在撬棒左端，阻力 F2 是石头对撬棒竖直向下的力。F1 的作用线延长（虚线）后，从 O 向两条作用线作垂线段，得到动力臂 l1 和阻力臂 l2。静态图。")
    A = (70, 90); Bt = (502, 200.5); O = (414, 178)
    g.line(350, 212, 630, 212, GRAY, THIN)
    # 支点（机械本体：灰淡填充）
    tri = [(414, 181), (398, 212), (430, 212)]
    g.poly(tri, c=GRAY, w=MAIN, fill='#fff', close=True)
    pts = ' '.join(f'{x},{y}' for x, y in tri)
    shape_fill(g, 'polygon', GRAY, .08, f'points="{pts}"')
    g.poly(tri, c=GRAY, w=MAIN, fill='none', close=True)
    # 石头（被撬动的物体：黄淡填充）
    d = "M506 212C499 196 512 172 540 160C575 146 612 160 618 190C620 200 617 208 614 212"
    g.raw(f'<path d="{d}" stroke="{GRAY}" stroke-width="{MAIN}" fill="#fff"/>')
    g.raw(f'<path d="{d}" fill="{YELLOW}" fill-opacity=".18" stroke="none"/>')
    g.raw(f'<path d="{d}" stroke="{GRAY}" stroke-width="{MAIN}" fill="none"/>')
    # 杠杆本体：宽 9 的长条
    dx, dy = Bt[0] - A[0], Bt[1] - A[1]; n = math.hypot(dx, dy); hw = 4.5
    px, py = -dy / n * hw, dx / n * hw
    bar = [(A[0] + px, A[1] + py), (Bt[0] + px, Bt[1] + py), (Bt[0] - px, Bt[1] - py), (A[0] - px, A[1] - py)]
    g.poly(bar, c=GRAY, w=MAIN, fill='#fff', close=True)
    pts = ' '.join(f'{f(x)},{f(y)}' for x, y in bar)
    shape_fill(g, 'polygon', GRAY, .08, f'points="{pts}"')
    g.poly(bar, c=GRAY, w=MAIN, fill='none', close=True)
    g.line(70, 150, 70, 194, GRAY, THIN, "5 4"); g.line(500, 140, 500, 198, GRAY, THIN, "5 4")
    g.line(414, 178, 70, 178, BLUE, 2); g.right_angle(70, 178, (1, 0), (0, -1), 8, BLUE)
    g.line(414, 178, 500, 178, CORAL, 2); g.right_angle(500, 178, (-1, 0), (0, 1), 8, CORAL)
    g.arrow(70, 90, 70, 148, BLUE, 2.8, 13); g.arrow(500, 200, 500, 262, CORAL, 2.8, 13)
    g.dot(414, 178, 3.6, INK)
    g.sym(418, 166, "O"); g.sym(34, 132, "F", sub="1", c=BLUE); g.sym(510, 258, "F", sub="2", c=CORAL)
    g.sym(234, 202, "l", sub="1", c=BLUE); g.sym(452, 170, "l", sub="2", c=CORAL)
    return g.save(str(OUT / 'crowbar-lever-arms.svg'))


def pulley_rope():
    g = Fig(560, 380, "pul", "滑轮组中承担物重的绳段",
            "一个定滑轮和一个动滑轮组成的两种滑轮组。甲：绳子一端系在动滑轮上，动滑轮由 3 段绳子（红色）吊着，n=3，拉力 F 向上。乙：绳子一端系在定滑轮上，动滑轮由 2 段绳子（红色）吊着，n=2，拉力 F 向下。在两个滑轮之间画一条横线，数穿过横线、连着动滑轮的绳段。静态图。")
    R = 22
    for k, X in enumerate([150, 410]):
        Yf = 70; Ym = 250
        mount(g, X - 60, X + 60, 30)
        g.line(X, 30, X, Yf, GRAY, THIN)
        if k == 0:
            hook = (X, Ym - R - 12)
            g.line(*hook, X + R, Yf, CORAL, THIN)
            g.line(X - R, Yf, X - R, Ym, CORAL, THIN)
            g.line(X + R, Ym, X + R, Ym - 60, CORAL, THIN)
            g.arrow(X + R, Ym - 60, X + R, Ym - 98, BLUE, 2.6, 11); g.sym(X + R + 8, Ym - 80, "F", c=BLUE)
        else:
            hook = (X, Yf + R + 12)
            g.line(X - R, Yf, X - R, Ym, CORAL, THIN)
            g.line(X + R, Ym, *hook, CORAL, THIN)
            g.line(X + R, Yf, X + R, Yf + 60, GRAY, THIN)
            g.arrow(X + R, Yf + 60, X + R, Yf + 96, BLUE, 2.6, 11); g.sym(X + R + 8, Yf + 92, "F", c=BLUE)
        wheel(g, X, Yf, R); wheel(g, X, Ym, R)
        g.raw(f'<path d="M{X-R} {Yf}A{R} {R} 0 0 1 {X+R} {Yf}" stroke="{GRAY}" stroke-width="{THIN}" fill="none"/>')
        g.raw(f'<path d="M{X-R} {Ym}A{R} {R} 0 0 0 {X+R} {Ym}" stroke="{GRAY}" stroke-width="{THIN}" fill="none"/>')
        g.dot(*hook, 3.2, INK)
        g.line(X, Ym + R, X, Ym + R + 14, GRAY, THIN)
        box(g, X - 22, Ym + R + 14, 44, 36)
        g.line(X - 58, Ym - 50, X + 58, Ym - 50, SOFT, THIN, "5 4")
        g.text(X - 26, 358, "甲" if k == 0 else "乙", anchor="middle")
        g.sym(X + 14, 358, "n", anchor="middle"); g.text(X + 38, 358, "= 3" if k == 0 else "= 2", anchor="middle", weight=500)
    return g.save(str(OUT / 'pulley-rope-count.svg'))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (sink_float(), pendulum(), crowbar(), pulley_rope()):
        print(p)
