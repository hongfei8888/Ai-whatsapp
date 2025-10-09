@echo off
chcp 65001 >nul
color 0E
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        重新构建 Docker 镜像（已修复Node.js版本）        ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo [1/3] 停止旧容器...
docker-compose down
echo [完成]
echo.

echo [2/3] 清理旧镜像...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [✗] 构建失败！
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. Docker Desktop未运行
    echo 3. 磁盘空间不足
    echo.
    pause
    exit /b 1
)
echo [完成]
echo.

echo [3/3] 启动新容器...
docker-compose up -d
if %errorlevel% neq 0 (
    color 0C
    echo [✗] 启动失败！
    pause
    exit /b 1
)
echo [完成]
echo.

color 0A
echo ════════════════════════════════════════════════════════════
echo                   重建成功！
echo ════════════════════════════════════════════════════════════
echo.
echo 应用已启动，访问：http://localhost:3000
echo.
pause

