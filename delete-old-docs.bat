@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ============================================
echo Delete Old Documentation Files
echo ============================================
echo.
echo This will delete 19 old documentation files.
echo.
echo KEEP:
echo   - README.md (GitHub standard)
echo   - 【项目总结】WhatsApp-AI自动化系统完整开发文档.md (New comprehensive doc)
echo.
echo DELETE (19 files):
echo   - All other .md files
echo   - Duplicated documentation
echo   - Outdated guides
echo.
echo WARNING: This operation cannot be undone!
echo.
set /p confirm="Confirm deletion? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Deleting old documentation files...
echo.

set count=0

REM Root directory docs
if exist "快速参考.md" (
    del /q "快速参考.md" 2>nul && echo [!count!] Deleted: 快速参考.md && set /a count+=1
)
if exist "项目文件说明.md" (
    del /q "项目文件说明.md" 2>nul && echo [!count!] Deleted: 项目文件说明.md && set /a count+=1
)
if exist "DOCKER使用指南.md" (
    del /q "DOCKER使用指南.md" 2>nul && echo [!count!] Deleted: DOCKER使用指南.md && set /a count+=1
)
if exist "替代方案说明.md" (
    del /q "替代方案说明.md" 2>nul && echo [!count!] Deleted: 替代方案说明.md && set /a count+=1
)
if exist "修复方案-网络问题.md" (
    del /q "修复方案-网络问题.md" 2>nul && echo [!count!] Deleted: 修复方案-网络问题.md && set /a count+=1
)
if exist "修复二维码问题.md" (
    del /q "修复二维码问题.md" 2>nul && echo [!count!] Deleted: 修复二维码问题.md && set /a count+=1
)
if exist "WhatsApp AI自动化系统 - 用户使用手册.md" (
    del /q "WhatsApp AI自动化系统 - 用户使用手册.md" 2>nul && echo [!count!] Deleted: WhatsApp AI自动化系统 - 用户使用手册.md && set /a count+=1
)
if exist "项目使用指南-最终版.md" (
    del /q "项目使用指南-最终版.md" 2>nul && echo [!count!] Deleted: 项目使用指南-最终版.md && set /a count+=1
)
if exist "README-使用指南.md" (
    del /q "README-使用指南.md" 2>nul && echo [!count!] Deleted: README-使用指南.md && set /a count+=1
)
if exist "WebSocket实时通信 - 显著提升用户体验.md" (
    del /q "WebSocket实时通信 - 显著提升用户体验.md" 2>nul && echo [!count!] Deleted: WebSocket实时通信 - 显著提升用户体验.md && set /a count+=1
)
if exist "WhatsApp AI自动化项目总结.md" (
    del /q "WhatsApp AI自动化项目总结.md" 2>nul && echo [!count!] Deleted: WhatsApp AI自动化项目总结.md && set /a count+=1
)
if exist "项目开发过程总结与经验教训1.md" (
    del /q "项目开发过程总结与经验教训1.md" 2>nul && echo [!count!] Deleted: 项目开发过程总结与经验教训1.md && set /a count+=1
)
if exist "部署.md" (
    del /q "部署.md" 2>nul && echo [!count!] Deleted: 部署.md && set /a count+=1
)
if exist "默认启用AI配置说明.md" (
    del /q "默认启用AI配置说明.md" 2>nul && echo [!count!] Deleted: 默认启用AI配置说明.md && set /a count+=1
)
if exist "CODE_OF_CONDUCT.md" (
    del /q "CODE_OF_CONDUCT.md" 2>nul && echo [!count!] Deleted: CODE_OF_CONDUCT.md && set /a count+=1
)

REM Web directory docs
if exist "web\OPTIMIZATION_SUMMARY.md" (
    del /q "web\OPTIMIZATION_SUMMARY.md" 2>nul && echo [!count!] Deleted: web\OPTIMIZATION_SUMMARY.md && set /a count+=1
)
if exist "web\docs\integration-guide.md" (
    del /q "web\docs\integration-guide.md" 2>nul && echo [!count!] Deleted: web\docs\integration-guide.md && set /a count+=1
)
if exist "web\docs\selfcheck.md" (
    del /q "web\docs\selfcheck.md" 2>nul && echo [!count!] Deleted: web\docs\selfcheck.md && set /a count+=1
)

REM Tests directory docs
if exist "tests\README.md" (
    del /q "tests\README.md" 2>nul && echo [!count!] Deleted: tests\README.md && set /a count+=1
)

echo.
echo ============================================
echo Cleanup Complete!
echo ============================================
echo.
echo Total deleted: !count! documentation files
echo.
echo Remaining documentation:
echo   - README.md (GitHub standard)
echo   - 【项目总结】WhatsApp-AI自动化系统完整开发文档.md (Comprehensive)
echo.
echo All old documentation has been consolidated into the new comprehensive document!
echo.
pause

REM Delete this script itself
(goto) 2>nul & del "%~f0"

