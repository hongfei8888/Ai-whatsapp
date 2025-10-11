$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath
Write-Host "当前目录: $scriptPath" -ForegroundColor Green
Write-Host "运行清理脚本..." -ForegroundColor Yellow
node cleanup-db-direct.js
Write-Host "`n按任意键退出..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

