import Link from "next/link";

// 全站页脚：版权与使用范围的一行小字，放在奶油色“舞台”的最下面
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        供学习参考，不得商用。课本与真题版权归原权利人。联系方式：idesia.work@gmail.com。 © 2026 ideva.sig
        {" · "}
        <Link href="/about/">关于与版权</Link>
      </p>
    </footer>
  );
}
