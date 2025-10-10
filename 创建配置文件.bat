@echo off
chcp 65001 > nul

echo ========================================
echo  创建前后端配置文件
echo ========================================
echo.

REM 创建后端配置
echo 创建后端配置文件 server\.env ...
(
    echo PORT=4000
    echo HOST=0.0.0.0
    echo DATABASE_URL=file:../prisma/dev.db
    echo NODE_ENV=development
) > server\.env
echo ✓ 已创建: server\.env

echo.

REM 创建前端配置  
echo 创建前端配置文件 web\.env.local ...
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 > web\.env.local
echo ✓ 已创建: web\.env.local

echo.
echo ========================================
echo  配置文件创建完成！
echo ========================================
echo.
echo 后端配置: server\.env
echo   - PORT=4000
echo   - HOST=0.0.0.0
echo.
echo 前端配置: web\.env.local  
echo   - API_URL=http://localhost:4000
echo.
echo 现在请：
echo 1. 重启前端服务器（刷新浏览器页面）
echo 2. 或运行: npm run dev:web
echo.

pause

