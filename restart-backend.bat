@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   重启后端服务器
echo ========================================
echo.

echo [1/2] 进入后端目录...
cd server

echo [2/2] 启动后端服务器...
npm run dev

