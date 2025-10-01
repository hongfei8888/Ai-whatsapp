/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 确保API路由使用Node.js运行时
  serverExternalPackages: [],
  
  // 图片域名配置（如果需要）
  images: {
    domains: [],
  },
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  
  // 构建优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 输出文件追踪根目录
  outputFileTracingRoot: undefined,
}

module.exports = nextConfig