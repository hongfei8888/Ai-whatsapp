export default function StyleTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-purple-500 to-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white text-center mb-8">
          🎨 样式测试页面
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ TailwindCSS 工作正常</h2>
            <p className="text-gray-600">如果您能看到这个彩色渐变背景和卡片效果，说明样式系统正常！</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎉 新界面可用</h2>
            <p className="text-gray-600">现在可以正常显示现代化界面了！</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-block bg-green-500/80 backdrop-blur text-white px-8 py-4 rounded-2xl shadow-lg">
            <p className="text-xl font-semibold">🚀 界面测试成功！</p>
          </div>
        </div>
      </div>
    </div>
  );
}
