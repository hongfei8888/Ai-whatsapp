export default function TestPage() {
  return (
    <div style={{ background: 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          🎉 测试页面
        </h1>
        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '2rem', borderRadius: '1rem', color: 'black', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅ 页面正常工作！</h2>
          <p style={{ fontSize: '1.2rem' }}>
            如果您能看到这个彩色背景和白色卡片，说明前端服务正常运行！
          </p>
        </div>
      </div>
    </div>
  );
}
