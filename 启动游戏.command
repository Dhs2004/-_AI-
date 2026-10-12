#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
printf '\n星潮纪行 · 本机游戏服务器\n请保留这个终端窗口。结束游戏后可按 Ctrl+C 关闭服务器。\n\n'
python3 launch.py
