@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   初始化数据库
echo ========================================
echo.

echo [步骤 1/4] 创建 .env 文件（如果不存在）...
if not exist "server\.env" (
    echo DATABASE_URL="file:../prisma/dev.db" > server\.env
    echo PORT=4000 >> server\.env
    echo HOST=0.0.0.0 >> server\.env
    echo ✅ .env 文件已创建
) else (
    echo ✅ .env 文件已存在
)
echo.

echo [步骤 2/4] 停止所有 Node 进程...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ 已停止所有 Node 进程
echo.

echo [步骤 3/4] 创建数据库并运行迁移...
cd server
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ❌ 迁移失败！尝试重置数据库...
    call npx prisma migrate reset --force
)
cd ..
echo.

echo [步骤 4/4] 生成 Prisma Client...
cd server
call npx prisma generate
cd ..
echo.

call npx prisma generate
echo.

echo ========================================
echo   ✅ 数据库初始化完成！
echo ========================================
echo.
echo 下一步：
echo 1. 启动后端： cd server ^&^& npm run dev
echo 2. 启动前端： cd web ^&^& npm run dev
echo.
pause

