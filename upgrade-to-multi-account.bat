@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   升级到多账号支持系统
echo ========================================
echo.

echo [步骤 1/3] 应用数据库迁移...
node apply-multi-account-migration.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ 迁移失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo [步骤 2/3] 重新生成 Prisma 客户端...
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ❌ 生成 Prisma 客户端失败！
    pause
    exit /b 1
)

echo.
echo [步骤 3/3] 完成！
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
echo    - 原有数据已自动迁移到"默认账号"
echo    - 旧表备份在 *_backup 表中
echo    - 如需回滚，请联系技术支持
echo.
pause

