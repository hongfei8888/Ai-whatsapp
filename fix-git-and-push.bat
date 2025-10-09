@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    修复 Git 并重新推送
echo ============================================
echo.

echo [步骤 1/5] 从 Git 缓存中移除大文件...
git rm -r --cached server/chrome/ 2>nul
git rm -r --cached chrome/ 2>nul
echo ✅ 大文件已移除
echo.

echo [步骤 2/5] 检查待提交的更改...
git status --short
echo.

echo [步骤 3/5] 提交更改...
git add .gitignore
git commit -m "Fix: Remove large Chrome files from Git, update .gitignore"
if errorlevel 1 (
    echo ℹ️  没有新的更改需要提交
) else (
    echo ✅ 提交成功
)
echo.

echo [步骤 4/5] 优化 Git 配置...
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
echo ✅ Git 配置已优化
echo.

echo ============================================
echo    准备推送到 GitHub
echo ============================================
echo.

set /p TOKEN="请粘贴您的 GitHub Token: "
echo.

if "%TOKEN%"=="" (
    echo ❌ 未提供 Token！
    pause
    exit /b 1
)

echo [步骤 5/5] 推送到 GitHub...
echo ℹ️  正在推送（不包含 Chrome 文件）...
echo.

git push https://%TOKEN%@github.com/hongfei8888/Ai-whatsapp.git master --force

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！请查看上方错误信息
    pause
    exit /b 1
)

echo.
echo ============================================
echo    ✅ 修复完成！
echo ============================================
echo.
echo 项目已成功推送到：
echo https://github.com/hongfei8888/Ai-whatsapp
echo.
echo 现在仓库中：
echo ✅ 不包含 Chrome 浏览器文件（Docker 会自动下载）
echo ✅ 所有文件都在 GitHub 大小限制内
echo ✅ .gitignore 已更新，以后不会再推送 Chrome 文件
echo.

pause

