@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   重启所有服务
echo ========================================
echo.

echo [步骤 1/4] 停止所有 Node 进程...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo [步骤 2/4] 重新生成 Prisma 客户端（根目录）...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ 生成失败！
    pause
    exit /b 1
)

echo.
echo [步骤 3/4] 重新生成 Prisma 客户端（后端）...
cd server
call npx prisma generate
cd ..
if %errorlevel% neq 0 (
    echo ❌ 生成失败！
    pause
    exit /b 1
)

echo.
echo [步骤 4/4] 完成！
echo.
echo ========================================
echo   ✅ 重新生成成功！
echo ========================================
echo.
echo 📋 下一步:
echo    1. 在一个终端运行: cd server ^&^& npm run dev
echo    2. 在另一个终端运行: cd web ^&^& npm run dev
echo    3. 刷新浏览器测试
echo.
pause

