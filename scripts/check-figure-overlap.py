#!/usr/bin/env python3
"""检查示意图（SVG）里的文字有没有被图形压住，或文字之间互相重叠。

用法：
  python3 scripts/check-figure-overlap.py course/physics/g9-13-internal-energy/figures/*.svg

做法：在 Chromium 内核里把 SVG 渲染三次。
  1. 正常渲染，记录每段 <text> 在画面上占的矩形；
  2. 只渲染图形（隐藏文字）；
  3. 只渲染文字（隐藏图形），得到每个字笔画实际占的像素。
把笔画像素向外扩 2px，看这些位置在“只有图形”的截图里是不是底色。文字放在纯色底上没问题；
笔画周围出现线条、箭头、边框的颜色，就是被压住了。两段文字的笔画互相碰到也算重叠。
只看笔画而不是整个文字方框，所以电表符号圆圈里的“A”“V”这类标准写法不会误报。

带 SMIL 动画（<animate> 等）的图：在动画时间轴上每隔 0.25 秒暂停取一帧，逐帧检查，
任何一帧压住文字都算不通过。文字本身不允许参与动画。

有问题时返回非 0，并列出是哪段文字、压到了多少像素。需要 PIL。
"""
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAD = 2             # 笔画向外扩 2px，线条贴着字也算压住
COLOR_TOLERANCE = 48  # 与底色相差超过这个值，才算“别的颜色”
MAX_STRAY_PIXELS = 6  # 容许的零星像素（抗锯齿）
FRAME_STEP = 0.25     # 动画逐帧检查的间隔（秒）


def chrome_bin():
    found = os.environ.get("CHROME_BIN") or next(iter(sorted(glob.glob(os.path.expanduser(
        "~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell"
    )), reverse=True)), None)
    if not found:
        sys.exit("未找到 Chromium 内核，请设置 CHROME_BIN。")
    return found


def run_chrome(args, profile):
    return subprocess.run(
        [chrome_bin(), "--no-sandbox", f"--user-data-dir={profile}", "--hide-scrollbars", *args],
        capture_output=True, text=True, timeout=120, check=True,
    ).stdout


def page(svg, width, height, mode):
    """mode: measure 记录文字位置；shapes 只画图形；text 只画文字。"""
    style = {
        "measure": "",
        "shapes": "text{visibility:hidden}",
        "text": "svg *{visibility:hidden} svg text,svg text *{visibility:visible}",
    }[mode]
    # 按网址里的 #t=秒 暂停动画，取该时刻的画面
    pause = """
<script>
const t=parseFloat((location.hash.match(/t=([\\d.]+)/)||[])[1]||0);
document.querySelectorAll('svg').forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});
</script>"""
    measure = "" if mode != "measure" else """
<script>
const rects=[...document.querySelectorAll('svg text')].map(t=>{const r=t.getBoundingClientRect();
let animated=false;for(let e=t;e&&e.tagName!=='svg';e=e.parentElement){
if([...e.children].some(c=>/^animate/.test(c.tagName)))animated=true;}
return {text:t.textContent.trim(),x:r.left,y:r.top,w:r.width,h:r.height,animated}});
const anims=[...document.querySelectorAll('svg animate,svg animateTransform,svg animateMotion')]
.map(a=>parseFloat(a.getAttribute('dur'))||0);
document.getElementById('out').textContent=JSON.stringify({rects,maxDur:Math.max(0,...anims)});
</script>"""
    script = pause + measure
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#fff}}'
            f'svg{{display:block;width:{width}px;height:{height}px}}{style}</style></head>'
            f'<body>{svg}<pre id="out"></pre>{script}</body></html>')


def screenshot(svg, width, height, mode, workdir, t=0.0):
    html_path = workdir / f"{mode}.html"
    shot = workdir / f"{mode}-{t:.2f}.png"
    html_path.write_text(page(svg, width, height, mode), encoding="utf-8")
    run_chrome([f"--window-size={width},{height}", f"--screenshot={shot}", f"{html_path.as_uri()}#t={t}"],
               workdir / "profile")
    return Image.open(shot).convert("RGB")


def differs(a, b):
    return max(abs(x - y) for x, y in zip(a, b)) > COLOR_TOLERANCE


def check(svg_path, workdir):
    svg = Path(svg_path).read_text(encoding="utf-8")
    vb = re.search(r'viewBox="([\d.\s-]+)"', svg)
    _, _, width, height = (float(v) for v in vb.group(1).split())
    width, height = int(round(width)), int(round(height))

    measure = workdir / "measure.html"
    measure.write_text(page(svg, width, height, "measure"), encoding="utf-8")
    dom = run_chrome(["--dump-dom", measure.as_uri()], workdir / "profile")
    info = json.loads(re.search(r'<pre id="out">(.*?)</pre>', dom, re.S).group(1).replace("&quot;", '"'))
    rects = info["rects"]
    texts = screenshot(svg, width, height, "text", workdir)
    steps = int(info["maxDur"] / FRAME_STEP) + 1 if info["maxDur"] else 1
    frames = [screenshot(svg, width, height, "shapes", workdir, i * FRAME_STEP) for i in range(steps)]
    white = (255, 255, 255)

    def ink(r):
        """这段文字笔画占的像素（向外扩 PAD px）。"""
        x0, y0 = max(int(r["x"]), 0), max(int(r["y"]), 0)
        x1, y1 = min(int(r["x"] + r["w"]) + 1, width), min(int(r["y"] + r["h"]) + 1, height)
        core = {(x, y) for x in range(x0, x1) for y in range(y0, y1) if differs(texts.getpixel((x, y)), white)}
        return {(x + dx, y + dy) for x, y in core for dx in range(-PAD, PAD + 1) for dy in range(-PAD, PAD + 1)
                if 0 <= x + dx < width and 0 <= y + dy < height}

    inks = [ink(r) for r in rects]
    problems = [f"文字“{r['text']}”参与了动画，文字必须保持静止" for r in rects if r["animated"]]
    for r, area in zip(rects, inks):
        if not area:
            continue
        worst, worst_t = 0, 0.0
        for i, shapes in enumerate(frames):
            colors = {}
            for xy in area:
                c = shapes.getpixel(xy)
                colors[c] = colors.get(c, 0) + 1
            base = max(colors, key=colors.get)
            stray = sum(n for c, n in colors.items() if differs(c, base))
            if stray > worst:
                worst, worst_t = stray, i * FRAME_STEP
        if worst > MAX_STRAY_PIXELS:
            when = f"，动画第 {worst_t:.2f} 秒" if len(frames) > 1 else ""
            problems.append(f"文字“{r['text']}”被图形压住（{worst} 个像素{when}）")
    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            core_j = inks[j]
            if len(inks[i] & core_j) > MAX_STRAY_PIXELS * 4:
                problems.append(f"文字“{rects[i]['text']}”和“{rects[j]['text']}”互相重叠")
    return len(rects), len(frames), problems


def main(paths):
    failed = 0
    with tempfile.TemporaryDirectory(dir=ROOT / ".build" if (ROOT / ".build").exists() else None) as tmp:
        for path in paths:
            count, nframes, problems = check(path, Path(tmp))
            name = Path(path).name
            if problems:
                failed += 1
                print(f"FAIL {name}（{count} 段文字，{nframes} 帧）")
                for p in problems:
                    print(f"  - {p}")
            else:
                print(f"PASS {name}（{count} 段文字，{nframes} 帧，无重叠）")
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1:]))
