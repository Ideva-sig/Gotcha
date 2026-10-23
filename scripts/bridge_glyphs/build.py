#!/usr/bin/env python3
"""把 glyphs/*.svg 合并成 src/lib/bridgeGlyphs.json（名字 → svg 内部标记）。
主角用 currentColor，网站按卡片颜色替换。改了 glyphs/ 里的图之后要重跑。"""
import json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parent
out = root.parent.parent / "src" / "lib" / "bridgeGlyphs.json"
glyphs = {}
for p in sorted((root / "glyphs").glob("*.svg")):
    s = p.read_text(encoding="utf-8")
    m = re.search(r"<svg[^>]*>(.*)</svg>", s, re.S)
    if not m or 'viewBox="0 0 150 90"' not in s:
        sys.exit(f"{p.name}：必须是 viewBox=\"0 0 150 90\" 的 svg")
    if re.search(r"<(script|style|animate|foreignObject)", s, re.I):
        sys.exit(f"{p.name}：不允许 script/style/animate")
    glyphs[p.stem] = re.sub(r"\s+", " ", m.group(1)).strip()
out.write_text(json.dumps(glyphs, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
print(f"{len(glyphs)} 个小图 → {out.relative_to(root.parent.parent)}")
