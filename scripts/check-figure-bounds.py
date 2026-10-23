#!/usr/bin/env python3
"""检查 SVG 里的文字和图形是否超出画布（viewBox）。用法：python3 scripts/check-figure-bounds.py <图.svg> ...
借用本机 Chrome 量每个元素的真实包围盒；超出画布 1px 以上就报错。"""
import sys, re, json, subprocess, tempfile, os
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
JS = """<script>
const s=document.querySelector('svg');const vb=s.viewBox.baseVal;const bad=[];
s.querySelectorAll('text,rect,circle,ellipse,path,line,polyline,polygon,g').forEach(e=>{
 if(e.tagName==='g'&&!e.querySelector('text'))return; if(e.tagName==='g')return;
 let b;try{b=e.getBoundingClientRect()}catch(x){return}
 const r=s.getBoundingClientRect();const k=vb.width/r.width;
 const l=(b.left-r.left)*k,t=(b.top-r.top)*k,rt=(b.right-r.left)*k,bt=(b.bottom-r.top)*k;
 if(l<-1||t<-1||rt>vb.width+1||bt>vb.height+1)bad.push((e.textContent||e.tagName).trim().slice(0,24)+' ['+[l,t,rt,bt].map(Math.round)+']')});
document.title='BAD:'+encodeURIComponent(JSON.stringify(bad));
</script>"""
rc = 0
for f in sys.argv[1:]:
    svg = open(f, encoding='utf-8').read()
    m = re.search(r'viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"', svg)
    w, h = float(m.group(1)), float(m.group(2))
    svg = re.sub(r'<svg ', f'<svg width="{w}" height="{h}" ', svg, 1)
    html = f"<html><body style='margin:0'>{svg}{JS}</body></html>"
    with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False) as t:
        t.write(html)
    out = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--dump-dom', 'file://' + t.name],
                         capture_output=True, text=True).stdout
    os.unlink(t.name)
    mm = re.search(r"<title>BAD:([^<]*)</title>", out)
    from urllib.parse import unquote
    bad = json.loads(unquote(mm.group(1))) if mm else None
    if bad is None:
        print(f"ERROR {os.path.basename(f)}（没取到结果）"); rc = 1
    elif bad:
        print(f"FAIL {os.path.basename(f)}：{len(bad)} 处超出画布：" + "；".join(bad[:8])); rc = 1
    else:
        print(f"PASS {os.path.basename(f)}")
sys.exit(rc)
