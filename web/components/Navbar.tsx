'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard,
  Users, 
  MessageSquare, 
  Settings,
  Menu,
  X,
  User
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const navItems = [
  { 
    href: '/dashboard', 
    label: '仪表盘', 
    icon: LayoutDashboard
  },
  { 
    href: '/contacts', 
    label: '联系人', 
    icon: Users
  },
  { 
    href: '/threads', 
    label: '会话', 
    icon: MessageSquare
  },
  { 
    href: '/settings', 
    label: '设置', 
    icon: Settings
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 h-full">
        {/* 左侧：Logo + 项目名 */}
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3 text-xl font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            W
          </div>
          WhatsApp 运营
        </Link>

        {/* 中间：功能导航 - 桌面端 */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 relative",
                  "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400",
                  isActive && "text-indigo-600 dark:text-indigo-400"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute inset-x-0 -bottom-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* 右侧：用户菜单 + 移动端菜单 */}
        <div className="flex items-center gap-4">
          {/* 用户菜单 - 桌面端 */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 移动端汉堡菜单 */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">导航菜单</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                          isActive && "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* 移动端用户菜单项 */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <User className="h-5 w-5" />
                        个人资料
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Settings className="h-5 w-5" />
                        设置
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                        退出登录
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
