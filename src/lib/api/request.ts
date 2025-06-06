// src/lib/api/request.ts
import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';

// 使用路径别名导入所有服务的 OpenAPI 配置
import { OpenAPI as UserHubOpenAPI } from '@/generated-api/user-hub/core/OpenAPI';
import { OpenAPI as PostServiceOpenAPI } from '@/generated-api/post-service/core/OpenAPI';
import { OpenAPI as PostSearchOpenAPI } from '@/generated-api/post-search/core/OpenAPI';

// 使用路径别名导入令牌刷新所需的服务和类型
import { AuthManagementService } from '@/generated-api/user-hub/services/AuthManagementService';
import type { docs_SwaggerAPITokenPairResponse } from '@/generated-api/user-hub/models/docs_SwaggerAPITokenPairResponse';

import { getAccessToken, setAccessToken as storeNewAccessToken } from '@/utils/tokenManager';
import { useUserStore } from '@/store/userStore';
import { LOGIN_REDIRECT_PATH } from '@/config/authConfig';


/**
 * API 网关的统一基础 URL。
 * 从环境变量 `NEXT_PUBLIC_GATEWAY_HOST_AND_PORT` 读取，如果未设置则使用默认值。
 */
const AXIOS_INSTANCE_DEFAULT_BASE_URL: string = process.env.NEXT_PUBLIC_GATEWAY_HOST_AND_PORT || 'http://localhost:8080';

/**
 * 创建一个全局共享的 Axios 实例。
 */
const axiosInstance: AxiosInstance = axios.create({
    baseURL: AXIOS_INSTANCE_DEFAULT_BASE_URL,
    timeout: 10000, // 10 秒
    withCredentials: true, // 对于发送/接收 cookie (如 http-only 刷新令牌) 至关重要
});

// --- 请求拦截器 ---
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> => {
        if (process.env.NODE_ENV === 'development') {
            // console.log(`[Axios 请求拦截器] 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
        }
        // 包含 Bearer token 的 Authorization 头通常由 openapi-typescript-codegen 使用的
        // `customRequest.ts` 模板添加，它会从相应的 OpenAPI.TOKEN 配置中读取 token。
        return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
        console.error('[Axios 请求拦截器] 请求错误:', error.message, error.config?.url);
        return Promise.reject(error);
    }
);

// --- 响应拦截器 ---

// 防止多个并发刷新尝试的标志。
let isCurrentlyRefreshingToken = false;
// 保存等待令牌刷新的请求的数组。
let tokenRefreshSubscribers: ((token: string | null) => void)[] = [];

const addTokenRefreshSubscriber = (callback: (token: string | null) => void) => {
    tokenRefreshSubscribers.push(callback);
};

const onTokenRefreshed = (newAccessToken: string | null) => {
    tokenRefreshSubscribers.forEach(callback => callback(newAccessToken));
    tokenRefreshSubscribers = [];
};


axiosInstance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
        if (process.env.NODE_ENV === 'development') {
            // console.log(`[Axios 响应拦截器] 收到响应: ${response.status} 来自 ${response.config.url}`);
        }
        return response;
    },
    async (error: AxiosError): Promise<AxiosError | AxiosResponse> => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });

        // 记录详细错误以供调试。
        console.error(
            `[Axios 响应拦截器] 响应错误: ${error.response?.status || '无响应状态'} - ${error.message}${originalRequest?.url ? ` - URL: ${originalRequest.url}` : ''}`
        );
        if (error.response?.data) {
            console.error('[Axios 响应拦截器] 错误响应数据:', JSON.stringify(error.response.data, null, 2));
        }

        // 用于保存标准化 API 错误信息的结构，包括我们的自定义业务代码。
        let apiErrorData: {
            status?: number; // HTTP 状态码
            message: string;
            data: any;
            url?: string;
            code?: number; // 后端返回的业务代码
            isAxiosInterceptorError?: boolean;
        } = {
            message: error.message || '请求期间发生未知错误。',
            data: null,
            isAxiosInterceptorError: true, // 标记此错误对象来自我们的拦截器
        };

        if (error.response) {
            // 错误来自服务器的响应 (例如, 4xx, 5xx)。
            apiErrorData = {
                ...apiErrorData,
                status: error.response.status,
                message: (error.response.data as any)?.message || error.message, // 优先使用后端消息
                data: error.response.data,
                url: originalRequest?.url,
                code: (error.response.data as any)?.code, // 提取业务代码
            };
        } else if (error.request) {
            // 请求已发出但未收到响应 (例如, 网络错误)。
            apiErrorData = {
                ...apiErrorData,
                message: '服务器无响应或网络连接问题。请稍后再试。',
                url: originalRequest?.url,
                status: -1, // 无响应/网络错误的自定义状态
            };
        } else {
            // 设置请求时发生错误。
            apiErrorData = {
                ...apiErrorData,
                message: error.message || '设置请求时发生错误。',
                status: -2, // 请求设置错误的自定义状态
            };
        }

        // 检查访问令牌过期的特定业务代码 (例如, 40102)
        // 同时确保 originalRequest 存在，以避免在 config 缺失时出错。
        if (apiErrorData.code === 40102 && originalRequest) {
            if (!isCurrentlyRefreshingToken) {
                isCurrentlyRefreshingToken = true;
                console.log('[Axios 响应拦截器] 访问令牌已过期 (业务代码 40102)。正在尝试刷新令牌...');

                try {
                    // 调用刷新令牌 API。
                    // 刷新令牌应位于 HttpOnly cookie 中并自动发送。
                    const refreshResponse = await AuthManagementService.postApiV1UserHubAuthRefreshToken({});
                    const refreshData = refreshResponse as docs_SwaggerAPITokenPairResponse;

                    if (refreshData.code === 0 && refreshData.data?.access_token) {
                        const newAccessToken = refreshData.data.access_token;
                        console.log('[Axios 响应拦截器] 令牌刷新成功。已获取新的访问令牌。');

                        // 1. 将新的访问令牌存储到 localStorage。
                        storeNewAccessToken(newAccessToken);

                        // 2. 使用新的令牌更新用户存储。
                        // 这会保留存储中现有的用户对象。
                        const currentUser = useUserStore.getState().user;
                        useUserStore.getState().setUserAndToken(currentUser, newAccessToken);

                        // 3. 更新原始失败请求的 Authorization 头。
                        if (originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        }

                        // 4. 通知所有订阅者 (排队的请求) 关于新令牌的信息。
                        onTokenRefreshed(newAccessToken);
                        isCurrentlyRefreshingToken = false;

                        // 5. 使用新的令牌重试原始请求。
                        console.log('[Axios 响应拦截器] 使用新令牌重试原始请求:', originalRequest.url);
                        return axiosInstance(originalRequest);
                    } else {
                        // 刷新失败。
                        console.error('[Axios 响应拦截器] 令牌刷新尝试失败，业务代码:', refreshData.code, '消息:', refreshData.message);
                        if (refreshData.code === 40103) { // 刷新令牌过期的特定业务代码
                            console.log('[Axios 响应拦截器] 刷新令牌已过期 (业务代码 40103)。正在清除会话并重定向到登录页。');
                            useUserStore.getState().clearUserSession(); // 清除本地会话
                            if (typeof window !== 'undefined') {
                                window.location.href = LOGIN_REDIRECT_PATH; // 重定向到登录页
                            }
                        }
                        onTokenRefreshed(null); // 通知订阅者刷新失败
                        isCurrentlyRefreshingToken = false;
                        // 传播来自刷新尝试的更具体的错误。
                        return Promise.reject({
                            ...apiErrorData,
                            message: `令牌刷新失败: ${refreshData.message || '令牌刷新期间发生未知错误'} (业务代码: ${refreshData.code})`,
                            code: refreshData.code,
                            status: refreshData.code === 40103 ? 401 : (apiErrorData.status || 500),
                        });
                    }
                } catch (refreshErr: any) {
                    console.error('[Axios 响应拦截器] 令牌刷新 API 调用期间发生严重错误:', refreshErr);
                    isCurrentlyRefreshingToken = false;
                    onTokenRefreshed(null);

                    const refreshErrorResponse = refreshErr.response?.data as any;
                    // 检查刷新错误本身是否表明刷新令牌已过期 (例如, 来自刷新端点的 HTTP 401 或特定业务代码)
                    if (refreshErr.status === 401 || refreshErrorResponse?.code === 40103) {
                        console.log('[Axios 响应拦截器] 根据刷新 API 错误判断刷新令牌似乎无效/已过期。正在清除会话并重定向。');
                        useUserStore.getState().clearUserSession();
                        if (typeof window !== 'undefined') {
                            window.location.href = LOGIN_REDIRECT_PATH;
                        }
                    }
                    // 使用来自刷新尝试的结构化错误拒绝。
                    return Promise.reject({
                        message: `令牌刷新过程严重失败: ${refreshErrorResponse?.message || refreshErr.message || '刷新 API 调用期间网络错误'}`,
                        code: refreshErrorResponse?.code,
                        status: refreshErr.status, // 来自刷新调用的 HTTP 状态
                        data: refreshErrorResponse,
                        originalErrorContext: apiErrorData, // 保留触发刷新的错误的上下文
                    });
                }
            } else {
                // 另一个请求已在刷新令牌，将此请求加入队列。
                console.log('[Axios 响应拦截器] 令牌刷新已在进行中，正在将请求加入队列:', originalRequest.url);
                return new Promise((resolve, reject) => {
                    addTokenRefreshSubscriber((newAccessToken: string | null) => {
                        if (newAccessToken && originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                            console.log('[Axios 响应拦截器] 使用新令牌重试已排队的请求:', originalRequest.url);
                            resolve(axiosInstance(originalRequest));
                        } else {
                            console.log('[Axios 响应拦截器] 令牌刷新失败，拒绝已排队的请求:', originalRequest.url);
                            reject(apiErrorData); // 使用导致排队的原始错误拒绝
                        }
                    });
                });
            }
        }

        // 如果不是 40102 错误，或者 originalRequest 未定义，
        // 则使用结构化的 API 错误数据拒绝。
        return Promise.reject(apiErrorData);
    }
);


/**
 * 初始化所有生成的 API 服务客户端的运行时配置。
 * 此函数应在应用程序客户端加载时调用一次。
 */
export function initializeApiClient(): void {
    console.log('[API 模块] Axios 默认的统一 API 网关 URL:', AXIOS_INSTANCE_DEFAULT_BASE_URL);
    console.log('[API 模块] 正在初始化 API 客户端配置...');

    const token: string | null = getAccessToken(); // 从 localStorage 获取令牌

    const commonHeaders: Record<string, string> = {
        'X-Platform': 'web',
    };

    const allApiConfigs: { name: string; config: any }[] = [
        { name: 'UserHub', config: UserHubOpenAPI },
        { name: 'PostService', config: PostServiceOpenAPI },
        { name: 'PostSearch', config: PostSearchOpenAPI },
    ];

    allApiConfigs.forEach(api => {
        if (!api.config) {
            console.error(`[API 模块] 严重错误: 服务 ${api.name} 的 OpenAPI 配置未定义。`);
            return;
        }
        api.config.BASE = AXIOS_INSTANCE_DEFAULT_BASE_URL;
        api.config.TOKEN = token === null ? undefined : token;
        api.config.HEADERS = { ...api.config.HEADERS, ...commonHeaders };

        if ('WITH_CREDENTIALS' in api.config) {
            (api.config as { WITH_CREDENTIALS?: boolean }).WITH_CREDENTIALS = true;
        } else {
            console.warn(`[API 模块] 服务 ${api.name}: 在 OpenAPI 配置中未找到 WITH_CREDENTIALS 属性。`);
        }

        if (process.env.NODE_ENV === 'development') {
            // console.log(
            //     `[API 模块] 服务 ${api.name} 已配置: ` +
            //     `BASE='${api.config.BASE}', ` +
            //     `Token=${api.config.TOKEN ? '存在' : '未设置'}, ` +
            //     `Headers=${JSON.stringify(api.config.HEADERS)}, ` +
            //     `WithCredentials=${(api.config as any).WITH_CREDENTIALS}`
            // );
        }
    });
    console.log('[API 模块] 所有 API 客户端配置已初始化。');
}

export default axiosInstance;
