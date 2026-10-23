"""第 八下 章示意图（手写 SVG）。用法：python3 scripts/figures/draw-ch8b.py [预览目录]"""
import math
from svgkit import *
import os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../course/physics") + "/"
OUT = ROOT
PV = sys.argv[1] if len(sys.argv) > 1 else None  # 传入一个目录时，另存 PNG 预览（需要 PIL 和 Playwright 的 Chromium）

# 7.1b 力的三要素
g=Fig(560,230,"f3","力的示意图怎样表示力的三要素",
 "一个木箱放在地面上，在木箱右侧中点用带箭头的线段表示一个向右上方的拉力：线段起点画在作用点上，箭头指向力的方向，线段长短表示力的大小。静态图。")
g.line(40,180,520,180,GRAY,2)
g.rect(110,100,140,80,GRAY,2.2,"#f4f8fa")
P=(250,140); E=(410,60)
g.dot(*P,4.2,BLUE); g.arrow(*P,*E,BLUE,2.8,14)
g.text(262,166,"作用点",c=BLUE)
g.text(422,58,"方向",c=BLUE)
ux,uy=unit(E[0]-P[0],E[1]-P[1]); nx,ny=uy,-ux  # 线段左下侧的法向
o=-22
a=(P[0]-nx*o,P[1]-ny*o); b=(E[0]-nx*o,E[1]-ny*o)
a=(P[0]+uy*22,P[1]-ux*22*-1)
nx,ny=(uy,-ux)
a=(P[0]+nx*22,P[1]+ny*22); b=(E[0]+nx*22,E[1]+ny*22)
g.line(*a,*b,SOFT,1.3); g.line(a[0]-nx*5,a[1]-ny*5,a[0]+nx*5,a[1]+ny*5,SOFT,1.3); g.line(b[0]-nx*5,b[1]-ny*5,b[0]+nx*5,b[1]+ny*5,SOFT,1.3)
m=((a[0]+b[0])/2+nx*12,(a[1]+b[1])/2+ny*12)
g.text(m[0]-4,m[1]+2,"大小（长短）",c=SOFT,size=13,weight=500,anchor="end")
g.save(OUT+"g8b-07-force/figures/force-three-elements.svg",PV)

# 7.2a 弹簧测力计
g=Fig(420,420,"ssc","弹簧测力计的零刻度线、量程、分度值和挂钩",
 "竖直放置的弹簧测力计，刻度板从 0 到 5 N，每 1 N 之间分成 5 个小格，每小格 0.2 N。左侧标出零刻度线、量程，右侧放大标出一个小格即分度值，下端标出挂钩，指针指在零刻度线上。静态图。")
cx=200; top=60; y0=90; unit_=50  # 每 1 N 50 px
g.rect(cx-30,30,60,330,GRAY,2.2,"#f4f8fa",rx=6)
g.circle(cx,22,8,GRAY,2,"#fff")
g.rect(cx-14,y0-6,28,y0+5*unit_-y0+12,c=LIGHT,sw=1.2,fill="#fff")
for i in range(26):
    y=y0+i*unit_/5; big=i%5==0
    g.line(cx+ (-14 if big else -6),y,cx+14 if big else cx+6,y,INK,1.6 if big else 1.1)
    if big: g.text(cx+20,y+5,str(i//5),c=INK,size=13,weight=500)
g.text(cx+36,y0+5*unit_+5,"N",c=INK,size=13,weight=500)
# 指针（在零刻度线）
g.line(cx-26,y0,cx-24,y0,CORAL,2); g.head(cx-15,y0,1,0,CORAL,10)
# 挂钩
g.line(cx,360,cx,378,GRAY,2.2)
g.raw(f'<path d="M{cx} 378 a10 10 0 1 1 -10 10" stroke="{GRAY}" stroke-width="2.2" fill="none"/>')
# 左侧标注
g.line(cx-36,y0,cx-70,y0,SOFT,1.2); g.text(cx-74,y0+5,"零刻度线",c=INK,anchor="end")
g.line(cx-46,y0,cx-46,y0+5*unit_,BLUE,1.4); g.line(cx-51,y0,cx-41,y0,BLUE,1.4); g.line(cx-51,y0+5*unit_,cx-41,y0+5*unit_,BLUE,1.4)
g.text(cx-56,y0+5*unit_/2-4,"量程",c=BLUE,anchor="end"); g.text(cx-56,y0+5*unit_/2+16,"0～5 N",c=BLUE,anchor="end",size=13,weight=500)
# 分度值放大
ya=y0+3*unit_; yb=ya+unit_/5
g.line(cx+44,ya,cx+60,ya,GREEN,1.2); g.line(cx+44,yb,cx+60,yb,GREEN,1.2)
g.line(cx+56,ya,cx+56,yb,GREEN,1.2)
g.line(cx+60,(ya+yb)/2,cx+80,(ya+yb)/2,GREEN,1.2)
g.text(cx+84,(ya+yb)/2-3,"分度值",c=GREEN); g.text(cx+84,(ya+yb)/2+15,"一小格 0.2 N",c=GREEN,size=13,weight=500)
g.line(cx-14,395,cx-70,395,SOFT,1.2); g.text(cx-74,400,"挂钩",c=INK,anchor="end")
g.save(OUT+"g8b-07-force/figures/spring-scale-parts.svg",PV)

# 7.3b 重力方向和重心
g=Fig(640,260,"cg","重力的方向竖直向下；规则均匀物体的重心在几何中心",
 "左：铅垂线静止时细线竖直，重力 G 的方向竖直向下。右：方形薄板的重心在两条对角线的交点，球的重心在球心，粗细均匀的直棒的重心在中点。静态图。")
g.line(30,24,150,24,GRAY,2.2)
for x in range(36,150,12): g.line(x,24,x-8,14,GRAY,1.2)
g.line(90,24,90,150,INK,1.6)
g.poly([(80,150),(100,150),(90,176)],c=GRAY,w=2,fill="#f4f8fa",close=True)
g.arrow(90,160,90,226,CORAL,2.6,12); g.sym(100,222,"G")
g.text(90,252,"铅垂线：竖直向下",anchor="middle",size=13)
g.line(190,20,190,240,"#d8dfe2",1.4)
# 方板
g.rect(230,70,110,110,GRAY,2.2,"#f4f8fa")
g.line(230,70,340,180,GRAY,1.3,"5 4"); g.line(340,70,230,180,GRAY,1.3,"5 4"); g.dot(285,125,4.4,CORAL)
g.text(285,214,"方形薄板",anchor="middle",size=13)
# 球
g.circle(430,125,52,GRAY,2.2,"#f4f8fa"); g.dot(430,125,4.4,CORAL)
g.text(430,214,"球",anchor="middle",size=13)
# 直棒
g.rect(510,119,110,12,GRAY,2,"#f4f8fa",rx=2); g.dot(565,125,4.4,CORAL)
g.line(510,144,565,144,SOFT,1.2); g.line(565,144,620,144,SOFT,1.2)
for x in (510,565,620): g.line(x,139,x,149,SOFT,1.2)
g.text(565,214,"均匀直棒",anchor="middle",size=13)
g.text(425,250,"红点：重心",anchor="middle",size=13,c=CORAL,weight=500)
g.save(OUT+"g8b-07-force/figures/gravity-direction-cg.svg",PV)

# 8.3a 测滑动摩擦力
g=Fig(640,220,"fr","用弹簧测力计水平匀速拉动木块，测滑动摩擦力",
 "木块放在水平长木板上，弹簧测力计水平拉着木块向右匀速运动。拉力 F 向右，长木板对木块的滑动摩擦力 f 向左，二力平衡，大小相等。静态图。")
g.rect(30,140,580,20,GRAY,2,"#f4f8fa")
g.rect(150,90,100,50,GRAY,2.2,"#e9e3d4")
g.line(250,115,300,115,INK,1.8)
g.rect(300,103,170,24,GRAY,2,"#f4f8fa",rx=4)
for i in range(11): g.line(320+i*13,103,320+i*13,110 if i%5 else 115,INK,1.1)
g.line(470,115,520,115,INK,1.8)
g.line(520,115,560,115,INK,1.8); g.text(568,120,"拉",c=SOFT,size=13,weight=500)
g.dot(200,104,3.2,BLUE); g.arrow(200,104,292,104,BLUE,2.8,13); g.sym(296,96,"F",c=BLUE)
g.dot(200,128,3.2,CORAL); g.arrow(200,128,108,128,CORAL,2.8,13); g.sym(102,124,"f",c=CORAL,anchor="end")
g.arrow(330,60,400,60,GRAY,1.6,9); g.text(408,65,"匀速运动",c=SOFT,size=13,weight=500)
g.text(320,190,"长木板",c=SOFT,size=13,weight=500,anchor="middle")
g.text(200,82,"木块",c=SOFT,size=13,weight=500,anchor="middle")
g.save(OUT+"g8b-08-motion-and-force/figures/friction-measure.svg",PV)

# 9.5a 纸条上方吹气
g=Fig(600,260,"blw","向纸条上方吹气：上方流速大、压强小",
 "手持纸条一端，在纸条上方水平吹气。纸条上方空气流速大、压强小，下方空气流速小、压强大，上下压强差形成向上的压力差，纸条向上飘起。静态图，纸条画在飘起后的位置。")
g.rect(40,108,26,30,GRAY,1.8,"#f4f8fa",rx=4)
g.text(53,162,"手持",anchor="middle",size=13,c=SOFT,weight=500)
g.raw(f'<path d="M66 116 C200 112 340 116 480 132" stroke="{INK}" stroke-width="3" fill="none"/>')
for y in (74,94):
    g.line(110,y,470,y,BLUE,1.8,"10 7")
    g.head(482,y,1,0,BLUE,11)
g.text(66,90,"吹气",c=BLUE,anchor="middle")
g.text(240,52,"流速大  压强小",c=BLUE,anchor="middle")
g.text(240,214,"流速小  压强大",c=SOFT,anchor="middle")
g.arrow(300,200,300,135,CORAL,2.8,13)
g.text(312,180,"压力差向上",c=CORAL)
g.save(OUT+"g8b-09-pressure/figures/blow-over-paper.svg",PV)

# 10.3a 浮沉条件
g=Fig(660,300,"fl","浮力与重力比较：上浮、悬浮、下沉、漂浮",
 "四个烧杯中物体受到竖直向上的浮力 F浮 和竖直向下的重力 G，线段长短表示力的大小。浸没的物体：F浮 大于 G 上浮，等于 G 悬浮，小于 G 下沉；漂浮在液面静止时 F浮 等于 G。静态图。")
cases=[("上浮",52,34),("悬浮",44,44),("下沉",34,52),("漂浮",40,40)]
for k,(cap,fu,gw) in enumerate(cases):
    cx=88+k*162; top=40; bot=230; L=60
    g.raw(f'<path d="M{cx-L} {top}V{bot}H{cx+L}V{top}" stroke="{GRAY}" stroke-width="2" fill="none"/>')
    surf=80
    g.rect(cx-L+1.2,surf,2*L-2.4,bot-surf-1.2,c="none",sw=0,fill=WATER)
    g.line(cx-L,surf,cx+L,surf,BLUE,1.4)
    if k<3: oy=160
    else: oy=surf+2
    g.rect(cx-17,oy-17,34,34,GRAY,2,"#f4f8fa") if k<3 else g.rect(cx-17,oy-22,34,34,GRAY,2,"#f4f8fa")
    c0=(cx,oy) if k<3 else (cx,oy-5)
    g.arrow(c0[0],c0[1],c0[0],c0[1]-fu-8,BLUE,2.6,11)
    g.arrow(c0[0],c0[1],c0[0],c0[1]+gw+8,CORAL,2.6,11)
    g.dot(*c0,3,INK)
    g.sym(c0[0]+8,c0[1]-fu-2,"F",sub="浮",c=BLUE,size=16)
    g.sym(c0[0]+8,c0[1]+gw+8,"G",c=CORAL,size=16)
    g.text(cx,260,cap,anchor="middle")
    op=[">","=","<","="][k]
    g.raw(f'<text class="fl-sy" x="{cx}" y="284" text-anchor="middle" style="fill:{SOFT};font-size:16px">F<tspan font-size="11" dy="3" font-style="normal">浮</tspan><tspan dy="-3" font-style="normal"> {op} </tspan>G</text>')
g.save(OUT+"g8b-10-buoyancy/figures/sink-float-forces.svg",PV)

# 11.4a 摆动中动能和重力势能的转化
g=Fig(560,320,"pen","摆动中动能和重力势能相互转化",
 "铁锁用细绳挂在 O 点，从 A 点由静止释放，摆到最低点 B 再摆到 C 点。A 到 B 重力势能转化为动能，B 到 C 动能转化为重力势能；忽略空气阻力时机械能守恒，C 与 A 一样高。静态图。")
O=(280,30); L=210; th=math.radians(42)
A=(O[0]-L*math.sin(th),O[1]+L*math.cos(th)); B=(O[0],O[1]+L); C=(O[0]+L*math.sin(th),O[1]+L*math.cos(th))
g.line(220,30,340,30,GRAY,2.2)
for x in range(226,340,12): g.line(x,30,x-8,20,GRAY,1.2)
g.raw(f'<path d="M{f(A[0])} {f(A[1])}A{L} {L} 0 0 0 {f(C[0])} {f(C[1])}" stroke="{LIGHT}" stroke-width="1.6" stroke-dasharray="6 5" fill="none"/>')
for P_,c in ((A,LIGHT),(C,LIGHT)): g.line(*O,*P_,c,1.4,"5 4")
g.line(*O,*B,INK,1.6)
for P_ in (A,B,C): g.circle(P_[0],P_[1],11,GRAY,2,"#f4f8fa")
g.line(A[0]-40,A[1],C[0]+40,C[1],SOFT,1.2,"3 4")
g.sym(O[0]+8,O[1]+52,"O",size=16)
g.sym(A[0]-22,A[1]-14,"A",size=17); g.sym(B[0],B[1]+34,"B",size=17,anchor="middle"); g.sym(C[0]+16,C[1]-14,"C",size=17)
g.text(A[0]-14,A[1]+34,"势能最大",anchor="middle",c=BLUE,size=13)
g.text(B[0],B[1]+58,"动能最大",anchor="middle",c=CORAL,size=13)
g.text(C[0]+14,C[1]+34,"与 A 一样高",anchor="middle",c=SOFT,size=13,weight=500)
a21=math.radians(21); g.text(O[0]-(L-44)*math.sin(a21),A[1]+30,"势能→动能",anchor="middle",size=13,c=INK,weight=500)
g.text(O[0]+(L-44)*math.sin(a21),C[1]+30,"动能→势能",anchor="middle",size=13,c=INK,weight=500)
g.save(OUT+"g8b-11-work-and-mechanical-energy/figures/pendulum-energy.svg",PV)

# 12.1a 撬棒的力臂
g=Fig(640,280,"lv","撬棒的支点、动力、阻力和力臂",
 "撬棒绕支点 O 转动。动力 F1 竖直向下作用在撬棒左端，阻力 F2 是石头对撬棒竖直向下的力。F1 的作用线延长（虚线）后，从 O 向两条作用线作垂线段，得到动力臂 l1 和阻力臂 l2。静态图。")
A=(70,90); Bt=(502,200.5); O=(414,178)
g.line(350,212,630,212,GRAY,1.6)
g.poly([(414,181),(398,212),(430,212)],c=GRAY,w=1.8,fill="#f4f8fa",close=True)
g.raw(f'<path d="M506 212C499 196 512 172 540 160C575 146 612 160 618 190C620 200 617 208 614 212" stroke="{GRAY}" stroke-width="1.8" fill="#f4f8fa"/>')
g.line(*A,*Bt,INK,5)
g.line(70,150,70,194,GRAY,1.4,"5 4"); g.line(500,140,500,198,GRAY,1.4,"5 4")
g.line(414,178,70,178,BLUE,2); g.right_angle(70,178,(1,0),(0,-1),8,BLUE)
g.line(414,178,500,178,CORAL,2); g.right_angle(500,178,(-1,0),(0,1),8,CORAL)
g.arrow(70,90,70,148,BLUE,2.8,13); g.arrow(500,200,500,262,CORAL,2.8,13)
g.dot(414,178,3.6,INK)
g.sym(418,166,"O"); g.sym(34,132,"F",sub="1",c=BLUE); g.sym(510,258,"F",sub="2",c=CORAL)
g.sym(234,202,"l",sub="1",c=BLUE); g.sym(452,170,"l",sub="2",c=CORAL)
g.save(OUT+"g8b-12-simple-machines/figures/crowbar-lever-arms.svg",PV)

# 12.3b 滑轮组：数承担物重的绳段
g=Fig(560,380,"pul","滑轮组中承担物重的绳段",
 "一个定滑轮和一个动滑轮组成的两种滑轮组。甲：绳子一端系在动滑轮上，动滑轮由 3 段绳子（红色）吊着，n=3，拉力 F 向上。乙：绳子一端系在定滑轮上，动滑轮由 2 段绳子（红色）吊着，n=2，拉力 F 向下。在两个滑轮之间画一条横线，数穿过横线、连着动滑轮的绳段。静态图。")
R=22
def pulley(x,y):
    g.circle(x,y,R,GRAY,2,"#f4f8fa"); g.circle(x,y,4,GRAY,1.6,"#fff")
for k,X in enumerate([150,410]):
    Yf=70; Ym=250
    g.line(X-60,30,X+60,30,GRAY,2.2)
    for x in range(X-54,X+60,12): g.line(x,30,x-8,20,GRAY,1.2)
    g.line(X,30,X,Yf,GRAY,2)
    if k==0:
        hook=(X,Ym-R-12)
        g.line(*hook,X+R,Yf,CORAL,2)          # 系在动滑轮上的一段
        g.line(X-R,Yf,X-R,Ym,CORAL,2)         # 左侧一段
        g.line(X+R,Ym,X+R,Ym-60,CORAL,2)      # 自由端（向上拉，也连着动滑轮）
        g.arrow(X+R,Ym-60,X+R,Ym-98,BLUE,2.6,11); g.sym(X+R+8,Ym-80,"F",c=BLUE)
    else:
        hook=(X,Yf+R+12)
        g.line(X-R,Yf,X-R,Ym,CORAL,2)
        g.line(X+R,Ym,*hook,CORAL,2)
        g.line(X+R,Yf,X+R,Yf+60,INK,2)        # 自由端（向下拉，不连动滑轮）
        g.arrow(X+R,Yf+60,X+R,Yf+96,BLUE,2.6,11); g.sym(X+R+8,Yf+92,"F",c=BLUE)
    pulley(X,Yf); pulley(X,Ym)
    g.raw(f'<path d="M{X-R} {Yf}A{R} {R} 0 0 1 {X+R} {Yf}" stroke="{INK}" stroke-width="2" fill="none"/>')
    g.raw(f'<path d="M{X-R} {Ym}A{R} {R} 0 0 0 {X+R} {Ym}" stroke="{INK}" stroke-width="2" fill="none"/>')
    g.dot(*hook,3.2,INK)
    g.line(X,Ym+R,X,Ym+R+14,GRAY,2)
    g.rect(X-22,Ym+R+14,44,36,GRAY,2,"#e9e3d4")
    g.line(X-58,Ym-50,X+58,Ym-50,SOFT,1.2,"4 4")
    g.text(X-26,358,"甲" if k==0 else "乙",anchor="middle")
    g.sym(X+14,358,"n",anchor="middle"); g.text(X+38,358,"= 3" if k==0 else "= 2",anchor="middle",weight=500)
g.save(OUT+"g8b-12-simple-machines/figures/pulley-rope-count.svg",PV)
