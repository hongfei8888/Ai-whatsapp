@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    推送 Vercel 部署文档到 GitHub
echo ============================================
echo.

REM 检查 Git 状态
echo [步骤 1/4] 检查 Git 状态...
git status
echo.

REM 添加新文件
echo [步骤 2/4] 添加新创建的文件...
git add web/next.config.vercel.js
git add web/vercel.json
git add RAILWAY_DEPLOYMENT.md
git add DEPLOYMENT_CHECKLIST.md
git add ENVIRONMENT_VARIABLES.md
git add QUICK_DEPLOY.md
git add prepare-vercel-deployment.bat
git add README.md
git add complete-fix-and-push.bat
git add fix-git-and-push.bat
git add .gitignore

echo ✅ 文件已添加
echo.

REM 提交更改
echo [步骤 3/4] 提交更改...
git commit -m "Add Vercel deployment documentation and configurations

- Add Vercel deployment guide (RAILWAY_DEPLOYMENT.md)
- Add deployment checklist (DEPLOYMENT_CHECKLIST.md)
- Add environment variables guide (ENVIRONMENT_VARIABLES.md)
- Add quick deploy guide (QUICK_DEPLOY.md)
- Add Vercel configuration files (web/next.config.vercel.js, web/vercel.json)
- Add deployment preparation script (prepare-vercel-deployment.bat)
- Update README.md with cloud deployment options
- Update .gitignore to exclude Chrome binaries"

if errorlevel 1 (
    echo ℹ️  没有新的更改需要提交（或提交失败）
    echo.
)
echo.

REM 推送到 GitHub
echo [步骤 4/4] 推送到 GitHub...
echo.

set /p TOKEN="请粘贴您的 GitHub Token（或直接按 Enter 使用已保存的认证）: "

if "%TOKEN%"=="" (
    echo 使用默认推送方式...
    git push origin master
) else (
    echo 使用 Token 推送...
    git push https://%TOKEN%@github.com/hongfei8888/Ai-whatsapp.git master
)

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 请检查：
    echo 1. Git 远程仓库是否已配置
    echo 2. Token 是否有效（如果使用）
    echo 3. 网络连接是否正常
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    ✅ 推送成功！
echo ============================================
echo.
echo 新的 Vercel 部署文档已推送到：
echo https://github.com/hongfei8888/Ai-whatsapp
echo.
echo 访问仓库查看更新后的文档！
echo.

pause

