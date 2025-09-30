'use client';

import { useState } from 'react';
import QRCodeDialog from '@/components/QRCodeDialog';

export default function TestQRPage() {
  const [showDialog, setShowDialog] = useState(false);

  const handleSuccess = () => {
    console.log('登录成功！');
    alert('登录成功！');
  };

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>二维码对话框测试</h1>
      <button 
        onClick={() => setShowDialog(true)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        测试二维码对话框
      </button>

      <QRCodeDialog 
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
