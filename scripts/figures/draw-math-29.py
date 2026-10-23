"""圆章必需配图；python3 scripts/figures/draw-math-29.py [PNG预览目录]。

几何位置由解析关系计算；步骤 SVG 默认完整可见，不写动画。
不修改原题图。圆周角采用数学极角（逆时针，0°在右）。
"""
from svgkit import *
from pathlib import Path
from html import escape
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'course/math/g9a-29-circle/figures'
PV = sys.argv[1] if len(sys.argv) > 1 else None
if PV:
    Path(PV).mkdir(parents=True, exist_ok=True)


def polar(o, r, angle):
    a = math.radians(angle)
    return o[0] + r * math.cos(a), o[1] - r * math.sin(a)


def segment(g, a, b, color=GRAY, width=2, dash=None):
    g.line(*a, *b, color, width, dash)


def arc(g, o, r, a, b, color=GRAY, width=2):
    g.arc(*o, r, -a, -b, color, width)


def sector(g, o, r, a, b, color=BLUE, opacity=0.12):
    p, q = polar(o, r, a), polar(o, r, b)
    g.raw(f'<path d="M{f(o[0])} {f(o[1])}L{f(p[0])} {f(p[1])}'
          f'A{f(r)} {f(r)} 0 {int(abs(b-a)>180)} {int(b<a)} {f(q[0])} {f(q[1])}Z" '
          f'fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def water_segment(g, o, r, color=BLUE, opacity=0.14):
    # 水深为半径的一半：水面端点位于210°、330°，下方小弧120°。
    a, b = polar(o, r, 210), polar(o, r, 330)
    g.raw(f'<path d="M{f(a[0])} {f(a[1])}A{f(r)} {f(r)} 0 0 0 '
          f'{f(b[0])} {f(b[1])}Z" fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def point(g, p, name, dx, dy, color=INK):
    g.dot(*p, 2.5, color)
    g.sym(p[0]+dx, p[1]+dy, name, c=color, size=18)


def radial_label(g, o, r, angle, name, color=INK):
    p = polar(o, r, angle)
    q = polar(o, r+18, angle)
    g.dot(*p, 2.5, color)
    g.sym(*[q[0], q[1]+6], name, c=color, anchor='middle', size=18)
    return p


def tick(g, a, b, color=GRAY, count=1, at=0.55, length=9):
    ux, uy = unit(b[0]-a[0], b[1]-a[1])
    for i in range(count):
        off = (i-(count-1)/2)*5
        x = a[0]+at*(b[0]-a[0])+off*ux
        y = a[1]+at*(b[1]-a[1])+off*uy
        g.line(x-uy*length/2, y+ux*length/2,
               x+uy*length/2, y-ux*length/2, color, 1.5)


def arc_tick(g, o, r, angle, color):
    segment(g, polar(o, r-4, angle), polar(o, r+4, angle), color, 1.5)


def angle_mark(g, vertex, a, b, radius, color):
    # 两条边的真实方向决定角弧。凸多边形内部角取小于180°的一段。
    t1 = math.degrees(math.atan2(-(a[1]-vertex[1]), a[0]-vertex[0]))
    t2 = math.degrees(math.atan2(-(b[1]-vertex[1]), b[0]-vertex[0]))
    diff = (t2-t1+180) % 360 - 180
    arc(g, vertex, radius, t1, t1+diff, color, 1.8)
    return abs(diff), t1+diff/2


def formula(g, x, y, chunks, size=18, anchor='middle'):
    """彩色短式；英文字母自动斜体，数字及运算符不斜体。"""
    spans = []
    for text, color in chunks:
        parts = []
        for ch in text:
            if ch.isascii() and ch.isalpha():
                parts.append(f'<tspan font-style="italic">{escape(ch)}</tspan>')
            else:
                parts.append(escape(ch))
        spans.append(f'<tspan fill="{color}">{"".join(parts)}</tspan>')
    g.raw(f'<text class="{g.p}-formula" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" '
          f'style="font-family:Times New Roman, PingFang SC, serif;font-size:{size}px;'
          f'font-weight:500;fill:{INK};stroke:none">{"".join(spans)}</text>')


def begin(g, n):
    g.raw(f'<g data-step="{n}">')


def end(g):
    g.raw('</g>')


def save(g, name):
    return g.save(str(OUT / name), PV)


def concepts():
    g = Fig(720, 320, 'circle-parts-29-1a', '圆中的直径、弦、弧及点的位置',
            '左图：AB是直径，蓝色AC为弦，绿色小弧AC为劣弧。右侧三个独立小图，'
            '半径相同，OP依次小于、等于、大于半径r，点P依次在圆内、圆上、圆外。静态图。')
    o, r = (130, 155), 90
    g.circle(*o, r)
    a, b, c = polar(o, r, 180), polar(o, r, 0), polar(o, r, 65)
    segment(g, a, b)
    segment(g, a, c, BLUE, 2.6)
    arc(g, o, r, 180, 65, GREEN, 3)
    for ang, name in [(180, 'A'), (0, 'B'), (65, 'C')]:
        radial_label(g, o, r, ang, name)
    point(g, o, 'O', 5, 22)
    formula(g, 130, 284, [('弦 AC', BLUE), ('   弧 AC', GREEN)])
    for x, ratio, relation, caption in [(340, .52, '<', '圆内'), (485, 1, '=', '圆上'), (630, 1.5, '>', '圆外')]:
        o, r = (x, 155), 44
        g.circle(*o, r)
        p = (x+r*ratio, 155)
        segment(g, o, (x, 155-r))
        segment(g, o, p)
        point(g, o, 'O', -16, 22)
        point(g, p, 'P', 3, 22)
        g.sym(x-17, 130, 'r', size=18)
        formula(g, x, 235, [('OP = d', GRAY)])
        formula(g, x, 261, [(f'd {relation} r', GRAY)])
        g.text(x, 288, caption, anchor='middle', size=14, c=SOFT, weight=500)
    save(g, 'circle-parts-29-1a.svg')


def perpendicular_bisector(g, a, b, o, half=93, count=2):
    mid = ((a[0]+b[0])/2, (a[1]+b[1])/2)
    u = unit(-(b[1]-a[1]), b[0]-a[0])
    segment(g, (o[0]-half*u[0], o[1]-half*u[1]),
            (o[0]+half*u[0], o[1]+half*u[1]), GRAY, 1.5, '5 4')
    g.right_angle(*mid, (a[0]-mid[0], a[1]-mid[1]), u, s=7)
    tick(g, a, mid, count=count, at=.52)
    tick(g, mid, b, count=count, at=.48)


def circumcircle():
    g = Fig(720, 310, 'circumcircle-29-1b', '作三角形的外接圆',
            '三步横向排列。第一步画三角形ABC；第二步作AB、BC的垂直平分线；'
            '第三步交于O，连接三条蓝色等长半径OA、OB、OC，并作经过三个顶点的圆。'
            '垂直平分线是虚线；AB两半用双刻痕、BC两半用三刻痕，三条半径用单刻痕。无动画。')
    for n, x in enumerate((120, 360, 600), 1):
        begin(g, n)
        o, r = (x, 149), 76
        a, b, c = [polar(o, r, t) for t in (115, 225, 330)]
        g.text(x, 30, ['三角形', '作垂直平分线', '找到外心'][n-1], anchor='middle', size=15)
        if n == 3:
            g.circle(*o, r)
        g.poly([a, b, c], close=True)
        if n >= 2:
            perpendicular_bisector(g, a, b, o)
            perpendicular_bisector(g, b, c, o, count=3)
        if n == 3:
            for p in (a, b, c):
                segment(g, o, p, BLUE, 2.5)
                tick(g, o, p, BLUE, at=.57)
            point(g, o, 'O', 8, 32)
            formula(g, x, 279, [('OA = OB = OC', BLUE)], size=18)
        for ang, name in [(115, 'A'), (225, 'B'), (330, 'C')]:
            radial_label(g, o, r, ang, name)
        end(g)
    save(g, 'circumcircle-29-1b.svg')


def chord_bisector():
    g = Fig(640, 340, 'chord-bisector-29-2a', '垂径定理与直径的反例',
            '左图：非直径弦AB为蓝色，直径CD经过圆心O，在E垂直于AB；AE与BE有相同刻痕。'
            '虚线OA是辅助半径。右图：两条不垂直的直径互相平分，说明推论必须排除直径。静态图。')
    o, r = (160, 156), 96
    g.circle(*o, r)
    h = .45*r
    t = math.degrees(math.asin(-h/r))
    a, b = polar(o, r, 180-t), polar(o, r, t)
    c, d, e = polar(o, r, 90), polar(o, r, 270), (o[0], o[1]+h)
    segment(g, c, d)
    segment(g, a, b, BLUE, 2.6)
    segment(g, o, a, GRAY, 1.6, '5 4')
    g.right_angle(*e, (-1, 0), (0, -1), s=9, c=BLUE)
    tick(g, a, e, BLUE); tick(g, e, b, BLUE)
    for ang, name in [(180-t, 'A'), (t, 'B'), (90, 'C'), (270, 'D')]:
        radial_label(g, o, r, ang, name)
    point(g, o, 'O', 12, 3)
    point(g, e, 'E', 12, 23)
    formula(g, 160, 307, [('AE = BE', BLUE)], size=20)
    o, r = (470, 156), 79
    g.circle(*o, r)
    for s, e, color in [(0, 180, BLUE), (55, 235, GRAY)]:
        a, b = polar(o, r, s), polar(o, r, e)
        segment(g, a, b, color, 2.4)
        tick(g, a, o, color, count=1 if color == BLUE else 2)
        tick(g, o, b, color, count=1 if color == BLUE else 2)
    for ang, name in [(180, 'A'), (0, 'B'), (55, 'C'), (235, 'D')]:
        radial_label(g, o, r, ang, name)
    point(g, o, 'O', 10, 24)
    g.text(470, 307, '互相平分 ≠ 互相垂直', anchor='middle', size=16, c=SOFT, weight=500)
    save(g, 'chord-bisector-29-2a.svg')


def bridge_geometry(x):
    # 不用舍入后的27.3画图：用讲义跨度与拱高的精确解析解。
    half, rise, scale = 18.5, 7.23, 4.3
    radius = (half**2+rise**2)/(2*rise)
    o = (x, 192)
    r = radius*scale
    d = (x, o[1]-(radius-rise)*scale)
    a, b = (x-half*scale, d[1]), (x+half*scale, d[1])
    c = (x, o[1]-r)
    angle = math.degrees(math.acos(half/radius))
    assert math.isclose(math.dist(o, a), r)
    return o, r, a, b, c, d, angle


def bridge():
    g = Fig(720, 580, 'bridge-radius-29-2b', '桥拱半径与平行弦的位置',
            '上方三步：桥拱弧AB与拱高CD；连接OA并作OD垂直AB；突出直角三角形OAD。'
            '蓝色半弦AD=18.5，绿色弦心距OD=R−7.23，灰色半径OA=R，勾股方程三项同色对应。'
            '下方无数值小图分别表示平行弦在圆心同侧和两侧，不显示练习的数值或结果。无动画。')
    for n, x in enumerate((120, 360, 600), 1):
        begin(g, n)
        g.text(x, 30, ['桥拱与拱高', '连接半径、作垂线', '直角三角形'][n-1], anchor='middle', size=15)
        o, r, a, b, c, d, ang = bridge_geometry(x)
        arc(g, o, r, 180-ang, ang, GRAY, 2.3)
        segment(g, a, b, GRAY, 1.8)
        segment(g, c, d, GRAY, 1.6, '4 3')
        if n >= 2:
            segment(g, o, a, GRAY, 2, '5 4')
            segment(g, o, d, GREEN if n == 3 else GRAY, 2.6 if n == 3 else 1.6, '5 4')
            g.right_angle(*d, (-1, 0), (0, 1), s=8)
            point(g, o, 'O', 4, 23)
        if n == 3:
            segment(g, a, d, BLUE, 3)
            segment(g, o, a, GRAY, 2.6, '5 4')
            formula(g, x, 255, [('AD = 18.5', BLUE)], size=18)
            formula(g, x, 283, [('OD = R−7.23', GREEN)], size=18)
            formula(g, x-63, 161, [('R', GRAY)], size=18)
        else:
            formula(g, x, 255, [('AB = 37', GRAY)], size=18)
            formula(g, x, 283, [('CD = 7.23', GRAY)], size=18)
        point(g, a, 'A', -17, 6)
        point(g, b, 'B', 6, 6)
        point(g, c, 'C', -7, -12)
        point(g, d, 'D', 7, -9)
        if n < 3:
            end(g)
    formula(g, 360, 333, [('R²', GRAY), (' = ', INK), ('18.5²', BLUE), (' + ', INK), ('(R−7.23)²', GREEN)], size=23)
    for x, offsets, caption in [(200, (-.68, -.27), '同侧：弦心距之差'), (520, (-.68, .27), '两侧：弦心距之和')]:
        o, r = (x, 452), 67
        g.circle(*o, r)
        for i, ratio in enumerate(offsets):
            dy = r*ratio
            hx = math.sqrt(r*r-dy*dy)
            segment(g, (x-hx, o[1]+dy), (x+hx, o[1]+dy), BLUE if i == 0 else GREEN, 2.4)
            segment(g, o, (x, o[1]+dy), GRAY, 1.5, '4 3')
            g.right_angle(x, o[1]+dy, (1, 0), (0, 1 if dy < 0 else -1), s=6)
        point(g, o, 'O', -20, 6)
        g.text(x, 553, caption, anchor='middle', size=16, c=SOFT, weight=500)
    end(g)
    save(g, 'bridge-radius-29-2b.svg')


def equal_arcs():
    g = Fig(640, 330, 'equal-arcs-29-2c', '等圆心角、等弧与等弦',
            '同一个圆O中，角AOB和角COD由旋转对应的两组半径围成；两个角及对应小弧为蓝色，'
            '等弦AB、CD为绿色。相等角有同样单弧，相等小弧有同样刻痕，相等弦有同样刻痕。'
            '仅表达讲义的等量关系，不给出练习的角度。静态图。')
    o, r = (175, 159), 99
    g.circle(*o, r)
    angles = [25, 85, 195, 255]
    pts = [polar(o, r, a) for a in angles]
    for p in pts:
        segment(g, o, p)
    for a, b, pa, pb in [(25, 85, pts[0], pts[1]), (195, 255, pts[2], pts[3])]:
        arc(g, o, 25, a, b, BLUE, 2)
        arc(g, o, r, a, b, BLUE, 3)
        arc_tick(g, o, r, (a+b)/2, BLUE)
        segment(g, pa, pb, GREEN, 2.5)
        tick(g, pa, pb, GREEN)
    for a, name in zip(angles, 'ABCD'):
        radial_label(g, o, r, a, name)
    point(g, o, 'O', 12, 24)
    formula(g, 458, 116, [('∠AOB = ∠COD', BLUE)], size=20)
    formula(g, 458, 166, [('弧 AB = 弧 CD', BLUE)], size=20)
    formula(g, 458, 216, [('AB = CD', GREEN)], size=20)
    save(g, 'equal-arcs-29-2c.svg')


def inscribed_angle():
    g = Fig(640, 350, 'inscribed-angle-29-2d', '圆周角组件的初始状态',
            '圆心O为原点，半径1。A极角0度，B极角100度，C极角230度。'
            '蓝色圆心角AOB为100度，绿色圆周角ACB为50度，两角对着同一条小弧AB。'
            '这是可拖动circle-angle组件的静态初始图，本SVG没有拖动或动画。')
    o, r = (205, 172), 121
    a, b, c = [polar(o, r, t) for t in (0, 100, 230)]
    g.circle(*o, r)
    arc(g, o, r, 0, 100, BLUE, 3)
    segment(g, o, a, BLUE, 2.3); segment(g, o, b, BLUE, 2.3)
    segment(g, c, a, GREEN, 2.3); segment(g, c, b, GREEN, 2.3)
    arc(g, o, 26, 0, 100, BLUE, 2)
    deg, bisector = angle_mark(g, c, a, b, 30, GREEN)
    assert math.isclose(deg, 50)
    q = polar(o, 63, 50)
    g.text(q[0], q[1]+5, '100°', BLUE, 'middle', 16, 500)
    q = polar(c, 54, bisector)
    g.text(q[0], q[1]+5, '50°', GREEN, 'middle', 16, 500)
    for ang, name in [(0, 'A'), (100, 'B'), (230, 'C')]:
        radial_label(g, o, r, ang, name)
    point(g, o, 'O', -18, 22)
    formula(g, 486, 130, [('∠AOB = 100°', BLUE)], size=23)
    formula(g, 486, 189, [('∠ACB = 50°', GREEN)], size=23)
    save(g, 'inscribed-angle-29-2d.svg')


def cyclic_quadrilateral():
    g = Fig(640, 340, 'cyclic-quadrilateral-29-2e', '圆内接四边形的对角互补',
            'A、B、C、D按圆周顺序排列，蓝色表示对角A与C，绿色表示对角B与D。'
            '两组对角各自的和为180度。角弧按实际边方向计算，不用等角刻痕。'
            '四边形不是平行四边形，不显示练习的矩形结论。静态图。')
    o, r = (170, 159), 107
    angles = [145, 245, 330, 415]
    pts = [polar(o, r, t) for t in angles]
    g.circle(*o, r)
    g.poly(pts, close=True)
    degrees = []
    for i, p in enumerate(pts):
        color = BLUE if i % 2 == 0 else GREEN
        deg, _ = angle_mark(g, p, pts[(i-1)%4], pts[(i+1)%4], 20, color)
        degrees.append(deg)
        radial_label(g, o, r, angles[i], 'ABCD'[i], color)
    assert math.isclose(degrees[0]+degrees[2], 180)
    assert math.isclose(degrees[1]+degrees[3], 180)
    formula(g, 468, 126, [('∠A + ∠C = 180°', BLUE)], size=22)
    formula(g, 468, 199, [('∠B + ∠D = 180°', GREEN)], size=22)
    save(g, 'cyclic-quadrilateral-29-2e.svg')


def arc_length():
    g = Fig(720, 310, 'arc-length-29-3a', '弧长占整圆周长的份额',
            '三步横向排列：整圆周长2πR；取圆心角n度的扇形；对应弧长l=(n/360)×2πR。'
            '圆周及所取弧为蓝色，半径R为绿色，式中的l与R同色对应。n为一般参数，不标示具体角度。无动画。')
    for n, x in enumerate((120, 360, 600), 1):
        begin(g, n)
        o, r = (x, 149), 74
        g.text(x, 30, ['整圆周长', '取一个扇形', '弧长的份额'][n-1], anchor='middle', size=15)
        if n == 1:
            g.circle(*o, r, BLUE, 2.5)
            segment(g, o, polar(o, r, 0), GREEN, 2.5)
            g.dot(*o, 2.5)
            g.sym(x+33, 136, 'R', c=GREEN)
            formula(g, x, 271, [('2π', BLUE), ('R', GREEN)], size=23)
        else:
            if n == 2:
                g.circle(*o, r)
            sector(g, o, r, 20, 130)
            for a in (20, 130):
                segment(g, o, polar(o, r, a), GREEN, 2.4)
            arc(g, o, r, 20, 130, BLUE, 3)
            arc(g, o, 22, 20, 130, GRAY, 1.4)
            g.dot(*o, 2.5)
            q = polar(o, 40, 75)
            formula(g, q[0], q[1]+5, [('n°', GRAY)], size=18)
            q = polar(o, r+20, 75)
            g.sym(q[0], q[1], 'l', c=BLUE, anchor='middle')
            g.sym(x+43, 158, 'R', c=GREEN)
            if n == 2:
                formula(g, x, 271, [('n°', GRAY)], size=23)
            else:
                formula(g, x, 271, [('l', BLUE), (' = (n/360)×2π', INK), ('R', GREEN)], size=19)
        end(g)
    save(g, 'arc-length-29-3a.svg')


def drainage():
    g = Fig(720, 355, 'drainage-area-29-3b', '有水面积等于扇形减三角形',
            '三步横向排列：排水管截面与水面AB；作OD垂直AB并连接OA、OB，标半径0.6米和水深0.3米；'
            '最后将扇形OAB分成淡蓝水域与淡绿三角形OAB，两块合起来是完整扇形。'
            '面积差中的扇形项为蓝色、三角形项为绿色，水域的弦与下方小弧完整显示。无动画。')
    for n, x in enumerate((120, 360, 600), 1):
        begin(g, n)
        o, r = (x, 157), 79
        a, b, c = [polar(o, r, t) for t in (210, 330, 270)]
        d = (x, o[1]+r/2)
        g.text(x, 30, ['截面与水面', '补出半径、垂线', '扇形减三角形'][n-1], anchor='middle', size=15)
        g.circle(*o, r)
        water_segment(g, o, r)
        if n == 3:
            # 扇形分成两个不重叠区域，避免透明叠色误导。
            g.raw(f'<path d="M{f(o[0])} {f(o[1])}L{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}Z" '
                  f'fill="{GREEN}" fill-opacity="0.15" stroke="none"/>')
        if n >= 2:
            for p in (a, b):
                segment(g, o, p, GRAY, 1.6, '5 4')
            if n == 2:
                segment(g, o, c, GRAY, 1.6, '5 4')
                segment(g, a, c, GRAY, 1.6, '5 4')
                g.right_angle(*d, (1, 0), (0, -1), s=7)
                point(g, d, 'D', 10, -8)
                point(g, c, 'C', -5, 26)
                formula(g, x-55, 167, [('0.6 m', GRAY)], size=16)
                formula(g, x+26, 216, [('0.3 m', GRAY)], size=14)
        segment(g, a, b, BLUE, 2.3)
        arc(g, o, r, 210, 330, BLUE, 2.7)
        radial_label(g, o, r, 210, 'A')
        radial_label(g, o, r, 330, 'B')
        point(g, o, 'O', -20, -8)
        if n < 3:
            end(g)
    formula(g, 360, 322, [('S', INK), (' = ', INK), ('S扇形OAB', BLUE), (' − ', INK), ('S△OAB', GREEN)], size=24)
    end(g)
    save(g, 'drainage-area-29-3b.svg')


def ellipse_arc(g, o, rx, ry, a, b, color, dash=None, width=2):
    # 底面圆的正投影。角度按屏幕坐标；原圆的点由三角函数计算。
    p = (o[0]+rx*math.cos(math.radians(a)), o[1]+ry*math.sin(math.radians(a)))
    q = (o[0]+rx*math.cos(math.radians(b)), o[1]+ry*math.sin(math.radians(b)))
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    g.raw(f'<path d="M{f(p[0])} {f(p[1])}A{f(rx)} {f(ry)} 0 {int(abs(b-a)>180)} '
          f'{int(b>a)} {f(q[0])} {f(q[1])}" stroke="{color}" stroke-width="{width}" fill="none"{ds}/>')
    return p, q


def cone(g, x, cutting=False):
    # 通用示意几何：r/l=1/3，展开角为2πr/l；不在图中标无题源数值。
    # 底面投影成椭圆，轮廓点取顶点到椭圆的精确切点，不手估。
    l, r, tilt = 132, 44, math.radians(21)
    h = math.sqrt(l*l-r*r)
    H, ry = h*math.cos(tilt), r*math.sin(tilt)
    base, top = (x, 215), (x, 215-H)
    tangent = math.degrees(math.asin(ry/H))
    left, right = ellipse_arc(g, base, r, ry, 180+tangent, 360-tangent, GREEN, '5 4')
    ellipse_arc(g, base, r, ry, 180+tangent, -tangent, GREEN, width=2.5)
    segment(g, top, left, BLUE, 2.7)
    segment(g, top, right, GRAY, 2)
    segment(g, base, (x+r, base[1]), GREEN, 1.7)
    g.dot(*base, 2.5)
    g.sym(x+54, base[1]+5, 'r', c=GREEN)
    g.sym(x-46, 156, 'l', c=BLUE)
    if cutting:
        # 标出已剪开的同一母线，不改变其长度，不添加任意角度数据。
        ux, uy = unit(left[0]-top[0], left[1]-top[1])
        mid = ((top[0]+left[0])/2, (top[1]+left[1])/2)
        g.line(mid[0]-uy*7, mid[1]+ux*7, mid[0]+uy*7, mid[1]-ux*7, BLUE, 1.5)
        g.text(x, 267, '沿蓝色母线剪开', c=BLUE, anchor='middle', size=14, weight=500)


def cone_net():
    g = Fig(720, 350, 'cone-net-29-3c', '圆锥沿母线剪开并展开',
            '三步横向排列：圆锥的底面半径r与母线l；沿蓝色母线剪开；展开为半径l的扇形。'
            '母线与扇形半径同为蓝色，底面圆周与扇形弧同为绿色；'
            '扇形弧长2πr等于底面周长，侧面积S侧=1/2×2πr×l。圆锥底面圆为正投影椭圆。'
            '示意比例不带数值标注，不显示练一练中滤纸或漏斗的结果。无动画。')
    for n, x in enumerate((120, 350, 590), 1):
        begin(g, n)
        g.text(x, 30, ['圆锥', '沿母线剪开', '展开扇形'][n-1], anchor='middle', size=15)
        if n < 3:
            cone(g, x, n == 2)
        else:
            o, r = (590, 78), 132
            sector(g, o, r, -150, -30, BLUE, .08)
            for a in (-150, -30):
                segment(g, o, polar(o, r, a), BLUE, 2.7)
            arc(g, o, r, -150, -30, GREEN, 3)
            g.dot(*o, 2.5)
            g.sym(514, 101, 'l', c=BLUE)
            g.sym(659, 101, 'l', c=BLUE)
            formula(g, 590, 244, [('2πr', GREEN)], size=21)
        if n < 3:
            end(g)
    formula(g, 360, 320, [('S侧', INK), (' = 1/2 × ', INK), ('2πr', GREEN), (' × ', INK), ('l', BLUE)], size=25)
    end(g)
    save(g, 'cone-net-29-3c.svg')


def verify_geometry():
    # SVG输出前做独立数值断言：圆上点、垂线、等量与例题几何一致。
    for x in (120, 360, 600):
        o, r, a, b, c, d, _ = bridge_geometry(x)
        assert math.isclose(math.dist(a, d)/4.3, 18.5)
        assert math.isclose(math.dist(c, d)/4.3, 7.23)
        assert math.isclose(math.dist(o, a)**2, math.dist(a, d)**2+math.dist(o, d)**2)
    o, r = (0, 0), 1
    a, b, c = [polar(o, r, t) for t in (0, 100, 230)]
    ca, cb = (a[0]-c[0], a[1]-c[1]), (b[0]-c[0], b[1]-c[1])
    angle = math.degrees(math.acos((ca[0]*cb[0]+ca[1]*cb[1])/(math.hypot(*ca)*math.hypot(*cb))))
    assert math.isclose(angle, 50)
    a, b = polar(o, .6, 210), polar(o, .6, 330)
    assert math.isclose(a[1], .3) and math.isclose(b[1], .3)
    assert math.isclose(math.dist(a, b), .6*math.sqrt(3))
    print('PASS 解析几何断言（桥拱、圆周角、排水管）')


if __name__ == '__main__':
    verify_geometry()
    for draw in (concepts, circumcircle, chord_bisector, bridge, equal_arcs,
                 inscribed_angle, cyclic_quadrilateral, arc_length, drainage, cone_net):
        draw()
    print(f'已生成10张SVG：{OUT}')
    if PV:
        print(f'PNG预览：{PV}')
