"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 旧地址的跳转页：静态站点没有服务端跳转，进页面后马上换地址，同时留一个手点的链接
export function Redirect({ to, children = "页面搬家了，正在带你过去。" }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return (
    <main className="page-main">
      <div className="page-container">
        <p>
          {children} <Link href={to}>没有自动跳转的话，点这里。</Link>
        </p>
      </div>
    </main>
  );
}
