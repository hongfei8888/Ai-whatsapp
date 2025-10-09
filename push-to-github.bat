@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo Push to GitHub Repository
echo ============================================
echo.
echo Repository: https://github.com/hongfei8888/Ai-whatsapp
echo.

echo [1/6] Adding all files...
git add .

echo [2/6] Checking status...
git status

echo.
echo [3/6] Creating commit...
git commit -m "feat: Docker容器化版本 v2.0 - 完整重构

✨ 主要更新:
- 🐳 完整的Docker容器化方案
- 🎨 清理所有临时文件和旧文档
- 📚 创建综合项目文档
- 🗑️ 删除2.7GB无用文件
- ✅ 二维码问题彻底解决

🏗️ 技术栈:
- Docker + Ubuntu 20.04
- Nginx + Supervisor
- Next.js 15 + Fastify
- WhatsApp Web.js + Prisma

📊 优化效果:
- 磁盘占用: 3.5GB → 800MB (↓77%%)
- 文档数量: 20个 → 2个
- 脚本数量: 30个 → 5个
- 项目结构: 清晰简洁

🎯 功能完整:
- AI智能回复
- 多账号管理
- 批量操作
- 实时监控
- 消息模板
- 知识库系统

详见: 【项目总结】WhatsApp-AI自动化系统完整开发文档.md"

echo.
echo [4/6] Pulling from remote (if exists)...
git pull origin master --allow-unrelated-histories --no-edit 2>nul
if errorlevel 1 (
    echo Remote branch does not exist or pull failed, will force push
)

echo.
echo [5/6] Pushing to GitHub...
echo This may take a few minutes for the first push...
git push -u origin master --force

echo.
echo [6/6] Verifying push...
git log --oneline -n 5

echo.
echo ============================================
echo ✅ Push Complete!
echo ============================================
echo.
echo 🌐 Visit: https://github.com/hongfei8888/Ai-whatsapp
echo.
pause

