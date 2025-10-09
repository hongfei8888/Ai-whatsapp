@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ============================================
echo Delete All Temporary Scripts
echo ============================================
echo.
echo This will delete ALL temporary and diagnostic scripts.
echo.
echo KEEP (Docker core - 5 files):
echo   - docker-start.bat
echo   - docker-stop.bat
echo   - docker-logs.bat
echo   - docker-rebuild.bat
echo   - rebuild-docker.bat
echo.
echo DELETE (24+ temporary scripts):
echo   - All diagnostic scripts
echo   - All fix/update scripts
echo   - All test scripts
echo   - Cleanup scripts
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
echo Deleting temporary scripts...
echo.

set count=0

REM Delete cleanup scripts
if exist "clean-project.bat" (
    del /q "clean-project.bat" 2>nul && echo [!count!] Deleted: clean-project.bat && set /a count+=1
)
if exist "清理无关文件.bat" (
    del /q "清理无关文件.bat" 2>nul && echo [!count!] Deleted: 清理无关文件.bat && set /a count+=1
)

REM Delete quick-fix scripts
if exist "quick-fix-copy.bat" (
    del /q "quick-fix-copy.bat" 2>nul && echo [!count!] Deleted: quick-fix-copy.bat && set /a count+=1
)
if exist "quick-fix-rebuild.bat" (
    del /q "quick-fix-rebuild.bat" 2>nul && echo [!count!] Deleted: quick-fix-rebuild.bat && set /a count+=1
)

REM Delete update scripts
if exist "update-nginx-config.bat" (
    del /q "update-nginx-config.bat" 2>nul && echo [!count!] Deleted: update-nginx-config.bat && set /a count+=1
)
if exist "update-nginx.bat" (
    del /q "update-nginx.bat" 2>nul && echo [!count!] Deleted: update-nginx.bat && set /a count+=1
)

REM Delete diagnostic and fix scripts with Chinese names
if exist "【强制管理员启动】必须使用这个.bat" (
    del /q "【强制管理员启动】必须使用这个.bat" 2>nul && echo [!count!] Deleted: 【强制管理员启动】必须使用这个.bat && set /a count+=1
)
if exist "系统诊断工具.bat" (
    del /q "系统诊断工具.bat" 2>nul && echo [!count!] Deleted: 系统诊断工具.bat && set /a count+=1
)
if exist "【终极方案】禁用ServiceWorker.bat" (
    del /q "【终极方案】禁用ServiceWorker.bat" 2>nul && echo [!count!] Deleted: 【终极方案】禁用ServiceWorker.bat && set /a count+=1
)
if exist "【使用稳定旧版本】最后尝试.bat" (
    del /q "【使用稳定旧版本】最后尝试.bat" 2>nul && echo [!count!] Deleted: 【使用稳定旧版本】最后尝试.bat && set /a count+=1
)
if exist "【终极简化版本】测试这个.bat" (
    del /q "【终极简化版本】测试这个.bat" 2>nul && echo [!count!] Deleted: 【终极简化版本】测试这个.bat && set /a count+=1
)
if exist "【最终方案】使用这个.bat" (
    del /q "【最终方案】使用这个.bat" 2>nul && echo [!count!] Deleted: 【最终方案】使用这个.bat && set /a count+=1
)
if exist "【终极方案】完全禁用缓存.bat" (
    del /q "【终极方案】完全禁用缓存.bat" 2>nul && echo [!count!] Deleted: 【终极方案】完全禁用缓存.bat && set /a count+=1
)
if exist "【重要】CacheStorage错误已修复.bat" (
    del /q "【重要】CacheStorage错误已修复.bat" 2>nul && echo [!count!] Deleted: 【重要】CacheStorage错误已修复.bat && set /a count+=1
)
if exist "【立即执行】应用更新.bat" (
    del /q "【立即执行】应用更新.bat" 2>nul && echo [!count!] Deleted: 【立即执行】应用更新.bat && set /a count+=1
)
if exist "测试网络连接.bat" (
    del /q "测试网络连接.bat" 2>nul && echo [!count!] Deleted: 测试网络连接.bat && set /a count+=1
)
if exist "1-关闭应用.bat" (
    del /q "1-关闭应用.bat" 2>nul && echo [!count!] Deleted: 1-关闭应用.bat && set /a count+=1
)
if exist "【必看】完整解决方案.bat" (
    del /q "【必看】完整解决方案.bat" 2>nul && echo [!count!] Deleted: 【必看】完整解决方案.bat && set /a count+=1
)
if exist "查看实时状态.bat" (
    del /q "查看实时状态.bat" 2>nul && echo [!count!] Deleted: 查看实时状态.bat && set /a count+=1
)
if exist "强制重启服务.bat" (
    del /q "强制重启服务.bat" 2>nul && echo [!count!] Deleted: 强制重启服务.bat && set /a count+=1
)
if exist "立即修复-请执行.bat" (
    del /q "立即修复-请执行.bat" 2>nul && echo [!count!] Deleted: 立即修复-请执行.bat && set /a count+=1
)
if exist "详细诊断.bat" (
    del /q "详细诊断.bat" 2>nul && echo [!count!] Deleted: 详细诊断.bat && set /a count+=1
)
if exist "快速修复.bat" (
    del /q "快速修复.bat" 2>nul && echo [!count!] Deleted: 快速修复.bat && set /a count+=1
)
if exist "install-server-deps.bat" (
    del /q "install-server-deps.bat" 2>nul && echo [!count!] Deleted: install-server-deps.bat && set /a count+=1
)

echo.
echo ============================================
echo Cleanup Complete!
echo ============================================
echo.
echo Total deleted: !count! scripts
echo.
echo Remaining scripts (Docker core):
dir docker*.bat /b 2>nul
dir rebuild-docker.bat /b 2>nul
echo.
echo Your project now only has essential Docker management scripts!
echo.
pause

REM Delete this script itself
(goto) 2>nul & del "%~f0"

