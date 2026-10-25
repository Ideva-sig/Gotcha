#!/usr/bin/env python3
"""实物感画法重画 b5 批：变阻器结构、条形磁体磁感线、继电器、环形电流小磁针（2026-10-25）。

用法：python3 scripts/figures/restyle-b5.py
坐标照抄 draw-opt-b.py / draw-ch9.py（只读，未运行），只改线宽与器材淡填充。
只写 output/preview/fig-review/restyle/，不碰 course/。
"""
import math
from pathlib import Path
from svgkit import *

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/preview/fig-review/restyle'
MAIN, THIN = 2.4, 1.6


def shape_fill(g, kind, color, opacity, attrs):
    g.raw(f'<{kind} {attrs} fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def body_rect(g, x, y, w, h, sw=MAIN, rx=0):
    """仪器本体：白底 + 灰色淡填充 + 灰轮廓。"""
    g.rect(x, y, w, h, GRAY, sw, fill='#fff', rx=rx)
    shape_fill(g, 'rect', GRAY, .08, f'x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{rx}"')
    g.rect(x, y, w, h, GRAY, sw, fill='none', rx=rx)


def mount(g, x1, x2, y):
    x = x1 + 4
    while x <= x2:
        g.line(x, y, x + 5.7, y - 5.7, GRAY, 1.4)
        x += 10
    g.line(x1, y, x2, y, GRAY, MAIN)


class BatchFig(Fig):
    def switch(self, x, y, vertical=False, closed=False, L=34):
        """闭合刀片精确接触两端；未闭合时沿用 svgkit 的课本符号。"""
        if not closed:
            return super().switch(x, y, vertical, closed, L)
        h = L / 2
        if vertical:
            self.rect(x-4, y-h, 8, L, c='none', sw=0)
            self.line(x, y-h, x, y+h, INK, 2)
            self.dot(x, y-h, 2.4, INK)
            self.dot(x, y+h, 2.4, INK)
        else:
            self.rect(x-h, y-4, L, 8, c='none', sw=0)
            self.line(x-h, y, x+h, y, INK, 2)
            self.dot(x-h, y, 2.4, INK)
            self.dot(x+h, y, 2.4, INK)



def rheostat_structure():
    g = BatchFig(650,410,'opt-b-rheostat','滑动变阻器结构与一上一下接法',
        '参考课本图16.4-2：上接线柱C、D连接金属杆，下接线柱A、B连接线圈两端，滑片P同时接触金属杆与电阻丝。示例选择B、D，一上一下接入；蓝色显示B到P的电阻丝及P经金属杆到D的连接，左侧未接入部分为线框灰。下方用课本变阻器符号表示同一接法。未标滑片移动方向、阻值变化或最大阻值位置，避免直接给出练习题结果。完整静态图，无动画。')
    left,right,px = 150,510,350
    y,amp,turns = 180,15,27
    # 密绕线圈用连续波线表示，无跨线旁路；px落在电阻丝上的准确交点。
    n = turns*24
    pts = [(left+(right-left)*i/n,y+amp*math.sin(2*math.pi*turns*i/n)) for i in range(n+1)]
    split = round(n*(px-left)/(right-left))
    assert abs(pts[split][0]-px) < 1e-9 and abs(pts[split][1]-y) < 1e-9
    body_rect(g,left,162,right-left,36,rx=6)  # 瓷筒
    g.poly(pts[:split+1],c=GRAY,w=THIN)
    g.poly(pts[split:],c=BLUE,w=THIN)
    g.wire([(90,210),(150,210),(150,y)],c=GRAY)
    g.wire([(510,y),(510,210),(560,210),(602,210)],c=BLUE)
    g.line(90,90,px,90,GRAY,MAIN)
    g.line(px,90,560,90,BLUE,MAIN)
    g.line(560,90,602,90,BLUE,2.2)
    g.line(px,90,px,y,BLUE,THIN)
    body_rect(g,px-9,76,18,27)
    g.dot(px,y,3,BLUE)
    for x,yy,label,color,ly in [(90,90,'C',GRAY,68),(560,90,'D',BLUE,68),
                              (90,210,'A',GRAY,239),(560,210,'B',BLUE,239)]:
        g.circle(x,yy,5,color,THIN)
        g.text(x,ly,label,anchor='middle',c=color)
    for yy in (90,210):
        g.circle(607,yy,4,BLUE,1.6)
    g.text(197,47,'金属杆',c=SOFT,size=13)
    g.line(222,58,222,84,GRAY,THIN)
    g.text(374,131,'滑片',c=SOFT,size=13)
    g.sym(374,158,'P')
    g.text(227,246,'线圈',c=SOFT,size=13)
    g.line(240,227,240,202,GRAY,1.6)
    g.text(468,275,'接 B、D',c=BLUE,anchor='middle')
    # 下面是同一B侧接法的标准符号，而不是另一个实验电路。
    g.text(55,326,'符号接法',size=13,c=SOFT)
    g.line(315,321,215,321,INK,2)
    g.rheo(325,345,315,L=160)
    g.line(405,345,555,345,INK,2)
    g.text(200,327,'D',anchor='end',c=BLUE)
    g.text(570,351,'B',c=BLUE)
    g.sym(328,317,'P')
    return g



def magnetic_field():
    # 以两异名磁极的场作为示意模型；坐标单位不代表实际物理数值。
    poles = ((230.,205.),(430.,205.))
    box = (215.,165.,445.,245.)
    # 示意画布纵向压缩；线和切向一起变换，不代表磁场数值或比例。
    yscale = .35

    def model_field(x,y):
        bx = by = 0.
        for (px,py),sign in zip(poles,(1.,-1.)):
            dx,dy = x-px,y-py
            radius = math.hypot(dx,dy)
            bx += sign*dx/radius**3
            by += sign*dy/radius**3
        return unit(bx,by)

    def field(x,y):
        ux,uy = model_field(x,205+(y-205)/yscale)
        return unit(ux,uy*yscale)

    def inside(p):
        return box[0] <= p[0] <= box[2] and box[1] <= p[1] <= box[3]

    def edge(a,b):
        # 二分得到磁体边界的精确交点，避免曲线进入磁体标签区。
        ai = inside(a)
        for _ in range(45):
            m = ((a[0]+b[0])/2,(a[1]+b[1])/2)
            if inside(m) == ai:
                a = m
            else:
                b = m
        return ((a[0]+b[0])/2,(a[1]+b[1])/2)

    def trace(angle):
        t = math.radians(angle)
        x,y = poles[0][0]+8*math.cos(t),poles[0][1]+8*math.sin(t)
        full = [(x,y)]
        for _ in range(2000):
            # midpoint积分，磁针严格沿同一场线的切向。
            ux,uy = model_field(x,y)
            mx,my = x+ux,y+uy
            vx,vy = model_field(mx,my)
            x,y = x+2*vx,y+2*vy
            full.append((x,y))
            if math.hypot(x-poles[1][0],y-poles[1][1]) < 8:
                break
        else:
            raise AssertionError('磁感线未回到S极')
        outside = [i for i,p in enumerate(full) if not inside(p)]
        a,b = outside[0],outside[-1]
        pts = [edge(full[a-1],full[a]),*full[a:b+1],edge(full[b],full[b+1])]
        pts = [(x,205+(y-205)*yscale) for x,y in pts]
        for p in pts:
            assert 22 < p[0] < 638 and 36 < p[1] < 374, p
        for p,q in zip(pts,pts[1:]):
            ux,uy = field(*p)
            assert (q[0]-p[0])*ux+(q[1]-p[1])*uy > 0
        return pts

    curves = [trace(a) for a in (-72,-100,-126,72,100,126)]
    g = BatchFig(660,420,'opt-b-magnet','条形磁体外部的磁感线与小磁针',
        '条形磁体左端为N极，右端为S极。外部六条磁感线均从N端出发回到S端，灰色箭头表示方向。三枚小磁针分别位于上方、左侧和右下方，珊瑚红为N端、蓝色为S端；N端严格沿对应磁感线的切向。磁感线在针下留白，文字离开曲线；不复刻练习题的四针位置、涂黑端或甲乙丙丁编号。磁感线是示意线而非真实存在的线。完整静态图，无动画。')
    # 分别选内侧顶部、外侧左端、外侧右下端；数量和布局不同于练习题。
    needles = {0:min(range(len(curves[0])),key=lambda i:curves[0][i][1]),
               2:min(range(len(curves[2])),key=lambda i:curves[2][i][0]),
               5:max(range(len(curves[5])),key=lambda i:curves[5][i][0])}
    for k,pts in enumerate(curves):
        ni = needles.get(k)
        if ni is None:
            g.poly(pts,c=GRAY,w=1.8)
        else:
            # 积分步长2，针长36；保留针端与场线至少8px间距。
            gap = 15
            g.poly(pts[:max(1,ni-gap)],c=GRAY,w=1.8)
            g.poly(pts[min(len(pts)-1,ni+gap):],c=GRAY,w=1.8)
        # 箭头位置不靠近针与磁体；切向由场函数计算。
        ai = round(len(pts)*(.66 if k%2 else .35))
        if ni is not None and abs(ai-ni) < 25:
            ai = round(len(pts)*.72)
        x,y = pts[ai]
        ux,uy = field(x,y)
        g.head(x+ux*4,y+uy*4,ux,uy,GRAY,9)
    body_rect(g,215,191,230,28)
    g.line(330,191,330,219,GRAY,THIN)
    g.text(246,212,'N',c=CORAL,anchor='middle',size=20)
    g.text(414,212,'S',c=BLUE,anchor='middle',size=20)
    for k,i in needles.items():
        x,y = curves[k][i]
        ux,uy = field(x,y)
        nx,ny = -uy,ux
        # N半针与B方向点积为正；S半针反向。
        nt = (x+18*ux,y+18*uy)
        st = (x-18*ux,y-18*uy)
        assert (nt[0]-x)*ux+(nt[1]-y)*uy > 0
        sides = [(x+5*nx,y+5*ny),(x-5*nx,y-5*ny)]
        g.poly([nt,*sides],c=CORAL,w=1.6,fill=CORAL,close=True)
        g.poly([st,*sides],c=BLUE,w=1.6,fill=BLUE,close=True)
        g.dot(x,y,2.2,'#fff')
        # 两端文字统一放在针的同一法向侧，不让场线穿字。
        offset = -17 if k == 0 else 17
        g.text(x+13*ux+offset*nx,y+13*uy+offset*ny+4,'N',c=CORAL,anchor='middle',size=12)
        g.text(x-13*ux+offset*nx,y-13*uy+offset*ny+4,'S',c=BLUE,anchor='middle',size=12)
    g.text(330,402,'磁体外部：N → S',anchor='middle',size=13,c=SOFT)
    return g



def colored_component(g, method, color, *args, **kwargs):
    """沿用 svgkit 的课本元件，只将该元件染成所属电路颜色。"""
    start = len(g.items)
    getattr(g, method)(*args, **kwargs)
    g.items[start:] = [item.replace(INK, color) for item in g.items[start:]]


def relay_structure():
    g = BatchFig(660,430,'opt-b-relay-structure','电磁继电器：控制电路通电',
        '参照课本图20.3-6的电磁铁、转动衔铁、弹簧与触点结构。蓝色低压控制电路的开关闭合，线圈通电，电磁铁向下吸引衔铁；衔铁绕左侧支点转动，使右端动触点与下方静触点接通，珊瑚红工作电路的另一电源向灯供电。弹簧上端固定、下端连衔铁，断电时向上拉回衔铁；灰色向上箭头表示弹簧回拉方向，蓝色向下箭头表示吸引方向。两电路没有导线连接，仅由衔铁机械控制触点。不标题目中的灯名、气敏电阻、浓度或答案。完整静态图，无动画。')
    g.text(330,30,'控制电路通电',anchor='middle')
    pivot, end = (155,150), (415,183)
    slope = (end[1]-pivot[1])/(end[0]-pivot[0])
    def arm_y(x):
        return pivot[1]+(x-pivot[0])*slope

    # 支点在左，铁芯在衔铁下方；所有机械件均不接线圈。
    g.poly([(155,153),(143,171),(167,171)],c=GRAY,w=THIN,close=True,fill='#fff')
    shape_fill(g,'path',GRAY,.08,'d="M155 153L143 171L167 171Z"')
    g.line(155,171,155,295,GRAY,THIN)
    g.line(133,295,301,295,GRAY,THIN)
    g.line(*pivot,*end,GRAY,MAIN)
    g.dot(*pivot,3,GRAY)
    g.text(106,148,'支点',anchor='middle',size=13,c=SOFT)
    g.text(321,112,'衔铁',anchor='middle')
    g.line(321,122,321,arm_y(321)-7,GRAY,THIN)

    # 拉簧固定在上方，通电后伸长；断电时回拉方向向上。
    sx, anchor, attach = 195, 70, arm_y(195)
    mount(g,sx-14,sx+14,anchor)
    spring = [(sx,anchor),(sx,anchor+9)]
    turns = 10
    for i in range(turns+1):
        spring.append((sx+(-5 if i%2 == 0 else 5),anchor+16+(attach-anchor-25)*i/turns))
    spring.extend([(sx,attach-3),(sx,attach)])
    g.poly(spring,c=GRAY,w=THIN)
    g.text(151,98,'弹簧',anchor='middle')
    g.arrow(214,131,214,89,GRAY,1.8,9)
    assert anchor < attach  # 拉簧回拉向上，与吸引方向相反。

    # 铁芯和线圈；导线从线圈两端分别引出，形成独立低压回路。
    body_rect(g,243,201,27,80)
    g.line(234,281,281,281,GRAY,THIN)
    coil = [(226,218)]
    for i in range(8):
        yy = 218+i*6
        coil.extend([(236,yy),(280,yy+4),(236,yy+6)])
    coil.append((287,266))
    g.poly(coil,c=BLUE,w=2)
    g.wire([(226,218),(45,218),(45,354),(320,354),(320,266),(287,266)],c=BLUE)
    colored_component(g,'battery',BLUE,120,354)
    colored_component(g,'switch',BLUE,230,354,closed=True)
    g.text(120,392,'低压电源',anchor='middle',size=13,c=BLUE)
    g.text(257,320,'电磁铁',anchor='middle')
    g.line(257,302,257,287,GRAY,THIN)
    g.arrow(257,arm_y(257)+9,257,195,BLUE,2.2,9)
    assert arm_y(257) < 201  # 衔铁被吸向下方铁芯。

    # 右端动触点随衔铁运动，下方静触点固定；两接触面相切。
    contact_x, moving_y, fixed_y, r = 399, 187, 195, 4
    g.line(contact_x,arm_y(contact_x),contact_x,moving_y,GRAY,THIN)
    g.wire([(contact_x,moving_y),(372,181),(345,181),(345,354),
            (610,354),(610,fixed_y),(contact_x,fixed_y)],c=CORAL)
    g.dot(contact_x,moving_y,r,CORAL)
    g.dot(contact_x,fixed_y,r,CORAL)
    assert fixed_y-moving_y == 2*r  # 闭合态：动静触点无缝接触。
    colored_component(g,'battery',CORAL,475,354)
    colored_component(g,'lamp',CORAL,610,273,r=16)
    g.text(475,392,'另一电源',anchor='middle',size=13,c=CORAL)
    g.text(577,278,'灯',anchor='end',size=13,c=CORAL)
    g.text(475,139,'触点',anchor='middle')
    g.poly([(475,150),(433,162),(408,183)],c=GRAY,w=THIN)
    g.text(478,237,'动、静触点接通',anchor='middle',size=13,c=CORAL)
    # 工作回路最左导线在 x=345，控制回路最右导线在 x=320。
    assert 345 > 320
    g.text(175,419,'控制电路',anchor='middle',c=BLUE)
    g.text(477,419,'工作电路',anchor='middle',c=CORAL)
    return g


def ring_current():
    g = Fig(560, 300, 'ring', '环形电流右侧小磁针的指向',
            '照课本图 20-4：圆环跟纸面垂直，环上朝向读者的一半（右半，实线）电流向下，背向读者的一半画成虚线。由安培定则，环形电流右端是 N 极，所以右侧小磁针静止时 N 极指向右。静态图。')
    X = 230; cx = X + 26; cy = 150; rx = 26; ry = 88
    g.line(X, 18, X, 282, GRAY, 3)
    g.arrow(X, 70, X, 38, INK, 1.8, 9); g.sym(X + 10, 48, "I", size=17)
    g.arrow(X, 268, X, 236, INK, 1.8, 9); g.sym(X + 10, 262, "I", size=17)
    g.raw(f'<path d="M{cx} {cy-ry}A{rx} {ry} 0 0 0 {cx} {cy+ry}" stroke="{GRAY}" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>')
    g.raw(f'<path d="M{cx} {cy-ry}A{rx} {ry} 0 0 1 {cx} {cy+ry}" stroke="{INK}" stroke-width="3" fill="none"/>')
    g.head(cx + rx, cy + 12, 0, 1, CORAL, 13)
    nx, ny = 420, 150
    g.poly([(nx - 46, ny), (nx, ny - 9), (nx, ny + 9)], c=BLUE, w=1.4, fill=BLUE, close=True)
    g.poly([(nx + 46, ny), (nx, ny - 9), (nx, ny + 9)], c=CORAL, w=1.4, fill=CORAL, close=True)
    g.dot(nx, ny, 2.4, "#fff")
    g.text(nx + 46, ny - 16, "N", c=CORAL, anchor="middle"); g.text(nx - 46, ny - 16, "S", c=BLUE, anchor="middle")
    return g


JOBS = [
    ('rheostat-structure-wiring.svg', rheostat_structure),
    ('bar-magnet-field-compasses.svg', magnetic_field),
    ('relay-structure.svg', relay_structure),
    ('ring-current-compass.svg', ring_current),
]

if __name__ == '__main__':
    for name, maker in JOBS:
        print(maker().save(str(OUT / name)))
