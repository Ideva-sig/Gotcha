"""第 九年级 章示意图（手写 SVG）。用法：python3 scripts/figures/draw-ch9.py [预览目录]"""
import math
from svgkit import *
import os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../course/physics") + "/"
OUT = ROOT
PV = sys.argv[1] if len(sys.argv) > 1 else None  # 传入一个目录时，另存 PNG 预览（需要 PIL 和 Playwright 的 Chromium）
J=lambda g,x,y: g.dot(x,y,3.6,INK)

def lit_lamp(g,x,y):
    g.lamp(x,y,13,lit=True)
    for a in (45,90,135,225,270,315):
        r=math.radians(a); g.line(x+19*math.cos(r),y+19*math.sin(r),x+25*math.cos(r),y+25*math.sin(r),YELLOW,1.8)

# 15.2c 元件符号和电路图
g=Fig(640,330,"sym","常用元件符号和一个简单电路图",
 "上排：电池、开关、小灯泡、电动机、电流表的电路符号（以课本图 15.2-6 为准），电池的长线是正极、短线是负极。下方：电池、开关、小灯泡用导线连成的电路图。静态图。")
names=["电池","开关","小灯泡","电动机","电流表"]
for i,n in enumerate(names):
    x=70+i*125; y=60
    g.line(x-42,y,x+42,y,INK,2)
    [lambda: g.battery(x,y), lambda: g.switch(x,y), lambda: g.lamp(x,y), lambda: g.meter(x,y,"M"), lambda: g.meter(x,y,"A")][i]()
    g.text(x,104,n,anchor="middle",size=13,c=SOFT,weight=500)
g.line(30,128,610,128,"#d8dfe2",1.2)
g.wire([(230,170),(410,170),(410,270),(230,270),(230,170)])
g.switch(285,170); g.battery(360,170); g.lamp(320,270)
g.text(320,314,"电路图",anchor="middle",size=13,c=SOFT,weight=500)
g.save(OUT+"g9-15-current-and-circuits/figures/circuit-symbols.svg",PV)

# 15.2d 通路、断路、短路
g=Fig(660,230,"osc","通路、断路、电源短路和灯被短路",
 "四个小电路图。通路：开关闭合，灯亮。断路：开关断开，电路中没有电流，灯不亮。电源短路：一根导线（红色）直接接在电源两极，电流很大，会烧坏电源。灯被短路：两灯串联，一根导线（红色）接在一盏灯两端，这盏灯不亮，另一盏灯亮。静态图。")
caps=["通路","断路","电源短路","灯被短路"]
for k in range(4):
    x0=k*165; L,R,T,B=x0+30,x0+140,60,160
    g.wire([(L,T),(R,T),(R,B),(L,B),(L,T)])
    g.battery((L+R)/2,T)
    g.switch(L,(T+B)/2,vertical=True,closed=(k!=1))
    if k==2:
        cx=(L+R)/2
        g.wire([(cx-22,T),(cx-22,T-28),(cx+22,T-28),(cx+22,T)],c=CORAL,w=2.4); J(g,cx-22,T); J(g,cx+22,T)
    if k<3:
        lit_lamp(g,(L+R)/2,B) if k==0 else g.lamp((L+R)/2,B)
    else:
        a,b=L+30,R-28
        g.wire([(b-22,B),(b-22,B+30),(b+22,B+30),(b+22,B)],c=CORAL,w=2.4); J(g,b-22,B); J(g,b+22,B)
        lit_lamp(g,a,B); g.lamp(b,B)
    g.text((L+R)/2,218,caps[k],anchor="middle")
g.save(OUT+"g9-15-current-and-circuits/figures/open-short-circuits.svg",PV)

# 15.3a 串联和并联
g=Fig(640,260,"spc","串联电路和并联电路",
 "左：两个小灯泡依次相连，是串联。右：两个小灯泡的两端分别连在一起，是并联；两个分支点之间各自的部分是支路（红色），共用的部分是干路（蓝色）。静态图。")
g.wire([(40,60),(280,60),(280,190),(40,190),(40,60)])
g.lamp(120,60); g.lamp(200,60); g.switch(40,125,vertical=True); g.battery(160,190)
g.text(160,240,"串联",anchor="middle")
A=(360,110); Bp=(600,110)
g.wire([A,(360,190),(600,190),Bp],c=BLUE,w=2.4)
g.wire([A,(360,50),(600,50),Bp],c=CORAL,w=2.4); g.wire([A,Bp],c=CORAL,w=2.4)
g.lamp(480,50); g.lamp(480,110); g.switch(360,150,vertical=True); g.battery(480,190)
J(g,*A); J(g,*Bp)
g.text(540,40,"支路",c=CORAL); g.text(540,182,"干路",c=BLUE)
g.text(480,240,"并联",anchor="middle")
g.save(OUT+"g9-15-current-and-circuits/figures/series-parallel.svg",PV)

# 15.3b 吸尘器电路
g=Fig(480,260,"vac","灯泡和电动机各由一个开关控制的电路",
 "灯泡 L 与开关 S1 串联成一条支路，电动机 M 与开关 S2 串联成另一条支路，两条支路并联后接在电源两端。静态图。")
g.wire([(240,50),(80,50),(80,210),(240,210)])
g.wire([(240,50),(400,50),(400,210),(240,210)]); g.wire([(240,50),(240,210)])
g.battery(80,130,vertical=True)
g.switch(240,95,vertical=True); g.lamp(240,160)
g.switch(400,95,vertical=True); g.meter(400,160,"M")
J(g,240,50); J(g,240,210)
g.sym(256,100,"S",sub="1"); g.sym(260,166,"L")
g.sym(416,100,"S",sub="2")
g.save(OUT+"g9-15-current-and-circuits/figures/lamp-motor-circuit.svg",PV)

# 15.4a 电流表表盘
g=Fig(640,300,"amd","电流表表盘的两排刻度",
 "电流表表盘从 0 到最右端共 30 个小格。上排刻度 0～3 A，接“3”接线柱时读上排，每小格 0.1 A；下排刻度 0～0.6 A，接“0.6”接线柱时读下排，每小格 0.02 A。同一指针位置，按上排读是按下排读的 5 倍。静态图。")
C=(320,250); R=170; a0,a1=-145,-35
ang=lambda i: math.radians(a0+(a1-a0)*i/30)
g.raw(f'<path d="M{f(C[0]+R*math.cos(ang(0)))} {f(C[1]+R*math.sin(ang(0)))}A{R} {R} 0 0 1 {f(C[0]+R*math.cos(ang(30)))} {f(C[1]+R*math.sin(ang(30)))}" stroke="{INK}" stroke-width="1.6" fill="none"/>')
for i in range(31):
    t=ang(i); l=16 if i%10==0 else (11 if i%5==0 else 7)
    g.line(C[0]+R*math.cos(t),C[1]+R*math.sin(t),C[0]+(R+l)*math.cos(t),C[1]+(R+l)*math.sin(t),INK,1.6 if i%10==0 else 1.1)
for j in range(4):
    t=ang(j*10)
    g.text(C[0]+(R+32)*math.cos(t),C[1]+(R+32)*math.sin(t)+5,str(j),anchor="middle",c=BLUE,size=15)
    g.text(C[0]+(R-22)*math.cos(t),C[1]+(R-22)*math.sin(t)+5,["0","0.2","0.4","0.6"][j],anchor="middle",c=CORAL,size=14)
t=ang(15)
g.line(C[0],C[1],C[0]+(R+4)*math.cos(t),C[1]+(R+4)*math.sin(t),INK,2.2)
g.circle(C[0],C[1],7,INK,2,INK)
g.text(C[0]-40,C[1]+6,"A",anchor="middle",size=20)
g.text(40,40,"接“3”：读上排",c=BLUE); g.text(40,62,"每小格 0.1 A",c=BLUE,size=13,weight=500)
g.text(600,40,"接“0.6”：读下排",c=CORAL,anchor="end"); g.text(600,62,"每小格 0.02 A",c=CORAL,anchor="end",size=13,weight=500)
g.text(40,284,"0～3 A 和 0～0.6 A 都是 30 小格",c=SOFT,size=13,weight=500)
g.save(OUT+"g9-15-current-and-circuits/figures/ammeter-dial.svg",PV)

# 17.1a 探究电流与电压、电阻
g=Fig(560,290,"iur","探究电流与电压、电阻关系的电路图",
 "电源、开关、电流表、定值电阻 R 和滑动变阻器串联，电压表并联在定值电阻 R 两端。滑片 P 改变变阻器接入电路的电阻。静态图。")
g.wire([(432,66),(500,66),(500,250),(80,250),(80,90),(398,90)])
g.wire([(240,90),(240,40),(340,40),(340,90)])
g.meter(150,90,"A"); g.resistor(290,90); g.rheo(420,90,432)
g.meter(290,40,"V"); g.battery(220,250); g.switch(380,250)
J(g,240,90); J(g,340,90)
g.sym(290,122,"R",anchor="middle"); g.sym(424,62,"P",anchor="end"); g.sym(380,282,"S",anchor="middle")
g.save(OUT+"g9-17-ohms-law/figures/current-voltage-resistance-circuit.svg",PV)

# 17.3a 伏安法测电阻
g=Fig(560,290,"vam","伏安法测电阻的电路图",
 "照课本图 17.3-2：电压表 V 并联在待测电阻 R 两端，电流表 A、滑动变阻器、开关 S 与电源串联。滑片 P 移动，改变 R 两端的电压和通过的电流。静态图。")
g.wire([(392,66),(500,66),(500,250),(100,250),(100,90),(358,90)])
g.wire([(170,90),(170,40),(270,40),(270,90)])
g.resistor(220,90); g.meter(220,40,"V"); g.rheo(380,90,392); g.meter(100,170,"A")
g.battery(220,250); g.switch(380,250)
J(g,170,90); J(g,270,90)
g.sym(220,122,"R",anchor="middle"); g.sym(384,62,"P",anchor="end"); g.sym(380,282,"S",anchor="middle")
g.save(OUT+"g9-17-ohms-law/figures/voltammeter-method-circuit.svg",PV)

# 17.4b 动态电路
g=Fig(600,300,"dyn","定值电阻与滑动变阻器串联的动态电路",
 "定值电阻 R0 与滑动变阻器 R 串联，电流表测电路电流，电压表并联在变阻器接入电路的部分两端。变阻器接入的是左端到滑片 P 之间的电阻丝，滑片向右移动时接入电阻变大。静态图。")
g.wire([(100,90),(330,90)]); g.wire([(370,66),(520,66),(520,250),(100,250),(100,90)])
g.wire([(300,90),(300,30),(450,30),(450,66)])
g.resistor(180,90); g.rheo(360,90,370,L=64); g.meter(375,30,"V"); g.meter(520,160,"A")
g.battery(220,250); g.switch(400,250,closed=True)
J(g,300,90); J(g,450,66)
g.sym(180,122,"R",sub="0",anchor="middle"); g.sym(360,122,"R",anchor="middle"); g.sym(364,62,"P",anchor="end")
g.arrow(388,50,424,50,GRAY,1.6,8); g.text(400,186,"滑片右移，接入电阻变大",c=SOFT,size=13,weight=500,anchor="middle")
g.sym(400,284,"S",anchor="middle")
g.save(OUT+"g9-17-ohms-law/figures/dynamic-series-rheostat.svg",PV)

# 17.4c 故障排查
g=Fig(560,280,"flt","用电压表排查串联电路的断路点",
 "两盏灯 L1、L2 与开关 S、电流表 A、电源串联，电压表 V 并联在 L1 两端，用来判断断路发生在哪里。静态图。")
g.wire([(100,100),(500,100),(500,240),(100,240),(100,100)])
g.wire([(170,100),(170,45),(270,45),(270,100)])
g.lamp(220,100); g.lamp(390,100); g.meter(220,45,"V"); g.meter(100,170,"A")
g.battery(240,240); g.switch(390,240,closed=True)
J(g,170,100); J(g,270,100)
g.sym(220,136,"L",sub="1",anchor="middle"); g.sym(390,136,"L",sub="2",anchor="middle"); g.sym(390,272,"S",anchor="middle")
g.save(OUT+"g9-17-ohms-law/figures/fault-voltmeter-check.svg",PV)

# 18.4c 电热水壶两挡
g=Fig(660,300,"ket","电热水壶两种挡位时接入电路的电阻",
 "照课本图 18-3。左：S2 接 1，电流不经过 R2，只有 R1 接入电路，是加热状态。右：S2 接 2，R1 与 R2 串联，是保温状态。蓝色是有电流通过的路径，浅灰色部分没有电流。S1 是总开关，闭合。静态图。")
for k in range(2):
    o=k*330
    P=(o+90,60); c1=(o+140,36); c2=(o+140,84); Jn=(o+280,84)
    on=BLUE; off=LIGHT
    a1=on if k==0 else off; a2=on if k==1 else off
    g.wire([(o+40,60),P,(o+40,60),(o+40,224)],c=on,w=2.2)
    g.wire([c1,(o+280,36),Jn],c=a1,w=2.2)
    g.wire([c2,Jn],c=a2,w=2.2)
    g.wire([Jn,(o+280,224),(o+120,224)],c=on,w=2.2)
    g.resistor(o+210,84,L=40); g.resistor(o+280,150,vertical=True,L=40)
    g.switch(o+200,224,closed=True)
    g.line(*P,*(c1 if k==0 else c2),INK,2.2); g.dot(*P,3,INK)
    g.circle(*c1,3,INK,1.6); g.circle(*c2,3,INK,1.6)
    g.circle(o+40,232,3.5,INK,1.6); g.circle(o+120,232,3.5,INK,1.6)
    g.line(o+40,224,o+40,228.5,on,2.2); g.line(o+120,224,o+120,228.5,on,2.2)
    J(g,*Jn)
    g.text(o+80,252,"220 V",anchor="middle",size=13,weight=500,c=SOFT)
    g.text(o+148,30,"1",size=13,weight=500); g.text(o+148,104,"2",size=13,weight=500)
    g.sym(o+84,48,"S",sub="2",anchor="end",size=16); g.sym(o+210,112,"R",sub="2",anchor="middle",size=16)
    g.sym(o+298,156,"R",sub="1",size=16); g.sym(o+200,212,"S",sub="1",anchor="middle",size=16)
    g.text(o+160,284,["S₂ 接 1：只有 R₁（加热）","S₂ 接 2：R₁、R₂ 串联（保温）"][k],anchor="middle",size=13)
g.save(OUT+"g9-18-electric-power/figures/kettle-two-settings.svg",PV)

# 19.2a 家庭电路接线
g=Fig(640,290,"hw","电灯、开关和三孔插座接入家庭电路",
 "上方三根线：相线（红）、中性线（蓝）、保护线（绿）。三孔插座：左孔接中性线，右孔接相线，上孔接保护线。开关接在相线和电灯之间，电灯另一端接中性线。插座和电灯是并联的。静态图。")
yL,yN,yE=40,66,92
g.line(30,yL,560,yL,CORAL,2.4); g.line(30,yN,560,yN,BLUE,2.4); g.line(30,yE,560,yE,GREEN,2.4)
g.text(570,yL+5,"相线",c=CORAL,size=13); g.text(570,yN+5,"中性线",c=BLUE,size=13); g.text(570,yE+5,"保护线",c=GREEN,size=13)
# 插座
sx,sy=140,190
g.rect(sx-34,sy-34,68,68,GRAY,2,"#f4f8fa",rx=6)
g.line(sx,sy-20,sx,sy-10,INK,3); g.line(sx-18,sy+8,sx-12,sy+16,INK,3); g.line(sx+18,sy+8,sx+12,sy+16,INK,3)
g.wire([(sx,sy-20),(sx,yE)],c=GREEN,w=2.2); J(g,sx,yE)
g.wire([(sx-15,sy+12),(sx-50,sy+12),(sx-50,yN)],c=BLUE,w=2.2); J(g,sx-50,yN)
g.wire([(sx+15,sy+12),(sx+60,sy+12),(sx+60,yL)],c=CORAL,w=2.2); J(g,sx+60,yL)
g.text(sx,sy+62,"三孔插座",anchor="middle",size=13,c=SOFT,weight=500)
g.text(sx,sy+82,"左零 右火 上接地",anchor="middle",size=12,c=SOFT,weight=500)
# 电灯和开关
lx,ly=340,200; swx=480
g.wire([(swx,yL),(swx,ly),(lx+13,ly)],c=CORAL,w=2.2); J(g,swx,yL)
g.wire([(lx-13,ly),(lx-50,ly),(lx-50,yN)],c=BLUE,w=2.2); J(g,lx-50,yN)
g.switch(swx,140,vertical=True,closed=True); g.lamp(lx,ly)
g.text(lx,ly+42,"电灯",anchor="middle",size=13,c=SOFT,weight=500)
g.text(swx+16,145,"开关",size=13,c=SOFT,weight=500)
g.save(OUT+"g9-19-household-electricity/figures/home-wiring.svg",PV)

# 20.2a 环形电流与小磁针
g=Fig(560,300,"ring","环形电流右侧小磁针的指向",
 "照课本图 20-4：圆环跟纸面垂直，环上朝向读者的一半（右半，实线）电流向下，背向读者的一半画成虚线。由安培定则，环形电流右端是 N 极，所以右侧小磁针静止时 N 极指向右。静态图。")
X=230; cx=X+26; cy=150; rx=26; ry=88
g.line(X,18,X,282,GRAY,3)
g.arrow(X,70,X,38,INK,1.8,9); g.sym(X+10,48,"I",size=17)
g.arrow(X,268,X,236,INK,1.8,9); g.sym(X+10,262,"I",size=17)
g.raw(f'<path d="M{cx} {cy-ry}A{rx} {ry} 0 0 0 {cx} {cy+ry}" stroke="{GRAY}" stroke-width="1.6" stroke-dasharray="5 4" fill="none"/>')
g.raw(f'<path d="M{cx} {cy-ry}A{rx} {ry} 0 0 1 {cx} {cy+ry}" stroke="{INK}" stroke-width="3" fill="none"/>')
g.head(cx+rx,cy+12,0,1,CORAL,13)
nx,ny=420,150
g.poly([(nx-46,ny),(nx,ny-9),(nx,ny+9)],c=BLUE,w=1.4,fill=BLUE,close=True)
g.poly([(nx+46,ny),(nx,ny-9),(nx,ny+9)],c=CORAL,w=1.4,fill=CORAL,close=True)
g.dot(nx,ny,2.4,"#fff")
g.text(nx+46,ny-16,"N",c=CORAL,anchor="middle"); g.text(nx-46,ny-16,"S",c=BLUE,anchor="middle")
g.save(OUT+"g9-20-electricity-and-magnetism/figures/ring-current-compass.svg",PV)
