@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo 正在启动 Prisma Studio 查看数据库...
echo.
cd server
npx prisma studio --schema prisma/schema.prisma

