@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   升级到多账号支持系统
echo ========================================
echo.
echo ⚠️  警告：此操作会重置数据库并应用新的 Schema
echo      所有现有数据将被清除！
echo.
echo 📋 如果您有重要数据，请先：
echo    1. 备份 prisma\dev.db 文件
echo    2. 导出重要数据
echo.
set /p confirm="确定要继续吗？(输入 YES 继续): "
if /i not "%confirm%"=="YES" (
    echo.
    echo ❌ 操作已取消
    pause
    exit /b 0
)

echo.
echo [步骤 1/3] 备份现有数据库...
if exist "prisma\dev.db" (
    copy "prisma\dev.db" "prisma\dev.db.backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.db" >nul
    echo ✅ 已备份到: prisma\dev.db.backup_*
) else (
    echo ⚠️  未找到现有数据库，跳过备份
)

echo.
echo [步骤 2/3] 重置数据库并应用新 Schema...
call npx prisma migrate reset --force --skip-seed
if %errorlevel% neq 0 (
    echo.
    echo ❌ 数据库重置失败！
    pause
    exit /b 1
)

echo.
echo [步骤 3/3] 生成 Prisma 客户端...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ❌ 生成客户端失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 升级成功！
echo ========================================
echo.
echo 📋 接下来的操作:
echo    1. 重启后端服务器
echo    2. 刷新前端页面
echo    3. 现在可以添加多个 WhatsApp 账号了！
echo.
echo 💡 提示:
echo    - 数据库已重置为全新状态
echo    - 备份文件在 prisma\dev.db.backup_* 
echo    - 首次使用请先添加账号
echo.
pause

