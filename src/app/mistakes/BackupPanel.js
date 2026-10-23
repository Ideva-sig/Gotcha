"use client";

import { useRef, useState } from "react";
import { buildBackup, restoreBackup } from "@/lib/studyBackup";
import styles from "@/app/physics/mistakes/mistakes.module.css";

const SUBJECT_NAMES = { math: "数学", physics: "物理", chemistry: "化学" };

// 统一备份面板：一份备份包含所有科目；恢复时合并进本机，不覆盖已有记录
export function BackupPanel() {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);

  const handleExport = () => {
    let json;
    try {
      json = JSON.stringify(buildBackup(), null, 2);
    } catch (_) {
      setNotice("读取本机记录失败。");
      return;
    }
    setText(json);
    try {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `学习备份-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice("备份已下载（数学、物理、化学都在里面）。iPad 上没弹出下载的话，可以复制下面文本框里的内容保存。");
    } catch (_) {
      setNotice("下载受限，备份已放进下面的文本框，复制保存即可。");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("备份文本已复制。");
    } catch (_) {
      setNotice("复制失败，请在文本框里长按全选后复制。");
    }
  };

  const restore = (raw, doneNotice) => {
    try {
      const done = restoreBackup(JSON.parse(raw));
      setNotice(`${doneNotice}已恢复：${done.map((s) => SUBJECT_NAMES[s]).join("、")}。和本机已有的记录合并，没有覆盖。`);
    } catch (err) {
      setNotice(
        err?.partial
          ? "恢复失败，而且没能完全还原：本机记录可能只恢复了一部分，请先导出现有备份再检查。"
          : "恢复失败：备份无效或本机存储写不进去，本机记录没有改动。",
      );
    }
  };

  const handleImportText = () => {
    if (!text.trim()) {
      setNotice("文本框是空的，先粘贴备份文本。");
      return;
    }
    restore(text, "");
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      setText(raw);
      restore(raw, "备份文件已导入，");
    } catch (_) {
      setNotice("导入失败：文件读不出来。");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className={styles.backup}>
      <p className={styles.backupNote}>
        数学、物理、化学的记录在同一份备份里。记录只存在这台设备上，换设备或清理浏览器前，先导出一份备份。
      </p>
      <div className={styles.backupActions}>
        <button className={styles.tool} onClick={handleExport} type="button">
          导出备份
        </button>
        <button className={styles.tool} onClick={() => fileInputRef.current?.click()} type="button">
          从文件恢复
        </button>
        <input accept=".json" hidden onChange={handleImportFile} ref={fileInputRef} type="file" />
      </div>
      <textarea
        className={styles.backupText}
        onChange={(e) => setText(e.target.value)}
        placeholder="导出后备份文本会出现在这里；也可以把另一台设备的备份文本粘贴进来恢复。"
        value={text}
      />
      <div className={styles.backupActions}>
        <button className={styles.tool} onClick={handleCopy} type="button">
          复制文本
        </button>
        <button className={styles.tool} onClick={handleImportText} type="button">
          用文本恢复
        </button>
      </div>
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
