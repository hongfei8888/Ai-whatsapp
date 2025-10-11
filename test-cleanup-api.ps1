# ========================================
# 测试清理API连接
# 用于验证API是否正常工作
# ========================================

param(
    [string]$ApiBaseUrl = "http://localhost:3001"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试清理API连接" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试API连接
Write-Host "🔍 测试API连接: $ApiBaseUrl" -ForegroundColor Cyan

try {
    # 测试基础连接
    Write-Host "1️⃣ 测试基础连接..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "$ApiBaseUrl/api/accounts" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ 服务器响应正常 (状态码: $($response.StatusCode))" -ForegroundColor Green
    
    # 获取账号列表
    Write-Host "`n2️⃣ 获取账号列表..." -ForegroundColor Yellow
    $accountsResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/api/accounts" -Method Get -TimeoutSec 10
    
    if ($accountsResponse.ok) {
        $accounts = $accountsResponse.data
        Write-Host "   ✅ 成功获取账号列表" -ForegroundColor Green
        Write-Host "   📊 账号总数: $($accounts.Count)" -ForegroundColor Cyan
        
        $onlineAccounts = $accounts | Where-Object { 
            $_.status -eq "READY" -or $_.status -eq "ONLINE" 
        }
        $offlineAccounts = $accounts | Where-Object { 
            $_.status -ne "READY" -and $_.status -ne "ONLINE" 
        }
        
        Write-Host "   ✅ 在线账号: $($onlineAccounts.Count)" -ForegroundColor Green
        Write-Host "   ❌ 离线账号: $($offlineAccounts.Count)" -ForegroundColor Red
        
        if ($accounts.Count -gt 0) {
            Write-Host "`n   账号详情:" -ForegroundColor White
            foreach ($acc in $accounts) {
                $statusColor = if ($acc.status -eq "READY" -or $acc.status -eq "ONLINE") { "Green" } else { "Red" }
                $phone = if ($acc.phoneNumber) { $acc.phoneNumber } else { "无手机号" }
                Write-Host "   - $($acc.name) ($phone) - $($acc.status)" -ForegroundColor $statusColor
            }
        }
        
        # 询问是否执行清理
        if ($offlineAccounts.Count -gt 0) {
            Write-Host "`n3️⃣ 测试清理API..." -ForegroundColor Yellow
            Write-Host "   ⚠️  发现 $($offlineAccounts.Count) 个离线账号" -ForegroundColor Yellow
            
            $confirm = Read-Host "   是否执行清理测试? (y/n)"
            
            if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                Write-Host "   🗑️  正在执行清理..." -ForegroundColor Cyan
                
                $cleanupResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/api/accounts/cleanup" -Method Delete -TimeoutSec 30
                
                if ($cleanupResponse.ok) {
                    $data = $cleanupResponse.data
                    Write-Host "   ✅ 清理成功!" -ForegroundColor Green
                    Write-Host "   📊 删除账号数: $($data.deletedCount)" -ForegroundColor Cyan
                    
                    if ($data.deletedCount -gt 0) {
                        Write-Host "`n   已删除的账号:" -ForegroundColor Yellow
                        foreach ($acc in $data.deletedAccounts) {
                            $phone = if ($acc.phoneNumber) { $acc.phoneNumber } else { "无手机号" }
                            Write-Host "   - $($acc.name) ($phone) - $($acc.status)" -ForegroundColor Yellow
                        }
                    }
                } else {
                    Write-Host "   ❌ 清理失败: $($cleanupResponse.message)" -ForegroundColor Red
                }
            } else {
                Write-Host "   ℹ️  跳过清理测试" -ForegroundColor Gray
            }
        } else {
            Write-Host "`n3️⃣ 测试清理API..." -ForegroundColor Yellow
            Write-Host "   ℹ️  没有离线账号需要清理" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ 获取账号列表失败" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ API测试完成" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ API测试失败" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    
    $errorMessage = $_.Exception.Message
    
    if ($errorMessage -match "Unable to connect" -or $errorMessage -match "ConnectFailure") {
        Write-Host "🔴 错误原因: 无法连接到服务器" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 解决方案:" -ForegroundColor Yellow
        Write-Host "   1. 确保后端服务正在运行" -ForegroundColor White
        Write-Host "   2. 检查API地址是否正确: $ApiBaseUrl" -ForegroundColor White
        Write-Host "   3. 确认端口号 (默认3001)" -ForegroundColor White
        Write-Host "   4. 检查防火墙设置" -ForegroundColor White
    } else {
        Write-Host "🔴 错误信息: $errorMessage" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "按 Enter 键退出"

