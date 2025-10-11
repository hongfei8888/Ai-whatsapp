@echo off
chcp 65001 >nul
echo ========================================
echo 自动清理离线账号服务
echo ========================================
echo.
echo 正在启动自动清理服务...
echo.

REM 设置环境变量（可根据需要修改）
set API_BASE_URL=http://localhost:3001
set CLEANUP_INTERVAL_MINUTES=60
set RUN_ONCE=false

REM 启动服务
node auto-cleanup-offline-accounts.js

pause

