// src/components/auth/withAuth.tsx
"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore'; // 假设 User 类型也从这里导出或按需导入
// MODIFIED: 从 user-hub 导入 enums_UserRole 和 User 类型
import type { enums_UserRole, vo_UserWithProfileVO as User } from '@/generated-api/user-hub';
import { LOGIN_REDIRECT_PATH, UNAUTHORIZED_REDIRECT_PATH } from '@/config/authConfig';

// 定义 HOC 的选项接口
interface WithAuthOptions {
    allowedRoles: enums_UserRole[]; // 允许访问此组件的角色列表
    LoadingComponent?: React.ComponentType; // 可选的加载状态组件
    UnauthorizedComponent?: React.ComponentType; // 可选的未授权时显示的组件（在重定向前）
}

const withAuth = <P extends object>( // P 代表被包裹组件的 props 类型
    WrappedComponent: React.ComponentType<P>,
    options: WithAuthOptions
) => {
    const ComponentWithAuth = (props: P) => {
        const router = useRouter();
        const pathname = usePathname(); // 获取当前路径，用于可能的重定向后返回

        // MODIFIED: 使用 selector 函数从 store 中获取状态
        const isLoading = useUserStore((state) => !state.initialized); // isLoading 可以视为 initialized 的反面
        const currentUser = useUserStore((state) => state.user as User | null); // 类型断言，因为 store 中 user 可以是 User | null
        const token = useUserStore((state) => state.token);
        const isAuthenticated = !!currentUser && !!token; // 根据 currentUser 和 token 判断是否认证

        const { allowedRoles, LoadingComponent, UnauthorizedComponent } = options;

        useEffect(() => {
            console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): Effect triggered. Path: ${pathname}`);
            console.log(`withAuth: Current Store State - isLoading (from !initialized): ${isLoading}, isAuthenticated: ${isAuthenticated}, user:`, currentUser);

            if (isLoading) {
                console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): Auth state not initialized yet.`);
                return;
            }

            if (!isAuthenticated) {
                console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): User not authenticated. Redirecting to ${LOGIN_REDIRECT_PATH}.`);
                router.replace(`${LOGIN_REDIRECT_PATH}?redirect=${encodeURIComponent(pathname)}`);
                return;
            }

            // 用户已认证，检查角色权限
            if (currentUser && typeof currentUser.role !== 'undefined') {
                console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): User authenticated. Role: ${currentUser.role}. Allowed roles: [${allowedRoles.join(', ')}]`);
                if (!allowedRoles.includes(currentUser.role)) {
                    console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): User role ${currentUser.role} NOT in allowed roles. Redirecting to ${UNAUTHORIZED_REDIRECT_PATH}.`);
                    router.replace(UNAUTHORIZED_REDIRECT_PATH);
                } else {
                    console.log(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): User role ${currentUser.role} IS in allowed roles. Access granted.`);
                }
            } else {
                // 如果 isAuthenticated 为 true，但 currentUser 或 currentUser.role 未定义
                // 这通常不应该发生，除非 token 存在但用户信息加载失败
                console.error(`withAuth (${WrappedComponent.displayName || WrappedComponent.name}): User is considered authenticated (token exists) but currentUser is null or role is undefined. This might indicate an issue with user info fetching. CurrentUser:`, currentUser);
                // 决定要重定向到错误页还是登录页，取决于业务逻辑
                // 如果 token 有效但用户信息缺失，可能需要尝试重新加载用户信息或直接视为未授权
                router.replace(LOGIN_REDIRECT_PATH); // 或者 UNAUTHORIZED_REDIRECT_PATH
            }
        }, [isAuthenticated, currentUser, isLoading, router, allowedRoles, pathname]);

        // 根据状态决定渲染内容
        if (isLoading) {
            return LoadingComponent ? <LoadingComponent /> : <div>正在加载认证状态...</div>;
        }

        if (!isAuthenticated) {
            // 正在重定向到登录页
            return LoadingComponent ? <LoadingComponent /> : <div>正在重定向到登录页...</div>;
        }

        // 检查角色权限 (在useEffect重定向前，可能会短暂显示这个)
        if (currentUser && typeof currentUser.role !== 'undefined' && !allowedRoles.includes(currentUser.role)) {
            // 角色不匹配，正在重定向到未授权页
            return UnauthorizedComponent ? <UnauthorizedComponent /> : <div>权限不足，正在重定向...</div>;
        }

        // 权限检查通过，或者正在等待 useEffect 中的重定向逻辑执行
        if (isAuthenticated && currentUser && typeof currentUser.role !== 'undefined' && allowedRoles.includes(currentUser.role)) {
            return <WrappedComponent {...props} />;
        }

        // 默认情况下，如果上述条件都不满足（例如，在重定向前），可以返回一个加载占位符或null
        return <div>正在验证访问权限...</div>;
    };

    // 设置 HOC 的 displayName，便于在 React DevTools 中调试
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    ComponentWithAuth.displayName = `withAuth(${displayName})`;

    return ComponentWithAuth;
};

export default withAuth;
