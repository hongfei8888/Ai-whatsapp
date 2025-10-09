/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 部署 - 使用默认 SSR/ISR 模式（不是静态导出）
  // output: 'export', // 注释掉，使用 Vercel 的动态功能
  
  reactStrictMode: true,
  
  // 图片配置 - Vercel 支持图片优化
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // 环境变量配置（从 Vercel 环境变量读取）
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'WhatsApp AI Automation',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  
  // 构建优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 禁用类型检查以加快构建
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 禁用ESLint检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig

