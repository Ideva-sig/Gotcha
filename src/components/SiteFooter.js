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
      <a
        className="site-footer-github"
        href="https://github.com/Ideva-sig/Gotcha"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="在 GitHub 上查看项目源码"
        title="GitHub 项目仓库"
      >
        <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
      </a>
    </footer>
  );
}
