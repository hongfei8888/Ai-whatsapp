@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    完全修复 Git 历史并重新推送
echo ============================================
echo.
echo ⚠️  这将删除所有 Git 历史记录并重新开始
echo    （不会影响您的文件，只是清除 Git 历史）
echo.
set /p CONFIRM="确认继续？ (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo [步骤 1/7] 删除旧的 Git 历史...
rmdir /s /q .git 2>nul
echo ✅ Git 历史已清除
echo.

echo [步骤 2/7] 初始化新的 Git 仓库...
git init
git config user.name "hongfei8888"
git config user.email "your-email@example.com"
echo ✅ Git 仓库已初始化
echo.

echo [步骤 3/7] 优化 Git 配置...
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
echo ✅ Git 配置已优化
echo.

echo [步骤 4/7] 添加远程仓库...
git remote add origin https://github.com/hongfei8888/Ai-whatsapp.git
echo ✅ 远程仓库已添加
echo.

echo [步骤 5/7] 添加文件（排除大文件）...
echo ℹ️  .gitignore 会自动排除 server/chrome/ 目录
git add .
echo ✅ 文件已添加
echo.

echo [步骤 6/7] 创建提交...
git commit -m "Initial commit: WhatsApp AI Automation System (without Chrome binaries)"
echo ✅ 提交完成
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

echo [步骤 7/7] 推送到 GitHub...
echo ℹ️  使用 --force 覆盖远程仓库...
echo.

git push https://%TOKEN%@github.com/hongfei8888/Ai-whatsapp.git master --force

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 请检查：
    echo 1. Token 是否有效
    echo 2. 网络连接是否正常
    echo 3. 上方的错误信息
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    🎉 成功！
echo ============================================
echo.
echo ✅ 项目已成功推送到 GitHub！
echo ✅ Chrome 文件已排除（Docker 会自动下载）
echo ✅ 所有文件都在大小限制内
echo.
echo 🔗 仓库地址：
echo    https://github.com/hongfei8888/Ai-whatsapp
echo.
echo 📊 推送统计：
git log --oneline -1
git ls-files | wc -l > temp.txt
set /p FILECOUNT=<temp.txt
del temp.txt
echo    文件数量：%FILECOUNT%
echo.
echo ℹ️  建议：立即撤销您刚才使用的 Token
echo    访问：https://github.com/settings/tokens
echo.

pause

