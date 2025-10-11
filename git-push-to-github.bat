@echo off
chcp 65001 > nul
cd /d "D:\projects\whatsapp-web.js-main 2025.9.29 自动回复养号"

echo 正在提交代码...
git add -A
git commit -m "feat: WhatsApp AI完整系统v3.5 - 145+功能/性能优化/Docker部署"

echo.
echo 正在推送到GitHub...
git push -u origin master

echo.
echo 推送完成！
pause

