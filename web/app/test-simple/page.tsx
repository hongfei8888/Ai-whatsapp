'use client';

import { useState } from 'react';

export default function TestSimplePage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>简单测试页面</h1>
      <p>如果你看到这个页面，说明基本的前端功能是正常的。</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        点击次数: {count}
      </button>
    </div>
  );
}
