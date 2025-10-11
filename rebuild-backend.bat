@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   重新编译并启动后端
echo ========================================
echo.

cd server

echo [步骤 1/2] 重新编译 TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo [步骤 2/2] 启动后端...
echo.
call npm run dev

