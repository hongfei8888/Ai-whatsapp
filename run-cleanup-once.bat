@echo off
chcp 65001 >nul
echo ========================================
echo 清理离线账号（单次执行）
echo ========================================
echo.
echo 正在执行清理任务...
echo.

REM 设置环境变量
set API_BASE_URL=http://localhost:3001
set RUN_ONCE=true

REM 执行一次清理
node auto-cleanup-offline-accounts.js

echo.
echo ========================================
echo 清理完成
echo ========================================
pause

