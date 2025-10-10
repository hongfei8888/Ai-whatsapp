/** @type {import('next').NextConfig} */
const nextConfig = {
  // 注释掉静态导出配置以支持动态路由
  // output: 'export',
  trailingSlash: true,
  
  reactStrictMode: true,
  
  // 图片配置 - 静态导出需要禁用优化
  images: {
    unoptimized: true,
    domains: [],
  },
  
  // 不设置 assetPrefix 和 basePath，让 Next.js 使用默认相对路径
  // assetPrefix: undefined,  // 不设置，使用默认
  // basePath: '',
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
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
}

module.exports = nextConfig