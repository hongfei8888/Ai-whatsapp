@echo off
chcp 65001 >nul
color 0C

echo.
echo ════════════════════════════════════════════════════════════
echo        停止 WhatsApp AI Automation Docker 容器
echo ════════════════════════════════════════════════════════════
echo.

docker-compose down

if %errorlevel%==0 (
    echo.
    echo [✓] 容器已停止
    echo.
) else (
    echo.
    echo [✗] 停止失败
    echo.
)

pause

