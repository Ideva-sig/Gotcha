#!/usr/bin/env python3
"""批次26：讲义必需的九张精确静态SVG。

用法：python3 scripts/figures/draw-math-26.py output/preview/fig-review/math-26
只写本批次新图；预览使用独立临时页，避免与其他批次争用svgkit的预览页。
曲线由解析式采样241点；几何图由坐标计算，绘图比例不是新题设。
"""
from svgkit import *
from pathlib import Path
import html
import re
import sys
import glob
import tempfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'course/math/g9a-26-quadratic-functions/figures'
FIGURES = []


def label(g, x, y, parts, size=16, anchor='start'):
    """单个text中的分色短式；所有拉丁变量、点名斜体，数和运算符正体。"""
    if isinstance(parts, str):
        parts = [(parts, INK)]
    spans = []
    for text, color in parts:
        for token in re.split(r'([A-Za-z]+)', text):
            if not token:
                continue
            italic = bool(re.fullmatch(r'[A-Za-z]+', token)) and token not in ('m',)
            family = 'Times New Roman,serif' if italic else '-apple-system,PingFang SC,sans-serif'
            spans.append(f'<tspan fill="{color}" font-family="{family}" font-style="{"italic" if italic else "normal"}">{html.escape(token)}</tspan>')
    g.raw(f'<text class="{g.p}-math" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" style="font-size:{size}px;font-weight:500;stroke:none">{"".join(spans)}</text>')


def step(g, n):
    g.raw(f'<g data-step="{n}">')


def end(g):
    g.raw('</g>')


def caption(g, x, text, y=28):
    g.text(x, y, text, size=15)


class Plot:
    """可重用仿射坐标系；刻度按数学单位等距，不依赖像素目测。"""
    def __init__(self, g, x, y, w, h, xmin, xmax, ymin, ymax):
        self.g = g
        self.x, self.y, self.w, self.h = x, y, w, h
        self.xmin, self.xmax, self.ymin, self.ymax = xmin, xmax, ymin, ymax
        self.sx, self.sy = w / (xmax - xmin), h / (ymax - ymin)

    def p(self, x, y):
        return self.x + (x-self.xmin)*self.sx, self.y + (self.ymax-y)*self.sy

    def line(self, x1, y1, x2, y2, c=GRAY, dash=None, w=1.5):
        self.g.line(*self.p(x1,y1), *self.p(x2,y2), c=c, w=w, dash=dash)

    def dot(self, x, y, c=GRAY):
        self.g.dot(*self.p(x,y), r=3.4, c=c)

    def axes(self, xcolor=GRAY, xticks=(), yticks=(), numbered=False, ylabel='y'):
        g = self.g
        if self.ymin <= 0 <= self.ymax:
            ax, ay = self.p(self.xmin,0)
            bx, by = self.p(self.xmax,0)
            g.arrow(ax,ay,bx,by,c=xcolor,w=1.3,size=6)
            label(g,bx+12,by+5,'x',size=17)
            for v in xticks:
                px,py = self.p(v,0)
                g.line(px,py-3,px,py+3,xcolor,1)
                if numbered and v != 0:
                    label(g,px,py+21,str(v),size=12,anchor='middle')
        if self.xmin <= 0 <= self.xmax:
            ax,ay = self.p(0,self.ymin)
            bx,by = self.p(0,self.ymax)
            g.arrow(ax,ay,bx,by,c=GRAY,w=1.3,size=6)
            label(g,bx-10,by-11,ylabel,size=17)
            for v in yticks:
                px,py = self.p(0,v)
                g.line(px-3,py,px+3,py,GRAY,1)
                if numbered and v != 0:
                    label(g,px-10,py+4,str(v),size=12,anchor='end')

    def curve(self, fun, lo=None, hi=None, c=GRAY, w=2.3, dash=None):
        lo = self.xmin if lo is None else lo
        hi = self.xmax if hi is None else hi
        pts = []
        for i in range(241):
            x = lo + (hi-lo)*i/240
            y = fun(x)
            assert self.ymin-1e-8 <= y <= self.ymax+1e-8, (self.g.p,x,y)
            pts.append(self.p(x,y))
        self.g.poly(pts,c=c,w=w,dash=dash)


def finish(g, name):
    path = OUT / name
    # svgkit直接插入title/desc；在本批次转义，不能让不等号破坏XML。
    g.title, g.desc = html.escape(g.title), html.escape(g.desc)
    g.save(str(path))
    FIGURES.append((path,g.w,g.h))


def opening():
    name='coefficient-opening-26-2a'
    g=Fig(720,480,name,'系数与抛物线开口',
          '三步同尺度：第一步由课本对应值描出y=x²；第二步比较a为1、2、1/2的三条向上抛物线；第三步比较a为−1、−2、−1/2的三条向下抛物线。蓝、绿、黄分别配对系数与曲线；顶点都是原点，对称轴都是y轴。')
    plots=[]
    for i in range(3):
        p=Plot(g,34+240*i,78,180,270,-3.5,3.5,-10,10)
        p.axes(xticks=range(-3,4),yticks=range(-9,10),numbered=False)
        plots.append(p)
    for i in range(3):
        step(g,i+1)
        caption(g,24+240*i,['描点成曲线','比较开口大小','改变开口方向'][i])
        p=plots[i]
        coeffs=[1] if i==0 else ([1,2,0.5] if i==1 else [-1,-2,-0.5])
        for j,a in enumerate(coeffs):
            c=[BLUE,GREEN,YELLOW][j]
            bound=min(3.5,math.sqrt(9/abs(a)))
            p.curve(lambda x,a=a:a*x*x,-bound,bound,c)
            label(g,24+240*i,384+28*j,[(f'a={a:g}',c),('  ',INK),(('y='+('' if a==1 else '−' if a==-1 else '2' if a==2 else '−2' if a==-2 else '0.5' if a==0.5 else '−0.5')+'x²'),c)],size=16)
        if i==0:
            for x in range(-3,4):
                p.dot(x,x*x,BLUE)
        p.dot(0,0,GRAY)
        end(g)
    label(g,360,468,'顶点 (0, 0)；对称轴为 y 轴',size=14,anchor='middle')
    finish(g,name+'.svg')


def shift():
    name='vertex-form-shift-26-2b'
    g=Fig(720,440,name,'顶点式探索器的初始状态与平移参照',
          '初始a=−0.5、h=0、k=0，蓝色实线y=−x²/2，顶点(0,0)。灰色虚线是目标y=−1/2(x+1)²−1，顶点(−1,−1)。绿色箭头先向下1，珊瑚红箭头再向左1；对称轴与h同为珊瑚红，竖直位移与k同为绿。右侧为固定读数区。')
    p=Plot(g,50,70,350,310,-4,3,-5,1.2)
    p.axes(xticks=range(-3,3),yticks=range(-4,2))
    p.curve(lambda x:-0.5*(x+1)**2-1,-1-math.sqrt(8),-1+math.sqrt(8),GRAY,dash='6 4')
    p.line(-1,-5,-1,0.5,CORAL,dash='5 5')
    p.line(0,-5,0,0.5,CORAL,dash='5 5')
    p.curve(lambda x:-0.5*x*x,-math.sqrt(10),3,BLUE)
    # 顶点实际位移；箭头端点与顶点坐标一致。
    g.arrow(*p.p(0,0),*p.p(0,-1),GREEN,2,7)
    g.arrow(*p.p(0,-1),*p.p(-1,-1),CORAL,2,7)
    p.dot(0,0,BLUE); p.dot(-1,-1,GRAY)
    label(g,70,416,[('x=−1',CORAL),('  ←  ',INK),('x=0',CORAL)],size=16)
    caption(g,450,'初始读数')
    label(g,450,70,[('a=−1/2',BLUE)],size=19)
    label(g,450,101,[('h=0',CORAL),('，',INK),('k=0',GREEN)],size=19)
    label(g,450,139,[('y=−x²/2',BLUE)],size=21)
    label(g,450,172,[('顶点 (',INK),('0',CORAL),(', ',INK),('0',GREEN),(')',INK)])
    label(g,450,206,[('a<0：开口向下',BLUE)])
    g.text(450,248,'平移参照',size=15)
    label(g,450,279,[('先下移 1',GREEN)])
    label(g,450,309,[('再左移 1',CORAL)])
    label(g,450,340,'y=−1/2(x+1)²−1',size=18)
    label(g,450,374,[('顶点 (',INK),('−1',CORAL),(', ',INK),('−1',GREEN),(')',INK)])
    finish(g,name+'.svg')


def completing():
    name='complete-square-26-2c'
    g=Fig(720,560,name,'配方与顶点、最低高度对应',
          '第一步提取1/2；第二步配成(x−6)²，并保留减36；第三步用y=1/2(x−6)²+3画曲线。蓝色的h=6对应横坐标与虚线对称轴；绿色的k=3对应纵坐标与最低高度线。横轴标刻度6，纵轴标刻度3，顶点为(6,3)。')
    p=Plot(g,435,150,230,322,0,10,0,14)
    p.axes(xticks=range(1,10),yticks=range(1,14))
    step(g,1)
    caption(g,26,'提取二次项系数')
    label(g,26,68,'y=1/2 x²−6x+21',size=20)
    label(g,26,110,'=1/2(x²−12x)+21',size=20)
    end(g)
    step(g,2)
    caption(g,26,'补成完全平方',y=168)
    label(g,26,211,[('=1/2[(x−',INK),('6',BLUE),(')²−36]+21',INK)],size=20)
    label(g,26,253,[('=1/2(x−',INK),('6',BLUE),(')²+',INK),('3',GREEN)],size=22)
    label(g,26,308,[('h=6',BLUE),('，',INK),('k=3',GREEN)],size=20)
    end(g)
    step(g,3)
    caption(g,429,'读回图象')
    lo,hi=6-math.sqrt(22),10
    px,py=p.p(6,0)
    label(g,px,py+21,[('6',BLUE)],size=14,anchor='middle')
    px,py=p.p(0,3)
    label(g,px-10,py+4,[('3',GREEN)],size=14,anchor='end')
    p.line(6,0,6,14,BLUE,dash='5 4')
    p.line(0,3,10,3,GREEN,dash='5 4')
    p.curve(lambda x:0.5*(x-6)**2+3,lo,hi,GRAY)
    p.dot(6,3,GREEN)
    label(g,429,82,[('x=6',BLUE),('；',INK),('y=3',GREEN)],size=18)
    label(g,429,116,[('顶点 (',INK),('6',BLUE),(', ',INK),('3',GREEN),(')',INK)],size=18)
    label(g,26,382,'1/2(x−6)² ≥ 0',size=20)
    label(g,26,418,[('最低高度：',INK),('3',GREEN)],size=19)
    end(g)
    finish(g,name+'.svg')


def symmetry():
    name='symmetric-values-26-2d'
    g=Fig(720,480,name,'比较函数值探索器的初始状态',
          'a=0.5、h=6、k=3。灰色曲线y=1/2(x−6)²+3；蓝色对称轴x=6。标出(3,7.5)、(6,3)、(9,7.5)，等高两点由绿色虚线连接；横轴下方黄色距离箭头各长3，右侧固定读数区显示坐标和绝对值距离。')
    p=Plot(g,45,88,370,370,0,10,0,10)
    p.axes(xticks=range(1,10),yticks=range(1,10))
    p.line(6,0,6,10,BLUE,dash='5 5')
    p.line(3,7.5,9,7.5,GREEN,dash='5 4')
    p.line(3,0,3,7.5,GRAY,dash='3 5',w=1)
    p.line(9,0,9,7.5,GRAY,dash='3 5',w=1)
    p.curve(lambda x:0.5*(x-6)**2+3,6-math.sqrt(14),9.7,GRAY)
    for x,y,c in [(3,7.5,GREEN),(6,3,BLUE),(9,7.5,GREEN)]:
        p.dot(x,y,c)
    # 距离在函数图底部空白位置画，长度与横坐标差精确一致。
    for x1,x2 in [(3,6),(6,9)]:
        g.arrow(*p.p(x1,-0.18),*p.p(x2,-0.18),YELLOW,1.8,6)
    caption(g,453,'初始读数')
    label(g,453,69,[('h=6',BLUE),('，k=3',INK)],size=19)
    label(g,453,107,[('y=1/2(x−',INK),('6',BLUE),(')²+3',INK)],size=19)
    label(g,453,150,[('(3, ',INK),('7.5',GREEN),(')',INK)],size=20)
    label(g,453,185,[('(6, 3)',BLUE)],size=20)
    label(g,453,220,[('(9, ',INK),('7.5',GREEN),(')',INK)],size=20)
    label(g,453,271,[('|3−6|=3',YELLOW)],size=20)
    label(g,453,306,[('|9−6|=3',YELLOW)],size=20)
    label(g,453,353,[('同距 → 同高',GREEN)],size=18)
    label(g,453,397,[('对称轴 x=6',BLUE)],size=19)
    finish(g,name+'.svg')


def roots():
    name='roots-intersections-26-3a'
    g=Fig(720,490,name,'实数根与横轴公共点的三种情况',
          '三幅图均采用横纵轴每单位19像素的相同尺度。第一步y=x²+x−2有两个交点(−2,0)、(1,0)，判别式为正；第二步y=x²−8x+16只有交点(4,0)，方程有两个相等实根，判别式为零；第三步y=x²−x+1没有横轴公共点或实根，判别式为负。根与横坐标同蓝，y=0与横轴同绿。')
    ps=[]
    for i in range(3):
        p=Plot(g,32+240*i,115,190,190,-3,7,-3,7)
        p.axes(xcolor=GREEN,xticks=range(-2,7),yticks=range(-2,7))
        ps.append(p)
    cases=[(lambda x:x*x+x-2,-0.5-math.sqrt(9.25),-0.5+math.sqrt(9.25),[-2,1],'y=x²+x−2','Δ>0','两个公共点'),
           (lambda x:(x-4)**2,4-math.sqrt(7),4+math.sqrt(7),[4],'y=x²−8x+16','Δ=0','一个公共点'),
           (lambda x:x*x-x+1,0.5-math.sqrt(6.25),0.5+math.sqrt(6.25),[],'y=x²−x+1','Δ<0','没有公共点')]
    for i,(fun,lo,hi,rs,formula,delta,title) in enumerate(cases):
        step(g,i+1)
        caption(g,24+240*i,title)
        label(g,24+240*i,66,formula,size=18)
        p=ps[i]; p.curve(fun,lo,hi)
        for r in rs: p.dot(r,0,BLUE)
        label(g,24+240*i,340,[(delta,BLUE)],size=21)
        label(g,24+240*i,372,[('y=0',GREEN)],size=18)
        if i==0:
            label(g,24,405,[('(−2, ',BLUE),('0',GREEN),(')，',INK),('(1, ',BLUE),('0',GREEN),(')',INK)],size=17)
            label(g,24,440,[('根 −2，1',BLUE)],size=18)
        elif i==1:
            label(g,264,405,[('(4, ',BLUE),('0',GREEN),(')',INK)],size=18)
            label(g,264,440,'两个相等实根',size=16)
            label(g,264,469,[('x₁=x₂=4',BLUE)],size=18)
        else:
            label(g,504,405,'没有实数根',size=18)
        end(g)
    finish(g,name+'.svg')


def inequalities():
    name='graph-intervals-26-3b'
    g=Fig(720,540,name,'图象上下位置与横坐标区间',
          '第一步完整画出y=x²−2x−3，标根−1、3；第二步将横轴上方曲线及数轴x<−1或x>3涂蓝；第三步将横轴下方曲线及数轴−1<x<3涂绿。严格不等式在数轴端点用空心圆，横轴交点在函数图上保留。')
    p=Plot(g,82,74,555,270,-3,5,-4.5,9)
    p.axes(xticks=range(-2,5),yticks=range(-4,9))
    for yy in [401,481]:
        g.arrow(*p.p(-3,0)[:1],yy,*p.p(5,0)[:1],yy,GRAY,1.2,6)
        label(g,663,yy+5,'x',size=17)
    step(g,1)
    caption(g,28,'先找横轴交点')
    label(g,375,28,'y=x²−2x−3',size=21)
    bound=math.sqrt(13)
    p.curve(lambda x:(x-1)**2-4,1-bound,1+bound,GRAY,w=1.6)
    for r in [-1,3]:
        p.dot(r,0,GRAY)
        px,py=p.p(r,0)
        label(g,px,py+24,[(str(r),GRAY)],size=15,anchor='middle')
    end(g)
    step(g,2)
    for lo,hi in [(1-bound,-1),(3,1+bound)]:
        p.curve(lambda x:(x-1)**2-4,lo,hi,BLUE,w=2.7)
    xlo=p.p(-3,0)[0]; x1=p.p(-1,0)[0]; x2=p.p(3,0)[0]; xhi=p.p(5,0)[0]
    g.arrow(x1-4,401,xlo,401,BLUE,2.6,7)
    g.arrow(x2+4,401,xhi,401,BLUE,2.6,7)
    for px in [x1,x2]: g.circle(px,401,4,BLUE,2,'#fff')
    label(g,82,380,[('y>0：x<−1 或 x>3',BLUE)],size=18)
    for px,num in [(x1,'−1'),(x2,'3')]: label(g,px,424,num,size=15,anchor='middle')
    end(g)
    step(g,3)
    p.curve(lambda x:(x-1)**2-4,-1,3,GREEN,w=2.7)
    g.line(x1+4,481,x2-4,481,GREEN,2.6)
    for px in [x1,x2]: g.circle(px,481,4,GREEN,2,'#fff')
    label(g,82,460,[('y<0：−1<x<3',GREEN)],size=18)
    for px,num in [(x1,'−1'),(x2,'3')]: label(g,px,505,num,size=15,anchor='middle')
    end(g)
    finish(g,name+'.svg')


def garden(g,x,y,w,h,partition=False,wall_width=None):
    # 墙和三条(或四条)实线篱笆分开；符号图不添加未给定的边长数值。
    wall_width=w+24 if wall_width is None else wall_width
    g.rect(x+(w-wall_width)/2,y-12,wall_width,12,c=GRAY,sw=1.2,fill=LIGHT)
    g.line(x,y,x,y+h,BLUE,2.4)
    g.line(x+w,y,x+w,y+h,BLUE,2.4)
    if partition: g.line(x+w/2,y,x+w/2,y+h,BLUE,2.4)
    g.line(x,y+h,x+w,y+h,GREEN,2.4)
    for cx in [x,x+w]: g.right_angle(cx,y+h,(0,-1),(1 if cx==x else -1,0),s=8)


def area_range():
    name='garden-domain-26-4a'
    g=Fig(720,280,name,'三边围园与面积式',
          '第一步用20米篱笆靠墙围三边，垂直边为x，平行边为20−2x。第二步由矩形面积列出S=x(20−2x)。蓝色配对x与垂直边，绿色配对平行边与其式子。不展示练一练的题设、模型、范围或答案。')
    step(g,1)
    caption(g,26,'靠墙围三边：20 m')
    garden(g,79,82,190,108)
    label(g,54,143,[('x',BLUE)],size=20,anchor='end')
    label(g,292,143,[('x',BLUE)],size=20)
    label(g,174,222,[('20−2x',GREEN)],size=20,anchor='middle')
    end(g)
    step(g,2)
    caption(g,382,'列面积式')
    label(g,382,143,[('S=',INK),('x',BLUE),('(',INK),('20−2x',GREEN),(')',INK)],size=23)
    end(g)
    finish(g,name+'.svg')


def bridge():
    name='bridge-waterline-26-4c'
    g=Fig(720,570,name,'拱桥建系、代点与水面宽度',
          '第一步以拱顶为原点，原水面y=−4，两端坐标(−5,−4)、(5,−4)；第二步代入(5,−4)求得y=−4/25 x²；第三步新水面y=−3，对应左右根−5√3/2与5√3/2，黄色宽度线表示两横坐标之差。蓝色对应高度与y，绿色对应横坐标与根。')
    ps=[]
    for i in range(3):
        p=Plot(g,33+240*i,90,180,192,-6,6,-5.3,1.1)
        p.axes(xticks=range(-5,6),yticks=range(-5,1))
        ps.append(p)
    for i in range(3):
        step(g,i+1)
        caption(g,24+240*i,['顶点建系','代入已知点','水面对应两个根'][i])
        p=ps[i]
        p.curve(lambda x:-4*x*x/25,-5.7,5.7)
        p.dot(0,0,GRAY)
        if i<2:
            p.line(-5,-4,5,-4,BLUE)
            p.dot(5,-4,GREEN)
            if i==0: p.dot(-5,-4,GREEN)
        else:
            r=5*math.sqrt(3)/2
            p.line(-5,-4,5,-4,GRAY,dash='4 4')
            p.line(-r,-3,r,-3,BLUE,w=2.4)
            for x in [-r,r]:
                p.dot(x,-3,GREEN)
                p.line(x,-3,x,-5.15,GREEN,dash='4 4')
            # 宽度精确为右根减左根；用底部双向箭头，不挡曲线或读数。
            x1,y1=p.p(-r,-5.05); x2,y2=p.p(r,-5.05)
            g.arrow(x1,y1,x2,y2,YELLOW,2,7)
            g.head(x1,y1,-1,0,YELLOW,7)
        if i==0:
            label(g,24,321,[('(',INK),('−5',GREEN),(', ',INK),('−4',BLUE),(')',INK)],size=18)
            label(g,24,354,[('(',INK),('5',GREEN),(', ',INK),('−4',BLUE),(')',INK)],size=18)
            label(g,24,403,[('y=−4',BLUE)],size=20)
            label(g,24,445,'单位：米',size=15)
        elif i==1:
            label(g,264,321,[('y',BLUE),('=ax²',INK)],size=22)
            label(g,264,362,[('−4',BLUE),('=a×',INK),('5',GREEN),('²',INK)],size=22)
            label(g,264,403,'a=−4/25',size=22)
            label(g,264,445,'y=−4/25 x²',size=22)
        else:
            label(g,504,321,[('y=−3',BLUE)],size=22)
            label(g,504,362,[('x=±5√3/2',GREEN)],size=22)
            label(g,504,403,[('右根 − 左根',YELLOW)],size=18)
            label(g,504,445,[('宽度 5√3 m',YELLOW)],size=22)
            label(g,504,488,[('≈ 8.7 m',YELLOW)],size=20)
        end(g)
    finish(g,name+'.svg')


def tick(g,p,q,n=1,c=GRAY):
    ux,uy=unit(q[0]-p[0],q[1]-p[1]); nx,ny=-uy,ux
    mx,my=(p[0]+q[0])/2,(p[1]+q[1])/2
    for j in range(n):
        off=(j-(n-1)/2)*5
        g.line(mx+off*ux-4*nx,my+off*uy-4*ny,mx+off*ux+4*nx,my+off*uy+4*ny,c,1.5)


def inscribed_square(g,ox,oy,L,ratio=0.27,midpoints=False):
    t=L*ratio
    pts={'A':(ox,oy+L),'B':(ox+L,oy+L),'C':(ox+L,oy),'D':(ox,oy),
         'E':(ox+t,oy+L),'F':(ox+L,oy+L-t),'G':(ox+L-t,oy),'H':(ox,oy+t)}
    g.poly([pts[z] for z in 'ABCD'],close=True,w=1.6)
    g.raw('<path d="M'+'L'.join(f'{f(pts[z][0])} {f(pts[z][1])}' for z in 'EFGH')+f'Z" fill="{GREEN if midpoints else BLUE}" fill-opacity="0.08" stroke="{GRAY}" stroke-width="2"/>')
    for z,a,b in [('A','B','D'),('B','A','C'),('C','B','D'),('D','A','C'),
                  ('E','F','H'),('F','E','G'),('G','F','H'),('H','E','G')]:
        p=pts[z]; q=pts[a]; r=pts[b]
        g.right_angle(*p,(q[0]-p[0],q[1]-p[1]),(r[0]-p[0],r[1]-p[1]),s=7,w=1.1)
    # 等长：四条内边双刻痕；四条对应短边单刻痕；另四条对应长边三刻痕。
    for a,b in [('E','F'),('F','G'),('G','H'),('H','E')]: tick(g,pts[a],pts[b],2)
    for a,b in [('A','E'),('B','F'),('C','G'),('D','H')]: tick(g,pts[a],pts[b],1)
    for a,b in [('E','B'),('F','C'),('G','D'),('H','A')]: tick(g,pts[a],pts[b],1 if midpoints else 3)
    for z in 'ABCDEFGH':
        x,y=pts[z]
        dx,dy={'A':(-13,23),'B':(13,23),'C':(13,-12),'D':(-13,-12),
               'E':(0,23),'F':(16,5),'G':(0,-12),'H':(-16,5)}[z]
        label(g,x+dx,y+dy,z,size=16,anchor='middle')
    return pts


def square_geometry():
    name='inscribed-square-area-26-4d'
    g=Fig(720,470,name,'内接正方形的面积三步图',
          '三步几何图沿用课本A左下、B右下、C右上、D左上的点序。第一步设AB=s、AE=t，用单刻痕表示AE=BF=CG=DH，三刻痕表示其余外边分段相等，内边用双刻痕；内外两个正方形均标四个直角。第二步突出直角三角形EBF，BE=s−t蓝色、BF=t绿色，平方项同色。第三步四个边中点构成内正方形，面积为s²/2。所有坐标、直角与刻痕由向量计算。')
    for i in range(3):
        step(g,i+1)
        caption(g,24+240*i,['设一个位置量','看直角三角形','四边中点'][i])
        pts=inscribed_square(g,44+240*i,98,150,0.5 if i==2 else 0.27,i==2)
        if i==0:
            label(g,24,309,'AB=s',size=19)
            label(g,24,346,'AE=t，BF=t',size=19)
            label(g,24,385,'0<t<s',size=19)
        elif i==1:
            E,B,F=pts['E'],pts['B'],pts['F']
            g.line(*E,*B,BLUE,2.6); g.line(*B,*F,GREEN,2.6); g.line(*E,*F,GRAY,2.6)
            label(g,264,309,[('BE=s−t',BLUE)],size=19)
            label(g,264,346,[('BF=t',GREEN)],size=19)
            label(g,264,385,[('S=',INK),('(s−t)²',BLUE),('+',INK),('t²',GREEN)],size=22)
        else:
            for z in 'EFGH': g.dot(*pts[z],r=3.3,c=GREEN)
            label(g,504,309,[('t=s/2',GREEN)],size=20)
            label(g,504,352,[('S=s²/2',GREEN)],size=24)
            label(g,504,391,'四个点都是中点',size=16)
        end(g)
    finish(g,name+'.svg')


def verify_math():
    """先核验核心数值和几何关系；不修改任何检查脚本。"""
    assert -0.5*(-1+1)**2-1 == -1
    for x,y in [(3,7.5),(6,3),(9,7.5)]: assert 0.5*(x-6)**2+3 == y
    for x in [-2,1]: assert x*x+x-2 == 0
    assert (4-4)**2 == 0
    assert 0.5**2-0.5+1 > 0
    for x in [-1,3]: assert x*x-2*x-3 == 0
    r=5*math.sqrt(3)/2
    assert abs(-4*r*r/25+3)<1e-12
    assert -4*25/25 == -4
    s,t=150,150*0.27
    E=(t,s); F=(s,s-t); G=(s-t,0); H=(0,t)
    vs=[(q[0]-p[0],q[1]-p[1]) for p,q in zip([E,F,G,H],[F,G,H,E])]
    for i,v in enumerate(vs):
        assert abs(v[0]**2+v[1]**2-((s-t)**2+t*t))<1e-9
        q=vs[(i+1)%4]; assert abs(v[0]*q[0]+v[1]*q[1])<1e-9


def render_previews(directory):
    directory=Path(directory).resolve(); directory.mkdir(parents=True,exist_ok=True)
    candidates=sorted(glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell')))
    chrome=os.environ.get('CHROME_BIN') or (candidates[-1] if candidates else None)
    if not chrome: raise RuntimeError('未找到Chromium，不能生成预览')
    temp=ROOT/'output/tmp'; temp.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='math-26-render-',dir=temp) as td:
        for path,w,h in FIGURES:
            page=Path(td)/(path.stem+'.html')
            page.write_text('<!doctype html><meta charset="utf-8"><style>body{margin:0}svg{display:block}</style>'+path.read_text(),encoding='utf-8')
            shot=directory/(path.stem+'.png')
            subprocess.run([chrome,'--headless','--no-sandbox',f'--user-data-dir={td}/profile',
                            f'--screenshot={shot}',f'--window-size={w},{h}','--force-device-scale-factor=2',
                            '--hide-scrollbars',page.as_uri()],capture_output=True,check=True,timeout=120)
            if not shot.is_file(): raise RuntimeError(f'预览未生成：{shot}')
    tiles=''.join(f'<section><h2>{html.escape(path.stem)}</h2><img src="{path.stem}.png" alt="{html.escape(path.stem)}"></section>' for path,_,_ in FIGURES)
    (directory/'index.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>数学批次26配图检查</title><style>body{font-family:-apple-system,sans-serif;margin:24px;color:#20272b;background:white}section{margin:32px 0;border-bottom:1px solid #bec9ce}h2{font-size:16px;font-weight:500}img{width:720px;max-width:100%;height:auto}</style><h1>数学批次26 · 配图检查</h1>'+tiles+'</html>',encoding='utf-8')


if __name__=='__main__':
    verify_math()
    for draw in [opening,shift,completing,symmetry,roots,inequalities,area_range,bridge,square_geometry]: draw()
    if len(sys.argv)>1: render_previews(sys.argv[1])
    print(f'完成 {len(FIGURES)} 张 SVG；核心坐标与几何关系校验通过。')
