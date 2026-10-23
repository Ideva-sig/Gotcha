"use client";

import { useEffect, useState } from "react";
import { CourseSubject } from "@/components/CourseSubject";
import { Tabs } from "@/components/island/Island";
import { PhysicsMistakesView } from "@/app/physics/mistakes/PhysicsMistakesView";
import { BackupPanel } from "./BackupPanel";
import styles from "./unified.module.css";

const TABS = [
  { key: "math", label: "数学" },
  { key: "physics", label: "物理" },
  { key: "chemistry", label: "化学" },
];

const tabFromHash = () => {
  const key = window.location.hash.replace("#", "");
  return TABS.some((t) => t.key === key) ? key : null;
};

// 三个科目用标签页切换，备份在最上面，一份备份装下所有科目
export function UnifiedMistakes({ subjects }) {
  const [active, setActive] = useState("math");
  const [backupOpen, setBackupOpen] = useState(false);

  // 地址里的 #math / #physics 决定打开哪个标签；放在 effect 里读，避免和静态页面不一致
  useEffect(() => {
    const sync = () => setActive(tabFromHash() ?? "math");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const choose = (key) => {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
  };

  const data = subjects[active];
  return (
    <main className="page-main">
      <div className="page-container">
        <div aria-hidden="true" className={styles.banner} />
        <div className={styles.tabs} key={active}>
          <Tabs
            bare
            defaultKey={active}
            items={TABS.map(({ key, label }) => ({ key, label }))}
            onChange={choose}
          />
        </div>
        <CourseSubject subject={active}>
          <PhysicsMistakesView
            {...data}
            backupOpen={backupOpen}
            backupSlot={<BackupPanel />}
            embedded
            onToggleBackup={() => setBackupOpen((v) => !v)}
          />
        </CourseSubject>
      </div>
    </main>
  );
}
