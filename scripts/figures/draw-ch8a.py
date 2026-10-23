"""第 八上 章示意图（手写 SVG）。用法：python3 scripts/figures/draw-ch8a.py [预览目录]"""
import math
from svgkit import *
import os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../course/physics") + "/"
OUT = ROOT
PV = sys.argv[1] if len(sys.argv) > 1 else None  # 传入一个目录时，另存 PNG 预览（需要 PIL 和 Playwright 的 Chromium）

# 1.3c s-t 与 v-t 图像
g=Fig(640,250,"stvt","匀速直线运动的 s-t 图像和 v-t 图像",
 "左：s-t 图像，横轴时间 t，纵轴路程 s，匀速直线运动是一条过原点的倾斜直线。右：v-t 图像，横轴时间 t，纵轴速度 v，匀速直线运动是一条平行于时间轴的直线。静态图。")
for ox,ylab,cap in [(60,"s","s-t 图像"),(380,"v","v-t 图像")]:
    oy=190
    g.arrow(ox,oy,ox+230,oy,GRAY,1.8,10); g.arrow(ox,oy,ox,oy-160,GRAY,1.8,10)
    g.sym(ox-10,oy+20,"O",anchor="middle",size=16)
    g.sym(ox+226,oy+24,"t",anchor="middle"); g.sym(ox-18,oy-146,ylab,anchor="middle")
    g.text(ox+115,oy+48,cap,anchor="middle")
g.line(60,190,250,62,BLUE,2.6)
g.line(380,120,580,120,BLUE,2.6)
g.save(OUT+"g8a-01-motion/figures/uniform-motion-graphs.svg",PV)

# 4.3b 由 AO 和像 A'O' 作平面镜
g=Fig(560,300,"mir","由 AO 和它的像 A′O′ 画出平面镜",
 "AO 是物体（实线），A′O′ 是它在平面镜中的像（虚线）。用虚线连接 AA′、OO′，平面镜在它们的垂直平分线上，交点处标垂直符号；镜面不反光的一侧画短斜线。静态图。")
A=(200,70); O=(110,230); Ap=(360,70); Op=(450,230); mx=280
g.line(*A,*Ap,LIGHT,1.6,"5 4"); g.line(*O,*Op,LIGHT,1.6,"5 4")
g.line(mx,40,mx,262,INK,2.6)
for y in range(46,262,14): g.line(mx,y,mx+9,y-9,GRAY,1.4)
g.right_angle(mx,70,(-1,0),(0,1),9,GRAY); g.right_angle(mx,230,(-1,0),(0,-1),9,GRAY)
g.arrow(*O,*A,CORAL,2.4,12)
ux,uy=unit(Ap[0]-Op[0],Ap[1]-Op[1])
g.line(Op[0],Op[1],Ap[0]-ux*10,Ap[1]-uy*10,CORAL,2.4,"6 5"); g.head(*Ap,ux,uy,CORAL,12)
g.sym(A[0]-6,A[1]-12,"A",anchor="middle"); g.sym(O[0]-14,O[1]+20,"O",anchor="middle")
g.sym(Ap[0]+6,Ap[1]-12,"A",prime=True,anchor="middle"); g.sym(Op[0]+16,Op[1]+20,"O",prime=True,anchor="middle")
g.text(mx+18,288,"平面镜",anchor="start",c=SOFT,size=13,weight=500)
g.save(OUT+"g8a-04-light/figures/mirror-from-image.svg",PV)

# 4.4a 光从空气斜射入水中
g=Fig(520,320,"rfr","光从空气斜射入水中的折射光路",
 "水平界面上方是空气，下方是水。过入射点 O 作垂直于界面的法线（虚线）。入射光线从左上方射到 O，折射光线进入水中，向法线偏折，折射角 r 小于入射角 i。静态图。")
O=(260,160)
g.rect(20,160,480,140,c="none",sw=0,fill=WATER)
g.line(20,160,500,160,GRAY,2)
g.line(260,24,260,296,GRAY,1.6,"6 5")
g.right_angle(260,160,(1,0),(0,-1),10,GRAY)
i=math.radians(50); r=math.radians(30)
P=(O[0]-170*math.sin(i),O[1]-170*math.cos(i)); Q=(O[0]+150*math.sin(r),O[1]+150*math.cos(r))
g.ray([P,O],CORAL); g.ray([O,Q],CORAL)
g.arc(260,160,46,-90-50,-90,GRAY); g.arc(260,160,50,90-30,90,GRAY)
g.sym(244,95,"i",anchor="middle"); g.sym(272,236,"r",anchor="middle")
g.sym(248,182,"O",anchor="middle",size=16)
g.text(40,60,"空气",c=SOFT); g.text(40,280,"水",c=SOFT)
g.save(OUT+"g8a-04-light/figures/refraction-air-water.svg",PV)

# 透镜形状
def convex(g,x,y,h=70,w=12):
    g.raw(f'<path d="M{x} {y-h}Q{x+w*2} {y} {x} {y+h}Q{x-w*2} {y} {x} {y-h}Z" fill="#dceff9" stroke="{BLUE}" stroke-width="1.8"/>')
def concave(g,x,y,h=70,w=12):
    g.raw(f'<path d="M{x-w} {y-h}L{x+w} {y-h}Q{x+3} {y} {x+w} {y+h}L{x-w} {y+h}Q{x-3} {y} {x-w} {y-h}Z" fill="#dceff9" stroke="{BLUE}" stroke-width="1.8"/>')

# 5.1a 会聚与发散
g=Fig(640,240,"lns","凸透镜使光会聚，凹透镜使光发散",
 "左：平行于主光轴的三束光射向凸透镜，穿过后会聚于焦点 F。右：同样的三束光射向凹透镜，穿过后向外散开。静态图。")
for cx,kind in [(150,"vex"),(470,"cave")]:
    y0=110
    g.line(cx-130,y0,cx+150,y0,LIGHT,1.4,"10 4 2 4")
    (convex if kind=="vex" else concave)(g,cx,y0)
    F=cx+90
    for dy in (-44,0,44):
        a=(cx-120,y0+dy); b=(cx,y0+dy)
        if kind=="vex":
            ux,uy=unit(F-cx,-dy) if dy else (1,0)
            e=(cx+ux*150,y0+dy+uy*150) if dy else (cx+150,y0)
        else:
            if dy:
                ux,uy=unit(cx-(cx-90), dy)  # 反向延长线过左侧虚焦点
                e=(cx+ux*125,y0+dy+uy*125)
            else: e=(cx+140,y0)
        g.ray([a,b],CORAL,arrows=[0]); g.ray([b,e],CORAL,at=0.32 if kind=='vex' else 0.6)
    if kind=="vex":
        g.dot(F,y0,3.2,INK); g.sym(F+4,y0+24,"F",anchor="middle",size=16)
    g.text(cx,222,"凸透镜：会聚" if kind=="vex" else "凹透镜：发散",anchor="middle")
g.save(OUT+"g8a-05-lenses/figures/lens-converge-diverge.svg",PV)

# 5.1b 凸透镜三条特殊光线
g=Fig(660,230,"ray3","凸透镜的三条特殊光线",
 "三幅小图并排，主光轴上标出光心 O 和两侧焦点 F。①过光心的光线传播方向不变；②平行于主光轴的光线经透镜后过焦点；③过焦点的光线经透镜后平行于主光轴。静态图。")
f=62
for k,cx in enumerate([110,330,550]):
    y0=110
    g.line(cx-100,y0,cx+100,y0,LIGHT,1.4,"10 4 2 4")
    convex(g,cx,y0,62,10)
    for s in (-1,1):
        g.dot(cx+s*f,y0,3,INK)
        up = (k==2 and s==-1) or (k==0 and s==1)
        dx = -8 if up else (-10 if (k==1 and s==1) else 0)
        g.sym(cx+s*f+dx,y0-10 if up else y0+24,"F",anchor="middle",size=15)
    g.dot(cx,y0,2.6,INK); g.sym(cx-22,y0+26,"O",anchor="middle",size=15)
    if k==0:
        a=(cx-95,y0-45); e=(cx+95,y0+45); g.ray([a,(cx,y0),e],CORAL,arrows=[0,1],at=0.5)
    if k==1:
        a=(cx-95,y0-40); b=(cx,y0-40); ux,uy=unit(f,40); e=(cx+ux*112,y0-40+uy*112)
        g.ray([a,b],CORAL,arrows=[0]); g.ray([b,e],CORAL,at=0.75)
    if k==2:
        ux,uy=unit(f,-40); a=(cx-f-ux*40,y0-uy*40); b=(cx,y0-40)
        g.ray([a,b],CORAL,at=0.75); g.ray([b,(cx+95,y0-40)],CORAL,arrows=[0])
    g.text(cx,214,["过光心：方向不变","平行光轴→过焦点","过焦点→平行光轴"][k],anchor="middle",size=13)
g.save(OUT+"g8a-05-lenses/figures/convex-three-rays.svg",PV)
