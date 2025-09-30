'use client';

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-black text-center mb-8 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          🎉 新界面测试成功！
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ 渐变背景</h2>
            <p className="text-gray-600">如果您能看到彩色渐变背景，说明TailwindCSS正常工作！</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎨 毛玻璃效果</h2>
            <p className="text-gray-600">这个卡片有半透明背景和毛玻璃效果！</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ 悬停动画</h2>
            <p className="text-gray-600">鼠标悬停时卡片会有缩放和阴影效果！</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 现代设计</h2>
            <p className="text-gray-600">新界面采用现代化设计语言，美观易用！</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-block bg-green-500 text-white px-8 py-4 rounded-2xl shadow-lg">
            <p className="text-xl font-semibold">🎊 前端界面优化完成！</p>
          </div>
        </div>
      </div>
    </div>
  );
}
