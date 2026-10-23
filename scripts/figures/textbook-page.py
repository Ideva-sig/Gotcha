"""查找、渲染课本 PDF 页（核对课本原图用）。
用法：python3 scripts/figures/textbook-page.py find 8B "图12.3-5"
      python3 scripts/figures/textbook-page.py render 8B <PDF页码> 输出.png
册：8A 八上、8B 八下、9 九全。PDF 页码 = 印刷页码 + 6（8A、9）或 + 4（8B）。"""
import pymupdf, sys, glob, os, re
books={k:glob.glob(os.path.join(os.environ.get("COURSE_MATERIALS_DIR") or os.path.join(os.path.expanduser("~"), "Desktop", "中考"), "物理/人教版", f"*{v}.pdf"))[0] for k,v in [("8A","八年级上册"),("8B","八年级下册"),("9","九年级全一册")]}
def find(book, pats):
    d=pymupdf.open(books[book])
    for i,p in enumerate(d):
        t=p.get_text().replace(" ","")
        for pat in pats:
            if re.search(pat,t): print(book,pat,"pdfpage",i+1)
def render(book,page,out,clip=None,zoom=2):
    d=pymupdf.open(books[book]); p=d[page-1]
    pix=p.get_pixmap(matrix=pymupdf.Matrix(zoom,zoom),clip=clip); pix.save(out)
if __name__=="__main__":
    if sys.argv[1]=="find": find(sys.argv[2], sys.argv[3:])
    else: render(sys.argv[2], int(sys.argv[3]), sys.argv[4])
