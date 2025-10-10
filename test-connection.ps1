# 测试前后端连接状态

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 测试前后端连接状态" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试后端 API
Write-Host "1. 测试后端 API (http://localhost:4000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/status" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ 后端连接成功! 状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   响应: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ 后端连接失败!" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   请检查:" -ForegroundColor Yellow
    Write-Host "   - 后端服务器是否启动（端口 4000）" -ForegroundColor White
    Write-Host "   - 运行命令: cd server && npm run dev" -ForegroundColor White
}

Write-Host ""

# 测试前端服务器
Write-Host "2. 测试前端服务器 (http://localhost:3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ 前端连接成功! 状态码: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 前端连接失败!" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   请检查:" -ForegroundColor Yellow
    Write-Host "   - 前端服务器是否启动（端口 3000）" -ForegroundColor White
    Write-Host "   - 运行命令: cd web && npm run dev" -ForegroundColor White
}

Write-Host ""

# 检查环境配置文件
Write-Host "3. 检查环境配置文件..." -ForegroundColor Yellow

$serverEnvExists = Test-Path "server\.env"
$webEnvExists = Test-Path "web\.env.local"

if ($serverEnvExists) {
    Write-Host "   ✓ 后端配置文件存在: server\.env" -ForegroundColor Green
} else {
    Write-Host "   ✗ 后端配置文件缺失: server\.env" -ForegroundColor Red
    Write-Host "     请运行 start-servers.ps1 或 start-dev.bat 自动创建" -ForegroundColor Yellow
}

if ($webEnvExists) {
    Write-Host "   ✓ 前端配置文件存在: web\.env.local" -ForegroundColor Green
} else {
    Write-Host "   ✗ 前端配置文件缺失: web\.env.local" -ForegroundColor Red
    Write-Host "     请运行 start-servers.ps1 或 start-dev.bat 自动创建" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 测试完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 提供快速启动建议
if (-not $serverEnvExists -or -not $webEnvExists) {
    Write-Host "💡 建议: 运行以下命令快速启动系统:" -ForegroundColor Yellow
    Write-Host "   .\start-servers.ps1" -ForegroundColor White
    Write-Host "   或" -ForegroundColor Gray
    Write-Host "   .\start-dev.bat" -ForegroundColor White
}

Write-Host ""
Read-Host "按 Enter 键退出"

