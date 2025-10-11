@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   添加 sessionPath 字段
echo ========================================
echo.

echo ⚠️  重要：必须先停止后端服务器！
echo.
set /p confirm="已停止后端？(输入 YES 继续): "
if /i not "%confirm%"=="YES" (
    echo ❌ 操作已取消
    pause
    exit /b 0
)

echo.
echo [步骤 1/4] 使用 Prisma Studio 应用 SQL...
echo 提示：这会直接修改数据库
echo.

npx prisma db execute --file=add-sessionpath-column.sql --schema=prisma/schema.prisma

if %errorlevel% neq 0 (
    echo.
    echo ❌ SQL 执行失败！
    echo.
    echo 💡 可能的原因:
    echo    - 后端服务器还在运行（请先停止）
    echo    - sessionPath 字段已存在（可忽略）
    echo.
    pause
    exit /b 1
)

echo.
echo [步骤 2/4] 重新生成 Prisma 客户端（根目录）...
call npx prisma generate

echo.
echo [步骤 3/4] 重新生成 Prisma 客户端（后端）...
cd server
call npx prisma generate
cd ..

echo.
echo [步骤 4/4] 验证数据库结构...
echo.
npx prisma db pull --force --schema=prisma/schema.prisma

echo.
echo ========================================
echo   ✅ 完成！
echo ========================================
echo.
echo 📋 下一步:
echo    1. 启动后端: cd server ^&^& npm run dev
echo    2. 刷新浏览器
echo    3. 测试删除账号功能
echo.
pause

