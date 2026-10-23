import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import "./island.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// 岛屿风圆体：只管拉丁字母和数字，中文仍用系统字体
// 字体文件在 src/fonts/nunito/（SIL OFL 1.1，已子集化为拉丁字符），构建时不联网
const nunito = localFont({
  src: "../fonts/nunito/Nunito-latin[wght].woff2",
  weight: "200 1000",
  style: "normal",
  variable: "--font-nunito",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Gotcha - 初中数理化学习",
    template: "%s | Gotcha",
  },
  description: "初中数理化中考复习：知识讲解、真题练习与错题本。",
};

// iPad 全面屏：内容铺到安全区，底部导航条自己让开 Home 指示条
export const viewport = { viewportFit: "cover" };

// 岛屿风暂时只有浅色（2026-10-09 用户决定先不做深色），深色变量留着以后用
const themeScript = `document.documentElement.dataset.theme = 'light';`;

export default function RootLayout({ children }) {
  return (
    <html
      className={nunito.variable}
      data-scroll-behavior="smooth"
      lang="zh-CN"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader />
        {/* 岛屿风：内容放在一块大的奶油色“舞台”上，绿色点阵只露在四周 */}
        <div className="island-stage">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
