#!/usr/bin/env python3
"""实物感画法重画 b1 批（2026-10-25）：力三要素、测力计各部分、重力方向和重心、测摩擦力、纸条吹气。
坐标照抄 draw-ch8b.py，只改线宽、填充和支架画法。只写 output/preview/fig-review/restyle/。"""
from svgkit import *
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/restyle'
MAIN, THIN = 2.4, 1.6


def body(g, x, y, w, h, color, op, rx=0):
    """白底 + 淡色填充 + 灰色 2.4 轮廓。"""
    r = f' rx="{rx}"' if rx else ''
    g.raw(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"{r} fill="#fff" stroke="none"/>')
    g.raw(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"{r} fill="{color}" fill-opacity="{op}" stroke="none"/>')
    g.rect(x, y, w, h, GRAY, MAIN, fill='none', rx=rx)


def tint_circle(g, cx, cy, r, color, op):
    g.circle(cx, cy, r, GRAY, MAIN, fill='#fff')
    g.raw(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{color}" fill-opacity="{op}" stroke="none"/>')
    g.circle(cx, cy, r, GRAY, MAIN, fill='none')


def mount(g, x1, x2, y):
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


def force_three():
    g = Fig(560, 230, 'f3', '力的示意图怎样表示力的三要素',
            '一个木箱放在地面上，在木箱右侧中点用带箭头的线段表示一个向右上方的拉力：线段起点画在作用点上，箭头指向力的方向，线段长短表示力的大小。静态图。')
    g.line(40, 180, 520, 180, GRAY, 2)
    body(g, 110, 100, 140, 80, YELLOW, .18)
    P = (250, 140); E = (410, 60)
    g.dot(*P, 4.2, BLUE); g.arrow(*P, *E, BLUE, 2.8, 14)
    g.text(262, 166, '作用点', c=BLUE)
    g.text(422, 58, '方向', c=BLUE)
    nx, ny = (E[1] - P[1]) / ((E[0]-P[0])**2 + (E[1]-P[1])**2) ** .5, 0
    ux, uy = unit(E[0] - P[0], E[1] - P[1])
    nx, ny = uy, -ux
    a = (P[0] + nx * 22, P[1] + ny * 22); b = (E[0] + nx * 22, E[1] + ny * 22)
    g.line(*a, *b, SOFT, THIN); g.line(a[0]-nx*5, a[1]-ny*5, a[0]+nx*5, a[1]+ny*5, SOFT, THIN); g.line(b[0]-nx*5, b[1]-ny*5, b[0]+nx*5, b[1]+ny*5, SOFT, THIN)
    m = ((a[0]+b[0])/2 + nx*12, (a[1]+b[1])/2 + ny*12)
    g.text(m[0]-4, m[1]+2, '大小（长短）', c=SOFT, size=13, weight=500, anchor='end')
    return g.save(str(OUT / 'force-three-elements.svg'))


def scale_parts():
    g = Fig(420, 420, 'ssc', '弹簧测力计的零刻度线、量程、分度值和挂钩',
            '竖直放置的弹簧测力计，刻度板从 0 到 5 N，每 1 N 之间分成 5 个小格，每小格 0.2 N。左侧标出零刻度线、量程，右侧放大标出一个小格即分度值，下端标出挂钩，指针指在零刻度线上。静态图。')
    cx = 200; y0 = 90; unit_ = 50
    body(g, cx-30, 30, 60, 330, GRAY, .08, rx=6)
    g.circle(cx, 22, 8, GRAY, THIN, fill='none')
    g.rect(cx-14, y0-6, 28, 5*unit_+12, c=LIGHT, sw=1, fill='#fff')
    for i in range(26):
        y = y0 + i*unit_/5; big = i % 5 == 0
        g.line(cx + (-14 if big else -6), y, cx+14 if big else cx+6, y, INK, THIN)
        if big: g.text(cx+20, y+5, str(i//5), c=INK, size=13, weight=500)
    g.text(cx+36, y0+5*unit_+5, 'N', c=INK, size=13, weight=500)
    g.line(cx-26, y0, cx-24, y0, CORAL, 2); g.head(cx-15, y0, 1, 0, CORAL, 10)
    g.line(cx, 360, cx, 378, GRAY, THIN)
    g.raw(f'<path d="M{cx} 378 a10 10 0 1 1 -10 10" stroke="{GRAY}" stroke-width="{THIN}" fill="none"/>')
    g.line(cx-36, y0, cx-70, y0, SOFT, THIN); g.text(cx-74, y0+5, '零刻度线', c=INK, anchor='end')
    g.line(cx-46, y0, cx-46, y0+5*unit_, BLUE, 1.4); g.line(cx-51, y0, cx-41, y0, BLUE, 1.4); g.line(cx-51, y0+5*unit_, cx-41, y0+5*unit_, BLUE, 1.4)
    g.text(cx-56, y0+5*unit_/2-4, '量程', c=BLUE, anchor='end'); g.text(cx-56, y0+5*unit_/2+16, '0～5 N', c=BLUE, anchor='end', size=13, weight=500)
    ya = y0 + 3*unit_; yb = ya + unit_/5
    g.line(cx+44, ya, cx+60, ya, GREEN, 1.2); g.line(cx+44, yb, cx+60, yb, GREEN, 1.2)
    g.line(cx+56, ya, cx+56, yb, GREEN, 1.2)
    g.line(cx+60, (ya+yb)/2, cx+80, (ya+yb)/2, GREEN, 1.2)
    g.text(cx+84, (ya+yb)/2-3, '分度值', c=GREEN); g.text(cx+84, (ya+yb)/2+15, '一小格 0.2 N', c=GREEN, size=13, weight=500)
    g.line(cx-14, 395, cx-70, 395, SOFT, THIN); g.text(cx-74, 400, '挂钩', c=INK, anchor='end')
    return g.save(str(OUT / 'spring-scale-parts.svg'))


def gravity_cg():
    g = Fig(640, 260, 'cg', '重力的方向竖直向下；规则均匀物体的重心在几何中心',
            '左：铅垂线静止时细线竖直，重力 G 的方向竖直向下。右：方形薄板的重心在两条对角线的交点，球的重心在球心，粗细均匀的直棒的重心在中点。静态图。')
    mount(g, 30, 150, 24)
    g.line(90, 24, 90, 150, GRAY, THIN)
    pts = [(80, 150), (100, 150), (90, 176)]
    g.poly(pts, c=GRAY, w=MAIN, fill='#fff', close=True)
    g.raw('<path d="M80 150L100 150L90 176Z" fill="%s" fill-opacity=".18" stroke="none"/>' % YELLOW)
    g.poly(pts, c=GRAY, w=MAIN, close=True)
    g.arrow(90, 160, 90, 226, CORAL, 2.6, 12); g.sym(100, 222, 'G')
    g.text(90, 252, '铅垂线：竖直向下', anchor='middle', size=13)
    g.line(190, 20, 190, 240, '#d8dfe2', 1.4)
    body(g, 230, 70, 110, 110, YELLOW, .18)
    g.line(230, 70, 340, 180, GRAY, THIN, '5 4'); g.line(340, 70, 230, 180, GRAY, THIN, '5 4'); g.dot(285, 125, 4.4, CORAL)
    g.text(285, 214, '方形薄板', anchor='middle', size=13)
    tint_circle(g, 430, 125, 52, YELLOW, .18); g.dot(430, 125, 4.4, CORAL)
    g.text(430, 214, '球', anchor='middle', size=13)
    body(g, 510, 119, 110, 12, YELLOW, .18, rx=2); g.dot(565, 125, 4.4, CORAL)
    g.line(510, 144, 565, 144, SOFT, THIN); g.line(565, 144, 620, 144, SOFT, THIN)
    for x in (510, 565, 620): g.line(x, 139, x, 149, SOFT, THIN)
    g.text(565, 214, '均匀直棒', anchor='middle', size=13)
    g.text(425, 250, '红点：重心', anchor='middle', size=13, c=CORAL, weight=500)
    return g.save(str(OUT / 'gravity-direction-cg.svg'))


def friction():
    g = Fig(640, 220, 'fr', '用弹簧测力计水平匀速拉动木块，测滑动摩擦力',
            '木块放在水平长木板上，弹簧测力计水平拉着木块向右匀速运动。拉力 F 向右，长木板对木块的滑动摩擦力 f 向左，二力平衡，大小相等。静态图。')
    body(g, 30, 140, 580, 20, GRAY, .08)
    body(g, 150, 90, 100, 50, YELLOW, .18)
    g.line(250, 115, 300, 115, GRAY, THIN)
    g.raw('<rect x="300" y="103" width="170" height="24" rx="4" fill="#fff" stroke="none"/>')
    g.raw(f'<rect x="300" y="103" width="170" height="24" rx="4" fill="{GRAY}" fill-opacity=".08" stroke="none"/>')
    g.rect(316, 105, 138, 20, LIGHT, 1, fill='#fff')
    for i in range(11): g.line(320+i*13, 105, 320+i*13, 110 if i % 5 else 115, INK, THIN)
    g.rect(300, 103, 170, 24, GRAY, MAIN, fill='none', rx=4)
    g.line(470, 115, 520, 115, GRAY, THIN)
    g.line(520, 115, 560, 115, GRAY, THIN); g.text(568, 120, '拉', c=SOFT, size=13, weight=500)
    g.dot(200, 104, 3.2, BLUE); g.arrow(200, 104, 292, 104, BLUE, 2.8, 13); g.sym(296, 96, 'F', c=BLUE)
    g.dot(200, 128, 3.2, CORAL); g.arrow(200, 128, 108, 128, CORAL, 2.8, 13); g.sym(102, 124, 'f', c=CORAL, anchor='end')
    g.arrow(330, 60, 400, 60, GRAY, 1.6, 9); g.text(408, 65, '匀速运动', c=SOFT, size=13, weight=500)
    g.text(320, 190, '长木板', c=SOFT, size=13, weight=500, anchor='middle')
    g.text(200, 82, '木块', c=SOFT, size=13, weight=500, anchor='middle')
    return g.save(str(OUT / 'friction-measure.svg'))


def blow_paper():
    g = Fig(600, 260, 'blw', '向纸条上方吹气：上方流速大、压强小',
            '手持纸条一端，在纸条上方水平吹气。纸条上方空气流速大、压强小，下方空气流速小、压强大，上下压强差形成向上的压力差，纸条向上飘起。静态图，纸条画在飘起后的位置。')
    body(g, 40, 108, 26, 30, GRAY, .08, rx=4)
    g.text(53, 162, '手持', anchor='middle', size=13, c=SOFT, weight=500)
    g.raw(f'<path d="M66 116 C200 112 340 116 480 132" stroke="{INK}" stroke-width="{MAIN}" fill="none"/>')
    for y in (74, 94):
        g.line(110, y, 470, y, BLUE, 1.8, '10 7')
        g.head(482, y, 1, 0, BLUE, 11)
    g.text(66, 90, '吹气', c=BLUE, anchor='middle')
    g.text(240, 52, '流速大  压强小', c=BLUE, anchor='middle')
    g.text(240, 214, '流速小  压强大', c=SOFT, anchor='middle')
    g.arrow(300, 200, 300, 135, CORAL, 2.8, 13)
    g.text(312, 180, '压力差向上', c=CORAL)
    return g.save(str(OUT / 'blow-over-paper.svg'))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for p in (force_three(), scale_parts(), gravity_cg(), friction(), blow_paper()):
        print(p)
