@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo    准备 Vercel 部署
echo ============================================
echo.

echo [步骤 1/4] 检查 Vercel CLI...
where vercel >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Vercel CLI 未安装
    echo.
    echo 是否现在安装？ (Y/N)
    set /p INSTALL="请选择: "
    if /i "%INSTALL%"=="Y" (
        echo 正在安装 Vercel CLI...
        npm install -g vercel
    ) else (
        echo 跳过 CLI 安装
    )
) else (
    echo ✅ Vercel CLI 已安装
)
echo.

echo [步骤 2/4] 进入前端目录...
cd web
echo ✅ 当前目录: %cd%
echo.

echo [步骤 3/4] 复制 Vercel 配置...
if exist next.config.vercel.js (
    copy /Y next.config.vercel.js next.config.js >nul
    echo ✅ next.config.js 已更新（Vercel 版本）
) else (
    echo ⚠️  未找到 next.config.vercel.js
)
echo.

echo [步骤 4/4] 测试构建...
echo ℹ️  正在测试构建（这可能需要几分钟）...
echo.
call npm install
call npm run build

if errorlevel 1 (
    echo.
    echo ❌ 构建失败！
    echo 请检查错误信息后重试。
    cd ..
    pause
    exit /b 1
)

echo.
echo ============================================
echo    ✅ 准备完成！
echo ============================================
echo.
echo 接下来的步骤：
echo.
echo 方式 1: 使用 Vercel Dashboard（推荐新手）
echo ----------------------------------------
echo 1. 访问：https://vercel.com/new
echo 2. 使用 GitHub 登录
echo 3. 导入仓库：hongfei8888/Ai-whatsapp
echo 4. 设置：
echo    - Root Directory: web
echo    - Framework: Next.js
echo 5. 添加环境变量：
echo    NEXT_PUBLIC_API_BASE_URL=https://your-railway-api.railway.app
echo    NEXT_PUBLIC_WS_URL=wss://your-railway-api.railway.app
echo 6. 点击 Deploy
echo.
echo 方式 2: 使用 Vercel CLI（推荐有经验用户）
echo ----------------------------------------
echo 1. 运行：vercel login
echo 2. 运行：vercel --prod
echo 3. 按照提示配置项目
echo.
echo 详细教程请查看：VERCEL_DEPLOYMENT.md
echo.

cd ..
pause

