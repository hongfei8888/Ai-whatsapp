@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   启动 WhatsApp 自动化系统
echo ========================================
echo.

echo 🚀 正在启动后端服务器...
start "WhatsApp 后端" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul

echo 🚀 正在启动前端服务器...
start "WhatsApp 前端" cmd /k "cd web && npm run dev"

echo.
echo ========================================
echo   ✅ 服务启动中...
echo ========================================
echo.
echo 后端: http://localhost:4000
echo 前端: http://localhost:5555
echo.
echo 提示：
echo   - 两个命令窗口已打开
echo   - 等待服务器启动完成（约 10-20 秒）
echo   - 然后访问前端添加账号
echo   - 关闭此窗口不会影响服务
echo.
pause

