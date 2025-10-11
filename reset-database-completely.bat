@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   完全重置数据库
echo ========================================
echo.
echo ⚠️  警告：此操作会：
echo   1. 删除所有现有数据库文件
echo   2. 删除所有账号和消息数据
echo   3. 重新创建全新的数据库
echo.
echo 按 Ctrl+C 取消，或
pause

echo.
echo [步骤 1/6] 停止所有 Node 进程...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✅ 已停止

echo.
echo [步骤 2/6] 删除旧数据库文件...
if exist "prisma\dev.db" del /F /Q "prisma\dev.db" >nul 2>&1
if exist "prisma\dev.db-journal" del /F /Q "prisma\dev.db-journal" >nul 2>&1
if exist "server\prisma\dev.db" del /F /Q "server\prisma\dev.db" >nul 2>&1
if exist "server\prisma\dev.db-journal" del /F /Q "server\prisma\dev.db-journal" >nul 2>&1
echo ✅ 旧数据库已删除

echo.
echo [步骤 3/6] 确保 .env 文件正确...
if not exist "server\.env" (
    echo DATABASE_URL="file:../prisma/dev.db" > server\.env
    echo PORT=4000 >> server\.env
    echo HOST=0.0.0.0 >> server\.env
    echo ✅ 已创建 .env
) else (
    echo ✅ .env 已存在
)

echo.
echo [步骤 4/6] 创建新数据库...
cd server
call npx prisma migrate reset --force --schema prisma/schema.prisma
if errorlevel 1 (
    echo ⚠️  重置失败，尝试 migrate dev...
    call npx prisma migrate dev --name init --schema prisma/schema.prisma
)
cd ..
echo ✅ 数据库已创建

echo.
echo [步骤 5/6] 生成 Prisma Client (根目录)...
call npx prisma generate --schema server/prisma/schema.prisma
echo ✅ 根目录 Client 已生成

echo.
echo [步骤 6/6] 生成 Prisma Client (server)...
cd server
call npx prisma generate --schema prisma/schema.prisma
cd ..
echo ✅ Server Client 已生成

echo.
echo ========================================
echo   ✅ 数据库重置完成！
echo ========================================
echo.
echo 下一步：
echo   1. 启动后端： cd server ^&^& npm run dev
echo   2. 启动前端： cd web ^&^& npm run dev
echo   3. 在浏览器中添加新账号
echo.
pause

