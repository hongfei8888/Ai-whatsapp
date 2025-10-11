@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   修复 Account 表 - 添加 sessionPath
echo ========================================
echo.

echo [步骤 1/5] 停止后端服务器（如正在运行）
echo 请按 Ctrl+C 停止后端，然后按任意键继续...
pause

echo.
echo [步骤 2/5] 应用 SQL 迁移...
node -e "const fs = require('fs'); const path = require('path'); const sql = fs.readFileSync('prisma/migrations/20251010_add_sessionPath.sql', 'utf8'); const sqlite3 = require('better-sqlite3'); const db = sqlite3('prisma/dev.db'); const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--')); statements.forEach(stmt => { try { db.exec(stmt); console.log('✅ 执行成功'); } catch(e) { console.log('⚠️  跳过:', e.message.substring(0, 50)); } }); db.close(); console.log('✅ 迁移完成！');"
if %errorlevel% neq 0 (
    echo ❌ 迁移失败！
    pause
    exit /b 1
)

echo.
echo [步骤 3/5] 重新生成 Prisma 客户端（根目录）...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ 生成失败！
    pause
    exit /b 1
)

echo.
echo [步骤 4/5] 重新生成 Prisma 客户端（后端）...
cd server
call npx prisma generate
cd ..
if %errorlevel% neq 0 (
    echo ❌ 生成失败！
    pause
    exit /b 1
)

echo.
echo [步骤 5/5] 完成！
echo.
echo ========================================
echo   ✅ 修复成功！
echo ========================================
echo.
echo 📋 下一步操作:
echo    1. 重启后端服务器: cd server; npm run dev
echo    2. 刷新前端页面
echo    3. 测试删除账号功能
echo.
pause

