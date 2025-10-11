@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   清理 Next.js 缓存并重启
echo ========================================
echo.

echo [步骤 1/3] 删除 .next 缓存目录...
if exist ".next" (
    rmdir /s /q ".next" 2>nul
    echo ✅ .next 已删除
) else (
    echo ✅ .next 不存在
)

echo.
echo [步骤 2/3] 删除 node_modules/.cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache" 2>nul
    echo ✅ node_modules\.cache 已删除
) else (
    echo ✅ 缓存不存在
)

echo.
echo [步骤 3/3] 重新启动开发服务器...
echo 请按 Ctrl+C 停止当前的 npm run dev，然后重新运行：
echo   npm run dev
echo.
pause

