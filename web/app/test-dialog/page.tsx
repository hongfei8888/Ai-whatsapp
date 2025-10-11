'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddAccountDialog } from '@/components/account/AddAccountDialog';

export default function TestDialogPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">弹窗居中测试页面</h1>
        
        <div className="space-y-2">
          <p className="text-gray-600">点击下方按钮测试弹窗是否居中</p>
          <p className="text-sm text-gray-500">弹窗应该出现在屏幕正中央</p>
        </div>

        <Button 
          onClick={() => setOpen(true)}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          打开添加账号弹窗
        </Button>

        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm max-w-md mx-auto">
          <h2 className="font-semibold mb-2">预期效果：</h2>
          <ul className="text-left text-sm space-y-1 text-gray-600">
            <li>✅ 弹窗在屏幕正中央</li>
            <li>✅ 绿色渐变背景</li>
            <li>✅ 四周间距均匀</li>
            <li>✅ 可以看到完整内容</li>
          </ul>
        </div>

        {/* 用于对比的角落标记 */}
        <div className="fixed top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-xs">
          左上角
        </div>
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs">
          右上角
        </div>
        <div className="fixed bottom-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded text-xs">
          左下角 ← 如果弹窗在这里就是错误的
        </div>
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-xs">
          右下角
        </div>
      </div>

      <AddAccountDialog 
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          setOpen(false);
          alert('测试成功！');
        }}
      />
    </div>
  );
}

