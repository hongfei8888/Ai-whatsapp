@echo off
chcp 65001 > nul

echo ========================================
echo  重启前端服务器（加载新的 WhatsApp 样式）
echo ========================================
echo.

REM 停止旧的前端服务器
echo 正在停止旧的前端服务器...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
    echo ✓ 已停止进程 %%a
)

timeout /t 2 /nobreak >nul

echo.
echo 正在启动新的前端服务器...
cd web
start "前端服务器 - WhatsApp Web 风格" cmd /k "npm run dev"

echo.
echo ========================================
echo  前端服务器重启中...
echo.
echo  等待 10 秒后访问: http://localhost:3000
echo  应该会看到全新的 WhatsApp Web 风格！
echo ========================================
echo.

timeout /t 10 /nobreak

echo 现在可以刷新浏览器了！
pause

