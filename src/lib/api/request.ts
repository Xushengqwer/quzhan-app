// src/lib/api/request.ts
import axios, {
    AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';

// 使用路径别名导入所有服务的 OpenAPI 配置
import { OpenAPI as UserHubOpenAPI, type OpenAPIConfig as UserHubConfig } from '@/generated-api/user-hub/core/OpenAPI';
import { OpenAPI as PostServiceOpenAPI, type OpenAPIConfig as PostServiceConfig } from '@/generated-api/post-service/core/OpenAPI';
import { OpenAPI as PostSearchOpenAPI, type OpenAPIConfig as PostSearchConfig } from '@/generated-api/post-search/core/OpenAPI';


// 使用路径别名导入令牌刷新所需的服务和类型
import { AuthManagementService } from '@/generated-api/user-hub/services/AuthManagementService';
import type { docs_SwaggerAPITokenPairResponse } from '@/generated-api/user-hub/models/docs_SwaggerAPITokenPairResponse';

import { getAccessToken, setAccessToken as storeNewAccessToken } from '@/utils/tokenManager';
import { useUserStore } from '@/store/userStore';
import { LOGIN_REDIRECT_PATH } from '@/config/authConfig';

// *** 为后端错误响应定义一个通用接口 ***
interface ApiErrorPayload {
    message?: string;
    code?: number;
    data?: unknown;
}

/**
 * API 网关的统一基础 URL。
 */
const AXIOS_INSTANCE_DEFAULT_BASE_URL: string = process.env.NEXT_PUBLIC_GATEWAY_HOST_AND_PORT || 'http://localhost:8080';

/**
 * 创建一个全局共享的 Axios 实例。
 */
const axiosInstance: AxiosInstance = axios.create({
    baseURL: AXIOS_INSTANCE_DEFAULT_BASE_URL,
    timeout: 10000,
    withCredentials: true,
});

// --- 请求拦截器 ---
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // 开发时可取消注释进行调试
        // console.log(`[Axios 请求拦截器] 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
        console.error('[Axios 请求拦截器] 请求错误:', error.message, error.config?.url);
        return Promise.reject(error);
    }
);

// --- 响应拦截器 ---

let isCurrentlyRefreshingToken = false;
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
        return response;
    },
    async (error: AxiosError): Promise<AxiosError | AxiosResponse> => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });

        console.error(
            `[Axios 响应拦截器] 响应错误: ${error.response?.status || '无响应状态'} - ${error.message}${originalRequest?.url ? ` - URL: ${originalRequest.url}` : ''}`
        );
        if (error.response?.data) {
            console.error('[Axios 响应拦截器] 错误响应数据:', JSON.stringify(error.response.data, null, 2));
        }

        let apiErrorData: {
            status?: number;
            message: string;
            data: unknown;
            url?: string;
            code?: number;
            isAxiosInterceptorError?: boolean;
        } = {
            message: error.message || '请求期间发生未知错误。',
            data: null,
            isAxiosInterceptorError: true,
        };

        if (error.response) {
            const responseData = error.response.data as ApiErrorPayload;
            apiErrorData = {
                ...apiErrorData,
                status: error.response.status,
                message: responseData?.message || error.message,
                data: error.response.data,
                url: originalRequest?.url,
                code: responseData?.code,
            };
        } else if (error.request) {
            apiErrorData.message = '服务器无响应或网络连接问题。请稍后再试。';
            apiErrorData.url = originalRequest?.url;
            apiErrorData.status = -1;
        } else {
            apiErrorData.message = error.message || '设置请求时发生错误。';
            apiErrorData.status = -2;
        }

        //   ★★★★★   新增的核心逻辑：处理 40101 错误码   ★★★★★
        if (apiErrorData.code === 40101) {
            console.log('[Axios 响应拦截器] 收到缺少或不正确的令牌错误 (业务代码 40101)。正在清除会话并重定向到登录页。');
            useUserStore.getState().clearUserSession();
            if (typeof window !== 'undefined') {
                window.location.href = LOGIN_REDIRECT_PATH;
            }
            // 返回一个被拒绝的 Promise 来中断后续的错误处理
            return Promise.reject(apiErrorData);
        }

        if (apiErrorData.code === 40102 && originalRequest) {
            if (!isCurrentlyRefreshingToken) {
                isCurrentlyRefreshingToken = true;
                console.log('[Axios 响应拦截器] 访问令牌已过期 (业务代码 40102)。正在尝试刷新令牌...');

                try {
                    const refreshResponse = await AuthManagementService.postApiV1UserHubAuthRefreshToken({});
                    const refreshData = refreshResponse as docs_SwaggerAPITokenPairResponse;

                    if (refreshData.code === 0 && refreshData.data?.access_token) {
                        const newAccessToken = refreshData.data.access_token;
                        console.log('[Axios 响应拦截器] 令牌刷新成功。');

                        storeNewAccessToken(newAccessToken);
                        const currentUser = useUserStore.getState().user;
                        useUserStore.getState().setUserAndToken(currentUser, newAccessToken);

                        if (originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        }

                        onTokenRefreshed(newAccessToken);
                        isCurrentlyRefreshingToken = false;

                        return axiosInstance(originalRequest);
                    } else {
                        console.error('[Axios 响应拦截器] 令牌刷新尝试失败，业务代码:', refreshData.code, '消息:', refreshData.message);
                        if (refreshData.code === 40103) {
                            console.log('[Axios 响应拦截器] 刷新令牌已过期 (业务代码 40103)。正在清除会话并重定向到登录页。');
                            useUserStore.getState().clearUserSession();
                            if (typeof window !== 'undefined') {
                                window.location.href = LOGIN_REDIRECT_PATH;
                            }
                        }
                        onTokenRefreshed(null);
                        isCurrentlyRefreshingToken = false;
                        return Promise.reject({
                            ...apiErrorData,
                            message: `令牌刷新失败: ${refreshData.message || '令牌刷新期间发生未知错误'} (业务代码: ${refreshData.code})`,
                            code: refreshData.code,
                            status: refreshData.code === 40103 ? 401 : (apiErrorData.status || 500),
                        });
                    }
                } catch (refreshErr: unknown) {
                    console.error('[Axios 响应拦截器] 令牌刷新 API 调用期间发生严重错误:', refreshErr);
                    isCurrentlyRefreshingToken = false;
                    onTokenRefreshed(null);

                    const refreshErrorResponse = (refreshErr as AxiosError)?.response?.data as ApiErrorPayload | undefined;
                    const refreshErrorStatus = (refreshErr as AxiosError)?.response?.status;
                    const refreshErrorMessage = refreshErr instanceof Error ? refreshErr.message : '刷新 API 调用期间网络错误';

                    if (refreshErrorStatus === 401 || refreshErrorResponse?.code === 40103) {
                        console.log('[Axios 响应拦截器] 根据刷新 API 错误判断刷新令牌似乎无效/已过期。正在清除会话并重定向。');
                        useUserStore.getState().clearUserSession();
                        if (typeof window !== 'undefined') {
                            window.location.href = LOGIN_REDIRECT_PATH;
                        }
                    }
                    return Promise.reject({
                        message: `令牌刷新过程严重失败: ${refreshErrorResponse?.message || refreshErrorMessage}`,
                        code: refreshErrorResponse?.code,
                        status: refreshErrorStatus,
                        data: refreshErrorResponse,
                        originalErrorContext: apiErrorData,
                    });
                }
            } else {
                console.log('[Axios 响应拦截器] 令牌刷新已在进行中，正在将请求加入队列:', originalRequest.url);
                return new Promise((resolve, reject) => {
                    addTokenRefreshSubscriber((newAccessToken: string | null) => {
                        if (newAccessToken && originalRequest.headers) {
                            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                            resolve(axiosInstance(originalRequest));
                        } else {
                            reject(apiErrorData);
                        }
                    });
                });
            }
        }

        return Promise.reject(apiErrorData);
    }
);


/**
 * 初始化所有生成的 API 服务客户端的运行时配置。
 */
export function initializeApiClient(): void {
    console.log('[API 模块] Axios 默认的统一 API 网关 URL:', AXIOS_INSTANCE_DEFAULT_BASE_URL);
    console.log('[API 模块] 正在初始化 API 客户端配置...');

    const token: string | null = getAccessToken();

    const commonHeaders: Record<string, string> = {
        'X-Platform': 'web',
    };

    type ApiConfig = UserHubConfig | PostServiceConfig | PostSearchConfig;

    const allApiConfigs: { name: string; config: ApiConfig }[] = [
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
            api.config.WITH_CREDENTIALS = true;
        } else {
            console.warn(`[API 模块] 服务 ${api.name}: 在 OpenAPI 配置中未找到 WITH_CREDENTIALS 属性。`);
        }
    });
    console.log('[API 模块] 所有 API 客户端配置已初始化。');
}

export default axiosInstance;
