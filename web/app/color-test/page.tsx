'use client';

export default function ColorTestPage() {
  return (
    <div 
      style={{
        background: 'linear-gradient(to bottom, #e0e7ff, #ffffff)',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#4f46e5',
              marginBottom: '1rem'
            }}
          >
            🎉 彩色测试页面
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            如果你能看到彩色，说明样式系统正常工作！
          </p>
        </div>

        {/* 卡片网格 */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          {/* 卡片1 */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              borderLeft: '4px solid #3b82f6'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>总对话数</h3>
              <div style={{ color: '#6b7280', fontSize: '1rem' }}>💬</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>12</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>所有活跃对话</div>
          </div>

          {/* 卡片2 */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              borderLeft: '4px solid #10b981'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>今日自动回复</h3>
              <div style={{ color: '#6b7280', fontSize: '1rem' }}>🤖</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>154</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>AI已发送消息</div>
          </div>

          {/* 卡片3 */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>24h 活跃线程</h3>
              <div style={{ color: '#6b7280', fontSize: '1rem' }}>⚡</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>8</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>最近活跃</div>
          </div>

          {/* 卡片4 */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              borderLeft: '4px solid #8b5cf6'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>平均响应时间</h3>
              <div style={{ color: '#6b7280', fontSize: '1rem' }}>⏱️</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>1.2s</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>系统延迟</div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* 左侧 */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💬 最近会话
            </h2>
            <div style={{ space: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>张三</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>+1234567890</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.875rem', color: '#374151' }}>5分钟前</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>15条消息</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>李四</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>+0987654321</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.875rem', color: '#374151' }}>10分钟前</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>8条消息</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 系统状态 */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚡ 系统状态
              </h2>
              <div style={{ space: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>WhatsApp 连接</span>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                    在线
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>AI 服务</span>
                  <span style={{ padding: '0.25rem 0.75rem', background: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500' }}>
                    正常
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>会话目录</span>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>5 个</span>
                </div>
              </div>
            </div>

            {/* 自动化日志 */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 自动化日志
              </h2>
              <div style={{ space: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#10b981', marginTop: '0.5rem' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>AI自动回复已发送</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>2分钟前</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#3b82f6', marginTop: '0.5rem' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>新对话已建立</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>5分钟前</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            style={{
              background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              transition: 'all 0.2s'
            }}
          >
            🎉 测试按钮 - 如果你看到这个，样式系统正常！
          </button>
        </div>
      </div>
    </div>
  );
}
