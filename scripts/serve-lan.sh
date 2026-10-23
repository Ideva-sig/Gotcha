#!/bin/zsh
# 在局域网里开放网站，供 iPad 访问（Mac 要开机、和 iPad 连同一个 Wi-Fi）。
# 用法：zsh scripts/serve-lan.sh          （先 npm run build 生成 out/）
# iPad 上打开 http://<本机名>.local:8080/physics/ ；不要用 IP 地址，换了地址学习记录会“看不见”。
cd "$(dirname "$0")/.."
[ -d out ] || { echo "没有 out/，先运行 npm run build"; exit 1; }
echo "iPad 打开：http://$(scutil --get LocalHostName).local:8080/physics/"
exec python3 -m http.server 8080 --bind 0.0.0.0 --directory out
