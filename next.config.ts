// frontend/doer_hub/next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
    // ... 其他 images 配置 ...
    images: {
        remotePatterns: [
            // ...
        ],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    experimental: {
        // ...
    },
    webpack: (
        config: WebpackConfiguration,
        // 将 isServer 重命名为 _isServer
        { isServer: _isServer }: { isServer: boolean; }
    ) => {
        // 你项目中已有的 webpack 配置
        return config;
    },
    // ...
};

export default nextConfig;