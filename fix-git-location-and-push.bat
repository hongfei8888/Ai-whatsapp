@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    修复 Git 位置并推送到 GitHub
echo ============================================
echo.
echo 当前目录: %cd%
echo.

REM 检查是否在正确的项目目录
if not exist "server" (
    echo ❌ 错误：未在项目根目录！
    echo 请确保脚本在项目根目录运行。
    pause
    exit /b 1
)

REM 删除父目录的错误 Git 仓库
echo [步骤 1/7] 清理错误位置的 Git 仓库...
if exist "..\\.git" (
    echo 发现父目录有 .git，正在删除...
    rmdir /s /q "..\\.git" 2>nul
)
echo ✅ 清理完成
echo.

REM 初始化 Git 仓库
echo [步骤 2/7] 在当前目录初始化 Git...
if exist ".git" (
    echo Git 仓库已存在
) else (
    git init
    echo ✅ Git 仓库已初始化
)
echo.

REM 配置 Git
echo [步骤 3/7] 配置 Git...
git config user.name "hongfei8888"
git config user.email "hongfei8888@users.noreply.github.com"
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
echo ✅ Git 配置完成
echo.

REM 添加远程仓库
echo [步骤 4/7] 配置远程仓库...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/hongfei8888/Ai-whatsapp.git
    echo ✅ 远程仓库已添加
) else (
    git remote set-url origin https://github.com/hongfei8888/Ai-whatsapp.git
    echo ✅ 远程仓库已更新
)
echo.

REM 添加文件
echo [步骤 5/7] 添加文件...
git add .
echo ✅ 所有文件已添加
echo.

REM 查看将要提交的文件
echo 将要提交的新文件：
git diff --cached --name-only | findstr /C:"vercel" /C:"RAILWAY" /C:"DEPLOYMENT" /C:"ENVIRONMENT" /C:"QUICK" /C:"prepare-vercel"
echo.

REM 提交更改
echo [步骤 6/7] 创建提交...
git commit -m "Add Vercel and Railway deployment documentation

Added comprehensive cloud deployment guides:
- Vercel deployment guide (RAILWAY_DEPLOYMENT.md)
- Deployment checklist (DEPLOYMENT_CHECKLIST.md)
- Environment variables guide (ENVIRONMENT_VARIABLES.md)
- Quick deploy guide (QUICK_DEPLOY.md)
- Vercel configuration files (web/next.config.vercel.js, web/vercel.json)
- Deployment preparation script (prepare-vercel-deployment.bat)
- Updated README.md with cloud deployment options

This enables easy deployment to Vercel (frontend) + Railway (backend)"

if errorlevel 1 (
    echo ℹ️  没有新的更改或提交失败
)
echo.

REM 推送到 GitHub
echo [步骤 7/7] 推送到 GitHub...
echo ============================================
echo.

set /p TOKEN="请粘贴您的 GitHub Token: "

if "%TOKEN%"=="" (
    echo ❌ 未提供 Token！
    echo.
    echo 请从这里获取 Token：
    echo https://github.com/settings/tokens/new
    echo.
    pause
    exit /b 1
)

echo.
echo 正在推送...
git push https://%TOKEN%@github.com/hongfei8888/Ai-whatsapp.git master --force

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 请检查上方错误信息。
    pause
    exit /b 1
)

echo.
echo ============================================
echo    🎉 推送成功！
echo ============================================
echo.
echo 文档已更新到：
echo https://github.com/hongfei8888/Ai-whatsapp
echo.
echo 新增的文档：
echo ✅ Vercel 部署指南
echo ✅ Railway 部署指南
echo ✅ 部署检查清单
echo ✅ 环境变量配置指南
echo ✅ 快速部署指南
echo.
echo ⚠️  提醒：立即撤销刚才使用的 Token
echo    访问：https://github.com/settings/tokens
echo.

pause

