# 启动 WhatsApp 自动化系统开发服务器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 启动 WhatsApp 自动化系统开发服务器" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查并创建后端环境配置文件
$serverEnvPath = Join-Path $PSScriptRoot "server\.env"
if (-not (Test-Path $serverEnvPath)) {
    Write-Host "创建后端环境配置文件..." -ForegroundColor Yellow
    @"
PORT=4000
HOST=0.0.0.0
DATABASE_URL=file:../prisma/dev.db
NODE_ENV=development
"@ | Out-File -FilePath $serverEnvPath -Encoding utf8
    Write-Host "✓ 后端配置文件已创建: server\.env" -ForegroundColor Green
}

# 检查并创建前端环境配置文件
$webEnvPath = Join-Path $PSScriptRoot "web\.env.local"
if (-not (Test-Path $webEnvPath)) {
    Write-Host "创建前端环境配置文件..." -ForegroundColor Yellow
    @"
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
"@ | Out-File -FilePath $webEnvPath -Encoding utf8
    Write-Host "✓ 前端配置文件已创建: web\.env.local" -ForegroundColor Green
}

Write-Host ""

# 启动后端服务器
Write-Host "正在启动后端服务器 (端口 4000)..." -ForegroundColor Yellow
$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 8

# 启动前端服务器  
Write-Host "正在启动前端服务器 (端口 3000)..." -ForegroundColor Yellow
$webPath = Join-Path $PSScriptRoot "web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$webPath'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 服务器启动完成!" -ForegroundColor Green
Write-Host ""
Write-Host " 前端访问地址: http://localhost:3000" -ForegroundColor White
Write-Host " 后端 API 地址: http://localhost:4000" -ForegroundColor White  
Write-Host ""
Write-Host " 两个新窗口已打开，可在其中查看日志" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

Read-Host "按 Enter 键退出"

