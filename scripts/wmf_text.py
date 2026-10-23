#!/usr/bin/env python3
"""从 MathType 公式图片（WMF）里读出文字，用于核对真题公式中的数值。

只解析 ExtTextOut 文本记录，按出现顺序拼接；小字号的片段标成 ^{} 或 _{}（位置信息不可靠，需人工判断是上标还是下标）。
用法：python3 scripts/wmf_text.py <docx 路径> media/image34.wmf [...]
"""
import struct,sys,zipfile,re
def wmf_text(data):
    if data[:4]==b'\xd7\xcd\xc6\x9a': data=data[22:]
    hsize=struct.unpack_from("<H",data,2)[0]*2
    pos=hsize; items=[]; font_h=[0]; fonts={}; objs=[]; cur=None; charset=0
    while pos+6<=len(data):
        size,func=struct.unpack_from("<IH",data,pos)
        if size<3: break
        rec=data[pos+6:pos+size*2]
        if func==0x02FB:  # CreateFontIndirect
            h=struct.unpack_from("<h",rec,0)[0]; cs=rec[23] if len(rec)>23 else 0
            face=rec[18:50].split(b'\0')[0].decode('latin1','ignore')
            # put into first free slot
            slot=objs.index(None) if None in objs else len(objs)
            if slot==len(objs): objs.append(None)
            objs[slot]=("font",abs(h),face)
        elif func in (0x012D,):  # SelectObject
            i=struct.unpack_from("<H",rec,0)[0]
            if i<len(objs) and objs[i] and objs[i][0]=="font": cur=objs[i]
        elif func==0x01F0:  # DeleteObject
            i=struct.unpack_from("<H",rec,0)[0]
            if i<len(objs): objs[i]=None
        elif func in (0x02FA,0x02FC,0x0142,0x01F9,0x06FF,0x0762):  # pens/brushes/palette etc take slots
            slot=objs.index(None) if None in objs else len(objs)
            if slot==len(objs): objs.append(None)
            objs[slot]=("other",)
        elif func==0x0A32:  # ExtTextOut
            y,x,n,opt=struct.unpack_from("<hhhH",rec,0); off=8+(8 if opt&0x6 else 0)
            s=rec[off:off+n]
            face=cur[2] if cur else ""
            if "Symbol" in face:
                sym={0xb4:"×",0xd7:"·",0xb1:"±",0x2d:"−",0x3d:"=",0x72:"ρ",0x44:"Δ",0x68:"η",0xb0:"°",0x61:"α"}
                t="".join(sym.get(b,chr(b)) for b in s)
            else:
                try: t=s.decode("gbk")
                except: t=s.decode("latin1")
            items.append((x,y,cur[1] if cur else 0,t))
        pos+=size*2
    return items
def render(items):
    if not items: return ""
    base=max(h for *_,h,_ in [(i[0],i[1],i[2],i[3]) for i in items])
    out=[]
    for x,y,h,t in sorted(items,key=lambda i:i[0]):
        if h<base*0.8: out.append("^{"+t+"}" if y<min(i[1] for i in items if i[2]==base)+0 else "_{"+t+"}")
        else: out.append(t)
    return "".join(out)
if __name__=="__main__":
    z=zipfile.ZipFile(sys.argv[1])
    for name in sys.argv[2:]:
        it=wmf_text(z.read("word/"+name)); print(name, "=>", render(it), "   raw:", [(i[0],i[1],i[2],i[3]) for i in sorted(it)][:12])
