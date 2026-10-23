#!/usr/bin/env python3
"""批次 a：八上／八下 17 张可选图。

用法：python3 scripts/figures/draw-opt-a.py output/preview/fig-review/a
只写本脚本清单内的新 SVG 和指定目录下的预览，不接入讲义。
尺寸用于排版，不表示实测数据；唯一数字标注 760 mm 来自 9.3a。
"""
from svgkit import *
from pathlib import Path
from html import escape
import argparse
import json
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'course/physics'
RECORDS = []
ONLY = set()  # 返修时只重写指定图；其余图仅保留在审图目录索引中。


def tint(g, x, y, width, height, color=BLUE, opacity=.12):
    g.raw(f'<rect x="{f(x)}" y="{f(y)}" width="{f(width)}" height="{f(height)}" '
          f'fill="{color}" fill-opacity="{opacity}" stroke="none"/>')


def vessel(g, cx, top, bottom, surface, half=65):
    tint(g, cx-half, surface, half*2, bottom-surface)
    g.poly([(cx-half, top), (cx-half, bottom), (cx+half, bottom), (cx+half, top)], w=2)
    g.line(cx-half, surface, cx+half, surface, BLUE, 1.8)


def dimension(g, x1, y1, x2, y2, color=GRAY):
    ux, uy = unit(x2-x1, y2-y1)
    nx, ny = -uy, ux
    g.line(x1, y1, x2, y2, color, 1.6)
    for x, y in ((x1, y1), (x2, y2)):
        g.line(x-nx*5, y-ny*5, x+nx*5, y+ny*5, color, 1.6)


def save(g, chapter, kp, filename, position, alt, field, check, doubt='无'):
    # 独立前缀，不与已存在图及其他批次共用类名／id。
    assert g.p == 'opt-a-' + filename[:-4]
    assert 480 <= g.w <= 660
    path = COURSE / chapter / 'figures' / filename
    if not ONLY or filename in ONLY:
        g.save(str(path))
    RECORDS.append(dict(chapter=chapter, kp=kp, filename=filename,
                        path=str(path.relative_to(ROOT)), position=position,
                        alt=alt, field=field, check=check, doubt=doubt,
                        width=g.w, height=g.h))


def fig(w, h, name, title, desc):
    return Fig(w, h, 'opt-a-'+name, title, desc+' 静态 SVG，无动画；图形尺寸仅作示意，不表示实测数值或题目数据。')


def draw_waves():
    chapter = 'g8a-02-sound'
    cases = [
        ('pitch-waveforms', '2.2a', '不同频率的波形',
         '在相同时间范围内，对比振幅相同、频率不同的两条波形。',
         [('频率较低', 2.3, 34, 0), ('频率较高', 3.7, 34, 0)],
         '相同时间范围、振幅相同，振动快慢不同；未标频率数值或具体比例'),
        ('loudness-waveforms', '2.2b', '不同振幅的波形',
         '在相同时间范围内，对比频率相同、振幅不同的两条波形；不表示距离因素。',
         [('振幅较小', 2.7, 19, 0), ('振幅较大', 2.7, 39, 0)],
         '频率相同、振幅不同；不画古琴，不写练习题响度变化的填空结果'),
        ('timbre-waveforms', '2.2c', '不同音色的波形',
         '两条波形的周期和峰值振幅相同，形状不同；表示不同音色，不对应具体人或乐器。',
         [('波形甲', 2.7, 34, 0), ('波形乙', 2.7, 34, .28)],
         '基频、峰值振幅相同，形状不同；不画编钟、鸟鸣、猫叫或题目数据'),
    ]
    for name, kp, title, desc, rows, check in cases:
        g = fig(620, 320, name, title, desc)
        x0, x1 = 150, 538
        for i, (label, cycles, amp, harmonic) in enumerate(rows):
            y = 88+i*132
            color = BLUE if i == 0 else CORAL
            g.text(25, y+5, label, size=14)
            g.line(x0, y-49, x0, y+49, GRAY, 1.6)
            g.arrow(x0, y, 573, y, GRAY, 1.6, 8)
            g.text(583, y+5, '时间', c=SOFT, size=13, weight=500)
            # 连续周期的最大振幅归一化；音色对比只改变波形。
            norm = max(abs(math.sin(t*2*math.pi/10000)+harmonic*math.sin(3*t*2*math.pi/10000))
                       for t in range(10001))
            pts = []
            for j in range(1001):
                phase = cycles*2*math.pi*j/1000
                value = (math.sin(phase)+harmonic*math.sin(3*phase))/norm
                pts.append((x0+(x1-x0)*j/1000, y-amp*value))
            g.poly(pts, c=color, w=2.2)
        g.text(344, 302, '相同时间范围', anchor='middle', c=SOFT, size=13, weight=500)
        save(g, chapter, kp, name+'.svg', '先认住', desc,
             '已完成 figures/'+name+'.svg（'+desc.rstrip('。')+'）', check)


def draw_balance():
    chapter = 'g8b-08-motion-and-force'
    name = 'cart-balanced-pulls'
    g = fig(600, 240, name, '小车两端的平衡拉力',
            '同一辆小车的两端受到大小相等、方向相反、在同一直线上的两个水平拉力。')
    g.rect(245, 92, 110, 58, GRAY, 2)
    for x in (268, 332):
        g.circle(x, 161, 11, GRAY, 2)
    g.line(95, 120, 505, 120, GRAY, 1.6, '5 5')
    g.arrow(245, 120, 155, 120, BLUE, 2.6, 12)
    g.arrow(355, 120, 445, 120, CORAL, 2.6, 12)
    g.dot(245, 120, 3, BLUE); g.dot(355, 120, 3, CORAL)
    g.sym(177, 99, 'F', '1', c=BLUE)
    g.sym(420, 99, 'F', '2', c=CORAL)
    g.text(300, 65, '同一小车', anchor='middle')
    for x, label in ((140, '大小相等'), (300, '方向相反'), (460, '同一直线')):
        g.text(x, 211, label, anchor='middle', size=14)
    save(g, chapter, '8.2a', name+'.svg', '先认住',
         '同一小车两端的水平拉力：两箭头等长、反向，并在同一直线上。',
         '已完成 figures/'+name+'.svg（小车两端等大、反向、共线的水平拉力）',
         '两作用点在同一小车；箭头均从车端出发，长度相等；不画练习汽车的四力答案')

    # 任务卡所写吸盘与现有正文不符，严格以讲义走一遍为源。
    name = 'suspended-force-balance'
    g = fig(580, 310, name, '悬挂静止物体的二力平衡',
            '左图是弹簧测力计悬挂的静止物体；右图只分析该物体受到的向上拉力和向下重力，两力等大、反向、共线。')
    g.line(82, 30, 202, 30)
    g.line(142, 30, 142, 37, GRAY, 1.8)
    g.circle(142, 44, 7, GRAY, 1.8)
    g.rect(125, 51, 34, 85, GRAY, 2)
    g.poly([(142, 59), (136, 66), (148, 73), (136, 80), (148, 87), (142, 94)], w=1.6)
    g.line(142, 94, 142, 172)
    g.rect(120, 172, 44, 44, GRAY, 2)
    g.text(142, 254, '静止悬挂', anchor='middle')
    cx, cy, length = 425, 158, 78
    g.rect(cx-22, cy-22, 44, 44, GRAY, 2)
    g.arrow(cx, cy, cx, cy-length, BLUE, 2.6, 12)
    g.arrow(cx, cy, cx, cy+length, CORAL, 2.6, 12)
    g.dot(cx, cy, 3, GRAY)
    g.text(cx+17, cy-length+5, '拉力', c=BLUE)
    g.text(cx+17, cy+length+5, '重力', c=CORAL)
    g.text(cx, 281, '研究物体', anchor='middle', size=13, c=SOFT)
    save(g, chapter, '8.2b', name+'.svg', '走一遍',
         '弹簧测力计悬挂的物体静止；该物体受到向上的拉力和向下的重力，两力等大、反向、共线。',
         '已完成 figures/'+name+'.svg（讲义走一遍中的静止悬挂物体与竖直平衡力）',
         '以悬挂物体为对象；两力等长共线；不画书的支持力作图题答案',
         '任务卡要求吸盘四向受力，但当前先认住写列车、走一遍写悬挂物体；吸盘只见备选 GZ2024-04。按硬规定 3 改画走一遍，不添加吸盘模型，待主会话确认。')

    name = 'collinear-resultants'
    g = fig(640, 335, name, '共线二力同向和反向的合力',
            '左侧两个共线力同向，合力方向相同、长度为两长度之和；右侧共线力反向，合力方向与较大的力相同、长度为两长度之差。各列上行为两个力，下行为单独作用的合力。同向两力为便于辨识上下平移，实际在同一直线上。')
    a, b = 112, 63
    for i, (cx, label) in enumerate(((92, '同向'), (437, '反向'))):
        g.text(cx+45, 35, label, anchor='middle')
        y = 104
        # 同向力仅为辨识上下平移；实际共线，文字明确说明。
        y1, y2 = (y-12, y+12) if i == 0 else (y, y)
        g.rect(cx-12, y-24 if i == 0 else y-12, 24, 48 if i == 0 else 24, GRAY, 1.8)
        x1, x2 = cx+12, cx+12 if i == 0 else cx-12
        end1, end2 = x1+a, x2+(b if i == 0 else -b)
        g.arrow(x1, y1, end1, y1, BLUE, 2.6, 11)
        g.arrow(x2, y2, end2, y2, CORAL, 2, 9)
        g.dot(x1, y1, 3, BLUE)
        g.dot(x2, y2, 3, CORAL)
        g.sym(end1-3, y1-16, 'F', '1', c=BLUE)
        g.sym(end2, y2+34, 'F', '2', c=CORAL, anchor='middle')
        g.text(cx+45, 174, '同一直线', anchor='middle', size=13, c=SOFT)
        length1, length2 = abs(end1-x1), abs(end2-x2)
        resultant = length1+length2 if i == 0 else length1-length2
        assert resultant == (a+b if i == 0 else a-b)
        yr, xr = 226, cx+12
        g.rect(cx-12, yr-12, 24, 24, GRAY, 1.8)
        g.arrow(xr, yr, xr+resultant, yr, BLUE, 2.6, 11)
        g.dot(xr, yr, 3, BLUE)
        g.text(xr+resultant+15, yr+5, '合力', c=BLUE)
        center = 160 if i == 0 else 480
        g.text(center, 293, '合力 = 两力之和' if i == 0 else '合力 = 大力减小力',
               anchor='middle', size=13, c=SOFT)
        g.text(center, 316, '方向相同' if i == 0 else '方向同大力',
               anchor='middle', size=13, c=SOFT)
    save(g, chapter, '8.4a', name+'.svg', '先认住',
         '同向：合力等于两力之和，方向相同；反向：合力等于大力减小力，方向同大力。同向箭头为便于辨识上下错开，实际在同一直线上。',
         '已完成 figures/'+name+'.svg（同向相加、反向相减的共线二力合成，不标数值）',
         '两力作用在同一物体；同向两箭头仅上下平移以便辨识并注明同一直线；按起点到箭尖的实际像素长度相加或相减画合力，不标数值')


def manometer(g, left, top, depth, gap, liquid_label):
    cx, half = left+65, 54
    surface, bottom = top+55, top+178
    vessel(g, cx, top+36, bottom, surface, half)
    probe_y = surface+depth
    # 探头膜片朝左，软管接探头背面；软管接到封闭的 U 管左端。
    g.rect(cx-8, probe_y-10, 16, 20, GRAY, 1.8)
    g.line(cx-8, probe_y-9, cx-8, probe_y+9, CORAL, 2)
    ul, ur, radius = left+195, left+243, 24
    tube_bottom = top+145
    g.poly([(cx+8, probe_y), (left+132, probe_y), (left+132, top+15),
            (ul+4, top+15), (ul+4, top+30)], w=1.8)
    yl, yr = top+94+gap, top+94-gap
    # U 管为同一种测压液；被加压的左液面降低、开口右液面升高。
    g.raw(f'<path d="M{ul} {yl}V{tube_bottom}A24 24 0 0 0 {ur} {tube_bottom}'
          f'V{yr}H{ur-8}V{tube_bottom}A16 16 0 0 1 {ul+8} {tube_bottom}'
          f'V{yl}Z" fill="{BLUE}" fill-opacity=".28" stroke="none"/>')
    for offset, r in ((0, radius), (8, radius-8)):
        g.raw(f'<path d="M{ul+offset} {top+30}V{tube_bottom}A{r} {r} 0 0 0 '
              f'{ur-offset} {tube_bottom}V{top+30}" stroke="{GRAY}" stroke-width="1.8" fill="none"/>')
    g.line(ul, top+30, ul+8, top+30, GRAY, 1.8)  # 左端密封，右端开口
    g.line(ul, yl, ul+8, yl, BLUE, 1.8)
    g.line(ur-8, yr, ur, yr, BLUE, 1.8)
    dimension(g, ur+15, yr, ur+15, yl, CORAL)
    g.text(cx, top+205, liquid_label, anchor='middle', size=13)
    g.text(ul+24, top+205, '液面差', anchor='middle', size=13, c=SOFT)


def draw_pressure():
    chapter = 'g8b-09-pressure'
    name = 'liquid-pressure-manometers'
    g = fig(660, 500, name, '用液体压强计比较深度和密度',
            '上排为同一种液体的浅、深两个位置，下排为同一深度的较小、较大密度液体。探头软管连接 U 形管封闭左端，右端开口；压强较大时左液面更低、右液面更高，液面差更大。测压液始终相同。')
    g.text(330, 23, '同种液体', anchor='middle')
    # 同种液体的液面差与探头深度成正比；坐标不作为数值标注。
    manometer(g, 25, 35, 36, 36*.36, '浅处')
    manometer(g, 355, 35, 83, 83*.36, '深处')
    g.text(330, 268, '同一深度', anchor='middle')
    manometer(g, 25, 280, 56, 16, '密度较小')
    manometer(g, 355, 280, 56, 29, '密度较大')
    save(g, chapter, '9.2a', name+'.svg', '先认住',
         'U 形管压强计对照：同种液体改变探头深度；同一深度改变液体密度，比较测压液的液面差。',
         '已完成 figures/'+name+'.svg（U 形管压强计分别比较深度、液体密度的影响）',
         '软管接密封左端，右端开口；加压侧液面下降；两行各只变一个因素；不画练习瓶侧孔、射程或 pc、pd 结果')

    name = 'liquid-depth-h'
    g = fig(560, 285, name, '液面下的竖直深度 h',
            '容器中标出液面与一个所求位置，h 仅表示从液面竖直向下到该位置的距离，不量到容器底。')
    vessel(g, 245, 35, 238, 76, 125)
    px, py = 268, 181
    g.dot(px, py, 4, CORAL)
    g.line(px+8, py, 416, py, GRAY, 1.6, '4 4')
    g.line(376, 76, 416, 76, GRAY, 1.6, '4 4')
    dimension(g, 429, 76, 429, py, BLUE)
    g.sym(444, 137, 'h', c=BLUE)
    g.text(100, 81, '液面', anchor='end', c=BLUE)
    g.text(px, 214, '所求位置', anchor='middle', size=13)
    save(g, chapter, '9.2b', name+'.svg', '先认住',
         '深度 h 是从液面竖直向下量到所求位置的距离，不是容器总高。',
         '已完成 figures/'+name+'.svg（液面到所求位置的竖直深度 h）',
         '尺寸线严格竖直，两端分别与液面、所求点等高；不标水塔数据或选项结果')

    name = 'torricelli-mercury'
    g = fig(600, 390, name, '托里拆利实验的水银柱高度差',
            '倒置玻璃管顶端封闭，下端开口并浸在水银槽内。管内水银上方是真空；标出管内外液面之间的竖直高度差 760 mm，槽面上的大气压支持水银柱。')
    left, right, upper, surface, bottom = 210, 246, 104, 309, 351
    tint(g, 128, surface, 224, bottom-surface, GRAY, .22)
    g.poly([(128, 283), (128, bottom), (352, bottom), (352, 283)], w=2)
    tint(g, left+1, upper, right-left-2, 334-upper, GRAY, .3)
    g.raw(f'<path d="M{left} 334V58Q{left} 40 228 40Q{right} 40 {right} 58V334" '
          f'stroke="{GRAY}" stroke-width="2" fill="none"/>')
    g.line(left, upper, right, upper, GRAY, 1.8)
    g.line(128, surface, left, surface, GRAY, 1.8)
    g.line(right, surface, 352, surface, GRAY, 1.8)
    g.text(228, 83, '真空', anchor='middle', size=13)
    g.text(107, 165, '玻璃管', anchor='middle', size=13)
    g.line(139, 160, 201, 160, GRAY, 1.6)
    for y in (upper, surface):
        g.line(right+8, y, 396, y, GRAY, 1.6, '4 4')
    dimension(g, 410, upper, 410, surface, BLUE)
    g.text(427, (upper+surface)/2+5, '760 mm', c=BLUE)
    for x in (165, 309):
        g.arrow(x, 260, x, 300, BLUE, 2.2, 10)
    g.text(309, 247, '大气压', anchor='middle', c=BLUE)
    g.text(240, 377, '水银槽', anchor='middle')
    save(g, chapter, '9.3a', name+'.svg', '先认住',
         '托里拆利实验：玻璃管上端封闭、下端浸入水银槽，管内水银上方是真空；管内外液面高度差为 760 mm。',
         '已完成 figures/'+name+'.svg（托里拆利实验的真空、水银槽和 760 mm 竖直液面高度差）',
         '管顶封闭、下端浸入水银且开口；760 mm 取自讲义，不量到槽底；不画练习吸盘气压关系')


def spring_scale(g, cx, top, end):
    g.circle(cx, top-9, 7, GRAY, 1.8)
    g.rect(cx-18, top, 36, 126, GRAY, 2)
    pts = [(cx, top+8)]
    for i in range(9):
        pts.append((cx+(-6 if i%2 == 0 else 6), top+16+(end-top-24)*i/8))
    pts.append((cx, end))
    g.poly(pts, w=1.6)
    g.line(cx, end, cx, top+145, GRAY, 1.8)
    for j in range(6):
        g.line(cx+8, top+48+j*10, cx+15, top+48+j*10, GRAY, 1.6)
    g.line(cx-13, end, cx-5, end, CORAL, 1.8)
    g.raw(f'<path d="M{cx} {top+145}a7 7 0 1 1 -7 7" '
          f'stroke="{GRAY}" stroke-width="1.8" fill="none"/>')


def draw_buoyancy():
    chapter = 'g8b-10-buoyancy'
    name = 'buoyancy-weighing'
    g = fig(600, 365, name, '称重法测量浮力',
            '同一物体分别静止悬挂在空气中和浸没在液体中。测力计示数只用 G 和 F拉 标明，不标具体读数；液体中的物体不接触容器底或壁。')
    for i, cx in enumerate((155, 435)):
        spring_scale(g, cx, 39, 124 if i == 0 else 102)
        if i:
            vessel(g, cx, 197, 324, 223, 85)
        g.line(cx, 39+159, cx, 250, GRAY, 1.8)
        g.rect(cx-24, 250, 48, 48, GRAY, 2)
        g.line(cx+26, 111, cx+59, 111, GRAY, 1.6)
        g.sym(cx+71, 117, 'G' if i == 0 else 'F', None if i == 0 else '拉', c=BLUE)
        g.text(cx, 350, '空气中' if i == 0 else '浸入液体', anchor='middle')
    save(g, chapter, '10.1a', name+'.svg', '先认住',
         '同一物体静止悬挂：空气中的测力计示数是 G，浸入液体后的示数是 F拉；物体不碰容器。',
         '已完成 figures/'+name+'.svg（空气中与浸入液体后的称重法对照，示数只标符号）',
         '同一物体且静止，不碰底壁；液体中弹簧伸长较小；不标实验题读数、深度或浮力—深度答案图')

    name = 'buoyancy-factor-comparisons'
    g = fig(660, 570, name, '比较浸入体积与液体密度',
            '上排同一物体逐渐浸入同种液体，依次部分浸入、刚好浸没、浸没后更深；下排同一物体完全浸没在密度不同的两种液体中，浸入体积相同。不写具体浸入比例或液体名称。')
    g.text(330, 24, '同种液体', anchor='middle')
    for cx, objtop, label in ((110, 72, '部分浸入'), (330, 110, '刚好浸没'), (550, 137, '浸没更深')):
        vessel(g, cx, 65, 245, 110, 76)
        g.line(cx, 40, cx, objtop, GRAY, 1.6)
        g.rect(cx-22, objtop, 44, 80, GRAY, 2)
        if objtop < 110:
            tint(g, cx-21, 110, 42, objtop+79-110, BLUE, .12)
        g.text(cx, 273, label, anchor='middle')
    g.text(330, 311, '浸入体积相同', anchor='middle')
    for cx, label in ((210, '密度较小'), (450, '密度较大')):
        vessel(g, cx, 341, 511, 365, 85)
        g.line(cx, 330, cx, 386, GRAY, 1.6)
        g.rect(cx-22, 386, 44, 80, GRAY, 2)
        g.text(cx, 545, label, anchor='middle')
    save(g, chapter, '10.1b', name+'.svg', '先认住',
         '上排同一物体逐渐浸入同种液体；下排同一物体浸没在密度不同的液体中，保持浸入体积相同。',
         '已完成 figures/'+name+'.svg（同一物体的浸入体积、不同液体密度两组控制变量对照）',
         '各物块尺寸相同；上排浸没后体积不变；下排同体积同深度；不写酒精、盐水等练习第（5）问答案，不标排开体积比例')

    name = 'buoyancy-pressure-origin'
    g = fig(620, 350, name, '上下表面压力差产生浮力',
            '完全浸没的长方体，上下表面面积相同。分别标出从液面到上、下表面的竖直深度；上表面受到向下的压力，下表面受到更大的向上压力。右侧表示压力差即竖直向上的浮力。')
    vessel(g, 306, 35, 308, 65, 236)
    left, right, top, bot = 245, 345, 141, 219
    g.rect(left, top, right-left, bot-top, GRAY, 2)
    for x, target in ((129, top), (184, bot)):
        dimension(g, x, 65, x, target, BLUE)
        g.line(x+8, target, left-8, target, GRAY, 1.6, '4 4')
        label_y = (65+target)/2 + (5 if target == top else 43)
        g.sym(x-11, label_y, 'h', '上' if target == top else '下',
              c=BLUE, anchor='end', size=17)
    g.arrow(269, top, 269, top+34, CORAL, 2.6, 10)
    g.arrow(321, bot, 321, bot-57, CORAL, 2.6, 10)
    g.text(369, 143, '向下压力', c=CORAL, size=13)
    g.text(369, 232, '向上压力', c=CORAL, size=13)
    g.arrow(458, 209, 458, 209-(57-34), BLUE, 2.6, 8)
    g.sym(474, 207, 'F', '浮', c=BLUE, size=17)
    g.text(300, 332, '下表面更深', anchor='middle', c=SOFT, size=13)
    save(g, chapter, '10.1c', name+'.svg', '先认住',
         '从液面量到上、下表面的竖直深度分别为 h上、h下；下表面更深，向上的压力较大，压力差产生向上的浮力。',
         '已完成 figures/'+name+'.svg（浸没长方体上下表面的深度、压力方向和向上浮力）',
         '两深度均从液面竖直量；两压力作用点分别位于上、下表面；向上压力箭头较长，浮力向上')


def draw_work():
    chapter = 'g8b-11-work-and-mechanical-energy'
    name = 'work-force-distance'
    g = fig(540, 345, name, '沿力方向移动的距离 s',
            '同一构件从下方起点竖直提升到上方终点，拉力 F 竖直向上；s 标在与拉力平行的竖直尺寸线上，两端与构件同一参考点的起、终位置等高。')
    cx, start, end = 247, 268, 125
    g.rect(cx-27, start-25, 54, 50, GRAY, 2)
    g.rect(cx-27, end-25, 54, 50, GRAY, 2)
    for y in (start, end):
        g.dot(cx, y, 3, GRAY)
        g.line(cx+35, y, 381, y, GRAY, 1.6, '4 4')
    g.arrow(cx, end-25, cx, 44, BLUE, 2.6, 12)
    g.sym(cx+16, 76, 'F', c=BLUE)
    g.arrow(397, start, 397, end, BLUE, 2, 10)
    g.line(390, start, 404, start, BLUE, 1.6)
    g.line(390, end, 404, end, BLUE, 1.6)
    g.sym(413, (start+end)/2+5, 's', c=BLUE)
    g.text(181, start+5, '起点', anchor='end')
    g.text(181, end+5, '终点', anchor='end')
    g.text(270, 327, '沿力方向移动', anchor='middle', size=13, c=SOFT)
    save(g, chapter, '11.1b', name+'.svg', '先认住',
         '竖直拉力 F 向上，构件沿力方向从起点移到终点，s 是同一参考点的竖直移动距离。',
         '已完成 figures/'+name+'.svg（拉力 F 的方向与沿力方向的距离 s）',
         'F 从上表面作用点向上；s 与 F 平行，端点取同一参考点；不用机器人、速度、时长或功的数值')


def lever(g, a, b, ox, beam_y, arm_y, force1, force2):
    g.line(a, beam_y, b, beam_y, GRAY, 2.6)
    # 水平杠杆、竖直力：杆上两彩色段就是从 O 到作用线的实际垂线段。
    # 上方尺寸线只是将同一长度移到空白处标注。
    g.line(a, beam_y, ox, beam_y, BLUE, 2)
    g.line(ox, beam_y, b, beam_y, CORAL, 2)
    g.poly([(ox, beam_y+4), (ox-14, beam_y+30), (ox+14, beam_y+30)],
           c=GRAY, w=1.8, close=True, fill='#fff')
    g.dot(ox, beam_y, 3, GRAY)
    g.line(ox, beam_y-8, ox, arm_y, GRAY, 1.6, '4 4')
    for x, force, color, sub in ((a, force1, BLUE, '1'), (b, force2, CORAL, '2')):
        g.line(x, arm_y-6, x, beam_y-6, GRAY, 1.6, '4 4')
        dimension(g, x, arm_y, ox, arm_y, color)
        g.right_angle(x, arm_y, (1 if x < ox else -1, 0), (0, 1), 8, color, 1.6)
        g.arrow(x, beam_y, x, beam_y+force, color, 2.6, 11)
        g.sym((x+ox)/2, arm_y-13, 'l', sub, c=color, anchor='middle')
    g.sym(a-16, beam_y+force1-6, 'F', '1', c=BLUE, anchor='end')
    g.sym(b+16, beam_y+force2-6, 'F', '2', c=CORAL)
    g.sym(ox+23, beam_y+26, 'O', size=16)


def draw_machines():
    chapter = 'g8b-12-simple-machines'
    name = 'lever-equilibrium'
    g = fig(620, 275, name, '杠杆平衡的力与力臂',
            '水平静止的杠杆，支点 O 两侧的竖直向下力 F1、F2 和对应的水平力臂 l1、l2。每条力臂从 O 到该力的作用线并与作用线垂直；较长力臂对应较小的力，两侧力与力臂乘积相等。')
    a, b, ox, force1 = 105, 485, 325, 48
    force2 = force1*(ox-a)/(b-ox)
    lever(g, a, b, ox, 128, 65, force1, force2)
    g.sym(310, 251, 'F₁l₁ = F₂l₂', anchor='middle', size=20)
    save(g, chapter, '12.1b', name+'.svg', '先认住',
         '杠杆水平静止：支点 O 两侧的 F1、F2 与垂直力臂 l1、l2 满足 F1l1＝F2l2。',
         '已完成 figures/'+name+'.svg（水平杠杆两侧的力、垂直力臂与平衡条件）',
         '两向下力产生相反转动效果；力臂与作用线成直角；按 F1l1=F2l2 计算箭长；不标练习钩码数、最小力或 l2 变形结果')

    name = 'lever-type-comparisons'
    g = fig(660, 520, name, '动力臂和阻力臂的三种关系',
            '三排水平杠杆分别表示动力臂大于、短于、等于阻力臂，依次为省力、费力、等臂杠杆；支点与两条竖直力的作用线确定水平力臂，箭长按平衡条件计算。')
    a, b = 230, 570
    for i, (ox, label, relation) in enumerate(((441, '省力杠杆', '>'), (359, '费力杠杆', '<'), (400, '等臂杠杆', '='))):
        row = i*168
        g.text(95, row+81, label, anchor='middle')
        # 单独三个 text，斜体量符号保留原讲义下标。
        g.sym(61, row+113, 'l', '1', size=17)
        g.text(95, row+113, escape(relation), anchor='middle', size=17, weight=500)
        g.sym(112, row+113, 'l', '2', size=17)
        force1 = 45 if i == 0 else (65 if i == 1 else 52)
        force2 = force1*(ox-a)/(b-ox)
        lever(g, a, b, ox, row+77, row+32, force1, force2)
    save(g, chapter, '12.1c', name+'.svg', '先认住',
         '动力臂长于、短于、等于阻力臂，分别对应省力杠杆、费力杠杆和等臂杠杆。',
         '已完成 figures/'+name+'.svg（三种杠杆的动力臂与阻力臂长短对照）',
         '力臂均为垂直距离；F1 为动力、F2 为阻力，箭长和平衡关系一致；不画方向盘、门把手、水龙头、雨刮器选项')

    name = 'fixed-movable-pulleys'
    g = fig(640, 390, name, '定滑轮和动滑轮的轴与物体',
            '左图定滑轮轴连接上方支架，物体挂在绳的一端，向下拉另一端。右图动滑轮轴连接物体，绳的一端固定上方，另一端向上拉，轴随物体一起上升。不标具体拉力或重量。')
    r = 28
    for cx in (160, 440):
        g.line(cx-62, 36, cx+62, 36, GRAY, 2)
    fx, fy = 160, 88
    g.line(fx, 36, fx, fy, GRAY, 1.8)
    g.circle(fx, fy, r, GRAY, 2)
    g.line(fx, 36, fx, fy, GRAY, 1.8)
    g.circle(fx, fy, 4, GRAY, 1.6)
    g.raw(f'<path d="M{fx-r} {fy}A{r} {r} 0 0 1 {fx+r} {fy}" stroke="{BLUE}" stroke-width="2"/>')
    g.line(fx-r, fy, fx-r, 258, BLUE, 2)
    g.line(fx+r, fy, fx+r, 210, BLUE, 2)
    g.arrow(fx+r, 210, fx+r, 262, BLUE, 2.6, 11)
    g.sym(fx+r+15, 239, 'F', c=BLUE)
    g.rect(fx-r-24, 258, 48, 43, GRAY, 2)
    g.text(fx-r, 284, '物体', anchor='middle', size=13)
    g.text(68, 88, '轴固定', anchor='middle', size=13)
    g.line(101, 83, fx-8, 83, GRAY, 1.6)
    mx, my = 440, 224
    g.line(mx-r, 36, mx-r, my, BLUE, 2)
    g.line(mx+r, my, mx+r, 123, BLUE, 2)
    g.arrow(mx+r, 123, mx+r, 66, BLUE, 2.6, 11)
    g.sym(mx+r+15, 105, 'F', c=BLUE)
    g.circle(mx, my, r, GRAY, 2)
    g.raw(f'<path d="M{mx-r} {my}A{r} {r} 0 0 0 {mx+r} {my}" stroke="{BLUE}" stroke-width="2"/>')
    g.circle(mx, my, 4, GRAY, 1.6)
    g.line(mx, my+5, mx, 294, GRAY, 1.8)
    g.rect(mx-24, 294, 48, 43, GRAY, 2)
    g.text(mx, 320, '物体', anchor='middle', size=13)
    g.text(550, 216, '轴随物体', anchor='middle', size=13)
    g.line(mx+9, my, 515, my, GRAY, 1.6)
    g.arrow(549, 325, 549, 257, CORAL, 2.2, 10)
    g.text(567, 295, '上升', c=CORAL, size=13)
    g.text(160, 369, '定滑轮', anchor='middle')
    g.text(440, 369, '动滑轮', anchor='middle')
    save(g, chapter, '12.3a', name+'.svg', '先认住',
         '定滑轮的轴固定在支架上；动滑轮的轴连接物体并随物体上升。',
         '已完成 figures/'+name+'.svg（定滑轮固定轴、动滑轮移动轴及与物体的位置关系）',
         '绳与轮相切，定滑轮绕上半周、动滑轮绕下半周；动滑轮轴连接物体；不写练习 1000 N、500 N 或拉力公式')

    name = 'work-energy-destinations'
    g = fig(640, 310, name, '有用功和额外功的去向',
            '总功作为输入，分为达到工作目的的有用功和其他耗费的额外功。两支箭头只表示分类，不代表能量数值或比例；不列举练习题所问的额外功具体成因。')
    g.text(82, 137, '总功', anchor='middle')
    g.sym(82, 172, 'W', '总', anchor='middle', c=BLUE)
    g.arrow(139, 153, 266, 153, BLUE, 2.2, 11)
    joint = (279, 153)
    g.line(266, 153, *joint, BLUE, 2.2)
    g.ray([joint, (346, 73), (421, 73)], c=BLUE, w=2.2, arrows=[1], at=.85, size=10)
    g.ray([joint, (346, 233), (421, 233)], c=CORAL, w=2.2, arrows=[1], at=.85, size=10)
    g.dot(*joint, 3, GRAY)
    g.text(486, 55, '有用功', anchor='middle', c=BLUE)
    g.sym(486, 86, 'W', '有用', anchor='middle', c=BLUE)
    g.text(486, 118, '达到目的', anchor='middle', c=SOFT, size=13)
    g.text(486, 216, '额外功', anchor='middle', c=CORAL)
    g.sym(486, 247, 'W', '额外', anchor='middle', c=CORAL)
    g.text(486, 279, '其他耗费', anchor='middle', c=SOFT, size=13)
    save(g, chapter, '12.4b', name+'.svg', '先认住',
         '总功分成达到工作目的的有用功和其他耗费的额外功；箭头不表示数值或比例。',
         '已完成 figures/'+name+'.svg（总功输入分为有用功、额外功两种去向，不标比例）',
         '总功不是第三个并列输出；分流线等粗、不编码比例；不列练习额外功原因，不写效率或功的数值')


def render_previews(preview_dir):
    """独立临时页，避免 svgkit.preview 的共享 /tmp 文件与别批次冲突。"""
    import glob
    chrome = sorted(glob.glob(os.path.expanduser(
        '~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell')))[-1]
    preview_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.render-', dir=preview_dir) as tmp:
        tmp = Path(tmp)
        for r in RECORDS:
            if ONLY and r['filename'] not in ONLY:
                continue
            html = tmp / 'frame.html'
            svg = (ROOT / r['path']).read_text(encoding='utf-8')
            html.write_text('<!doctype html><meta charset="utf-8"><style>'
                            'html,body{margin:0;background:#fff}svg{display:block}</style>'+svg,
                            encoding='utf-8')
            png = preview_dir / (r['filename'][:-4]+'.png')
            subprocess.run([chrome, '--no-sandbox', '--headless',
                            '--user-data-dir='+str(tmp/'profile'),
                            '--screenshot='+str(png),
                            f'--window-size={r["width"]},{r["height"]}',
                            '--force-device-scale-factor=2', '--hide-scrollbars', html.as_uri()],
                           capture_output=True, check=True, timeout=120)
            assert png.exists() and png.stat().st_size > 1000, png
    rows = []
    for r in RECORDS:
        rows.append('<section><h2>'+escape(r['kp']+' · '+r['filename'])+'</h2>'
                    '<img src="'+r['filename'][:-4]+'.png" width="'+str(r['width'])+'" '
                    'alt="'+escape(r['alt'])+'"><p>'+escape(r['alt'])+'</p></section>')
    (preview_dir/'index.html').write_text(
        '<!doctype html><html lang="zh-CN"><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>批次 a · 17 张 SVG 审图预览</title><style>'
        'body{margin:32px auto;max-width:900px;padding:0 20px;color:#20272b;background:white;'
        'font:16px/1.7 -apple-system,"PingFang SC",sans-serif}'
        'section{padding:24px 0;border-top:1px solid #52626a}h2{font-size:18px}'
        'img{display:block;max-width:100%;height:auto}p{max-width:660px}'
        '@media print{section{break-inside:avoid}body{margin:0}}</style>'
        '<h1>批次 a：可选示意图</h1><p>17 张静态 SVG。未接入讲义。'
        '8.2b 按当前讲义改用悬挂物体；详见交付报告的疑问栏。</p>'
        +''.join(rows)+'</html>', encoding='utf-8')
    (preview_dir/'manifest.json').write_text(json.dumps(RECORDS, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def validate():
    assert len(RECORDS) == 17
    ids, classes = set(), set()
    allowed = {GRAY, BLUE, CORAL, YELLOW, GREEN, INK, SOFT, '#fff', 'none'}
    for r in RECORDS:
        node = ET.fromstring((ROOT/r['path']).read_text(encoding='utf-8'))
        colors = set()
        prefix = 'opt-a-'+r['filename'][:-4]
        for el in node.iter():
            assert not el.tag.split('}')[-1].startswith('animate')
            if 'id' in el.attrib:
                ident = el.attrib['id']
                assert ident.startswith(prefix) and ident not in ids
                ids.add(ident)
            if 'class' in el.attrib:
                name = el.attrib['class']
                assert name.startswith(prefix)
                classes.add(name)
            for attr in ('stroke', 'fill'):
                if attr in el.attrib:
                    color = el.attrib[attr]
                    assert color in allowed, color
                    if color in {GRAY, BLUE, CORAL, YELLOW, GREEN}:
                        colors.add(color)
            if 'stroke-width' in el.attrib:
                sw = float(el.attrib['stroke-width'])
                assert sw == 0 or sw == .01 or 1.6 <= sw <= 2.6, sw
        assert len(colors) <= 3, (r['filename'], colors)
        for tag in ('title', 'desc'):
            assert node.find('{http://www.w3.org/2000/svg}'+tag).text
    print('PASS 静态结构：17 张；尺寸、颜色、线宽、title/desc、唯一前缀、无动画。')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('preview_dir', nargs='?', default='output/preview/fig-review/a')
    ap.add_argument('--only', nargs='+', help='只重写指定文件名及其 PNG 预览')
    args = ap.parse_args()
    ONLY.update(args.only or [])
    pv = (ROOT/args.preview_dir).resolve()
    assert pv == (ROOT/'output/preview/fig-review/a').resolve(), '只允许批次 a 预览目录'
    draw_waves()
    draw_balance()
    draw_pressure()
    draw_buoyancy()
    draw_work()
    draw_machines()
    validate()
    render_previews(pv)
    count = sum(not ONLY or r['filename'] in ONLY for r in RECORDS)
    print(f'已重出 {count} 张 SVG 和 PNG；索引保留 {len(RECORDS)} 张：{pv}')


if __name__ == '__main__':
    main()
