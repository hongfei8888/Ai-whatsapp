@echo off
chcp 65001 >nul
color 0E

echo.
echo ════════════════════════════════════════════════════════════
echo        查看 WhatsApp AI Automation 实时日志
echo ════════════════════════════════════════════════════════════
echo.
echo 按 Ctrl+C 退出
echo.

docker-compose logs -f

