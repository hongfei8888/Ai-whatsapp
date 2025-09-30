'use client';

import { useState } from 'react';
import { 
  UserPlus, 
  RefreshCw, 
  LogOut, 
  Settings,
  Plus,
  RotateCcw,
  Power,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddAccountDialog } from '@/components/AddAccountDialog';
import { SettingsDialog } from '@/components/dashboard/settings-dialog';
import { StatusDialog } from '@/components/dashboard/status-dialog';
import { AccountDialog } from '@/components/dashboard/account-dialog';

interface ActionButtonsProps {
  isRefreshing: boolean;
  isLoggingOut: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onLoginSuccess: () => void;
}

export function ActionButtons({
  isRefreshing,
  isLoggingOut,
  onRefresh,
  onLogout,
  onLoginSuccess
}: ActionButtonsProps) {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);


  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {/* 添加账号 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsAddAccountOpen(true)}
              className="rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-emerald-400/20 h-12 w-12 p-0"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>添加账号</p>
          </TooltipContent>
        </Tooltip>

        {/* 账号管理 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsAccountOpen(true)}
              className="rounded-full bg-blue-500/90 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-blue-400/20 h-12 w-12 p-0"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>账号管理</p>
          </TooltipContent>
        </Tooltip>

        {/* 系统设置 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full bg-purple-500/90 hover:bg-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-purple-400/20 h-12 w-12 p-0"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>系统设置</p>
          </TooltipContent>
        </Tooltip>

        {/* 刷新 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-full bg-orange-500/90 hover:bg-orange-500 text-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-orange-400/20 h-12 w-12 p-0 disabled:opacity-70"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRefreshing ? '刷新中...' : '刷新数据'}</p>
          </TooltipContent>
        </Tooltip>

        {/* 退出登录 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm border border-red-400/20 h-12 w-12 p-0"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isLoggingOut ? '退出中...' : '退出登录'}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 弹出框 */}
      <AddAccountDialog
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
        onSuccess={onLoginSuccess}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />

      <AccountDialog
        open={isAccountOpen}
        onOpenChange={setIsAccountOpen}
      />

      <StatusDialog
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
      />
    </TooltipProvider>
  );
}
