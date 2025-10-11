@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   修复 Account Schema
echo ========================================
echo.

echo ⚠️  警告：需要先停止后端服务器！
echo.
set /p confirm="已停止后端？(输入 YES 继续): "
if /i not "%confirm%"=="YES" (
    echo ❌ 操作已取消
    pause
    exit /b 0
)

echo.
echo [步骤 1/4] 创建迁移...
call npx prisma migrate dev --name add_sessionpath --create-only
if %errorlevel% neq 0 (
    echo ❌ 创建迁移失败！
    pause
    exit /b 1
)

echo.
echo [步骤 2/4] 应用迁移...
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ❌ 应用迁移失败！
    pause
    exit /b 1
)

echo.
echo [步骤 3/4] 重新生成 Prisma 客户端（根目录）...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ 生成失败！
    pause
    exit /b 1
)

echo.
echo [步骤 4/4] 重新生成 Prisma 客户端（后端）...
cd server
call npx prisma generate
cd ..

echo.
echo ========================================
echo   ✅ 修复成功！
echo ========================================
echo.
echo 📋 下一步操作:
echo    1. 启动后端: cd server && npm run dev
echo    2. 刷新浏览器页面
echo    3. 测试所有功能
echo.
pause

