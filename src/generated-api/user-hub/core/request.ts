// src/lib/api/customRequest.ts
// 这个文件是 openapi-typescript-codegen 生成各服务 SDK 时使用的自定义请求模板。
// 它最终会被复制到每个 SDK 的 core/request.ts 文件中。
// 因此，它内部对 ./ApiError 等核心类型的相对路径导入，是相对于最终生成位置（core/目录）的。
// 直接在 src/lib/api/ 目录下查看此文件时，IDE 可能会对这些相对导入报错，这是正常现象。

/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import originalAxiosModule from 'axios';
import type { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance, CancelTokenSource } from 'axios';
const { CancelToken } = originalAxiosModule;

import FormData from 'form-data';

// 导入共享的、已配置好的 Axios 实例。
// 此路径是相对于最终生成的 core/request.ts 文件的位置。
import customAxiosInstance from '../../../lib/api/request';

// 从与最终生成的 request.ts 同级的 core/ 目录中导入必要的类型和类。
import { ApiError } from './ApiError';
import type { ApiRequestOptions } from './ApiRequestOptions';
import type { ApiResult } from './ApiResult';
import { CancelablePromise } from './CancelablePromise';
import type { OnCancel } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI'; // 这个 OpenAPIConfig 是指每个 SDK 的 core/OpenAPI.ts 中定义的类型和对象

// --- 辅助函数区域 ---
// 这些辅助函数由 openapi-typescript-codegen 默认提供，用于处理请求构建的各个方面。

export const isDefined = <T>(value: T | null | undefined): value is Exclude<T, null | undefined> => {
    return value !== undefined && value !== null;
};

export const isString = (value: any): value is string => typeof value === 'string';

export const isStringWithValue = (value: any): value is string => isString(value) && value !== '';

export const isBlob = (value: any): value is Blob =>
    typeof value === 'object' &&
    typeof value.type === 'string' &&
    typeof value.stream === 'function' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.constructor === 'function' &&
    typeof value.constructor.name === 'string' &&
    /^(Blob|File)$/.test(value.constructor.name) &&
    /^(Blob|File)$/.test(value[Symbol.toStringTag]);

export const isFormData = (value: any): value is FormData => value instanceof FormData;

export const isSuccess = (status: number): boolean => status >= 200 && status < 300;

export const base64 = (str: string): string => {
    try { return btoa(str); }
    catch (err) { return Buffer.from(str).toString('base64'); }
};

export const getQueryString = (params: Record<string, any>): string => {
    const qs: string[] = [];
    const append = (key: string, value: any) => qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    const process = (key: string, value: any) => {
        if (isDefined(value)) {
            if (Array.isArray(value)) value.forEach(v => process(key, v));
            else if (typeof value === 'object') Object.entries(value).forEach(([k, v]) => process(`${key}[${k}]`, v));
            else append(key, value);
        }
    };
    Object.entries(params).forEach(([key, value]) => process(key, value));
    return qs.length > 0 ? `?${qs.join('&')}` : '';
};

/**
 * 构建完整的请求 URL。
 * @param config 当前服务 SDK 的 OpenAPI 配置对象 (包含 BASE URL, VERSION 等)。
 * @param options API 请求选项 (包含从 Swagger/OpenAPI 定义中提取的相对路径 options.url)。
 * @returns 拼接好的完整请求 URL。
 */
const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
    // 开发环境下可以保留少量关键日志，生产环境应移除或使用日志级别控制
    if (process.env.NODE_ENV === 'development') {
        // console.log('[CustomRequest:getUrl] 使用的 OpenAPI.BASE:', config.BASE);
        // console.log('[CustomRequest:getUrl] Swagger 中的原始路径 (options.url):', options.url);
    }

    if (typeof config.BASE !== 'string' || config.BASE.trim() === '') {
        console.error('[CustomRequest:getUrl] 严重错误: OpenAPI 配置中的 BASE URL 无效或为空!', config.BASE, '请求的 options.url:', options.url);
        // 实际项目中，这里应该抛出错误或返回一个可识别的错误URL，以便上游能捕获
        // throw new Error(`[CustomRequest:getUrl] OpenAPI BASE configuration is missing or invalid for options.url: ${options.url}`);
    }
    if (typeof options.url !== 'string') {
        console.error('[CustomRequest:getUrl] 严重错误: options.url (来自Swagger的路径) 不是一个字符串!', options.url);
        // throw new Error(`[CustomRequest:getUrl] options.url is invalid for config.BASE: ${config.BASE}`);
    }

    const encoder = config.ENCODE_PATH || encodeURI;
    // options.url 现在应该是包含完整服务前缀的路径，例如 "/api/v1/user-hub/account/login"
    const path = options.url
        .replace('{api-version}', config.VERSION) // 替换路径中的 {api-version} 占位符
        .replace(/{(.*?)}/g, (substring: string, group: string) => { // 替换路径参数，如 {userID}
            const pathParam = options.path?.[group];
            return typeof pathParam !== 'undefined' ? encoder(String(pathParam)) : substring;
        });

    // 拼接规则：config.BASE (例如 "http://localhost:8080") + path (例如 "/api/v1/user-hub/users")
    const finalUrl = `${config.BASE}${path}`;

    if (process.env.NODE_ENV === 'development') {
        // console.log('[CustomRequest:getUrl] 最终构建的 URL:', finalUrl);
    }
    return options.query ? `${finalUrl}${getQueryString(options.query)}` : finalUrl;
};

export const getFormData = (options: ApiRequestOptions): FormData | undefined => {
    if (options.formData) {
        const formData = new FormData();
        const process = (key: string, value: any) => {
            if (isString(value) || isBlob(value)) formData.append(key, value);
            else formData.append(key, JSON.stringify(value));
        };
        Object.entries(options.formData)
            .filter(([_, value]) => isDefined(value))
            .forEach(([key, value]) => {
                if (Array.isArray(value)) value.forEach(v => process(key, v));
                else process(key, value);
            });
        return formData;
    }
    return undefined;
};

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;

export const resolve = async <T>(options: ApiRequestOptions, resolver?: T | Resolver<T>): Promise<T | undefined> => {
    if (typeof resolver === 'function') return (resolver as Resolver<T>)(options);
    return resolver;
};

/**
 * 构建请求头部。
 * 会合并来自 OpenAPI 配置的通用头部、options 中指定的特定请求头部以及 FormData 的头部。
 * 认证令牌 (Bearer Token) 也会在此处根据 OpenAPI 配置中的 TOKEN 添加。
 */
export const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions, formData?: FormData): Promise<Record<string, string>> => {
    const [token, username, password, additionalHeadersFromConfig] = await Promise.all([
        resolve(options, config.TOKEN),
        resolve(options, config.USERNAME), // 用于 Basic Auth (如果配置)
        resolve(options, config.PASSWORD), // 用于 Basic Auth (如果配置)
        resolve(options, config.HEADERS),  // 来自 OpenAPI.HEADERS (在 apiClientConfig.ts 中设置)
    ]);

    const formHeaders = typeof formData?.getHeaders === 'function' ? formData.getHeaders() : {};

    const headers = Object.entries({
        Accept: 'application/json', // 默认接受 JSON 响应
        ...(additionalHeadersFromConfig || {}),
        ...(options.headers || {}), // 特定于此请求的头部 (来自生成的服务方法参数)
        ...formHeaders, // FormData 相关的头部 (例如 Content-Type: multipart/form-data)
    })
        .filter(([_, value]) => isDefined(value))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {} as Record<string, string>);

    if (isStringWithValue(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (isStringWithValue(username) && isStringWithValue(password)) {
        const credentials = base64(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    // 设置 Content-Type (如果 options.body 存在且未被 FormData 头部覆盖)
    if (options.body !== undefined && !headers['Content-Type']?.includes('multipart/form-data')) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        } else if (isBlob(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        } else if (isString(options.body)) {
            headers['Content-Type'] = 'text/plain';
        } else if (!isFormData(options.body)) { // 如果不是 FormData，且没有指定 mediaType，则默认为 JSON
            headers['Content-Type'] = 'application/json';
        }
    }
    return headers;
};

export const getRequestBody = (options: ApiRequestOptions): any => options.body;

/**
 * 内部函数，实际使用 Axios 实例发送请求。
 */
const sendRequestInternal = async <T>(
    config: OpenAPIConfig, // 当前 SDK 的 OpenAPI 配置对象
    _options: ApiRequestOptions, // 请求的原始选项
    url: string, // 最终构建的请求 URL
    body: any,
    formData: FormData | undefined,
    headers: Record<string, string>,
    onCancel: OnCancel,
    axiosClient: AxiosInstance, // 共享的 customAxiosInstance
    method: ApiRequestOptions['method']
): Promise<AxiosResponse<T>> => {
    const source: CancelTokenSource = CancelToken.source();

    // 从传入的特定 SDK 的 OpenAPI 配置对象中读取 WITH_CREDENTIALS
    const requestConfig: AxiosRequestConfig = {
        url,
        headers,
        data: body ?? formData,
        method,
        withCredentials: config.WITH_CREDENTIALS,
        cancelToken: source.token,
    };

    if (process.env.NODE_ENV === 'development') {
        // console.log('[CustomRequest:sendRequestInternal] 准备发送的 Axios 请求配置:', JSON.stringify(requestConfig, null, 2));
    }

    onCancel(() => source.cancel('用户中止了请求 (The user aborted a request).'));

    try {
        return await axiosClient.request(requestConfig); // 使用共享的 customAxiosInstance
    }
    catch (error) {
        const axiosError = error as AxiosError<T>;
        // 错误已在 axiosInstance 的响应拦截器中记录，这里可以只处理特定于此模板的逻辑（如果需要）
        // console.error('[CustomRequest:sendRequestInternal] Axios 请求原始错误:', error);
        if (axiosError.response) {
            // console.error('[CustomRequest:sendRequestInternal] Axios 错误响应数据:', JSON.stringify(axiosError.response.data));
        }
        throw error; // 将错误（可能已被拦截器包装）继续抛出
    }
};

export const getResponseHeader = (response: AxiosResponse<any>, responseHeader?: string): string | undefined => {
    if (responseHeader) {
        const content = response.headers[responseHeader];
        if (isString(content)) return content;
    }
    return undefined;
};

export const getResponseBody = (response: AxiosResponse<any>): any => {
    if (response.status !== 204) return response.data; // 204 No Content 通常没有响应体
    return undefined;
};

/**
 * 根据 HTTP 状态码检查是否为 API 定义的特定错误类型。
 * 如果是，则抛出 ApiError。
 */
export const catchErrorCodes = (options: ApiRequestOptions, result: ApiResult): void => {
    const errors: Record<number, string> = {
        400: '错误的请求 (Bad Request)',
        401: '未授权 (Unauthorized)',
        403: '禁止访问 (Forbidden)',
        404: '未找到资源 (Not Found)',
        500: '服务器内部错误 (Internal Server Error)',
        502: '错误的网关 (Bad Gateway)',
        503: '服务不可用 (Service Unavailable)',
        ...(options.errors || {}), // 合并 API 定义中特定的错误码描述
    };
    const error = errors[result.status];
    if (error) { // 如果状态码在预定义的错误中
        throw new ApiError(options, result, error);
    }
    if (!result.ok) { // 对于其他非成功状态码 (不在 errors 中定义)
        const errorStatus = result.status ?? '未知状态';
        const errorStatusText = result.statusText ?? '未知状态文本';
        const errorBody = (() => { try { return JSON.stringify(result.body, null, 2); } catch (e) { return undefined; } })();
        throw new ApiError(options, result, `通用错误: 状态码: ${errorStatus}; 状态文本: ${errorStatusText}; 响应体: ${errorBody}`);
    }
};
// --- 辅助函数区域结束 ---

/**
 * API 请求的核心函数。
 * 此函数由 openapi-typescript-codegen 生成的各个服务方法调用。
 * @param config 当前服务 SDK 的 OpenAPI 配置对象 (在 apiClientConfig.ts 中初始化)。
 * @param options API 请求的详细选项 (方法、URL路径、参数、请求体等)。
 * @returns 一个 CancelablePromise，解析为 API 响应体。
 */
export const request = <T>(
    config: OpenAPIConfig,
    options: ApiRequestOptions
): CancelablePromise<T> => {
    return new CancelablePromise<T>(async (
        resolveRequest: (value: T | PromiseLike<T>) => void,
        rejectRequest: (reason?: any) => void,
        onCancel: OnCancel
    ) => {
        // 开发环境下可以保留少量关键日志
        if (process.env.NODE_ENV === 'development') {
            // console.log('[CustomRequest:request_fn_entry] API 请求发起。传入的 options:', JSON.stringify(options, null, 0));
            // console.log('[CustomRequest:request_fn_entry] 使用的 OpenAPI 配置 (config):', JSON.stringify(config, null, 0));
            // console.log('[CustomRequest:request_fn_entry] 使用的 config.BASE:', config.BASE);
            // console.log('[CustomRequest:request_fn_entry] 使用的 config.TOKEN:', config.TOKEN ? "存在" : "不存在");
        }

        try {
            const url = getUrl(config, options);
            const formData = getFormData(options);
            const body = getRequestBody(options);
            const headers = await getHeaders(config, options, formData);

            if (!onCancel.isCancelled) {
                const response = await sendRequestInternal<T>(
                    config, options, url, body, formData, headers,
                    onCancel, customAxiosInstance, options.method
                );
                const responseBody = getResponseBody(response);
                const responseHeader = getResponseHeader(response, options.responseHeader);
                const result: ApiResult = {
                    url,
                    ok: isSuccess(response.status),
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };
                catchErrorCodes(options, result); // 如果是错误状态码，这里会抛出 ApiError
                resolveRequest(result.body);
            }
        } catch (error) {
            // 错误已在 sendRequestInternal 或 axios 拦截器中记录
            // console.error('[CustomRequest:request_fn_entry] 请求Promise中捕获到错误:', error);
            rejectRequest(error);
        }
    });
};
