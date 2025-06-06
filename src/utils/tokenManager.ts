// src/utils/tokenManager.ts
// import axiosInstance from '../lib/request'; // 注意：如果需要从 request.ts 导入，路径可能需要调整

// 为了避免循环依赖 (例如 request.ts 依赖 tokenManager.ts, tokenManager.ts 又依赖 request.ts 中的 axiosInstance)
// 刷新 token 的请求最好使用一个独立的、轻量级的 axios 实例，或者直接使用 fetch。
// 更好的做法是在 request.ts 中导出原始的 axiosInstance，或者创建一个新的实例专门用于刷新。

const ACCESS_TOKEN_KEY = 'accessToken';

/**
 * 获取存储的 Access Token
 * @returns Access Token 字符串或 null
 */
export const getAccessToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
};

/**
 * 存储 Access Token
 * @param token Access Token 字符串
 */
export const setAccessToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
};

/**
 * 移除存储的 Access Token
 */
export const removeAccessToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
};

/**
 * 清除所有认证相关的数据 (目前仅 Access Token)
 */
export const clearAuthData = (): void => {
    removeAccessToken();
    // 如果还有其他用户相关信息存储在 localStorage，也一并清除
    // localStorage.removeItem('userData');
    console.log('Authentication data cleared.');
};


