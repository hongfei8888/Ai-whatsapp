@echo off
chcp 65001 >nul
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        WhatsApp AI Automation - Docker 启动工具         ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: 检查Docker是否安装
echo [1/5] 检查Docker环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [✗] Docker未安装！
    echo.
    echo 请先安装Docker Desktop for Windows：
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [✓] Docker已安装
docker --version
echo.

:: 检查Docker是否运行
echo [2/5] 检查Docker服务状态...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [✗] Docker服务未运行！
    echo.
    echo 请启动Docker Desktop
    echo.
    pause
    exit /b 1
)
echo [✓] Docker服务正在运行
echo.

:: 停止旧容器
echo [3/5] 停止旧容器（如果存在）...
docker-compose down 2>nul
echo [完成]
echo.

:: 构建镜像
echo [4/5] 构建Docker镜像...
echo 这可能需要5-10分钟（首次构建）
echo.
docker-compose build
if %errorlevel% neq 0 (
    color 0C
    echo [✗] 镜像构建失败！
    echo.
    pause
    exit /b 1
)
echo [✓] 镜像构建成功
echo.

:: 启动容器
echo [5/5] 启动容器...
docker-compose up -d
if %errorlevel% neq 0 (
    color 0C
    echo [✗] 容器启动失败！
    echo.
    pause
    exit /b 1
)
echo [✓] 容器启动成功
echo.

color 0A
echo ════════════════════════════════════════════════════════════
echo                   启动完成！
echo ════════════════════════════════════════════════════════════
echo.
echo 后端API地址：http://localhost:4000
echo 前端界面：http://localhost:3000
echo.
echo 常用命令：
echo - 查看日志：docker-compose logs -f
echo - 停止容器：docker-compose down
echo - 重启容器：docker-compose restart
echo - 进入容器：docker exec -it whatsapp-ai-automation bash
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 等待服务完全启动（约30-60秒）...
timeout /t 5 /nobreak >nul
echo.
echo 正在检查服务状态...
curl -s http://localhost:4000/status >nul 2>&1
if %errorlevel%==0 (
    echo [✓] 服务已就绪！
    echo.
    echo 现在可以打开浏览器访问：
    echo http://localhost:3000
) else (
    echo [提示] 服务正在启动中...
    echo 请等待30-60秒后访问：http://localhost:3000
)
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:3000

