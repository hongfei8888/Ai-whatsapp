@echo off
chcp 65001 >nul
cd /d "%~dp0"
node cleanup-accounts.js
pause

