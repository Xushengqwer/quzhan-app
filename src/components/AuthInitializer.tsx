// src/components/AuthInitializer.tsx
"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
// 不再需要从 '@/generated-api' 导入 OpenAPI，因为每个服务SDK有自己的OpenAPI对象，
// 它们的配置（包括TOKEN）由 apiClientConfig.ts 和 userStore.ts 内部逻辑（如loadUserInfo）处理。
// getAccessToken 仍然可以用于例如在非store场景下检查本地是否存在token，但在此文件中不再直接使用。

export default function AuthInitializer() {
    useEffect(() => {
        const initializeAuth = async () => {
            // 从 store 获取 initialized 状态和 loadUserInfo action
            const { initialized, loadUserInfo, setInitialized } = useUserStore.getState();

            if (!initialized) {
                console.log("[AuthInitializer] Auth state not initialized, starting initialization process...");

                // loadUserInfo 内部会:
                // 1. 尝试获取 token (从 localStorage 或 store)。
                // 2. 使用由 ApiClientInitializer 配置好的、对应 user-hub 服务的 OpenAPI 对象进行 API 调用。
                //    (ApiClientInitializer 应该已经为所有服务的 OpenAPI 对象设置了正确的 GATEWAY_BASE_URL 和通用 HEADERS)
                //    (loadUserInfo 内部在调用 UserManagementService.getUsers 前，应确保 UserHubOpenAPI.TOKEN 已同步)
                // 3. 在完成后更新 initialized 状态。
                await loadUserInfo();

                // 再次检查 initialized 状态，确保 loadUserInfo (或其分支) 正确设置了它。
                // 如果 loadUserInfo 的某些执行路径可能没有设置 initialized，这里可以作为保障。
                if (!useUserStore.getState().initialized) {
                    console.warn("[AuthInitializer] initialized was still false after loadUserInfo, explicitly setting to true.");
                    setInitialized(true);
                }
                console.log("[AuthInitializer] Initialization process finished. Current initialized state:", useUserStore.getState().initialized);
            } else {
                console.log("[AuthInitializer] Auth state already initialized, skipping.");
            }
        };

        // 确保这个逻辑只在客户端执行一次
        if (typeof window !== "undefined") {
            initializeAuth();
        }

    }, []); // 空依赖数组确保此 effect 只在组件挂载后运行一次

    return null; // 此组件不渲染任何 UI
}