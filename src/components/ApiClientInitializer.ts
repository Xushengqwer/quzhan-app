// src/components/ApiClientInitializer.ts
"use client";

import { useEffect } from 'react';
// MODIFIED: 更新导入路径
import { initializeApiClient } from '@/lib/api/request'; // 之前是 @/lib/apiClientConfig

/**
 * 此组件的唯一目的是在应用程序客户端加载时调用一次 `initializeApiClient` 函数。
 * `initializeApiClient` 负责配置所有 API 服务客户端的运行时参数。
 * 它不渲染任何 UI。
 */
export default function ApiClientInitializer() {
    useEffect(() => {
        initializeApiClient();
        // console.log('[ApiClientInitializer] initializeApiClient has been called.'); // 可以保留或移除此日志
    }, []); // 空依赖数组确保只在组件挂载后运行一次

    return null; // 此组件不渲染任何可见的UI元素
}
