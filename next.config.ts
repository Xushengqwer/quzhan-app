// frontend/doer_hub/next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            // 解决方案：添加此配置块以允许来自 placehold.co 的图片
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            {
                protocol: 'https',
                hostname: 'doer-user-hub-1258994983.cos.ap-guangzhou.myqcloud.com',
            },
            {
                protocol: 'https',
                hostname: 'doer-post-detail-1258994983.cos.ap-guangzhou.myqcloud.com',
            },
        ],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    experimental: {
        // 您项目中已有的 experimental 配置
    },
    webpack: (
        config: WebpackConfiguration,
        { isServer: _isServer }: { isServer: boolean; /* 其他 Next.js Webpack 上下文属性 */ }
    ) => {
        // 您项目中已有的 webpack 配置
        return config;
    },
    // ... 其他你已有的配置
};

export default nextConfig;