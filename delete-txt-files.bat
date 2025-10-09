@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo ============================================
echo Delete All TXT Files
echo ============================================
echo.
echo This will delete 8 temporary TXT files:
echo.
echo   - 问题解决方案.txt
echo   - 最终诊断.txt
echo   - 【重要】使用正确的文件夹.txt
echo   - 更新说明.txt
echo   - 【简单3步】解决方案.txt
echo   - 紧急修复步骤.txt
echo   - 临时解决方案.txt
echo   - 二维码问题解决指南.txt
echo.
echo These are temporary diagnostic files created during troubleshooting.
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
echo Deleting TXT files...
echo.

set count=0

if exist "问题解决方案.txt" (
    del /q "问题解决方案.txt" 2>nul && echo [!count!] Deleted: 问题解决方案.txt && set /a count+=1
)
if exist "最终诊断.txt" (
    del /q "最终诊断.txt" 2>nul && echo [!count!] Deleted: 最终诊断.txt && set /a count+=1
)
if exist "【重要】使用正确的文件夹.txt" (
    del /q "【重要】使用正确的文件夹.txt" 2>nul && echo [!count!] Deleted: 【重要】使用正确的文件夹.txt && set /a count+=1
)
if exist "更新说明.txt" (
    del /q "更新说明.txt" 2>nul && echo [!count!] Deleted: 更新说明.txt && set /a count+=1
)
if exist "【简单3步】解决方案.txt" (
    del /q "【简单3步】解决方案.txt" 2>nul && echo [!count!] Deleted: 【简单3步】解决方案.txt && set /a count+=1
)
if exist "紧急修复步骤.txt" (
    del /q "紧急修复步骤.txt" 2>nul && echo [!count!] Deleted: 紧急修复步骤.txt && set /a count+=1
)
if exist "临时解决方案.txt" (
    del /q "临时解决方案.txt" 2>nul && echo [!count!] Deleted: 临时解决方案.txt && set /a count+=1
)
if exist "二维码问题解决指南.txt" (
    del /q "二维码问题解决指南.txt" 2>nul && echo [!count!] Deleted: 二维码问题解决指南.txt && set /a count+=1
)

echo.
echo ============================================
echo Cleanup Complete!
echo ============================================
echo.
echo Total deleted: !count! TXT files
echo.
echo All temporary diagnostic files have been removed!
echo Project is now clean and organized.
echo.
pause

REM Delete this script itself
(goto) 2>nul & del "%~f0"

