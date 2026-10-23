// 讲义小标题的显示名（任务式，2026-10-12 用户定）。
// 内容文件、导出数据、检查脚本里仍用原名（先认住、容易错……），只有网站上显示的字换掉。
export const BLOCK_LABELS = {
  本次只学: "本关任务",
  先认住: "本关要点",
  数形结合: "数形结合",
  破题钥匙: "现象建模",
  走一遍: "跟着闯一遍",
  容易错: "踩坑提醒",
  练一练: "闯一关",
  怎样算掌握: "过关进度",
  学完我能做到: "通关自检",
};

// 化学的“破题钥匙”叫“三重表征”（2026-10-14 用户定）。
const CHEM_LABELS = { 破题钥匙: "三重表征" };

export function blockLabel(heading, subject) {
  if (subject === "chemistry" && CHEM_LABELS[heading]) return CHEM_LABELS[heading];
  return BLOCK_LABELS[heading] || heading;
}
