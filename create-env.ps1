# 创建前端环境配置文件

$envContent = "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000"
$envPath = Join-Path $PSScriptRoot "web\.env.local"

Write-Host "创建配置文件: $envPath"
$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

if (Test-Path $envPath) {
    Write-Host "✓ 配置文件创建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "配置内容:" -ForegroundColor Yellow
    Get-Content $envPath
    Write-Host ""
    Write-Host "现在请刷新浏览器页面 (Ctrl+F5) 或重启前端服务器！" -ForegroundColor Cyan
} else {
    Write-Host "✗ 配置文件创建失败" -ForegroundColor Red
}

