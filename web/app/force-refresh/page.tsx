'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ForceRefreshPage() {
  useEffect(() => {
    // 强制清除浏览器缓存
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  }, []);

  const handleHardRefresh = () => {
    // 清除所有存储
    localStorage.clear();
    sessionStorage.clear();
    
    // 强制刷新
    window.location.href = '/dashboard?t=' + Date.now();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-8">
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">🔄 强制缓存清理</h1>
        <p className="text-gray-600 mb-6">
          如果界面还是老样子，点击下面的按钮强制清除缓存并跳转到新界面
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleHardRefresh}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            🚀 清除缓存并刷新
          </Button>
          
          <div className="text-sm text-gray-500">
            <p className="mb-2">或者手动操作：</p>
            <ol className="text-left space-y-1">
              <li>1. 按 Ctrl + Shift + R</li>
              <li>2. 按 F12 打开开发者工具</li>
              <li>3. 右键点击刷新按钮选择"清空缓存并硬性重新加载"</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium text-blue-800">预期界面特征：</p>
          <ul className="text-blue-600 text-left mt-2 space-y-1">
            <li>• 渐变背景（紫到白）</li>
            <li>• 4个统计卡片</li>
            <li>• 彩色圆形按钮</li>
            <li>• 现代化卡片设计</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
