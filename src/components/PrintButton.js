"use client";

export function PrintButton() {
  return (
    <button className="island-btn" onClick={() => window.print()} type="button">
      打印这一页
    </button>
  );
}
