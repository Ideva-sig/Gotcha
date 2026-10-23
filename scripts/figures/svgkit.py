"""小绘图工具：用坐标算出精确的示意图 SVG。各章的图在 draw-*.py 里，改图时改坐标后重跑。"""
import math, os, subprocess

GRAY = "#52626a"; BLUE = "#287fc4"; CORAL = "#c9554d"; YELLOW = "#bf8d08"; GREEN = "#197a60"
INK = "#20272b"; SOFT = "#5d6970"; WATER = "#e3f1fa"; LIGHT = "#bec9ce"


def unit(dx, dy):
    l = math.hypot(dx, dy)
    return dx / l, dy / l


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


class Fig:
    def __init__(self, w, h, prefix, title, desc):
        self.w, self.h, self.p, self.title, self.desc = w, h, prefix, title, desc
        self.items = []

    # ---------- 基本图形 ----------
    def raw(self, s):
        self.items.append(s)

    def line(self, x1, y1, x2, y2, c=GRAY, w=2, dash=None, cap="round"):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.raw(f'<path d="M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}" stroke="{c}" stroke-width="{w}" stroke-linecap="{cap}"{d}/>')

    def poly(self, pts, c=GRAY, w=2, dash=None, fill="none", close=False):
        d = "M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts) + ("Z" if close else "")
        ds = f' stroke-dasharray="{dash}"' if dash else ""
        self.raw(f'<path d="{d}" stroke="{c}" stroke-width="{w}" fill="{fill}" stroke-linejoin="round"{ds}/>')

    def rect(self, x, y, w, h, c=GRAY, sw=2, fill="#fff", rx=0):
        self.raw(f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{rx}" fill="{fill}" stroke="{c}" stroke-width="{sw}"/>')

    def circle(self, x, y, r, c=GRAY, sw=2, fill="#fff"):
        self.raw(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{fill}" stroke="{c}" stroke-width="{sw}"/>')

    def dot(self, x, y, r=3.6, c=INK):
        self.raw(f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}" fill="{c}"/>')

    def head(self, tx, ty, ux, uy, c, size=11):
        """在 (tx,ty) 画一个指向 (ux,uy) 方向的实心箭头。"""
        px, py = -uy, ux
        b = (tx - ux * size, ty - uy * size)
        w = size * 0.45
        self.poly([(tx, ty), (b[0] + px * w, b[1] + py * w), (b[0] - px * w, b[1] - py * w)], c=c, w=0.01, fill=c, close=True)

    def arrow(self, x1, y1, x2, y2, c=BLUE, w=2.6, size=12):
        """力的示意图：起点为作用点，终点为箭头尖。"""
        ux, uy = unit(x2 - x1, y2 - y1)
        self.line(x1, y1, x2 - ux * size * 0.8, y2 - uy * size * 0.8, c, w, cap="butt")
        self.head(x2, y2, ux, uy, c, size)

    def ray(self, pts, c=CORAL, w=2.2, at=0.55, size=11, arrows=None):
        """光线：折线，每段（或 arrows 指定的段）中部加箭头。"""
        self.poly(pts, c=c, w=w)
        segs = range(len(pts) - 1) if arrows is None else arrows
        for i in segs:
            (x1, y1), (x2, y2) = pts[i], pts[i + 1]
            ux, uy = unit(x2 - x1, y2 - y1)
            mx, my = x1 + (x2 - x1) * at, y1 + (y2 - y1) * at
            self.head(mx + ux * size / 2, my + uy * size / 2, ux, uy, c, size)

    def right_angle(self, cx, cy, d1, d2, s=9, c=GRAY, w=1.4):
        a = unit(*d1); b = unit(*d2)
        self.poly([(cx + a[0] * s, cy + a[1] * s), (cx + a[0] * s + b[0] * s, cy + a[1] * s + b[1] * s), (cx + b[0] * s, cy + b[1] * s)], c=c, w=w)

    def arc(self, cx, cy, r, a1, a2, c=GRAY, w=1.4):
        """角度标记弧，角度按屏幕坐标（度，0=右，90=下）。"""
        x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
        x2, y2 = cx + r * math.cos(math.radians(a2)), cy + r * math.sin(math.radians(a2))
        large = 1 if abs(a2 - a1) > 180 else 0
        sweep = 1 if a2 > a1 else 0
        self.raw(f'<path d="M{f(x1)} {f(y1)}A{r} {r} 0 {large} {sweep} {f(x2)} {f(y2)}" fill="none" stroke="{c}" stroke-width="{w}"/>')

    # ---------- 文字 ----------
    def text(self, x, y, s, c=INK, anchor="start", size=14, weight=600):
        self.raw(f'<text class="{self.p}-lb" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" style="fill:{c};font-size:{size}px;font-weight:{weight}">{s}</text>')

    def sym(self, x, y, s, sub=None, c=INK, anchor="start", size=18, prime=False):
        """物理量符号：斜体，可带下标。"""
        sub_s = f'<tspan font-size="{round(size*0.7)}" dy="4" font-style="normal">{sub}</tspan>' if sub else ""
        pr = "′" if prime else ""
        self.raw(f'<text class="{self.p}-sy" x="{f(x)}" y="{f(y)}" text-anchor="{anchor}" style="fill:{c};font-size:{size}px">{s}{pr}{sub_s}</text>')

    # ---------- 电路元件（画在导线之上，白底盖住导线） ----------
    def battery(self, x, y, vertical=False, pos_first=True):
        """电池：长细线为正极，短粗线为负极。pos_first=True 时正极在左（或上）。"""
        g = 5
        a, b = (-g, g) if pos_first else (g, -g)
        if not vertical:
            self.rect(x - 9, y - 16, 18, 32, c="none", sw=0, fill="#fff")
            self.line(x + a, y - 15, x + a, y + 15, INK, 2)
            self.line(x + b, y - 8, x + b, y + 8, INK, 5, cap="butt")
        else:
            self.rect(x - 16, y - 9, 32, 18, c="none", sw=0, fill="#fff")
            self.line(x - 15, y + a, x + 15, y + a, INK, 2)
            self.line(x - 8, y + b, x + 8, y + b, INK, 5, cap="butt")

    def lamp(self, x, y, r=13, lit=False):
        self.circle(x, y, r, INK, 2, "#fff6dc" if lit else "#fff")
        k = r * 0.7071
        self.line(x - k, y - k, x + k, y + k, INK, 2)
        self.line(x - k, y + k, x + k, y - k, INK, 2)

    def meter(self, x, y, ch, r=13):
        self.circle(x, y, r, INK, 2)
        self.raw(f'<text class="{self.p}-sy" x="{f(x)}" y="{f(y + 6)}" text-anchor="middle" style="fill:{INK};font-size:17px;font-style:normal;font-family:-apple-system,\'PingFang SC\',sans-serif;font-weight:600">{ch}</text>')

    def resistor(self, x, y, vertical=False, L=34, Wd=12):
        if vertical:
            self.rect(x - Wd / 2, y - L / 2, Wd, L, INK, 2)
        else:
            self.rect(x - L / 2, y - Wd / 2, L, Wd, INK, 2)

    def rheostat(self, x, y, L=40, Wd=12):
        """滑动变阻器（水平）：电阻符号 + 斜穿箭头（课本符号）。"""
        self.rect(x - L / 2, y - Wd / 2, L, Wd, INK, 2)
        x1, y1, x2, y2 = x - L / 2 - 4, y + Wd / 2 + 10, x + L / 2 + 4, y - Wd / 2 - 10
        ux, uy = unit(x2 - x1, y2 - y1)
        self.line(x1, y1, x2 - ux * 7, y2 - uy * 7, INK, 1.8)
        self.head(x2, y2, ux, uy, INK, 9)

    def switch(self, x, y, vertical=False, closed=False, L=34):
        """开关（课本符号）：导线断开一段，刀片从前端抬起；闭合时刀片放平。"""
        h = L / 2
        if not vertical:
            self.rect(x - h, y - 4, L, 8, c="none", sw=0, fill="#fff")
            if closed:
                self.line(x - h, y, x + h + 4, y - 5, INK, 2)
            else:
                self.line(x - h, y, x + h - 2, y - 13, INK, 2)
            self.dot(x - h, y, 2.4, INK)
            if closed: self.dot(x + h, y, 2.4, INK)
        else:
            self.rect(x - 4, y - h, 8, L, c="none", sw=0, fill="#fff")
            if closed:
                self.line(x, y + h, x - 5, y - h - 4, INK, 2)
            else:
                self.line(x, y + h, x - 13, y - h + 2, INK, 2)
            self.dot(x, y + h, 2.4, INK)
            if closed: self.dot(x, y - h, 2.4, INK)

    def rheo(self, x, y, px, L=44, Wd=12):
        """滑动变阻器（课本符号，水平）：电阻框 + 滑片箭头从上方压在 px 处，滑片引线从 (px, y-24) 引出。"""
        self.rect(x - L / 2, y - Wd / 2, L, Wd, INK, 2)
        self.line(px, y - 24, px, y - Wd / 2 - 8, INK, 1.8)
        self.head(px, y - Wd / 2 - 1, 0, 1, INK, 8)

    def wire(self, pts, c=INK, w=2, dash=None):
        self.poly(pts, c=c, w=w, dash=dash)

    # ---------- 输出 ----------
    def svg(self):
        style = (f'<style>.{self.p}-lb{{font:600 14px -apple-system,"PingFang SC",sans-serif;stroke:none}}'
                 f'.{self.p}-sy{{font:italic 18px "Times New Roman",Times,serif;stroke:none}}</style>')
        body = "\n  ".join(self.items)
        import re
        body = re.sub(r"<(?![A-Za-z/!?])", "&lt;", body)  # 文字里的小于号必须转义，否则 SVG 不是合法 XML
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" fill="none" '
                f'stroke-linecap="round" stroke-linejoin="round" role="img" aria-labelledby="{self.p}-t {self.p}-d">\n'
                f'  <title id="{self.p}-t">{self.title}</title>\n  <desc id="{self.p}-d">{self.desc}</desc>\n  {style}\n'
                f'  <rect width="{self.w}" height="{self.h}" fill="#fff" stroke="none"/>\n  {body}\n</svg>\n')

    def save(self, path, preview_dir=None):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(self.svg())
        if preview_dir:
            preview(path, preview_dir, self.w, self.h)
        return path


def preview(svg_path, out_dir, w, h, scale=2):
    """用无头 Chromium 渲染 PNG 预览。"""
    import glob, tempfile
    chrome = sorted(glob.glob(os.path.expanduser("~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell")))[-1]
    html = os.path.join(tempfile.gettempdir(), "fig-preview.html")
    with open(html, "w", encoding="utf-8") as fh:
        fh.write(f'<html><body style="margin:0;background:#fff"><div style="width:{w}px">{open(svg_path, encoding="utf-8").read()}</div></body></html>')
    out = os.path.join(out_dir, os.path.basename(svg_path)[:-4] + ".png")
    subprocess.run([chrome, "--headless", f"--screenshot={os.path.abspath(out)}", f"--window-size={w},{h}",
                    f"--force-device-scale-factor={scale}", "--hide-scrollbars", "file://" + html], capture_output=True)
