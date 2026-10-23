#!/usr/bin/env python3
"""批次 b：九年级可选示意图；不接入讲义。

用法：python3 scripts/figures/draw-opt-b.py output/preview/fig-review/b
所有坐标、刻度、磁针方向由参数计算；仅覆盖本脚本清单内的新图。
返修可加 --only <文件名>，其余图和 PNG 不重写。
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
from html import escape
import argparse
from svgkit import *

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'course/physics'
DEFAULT_PREVIEW = ROOT / 'output/preview/fig-review/b'


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


def junction(g, x, y):
    g.dot(x, y, 3.2, INK)


def bracket(g, x1, x2, y, symbol, sub=None, color=CORAL):
    g.line(x1, y, x2, y, color, 1.6)
    for x in (x1, x2):
        g.line(x, y-4, x, y+4, color, 1.6)
    g.sym((x1+x2)/2, y-12, symbol, sub=sub, c=color, anchor='middle')


def energy_flow():
    g = BatchFig(620,260,'opt-b-energy','热机中燃料化学能的去向',
        '参考课本图14.3-2：燃料化学能一部分转化为有用机械能，另一部分随废气带走或以散热等方式损失。箭头仅表示能量去向，不表示能量大小或比例；不列效率、热量和练习题的结果。完整静态图，无动画。')
    g.text(38,133,'燃料化学能')
    g.arrow(163,128,248,128,GRAY,2.2,10)
    g.poly([(248,128),(294,128),(294,55),(390,55)],c=BLUE,w=2.2)
    g.head(400,55,1,0,BLUE,11)
    g.text(415,60,'有用机械能',c=BLUE)
    g.poly([(294,128),(294,145),(390,145)],c=CORAL,w=2.2)
    g.head(400,145,1,0,CORAL,11)
    g.text(415,150,'废气带走',c=CORAL)
    g.poly([(294,145),(294,217),(390,217)],c=CORAL,w=2.2)
    g.head(400,217,1,0,CORAL,11)
    g.text(415,222,'散热等损失',c=CORAL)
    return g


def atom_structure():
    # 通用结构，不对应具体元素；电子点只示意核外分布。
    g = BatchFig(620,300,'opt-b-atom-structure','原子结构',
        '通用原子结构示意：中心原子核标“＋”，核外电子点标“－”；原子核带正电，核外电子带负电。圆圈只示意核外运动，不表示真实固定轨道、具体元素、电子数量或空间比例。完整静态图，无动画。')
    g.text(310,30,'原子结构',anchor='middle')
    cx, cy, radius = 216, 155, 85
    g.circle(cx,cy,radius,GRAY,1.6)
    g.circle(cx,cy,27,CORAL,2)
    g.text(cx,cy+8,'＋',c=CORAL,anchor='middle',size=22)
    for angle in (-90,30,150):
        t = math.radians(angle)
        x,y = cx+radius*math.cos(t),cy+radius*math.sin(t)
        g.dot(x,y,5,BLUE)
        # 符号沿径向向外放置，离开轨道及电子点。
        offset = -19 if angle == 30 else 5  # 右下电子的负号避开引线。
        g.text(cx+(radius+22)*math.cos(t),cy+(radius+22)*math.sin(t)+offset,
               '－',c=BLUE,anchor='middle',size=16)
    g.text(360,140,'原子核带正电',c=CORAL)
    g.line(cx+35,cy,342,cy,CORAL,1.6)
    g.text(360,224,'核外电子带负电',c=BLUE)
    ex,ey = cx+radius*math.cos(math.radians(30)),cy+radius*.5
    g.poly([(ex+10,ey+8),(326,239),(343,239)],c=BLUE,w=1.6)
    return g


def current_electrons():
    g = BatchFig(600,340,'opt-b-directions','电流方向与金属导线中自由电子的移动方向',
        '电池长线在左为正极，短线在右为负极。蓝色箭头表示电池外部的电流：从正极经左侧导线、小灯泡、右侧导线回到负极。珊瑚红箭头仅标在金属导线旁，表示自由电子定向移动，方向与电流相反。不把电子箭头画入电池内部。完整闭合静态图，无动画。')
    g.wire([(100,85),(500,85),(500,235),(100,235),(100,85)])
    g.battery(300,85)
    g.lamp(300,235,r=18)
    g.text(279,57,'＋',anchor='middle',size=16)
    g.text(321,57,'－',anchor='middle',size=16)
    # 各段电流/电子箭头严格相反，颜色箭头与金属导线保持间距。
    pairs = [((235,65),(165,65),(165,105),(235,105)),
             ((445,65),(375,65),(375,105),(445,105)),
             ((80,125),(80,195),(120,195),(120,125)),
             ((520,195),(520,125),(480,125),(480,195)),
             ((170,258),(245,258),(245,214),(170,214)),
             ((355,258),(430,258),(430,214),(355,214))]
    for a,b,c,d in pairs:
        u = unit(b[0]-a[0],b[1]-a[1])
        v = unit(d[0]-c[0],d[1]-c[1])
        assert u[0]*v[0]+u[1]*v[1] < -0.999
        g.arrow(*a,*b,BLUE,2.2,10)
        g.arrow(*c,*d,CORAL,2.2,10)
    g.arrow(75,314,110,314,BLUE,2.2,10)
    g.text(122,319,'电流',c=BLUE)
    g.arrow(295,314,330,314,CORAL,2.2,10)
    g.text(342,319,'自由电子',c=CORAL)
    return g


def current_positions():
    g = BatchFig(660,535,'opt-b-current-points','串联与并联电路的三个电流测量位置',
        '上方两灯串联，A、B、C为依次测量电流的三个位置，各处电流表均串联。下方两灯并联，A、B电流表分别在两条支路，C电流表在分支点之外的干路。图中三个电流表代表测量位置，也可以同时串入；开关为闭合状态。未标电流示数、灯泡规格或练习题中先正常发光的灯泡。完整静态图，无动画。')
    g.text(330,27,'串联',anchor='middle')
    g.wire([(60,80),(600,80),(600,210),(60,210),(60,80)])
    for x, label in [(100,'A'),(320,'B'),(550,'C')]:
        g.meter(x,80,'A')
        g.text(x,58,label,anchor='middle')
    for x, sub in [(200,'1'),(440,'2')]:
        g.lamp(x,80)
        g.sym(x,116,'L',sub=sub,anchor='middle')
    g.battery(270,210)
    g.switch(435,210,closed=True)
    g.text(330,248,'并联',anchor='middle')
    g.wire([(60,395),(60,310),(600,310),(600,395)])
    g.wire([(60,395),(600,395)])
    g.wire([(60,395),(60,490),(600,490),(600,395)])
    for y, label, sub in [(310,'A','1'),(395,'B','2')]:
        g.meter(180,y,'A')
        g.text(180,y-23,label,anchor='middle')
        g.lamp(405,y)
        g.sym(405,y+35,'L',sub=sub,anchor='middle')
    g.meter(60,447,'A')
    g.text(87,452,'C')
    junction(g,60,395)
    junction(g,600,395)
    g.battery(310,490)
    g.switch(480,490,closed=True)
    return g


def voltmeter_dial():
    g = BatchFig(640,330,'opt-b-voltmeter','电压表两排刻度与量程',
        '参考课本图16.1-4及已有电流表画法：上排对应0至15V，下排对应0至3V。按讲义的小量程分度值等分刻度，两排刻度位置一一对应。仅标讲义已有的量程端点，不增加中间刻度数字。下方接线柱为负、3、15。不画指针，不给任何测量读数。完整静态图，无动画。')
    g.text(35,30,'接“15”读上排',c=BLUE)
    g.text(605,30,'接“3”读下排',c=CORAL,anchor='end')
    cx,cy,r = 320,253,170
    def ang(i):
        return math.radians(-145+110*i/30)
    g.arc(cx,cy,r,-145,-35,INK,1.6)
    for i in range(31):
        t = ang(i)
        length = 16 if i%10 == 0 else (11 if i%5 == 0 else 7)
        g.line(cx+r*math.cos(t),cy+r*math.sin(t),
               cx+(r+length)*math.cos(t),cy+(r+length)*math.sin(t),INK,1.6)
    # 硬规定0.3：讲义没有列出上排5、10等中间刻度数字，故只标量程端点。
    for j in (0,3):
        t = ang(j*10)
        g.text(cx+(r+32)*math.cos(t),cy+(r+32)*math.sin(t)+5,str(j*5),anchor='middle',c=BLUE,size=15)
        g.text(cx+(r-22)*math.cos(t),cy+(r-22)*math.sin(t)+5,str(j),anchor='middle',c=CORAL,size=15)
    g.text(cx,240,'V',anchor='middle',size=22)
    for x,label in [(250,'－'),(320,'3'),(390,'15')]:
        g.circle(x,285,6,GRAY,1.6)
        g.text(x,313,label,anchor='middle',size=13)
    return g


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
    g.poly(pts[:split+1],c=GRAY,w=1.8)
    g.poly(pts[split:],c=BLUE,w=1.8)
    g.wire([(90,210),(150,210),(150,y)],c=GRAY)
    g.wire([(510,y),(510,210),(560,210),(602,210)],c=BLUE)
    g.line(90,90,px,90,GRAY,2.2)
    g.line(px,90,560,90,BLUE,2.2)
    g.line(560,90,602,90,BLUE,2.2)
    g.line(px,90,px,y,BLUE,2.2)
    g.rect(px-9,76,18,27,GRAY,1.8)
    g.dot(px,y,3,BLUE)
    for x,yy,label,color,ly in [(90,90,'C',GRAY,68),(560,90,'D',BLUE,68),
                              (90,210,'A',GRAY,239),(560,210,'B',BLUE,239)]:
        g.circle(x,yy,5,color,1.8)
        g.text(x,ly,label,anchor='middle',c=color)
    for yy in (90,210):
        g.circle(607,yy,4,BLUE,1.6)
    g.text(197,47,'金属杆',c=SOFT,size=13)
    g.line(222,58,222,84,GRAY,1.6)
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


def ohm_simple():
    g = BatchFig(560,300,'opt-b-ohm','同一个定值电阻的电流和电压',
        '电源、闭合开关、电流表A和定值电阻R组成主回路，电压表V并联在R两端。蓝色I箭头表示通过R的电流，珊瑚红U表示电压表测量R两端电压，R标签对应同一个电阻。电流表、电压表均为正进负出。未标任何数值或计算结果。完整静态图，无动画。')
    g.wire([(80,110),(490,110),(490,250),(80,250),(80,110)])
    g.wire([(260,110),(260,50),(360,50),(360,110)])
    g.meter(155,110,'A')
    g.resistor(310,110)
    g.meter(310,50,'V')
    g.battery(250,250)
    g.switch(405,250,closed=True)
    junction(g,260,110)
    junction(g,360,110)
    g.arrow(200,110,240,110,BLUE,2.2,10)
    g.sym(220,145,'I',c=BLUE,anchor='middle')
    g.sym(310,145,'R',anchor='middle')
    g.sym(382,56,'U',c=CORAL)
    for x,yy,s in [(130,85,'＋'),(180,85,'－'),(285,26,'＋'),(335,26,'－')]:
        g.text(x,yy,s,size=12,anchor='middle',weight=500)
    return g


def division_comparison():
    g = BatchFig(660,385,'opt-b-division','串联分压与并联分流',
        '左侧两个定值电阻R1、R2串联，括号分别标出各电阻的电压U1、U2与总电压U；同一电流通过两个电阻，电阻越大分得的电压越大。右侧R1、R2并联，蓝色箭头表示干路电流I分为支路电流I1、I2；各支路电压相等，电阻越小通过的电流越大。电池正极均在左，外部电流方向由正极到负极。所有电阻符号、括号和箭头的长度均不表示数值、大小或比例。完整静态图，无动画。')
    g.text(170,25,'串联分压',anchor='middle')
    g.text(505,25,'并联分流',anchor='middle')
    g.wire([(40,145),(300,145),(300,260),(40,260),(40,145)])
    g.resistor(105,145)
    g.resistor(235,145)
    g.battery(170,260)
    g.sym(105,180,'R',sub='1',anchor='middle')
    g.sym(235,180,'R',sub='2',anchor='middle')
    bracket(g,40,300,63,'U')
    bracket(g,40,170,112,'U','1')
    bracket(g,170,300,112,'U','2')
    g.wire([(390,195),(390,110),(620,110),(620,195)])
    g.wire([(390,195),(620,195)])
    g.wire([(390,195),(390,270),(620,270),(620,195)])
    junction(g,390,195)
    junction(g,620,195)
    for y,sub in [(110,'1'),(195,'2')]:
        g.resistor(520,y)
        g.sym(520,y+33,'R',sub=sub,anchor='middle')
        g.arrow(413,y,460,y,BLUE,2.2,10)
        g.sym(437,y-17,'I',sub=sub,anchor='middle',c=BLUE)
    g.battery(505,270)
    g.arrow(390,255,390,216,BLUE,2.2,10)
    g.sym(368,244,'I',c=BLUE,anchor='middle')
    g.text(170,319,'各处电流相等',anchor='middle',size=13,c=SOFT,weight=500)
    g.text(505,319,'各支路电压相等',anchor='middle',size=13,c=SOFT,weight=500)
    g.text(170,351,'电阻越大，分压越大',anchor='middle',size=13,c=CORAL)
    g.text(505,351,'电阻越小，电流越大',anchor='middle',size=13,c=BLUE)
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
    g.rect(215,191,230,28,GRAY,2)
    g.line(330,191,330,219,GRAY,1.8)
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
    g.poly([(155,153),(143,171),(167,171)],c=GRAY,w=1.8,close=True,fill='#fff')
    g.line(155,171,155,295,GRAY,2)
    g.line(133,295,301,295,GRAY,2)
    g.line(*pivot,*end,GRAY,2.6)
    g.dot(*pivot,3,GRAY)
    g.text(106,148,'支点',anchor='middle',size=13,c=SOFT)
    g.text(321,112,'衔铁',anchor='middle')
    g.line(321,122,321,arm_y(321)-7,GRAY,1.6)

    # 拉簧固定在上方，通电后伸长；断电时回拉方向向上。
    sx, anchor, attach = 195, 70, arm_y(195)
    g.line(sx-14,anchor,sx+14,anchor,GRAY,2)
    spring = [(sx,anchor),(sx,anchor+9)]
    turns = 10
    for i in range(turns+1):
        spring.append((sx+(-5 if i%2 == 0 else 5),anchor+16+(attach-anchor-25)*i/turns))
    spring.extend([(sx,attach-3),(sx,attach)])
    g.poly(spring,c=GRAY,w=1.8)
    g.text(151,98,'弹簧',anchor='middle')
    g.arrow(214,131,214,89,GRAY,1.8,9)
    assert anchor < attach  # 拉簧回拉向上，与吸引方向相反。

    # 铁芯和线圈；导线从线圈两端分别引出，形成独立低压回路。
    g.rect(243,201,27,80,GRAY,1.8)
    g.line(234,281,281,281,GRAY,2)
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
    g.line(257,302,257,287,GRAY,1.6)
    g.arrow(257,arm_y(257)+9,257,195,BLUE,2.2,9)
    assert arm_y(257) < 201  # 衔铁被吸向下方铁芯。

    # 右端动触点随衔铁运动，下方静触点固定；两接触面相切。
    contact_x, moving_y, fixed_y, r = 399, 187, 195, 4
    g.line(contact_x,arm_y(contact_x),contact_x,moving_y,GRAY,1.8)
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
    g.poly([(475,150),(433,162),(408,183)],c=GRAY,w=1.6)
    g.text(478,237,'动、静触点接通',anchor='middle',size=13,c=CORAL)
    # 工作回路最左导线在 x=345，控制回路最右导线在 x=320。
    assert 345 > 320
    g.text(175,419,'控制电路',anchor='middle',c=BLUE)
    g.text(477,419,'工作电路',anchor='middle',c=CORAL)
    return g


JOBS = [
    ('g9-14-internal-energy-use','PHY-9-14-3b','heat-engine-energy-flow.svg',energy_flow),
    ('g9-15-current-and-circuits','PHY-9-15-1b','atom-structure.svg',atom_structure),
    ('g9-15-current-and-circuits','PHY-9-15-2a','current-electron-directions.svg',current_electrons),
    ('g9-15-current-and-circuits','PHY-9-15-5a','current-measuring-points.svg',current_positions),
    ('g9-16-voltage-and-resistance','PHY-9-16-1a','voltmeter-dial.svg',voltmeter_dial),
    ('g9-16-voltage-and-resistance','PHY-9-16-4a','rheostat-structure-wiring.svg',rheostat_structure),
    ('g9-17-ohms-law','PHY-9-17-2a','ohms-law-simple-circuit.svg',ohm_simple),
    ('g9-17-ohms-law','PHY-9-17-4a','series-voltage-parallel-current.svg',division_comparison),
    ('g9-20-electricity-and-magnetism','PHY-9-20-1b','bar-magnet-field-compasses.svg',magnetic_field),
    ('g9-20-electricity-and-magnetism','PHY-9-20-3b','relay-structure.svg',relay_structure),
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('preview_dir', nargs='?', default=str(DEFAULT_PREVIEW))
    ap.add_argument('--only', nargs='+', help='只重写指定文件名及其 PNG 预览')
    args = ap.parse_args()
    only = set(args.only or [])
    unknown = only-{job[2] for job in JOBS}
    if unknown:
        raise SystemExit(f'未知图名：{sorted(unknown)}')
    pv = Path(args.preview_dir).resolve()
    if pv != DEFAULT_PREVIEW.resolve():
        raise SystemExit('本批次只允许预览目录 output/preview/fig-review/b')
    pv.mkdir(parents=True,exist_ok=True)
    rows = []
    # 先完成所有构图和几何自查，再保存，避免失败留下半套文件。
    figs = [(chapter,kp,name,maker()) for chapter,kp,name,maker in JOBS]
    for chapter,kp,name,g in figs:
        path = COURSE / chapter / 'figures' / name
        if not only or name in only:
            g.save(str(path),str(pv))
        shot = pv / (Path(name).stem+'.png')
        if not shot.is_file() or shot.stat().st_size < 1000:
            raise RuntimeError(f'预览未生成：{shot}')
        rows.append(f'<section><h2>{escape(kp)} · {escape(g.title)}</h2>'
                    f'<p>{escape(str(path.relative_to(ROOT)))}</p>'
                    f'<img src="{escape(shot.name)}" width="{g.w}" height="{g.h}" alt="{escape(g.title)}">'
                    f'<p>{escape(g.desc)}</p></section>')
        print(path.relative_to(ROOT))
    (pv/'index.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>批次 b 审图</title>'
        '<style>body{margin:24px auto;padding:0 20px;max-width:900px;background:#fff;color:#20272b;'
        'font:16px -apple-system,"PingFang SC",sans-serif}h1{font-size:24px}h2{font-size:18px}'
        'section{padding:24px 0;border-bottom:1px solid #52626a}p{line-height:1.7;overflow-wrap:anywhere}'
        'img{display:block;max-width:100%;height:auto}</style><h1>批次 b · 九年级可选示意图</h1>'
        '<p>仅供审图，未接入讲义。原子图为通用结构；继电器图为通电接通状态，不对应练习题装置。</p>'
        +''.join(rows)+'</html>',encoding='utf-8')
    print(f'PASS：{len(figs)} 张图几何断言；PNG 预览存在。')


if __name__ == '__main__':
    main()
