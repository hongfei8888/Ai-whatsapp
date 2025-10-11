@echo off
chcp 65001 > nul
echo ========================================
echo     WhatsApp 自动化系统 - 快速启动
echo ========================================
echo.

echo [1/2] 正在启动后端服务器（端口 4000）...
cd server
start "WhatsApp 后端" cmd /k "npm run dev"
cd ..

echo.
echo 等待后端启动...
timeout /t 5 /nobreak > nul

echo [2/2] 正在启动前端服务器（端口 3000）...
cd web
start "WhatsApp 前端" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo ✓ 启动完成！
echo ========================================
echo.
echo 后端地址：http://localhost:4000
echo 前端地址：http://localhost:3000
echo.
echo 请等待几秒钟让服务器完全启动，
echo 然后打开浏览器访问：http://localhost:3000
echo.
echo 按任意键关闭此窗口...
pause > nul

