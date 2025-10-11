# ========================================
# 自动清理离线账号脚本 (PowerShell版本)
# 自动调用清理API删除所有离线账号
# ========================================

param(
    [string]$ApiBaseUrl = "http://localhost:3001",
    [int]$IntervalMinutes = 60,
    [switch]$RunOnce = $false
)

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# 调用清理API
function Invoke-CleanupOfflineAccounts {
    try {
        Write-ColorOutput "🔍 开始清理离线账号..." "Cyan"
        
        $url = "$ApiBaseUrl/api/accounts/cleanup"
        $response = Invoke-RestMethod -Uri $url -Method Delete -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.ok) {
            $data = $response.data
            $deletedCount = $data.deletedCount
            $deletedAccounts = $data.deletedAccounts
            $message = $data.message
            
            if ($deletedCount -gt 0) {
                Write-ColorOutput "✅ $message" "Green"
                Write-ColorOutput "📊 删除的账号详情:" "Yellow"
                foreach ($acc in $deletedAccounts) {
                    $phone = if ($acc.phoneNumber) { $acc.phoneNumber } else { "无手机号" }
                    Write-ColorOutput "  - $($acc.name) ($phone) - $($acc.status)" "Yellow"
                }
            } else {
                Write-ColorOutput "✨ $message" "Green"
            }
            
            return @{
                success = $true
                deletedCount = $deletedCount
                deletedAccounts = $deletedAccounts
            }
        } else {
            Write-ColorOutput "❌ 清理失败: $($response.message)" "Red"
            return @{
                success = $false
                error = $response.message
            }
        }
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -match "Unable to connect" -or $errorMessage -match "ConnectFailure") {
            Write-ColorOutput "❌ 无法连接到服务器 $ApiBaseUrl，请确保服务器正在运行" "Red"
        } else {
            Write-ColorOutput "❌ 清理失败: $errorMessage" "Red"
        }
        
        return @{
            success = $false
            error = $errorMessage
        }
    }
}

# 获取账号状态
function Get-AccountsStatus {
    try {
        $url = "$ApiBaseUrl/api/accounts"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.ok) {
            $accounts = $response.data
            
            $onlineAccounts = $accounts | Where-Object { 
                $_.status -eq "READY" -or $_.status -eq "ONLINE" 
            }
            
            $offlineAccounts = $accounts | Where-Object { 
                $_.status -ne "READY" -and $_.status -ne "ONLINE" 
            }
            
            Write-ColorOutput "📊 当前账号状态:" "Blue"
            Write-ColorOutput "  ✅ 在线账号: $($onlineAccounts.Count)" "Green"
            Write-ColorOutput "  ❌ 离线账号: $($offlineAccounts.Count)" "Red"
            
            if ($offlineAccounts.Count -gt 0) {
                Write-ColorOutput "`n离线账号列表:" "Yellow"
                foreach ($acc in $offlineAccounts) {
                    $phone = if ($acc.phoneNumber) { $acc.phoneNumber } else { "无手机号" }
                    Write-ColorOutput "  - $($acc.name) ($phone) - $($acc.status)" "Yellow"
                }
            }
            
            return @{
                total = $accounts.Count
                online = $onlineAccounts.Count
                offline = $offlineAccounts.Count
            }
        }
    }
    catch {
        Write-ColorOutput "⚠️  无法获取账号状态: $($_.Exception.Message)" "Yellow"
        return $null
    }
}

# 执行一次清理任务
function Invoke-CleanupTask {
    Write-Host ""
    Write-ColorOutput "═════════════════════════════════════════" "White"
    Write-ColorOutput "🚀 开始执行清理任务" "White"
    Write-ColorOutput "═════════════════════════════════════════" "White"
    Write-Host ""
    
    # 先获取当前状态
    Get-AccountsStatus | Out-Null
    Write-Host ""
    
    # 执行清理
    $result = Invoke-CleanupOfflineAccounts
    Write-Host ""
    
    # 清理后再次获取状态
    if ($result.success -and $result.deletedCount -gt 0) {
        Write-ColorOutput "🔄 清理后的账号状态:" "Cyan"
        Get-AccountsStatus | Out-Null
    }
    
    Write-Host ""
    Write-ColorOutput "═════════════════════════════════════════" "White"
    Write-ColorOutput "✨ 清理任务完成" "White"
    Write-ColorOutput "═════════════════════════════════════════" "White"
    
    return $result
}

# 启动定时任务
function Start-ScheduledCleanup {
    Write-Host ""
    Write-ColorOutput "🎯 自动清理离线账号服务已启动" "White"
    Write-ColorOutput "📡 API地址: $ApiBaseUrl" "Cyan"
    Write-ColorOutput "⏰ 清理间隔: $IntervalMinutes 分钟" "Cyan"
    
    # 立即执行一次
    Invoke-CleanupTask | Out-Null
    
    if (-not $RunOnce) {
        Write-Host ""
        $intervalMs = $IntervalMinutes * 60 * 1000
        $nextRunTime = (Get-Date).AddMinutes($IntervalMinutes).ToString("yyyy-MM-dd HH:mm:ss")
        Write-ColorOutput "⏰ 下次清理时间: $nextRunTime" "Cyan"
        Write-ColorOutput "💡 按 Ctrl+C 停止服务" "Yellow"
        Write-Host ""
        
        # 定时执行
        while ($true) {
            Start-Sleep -Seconds ($IntervalMinutes * 60)
            Invoke-CleanupTask | Out-Null
            
            $nextRunTime = (Get-Date).AddMinutes($IntervalMinutes).ToString("yyyy-MM-dd HH:mm:ss")
            Write-Host ""
            Write-ColorOutput "⏰ 下次清理时间: $nextRunTime" "Cyan"
        }
    } else {
        Write-Host ""
        Write-ColorOutput "✅ 单次运行完成，脚本退出" "Green"
    }
}

# 捕获Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host ""
    Write-Host "👋 正在停止自动清理服务..." -ForegroundColor Yellow
}

# 启动
try {
    Start-ScheduledCleanup
}
catch {
    Write-Host ""
    Write-ColorOutput "❌ 服务启动失败: $($_.Exception.Message)" "Red"
    exit 1
}

