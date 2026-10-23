"""用本机 iLab CONJURE（读 ~/.codex/auth.json）批量生图。
用法：python3 scripts/figures/conjure-generate.py jobs.json gpt-image-2 输出目录
jobs.json：[{"name": "文件名不含扩展名", "ratio": "4:3", "prompt": "英文内容描述"}]，STYLE 会自动加在前面。"""
import json, os, shutil, sys, time, urllib.request, urllib.error
BASE = "http://127.0.0.1:8787"
OUT = sys.argv[3] if len(sys.argv) > 3 else os.getcwd()
STYLE = (
    "Style: a clean flat 2D physics textbook diagram for a Chinese middle-school handout. Pure white background (#ffffff), "
    "no paper texture, no gradient, no shadow, no 3D shading, no cartoon decoration, no border frame, no title. "
    "Thin uniform vector lines (about 2px). Colors strictly limited to: outline/neutral gray #52626a, blue #287fc4, coral red #c9554d, "
    "and at most one of yellow #bf8d08 or green #197a60. Must remain readable when printed in black and white. "
    "Very few labels, small clean sans-serif letters, every label sits in empty white space and is never crossed or touched by any line or arrow. "
    "Generous margins; the diagram is centered and occupies about 70% of the canvas. One idea per picture. "
)
def submit(prompt, model, ratio):
    b = "----ConjureFig"
    fields = {"prompt": prompt, "main_model": "gpt-6-sol", "model": model, "codex_mode": "responses",
              "ratio": ratio, "quality": "high", "output_format": "png", "ui_language": "zh-CN"}
    body = bytearray()
    for k, v in fields.items():
        body.extend(f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode())
    body.extend(f"--{b}--\r\n".encode())
    req = urllib.request.Request(f"{BASE}/api/generate", data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={b}"}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())["task"]["task_id"]
    except urllib.error.HTTPError as e:
        raise RuntimeError(e.read().decode())
def wait(tid, dest, timeout=600):
    t0 = time.time()
    while time.time() - t0 < timeout:
        with urllib.request.urlopen(f"{BASE}/api/tasks/{tid}") as r:
            task = json.loads(r.read())["task"]
        s = task.get("status")
        if s == "completed":
            f = task["outputs"][0]["file"]
            shutil.copyfile(os.path.expanduser(f"~/Library/Application Support/iLab GPT CONJURE/webui-outputs/{f}"), dest)
            return dest
        if s in ("failed", "cancelled"):
            raise RuntimeError(task.get("last_error"))
        time.sleep(5)
    raise TimeoutError(tid)
if __name__ == "__main__":
    jobs = json.load(open(sys.argv[1]))
    model = sys.argv[2] if len(sys.argv) > 2 else "gpt-image-2"
    os.makedirs(OUT, exist_ok=True)
    ids = []
    for j in jobs:
        try:
            ids.append((j, submit(STYLE + j["prompt"], model, j.get("ratio", "4:3"))))
            print("submitted", j["name"], flush=True)
        except Exception as e:
            print("SUBMIT FAIL", j["name"], e, flush=True)
    for j, tid in ids:
        try:
            print("done", wait(tid, os.path.join(OUT, j["name"] + ".png")), flush=True)
        except Exception as e:
            print("FAIL", j["name"], e, flush=True)
