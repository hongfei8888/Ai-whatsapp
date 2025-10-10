@echo off
chcp 65001 > nul
echo ========================================
echo 启动 WhatsApp 自动化系统开发服务器
echo ========================================
echo.

REM 检查并创建后端环境配置文件
if not exist "server\.env" (
    echo 创建后端环境配置文件...
    (
        echo PORT=4000
        echo HOST=0.0.0.0
        echo DATABASE_URL=file:../prisma/dev.db
        echo NODE_ENV=development
    ) > "server\.env"
    echo ✓ 后端配置文件已创建
)

REM 检查并创建前端环境配置文件
if not exist "web\.env.local" (
    echo 创建前端环境配置文件...
    echo NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 > "web\.env.local"
    echo ✓ 前端配置文件已创建
)

echo.
echo 正在启动后端服务器 (端口 4000)...
start /B "后端服务器" cmd /c "cd server && npm run dev > ../server-log.txt 2>&1"

timeout /t 5 /nobreak >nul

echo.
echo 正在启动前端服务器 (端口 3000)...
start /B "前端服务器" cmd /c "cd web && npm run dev > ../web-log.txt 2>&1"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo 服务器启动中，请稍候...
echo.
echo 前端访问地址: http://localhost:3000
echo 后端 API 地址: http://localhost:4000
echo.
echo 日志文件:
echo   - 后端: server-log.txt
echo   - 前端: web-log.txt
echo ========================================
echo.

pause

