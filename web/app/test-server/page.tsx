'use client';

import { useEffect, useState } from 'react';

export default function TestServerPage() {
  const [frontendStatus, setFrontendStatus] = useState('检测中...');
  const [backendStatus, setBackendStatus] = useState('检测中...');
  const [apiStatus, setApiStatus] = useState('检测中...');

  useEffect(() => {
    setFrontendStatus('✅ 前端服务正常 (Next.js)');

    // 测试后端连接
    fetch('http://localhost:4000/status')
      .then(res => {
        if (res.ok) {
          setBackendStatus('✅ 后端服务正常 (Fastify)');
          return res.json();
        } else {
          setBackendStatus(`❌ 后端响应错误: ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
      })
      .then(data => {
        setApiStatus(`✅ API正常 - 在线: ${data.online ? '是' : '否'}, 联系人: ${data.contactCount || 0}`);
      })
      .catch(err => {
        setBackendStatus('❌ 后端连接失败');
        setApiStatus(`❌ API错误: ${err.message}`);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🔧 服务器状态检测
        </h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">前端服务</h2>
            <p className="text-lg">{frontendStatus}</p>
            <p className="text-sm text-gray-600">地址: http://localhost:3000 或 http://localhost:3001</p>
          </div>
          
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">后端服务</h2>
            <p className="text-lg">{backendStatus}</p>
            <p className="text-sm text-gray-600">地址: http://localhost:4000</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">API状态</h2>
            <p className="text-lg">{apiStatus}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/dashboard" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
