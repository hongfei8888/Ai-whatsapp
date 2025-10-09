@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    GitHub 推送工具 - 大文件优化版
echo ============================================
echo.

REM 检查是否已配置用户信息
git config user.name >nul 2>&1
if errorlevel 1 (
    echo [配置] 设置 Git 用户信息...
    git config user.name "hongfei8888"
    git config user.email "your-email@example.com"
)

REM 检查 .git 目录
if not exist ".git" (
    echo [初始化] 创建 Git 仓库...
    git init
    echo.
)

REM 配置 Git 以处理大文件
echo [配置] 优化 Git 设置以处理大文件...
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
git config pack.windowMemory 256m
git config pack.packSizeLimit 256m
git config pack.threads 1
echo ✅ Git 配置完成
echo.

REM 检查远程仓库
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [配置] 添加远程仓库...
    git remote add origin https://github.com/hongfei8888/Ai-whatsapp.git
) else (
    echo [配置] 更新远程仓库地址...
    git remote set-url origin https://github.com/hongfei8888/Ai-whatsapp.git
)
echo ✅ 远程仓库已配置
echo.

REM 添加文件
echo [准备] 添加文件到 Git...
git add .
if errorlevel 1 (
    echo ❌ 添加文件失败！
    echo.
    echo 请检查是否有权限问题或文件被占用
    pause
    exit /b 1
)
echo ✅ 文件已添加
echo.

REM 检查是否有更改
git diff --cached --quiet
if not errorlevel 1 (
    echo ℹ️  没有新的更改需要提交
    echo.
    goto PUSH
)

REM 提交更改
echo [提交] 创建提交...
git commit -m "Initial commit: WhatsApp AI Automation System with Docker"
if errorlevel 1 (
    echo ❌ 提交失败！
    pause
    exit /b 1
)
echo ✅ 提交成功
echo.

:PUSH
REM 推送到 GitHub
echo ============================================
echo    准备推送到 GitHub
echo ============================================
echo.
echo ⚠️  重要：您需要 GitHub Personal Access Token
echo.
echo 如果还没有 Token，请：
echo 1. 访问：https://github.com/settings/tokens
echo 2. 点击 "Generate new token (classic)"
echo 3. 勾选 "repo" 权限
echo 4. 复制生成的 Token
echo.
echo ============================================
echo.

set /p TOKEN="请粘贴您的 GitHub Token (输入将隐藏): "
echo.

if "%TOKEN%"=="" (
    echo ❌ 未提供 Token！
    echo.
    echo 无法推送到 GitHub，请重新运行脚本并提供 Token。
    pause
    exit /b 1
)

echo [推送] 正在推送到 GitHub...
echo ℹ️  这可能需要几分钟，请耐心等待...
echo.

git push https://%TOKEN%@github.com/hongfei8888/Ai-whatsapp.git master --force

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. Token 无效或权限不足
    echo 2. 网络连接问题
    echo 3. 文件过大
    echo.
    echo 解决方案：
    echo 1. 检查 Token 是否正确
    echo 2. 确保网络稳定
    echo 3. 查看上方错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    ✅ 推送成功！
echo ============================================
echo.
echo 您的项目已成功推送到：
echo https://github.com/hongfei8888/Ai-whatsapp
echo.
echo 接下来您可以：
echo 1. 访问仓库查看文件
echo 2. 设置 GitHub Pages（如果需要）
echo 3. 邀请协作者
echo.

pause
