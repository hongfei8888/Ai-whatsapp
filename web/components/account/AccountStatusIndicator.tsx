'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccountStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function AccountStatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  animated = true,
  className,
}: AccountStatusIndicatorProps) {
  // 🔧 标准化状态值（支持后端返回的 READY/ONLINE）
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase();
    if (normalized === 'ready' || normalized === 'online') return 'online';
    if (normalized === 'qr' || normalized === 'authenticating') return 'qr';
    if (normalized === 'connecting') return 'connecting';
    return 'offline';
  };

  // 状态配置
  const getStatusConfig = () => {
    const normalizedStatus = normalizeStatus(status);
    const config = {
      online: {
        color: 'bg-green-500',
        label: '在线',
        ring: 'ring-green-200',
      },
      offline: {
        color: 'bg-gray-400',
        label: '离线',
        ring: 'ring-gray-200',
      },
      connecting: {
        color: 'bg-yellow-500',
        label: '连接中',
        ring: 'ring-yellow-200',
      },
    };

    return config[normalizedStatus as keyof typeof config] || config.offline;
  };

  // 大小配置
  const sizeConfig = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusConfig = getStatusConfig();

  const indicator = (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full relative',
          sizeConfig[size],
          statusConfig.color,
          animated && normalizeStatus(status) === 'connecting' && 'animate-pulse'
        )}
      >
        {/* 脉冲效果 */}
        {animated && normalizeStatus(status) === 'online' && (
          <span
            className={cn(
              'absolute inset-0 rounded-full opacity-75 animate-ping',
              statusConfig.color
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{statusConfig.label}</span>
      )}
    </div>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{indicator}</TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicator;
}

