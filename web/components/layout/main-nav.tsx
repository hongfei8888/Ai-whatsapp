'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Users, 
  MessageSquare, 
  Settings
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const links = [
  {
    href: '/dashboard',
    label: '仪表盘',
    icon: Home,
    description: '查看系统总览与实时状态',
  },
  {
    href: '/contacts',
    label: '联系人',
    icon: Users,
    description: '管理客户联系人和资料',
  },
  {
    href: '/threads',
    label: '会话',
    icon: MessageSquare,
    description: '查看和管理聊天记录',
  },
  {
    href: '/settings',
    label: '设置',
    icon: Settings,
    description: '配置系统与 AI 回复参数',
  },
];

];

export function MainNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <nav className="flex items-center gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || 
            (link.href !== '/dashboard' && pathname?.startsWith(link.href));
          
          return (
            <Tooltip key={link.href}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "relative h-10 px-3 gap-2 font-medium transition-all duration-200 min-w-[80px] rounded-full bg-white dark:bg-zinc-900 shadow hover:bg-accent transition",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Link href={link.href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{link.label}</span>
                    {isActive && (
                      <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary-foreground rounded-full" />
                    )}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
