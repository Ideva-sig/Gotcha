#!/usr/bin/env python3
"""读取“精品解析”中考真题 Word（.docx）的文字。

- 上标、下标转成 ^{...}、_{...}；MathType 公式对象标成〔式〕；图片标成〔图:media/xxx〕。
- 公式图片（WMF）里的文字用 wmf_text.py 读取。

用法：python3 scripts/exam_docx.py "<docx 路径通配>" 8 9   # 打印第 8、9 题（题干 + 答案 + 解析）
"""
import zipfile,re,sys,glob
def runs_text(p, rels):
    out=[]
    for tok in re.findall(r"<w:r[ >].*?</w:r>|<w:object.*?</w:object>",p,re.S):
        if tok.startswith("<w:object"):
            out.append("〔式〕"); continue
        img=re.search(r'r:embed="([^"]+)"',tok) or re.search(r'<v:imagedata r:id="([^"]+)"',tok)
        if img: out.append(f"〔图:{rels.get(img.group(1),'?')}〕")
        t="".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>",tok,re.S))
        if not t: continue
        if 'w:val="superscript"' in tok: t="^{"+t+"}"
        elif 'w:val="subscript"' in tok: t="_{"+t+"}"
        out.append(t)
    return "".join(out)
def load(f):
    z=zipfile.ZipFile(f); x=z.read("word/document.xml").decode()
    rx=z.read("word/_rels/document.xml.rels").decode()
    rels=dict(re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"',rx))
    return "\n".join(runs_text(p,rels) for p in re.findall(r"<w:p[ >].*?</w:p>",x,re.S))
def question(text,n):
    m=re.search(rf"(?m)^{n}[\.．]\s*\S",text)
    nxt=re.search(rf"(?m)^{n+1}[\.．]\s*\S",text[m.end():])
    return text[m.start(): m.end()+nxt.start() if nxt else None]
if __name__=="__main__":
    pat,nums=sys.argv[1],[int(n) for n in sys.argv[2:]]
    f=glob.glob(pat)[0]; t=load(f)
    for n in nums: print(f"===== {f.split('：')[1][:14]} Q{n}\n"+question(t,n).strip()+"\n")
