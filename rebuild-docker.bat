@echo off
chcp 65001 >nul
echo ============================================
echo 🐳 重新构建 Docker 镜像
echo ============================================
echo.

echo [1/3] 停止现有容器...
docker-compose down

echo.
echo [2/3] 重新构建镜像（这需要5-7分钟）...
docker-compose build --no-cache

echo.
echo [3/3] 启动容器...
docker-compose up -d

echo.
echo ============================================
echo ✅ 完成！
echo ============================================
echo.
echo 📊 检查状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f
echo 🌐 访问应用: http://localhost:3000
echo.
pause

