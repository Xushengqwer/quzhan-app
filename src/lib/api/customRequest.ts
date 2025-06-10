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
// 注意：此处的路径错误是预期的，因为这是一个模板文件。
import customAxiosInstance from '../../../lib/api/request';

// 从与最终生成的 request.ts 同级的 core/ 目录中导入必要的类型和类。
import { ApiError } from './ApiError';
import type { ApiRequestOptions } from './ApiRequestOptions';
import type { ApiResult } from './ApiResult';
import { CancelablePromise } from './CancelablePromise';
import type { OnCancel } from './CancelablePromise';
import type { OpenAPIConfig } from './OpenAPI';

// --- 辅助函数区域 ---

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

const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
    if (typeof config.BASE !== 'string' || config.BASE.trim() === '') {
        console.error('[CustomRequest:getUrl] 严重错误: OpenAPI 配置中的 BASE URL 无效或为空!', config.BASE, '请求的 options.url:', options.url);
    }
    if (typeof options.url !== 'string') {
        console.error('[CustomRequest:getUrl] 严重错误: options.url (来自Swagger的路径) 不是一个字符串!', options.url);
    }

    const encoder = config.ENCODE_PATH || encodeURI;
    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring: string, group: string) => {
            const pathParam = options.path?.[group];
            return typeof pathParam !== 'undefined' ? encoder(String(pathParam)) : substring;
        });

    const finalUrl = `${config.BASE}${path}`;
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

export const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions, formData?: FormData): Promise<Record<string, string>> => {
    const [token, username, password, additionalHeadersFromConfig] = await Promise.all([
        resolve(options, config.TOKEN),
        resolve(options, config.USERNAME),
        resolve(options, config.PASSWORD),
        resolve(options, config.HEADERS),
    ]);

    const formHeaders = typeof formData?.getHeaders === 'function' ? formData.getHeaders() : {};

    const headers = Object.entries({
        Accept: 'application/json',
        ...(additionalHeadersFromConfig || {}),
        ...(options.headers || {}),
        ...formHeaders,
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

    if (options.body !== undefined && !headers['Content-Type']?.includes('multipart/form-data')) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        } else if (isBlob(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        } else if (isString(options.body)) {
            headers['Content-Type'] = 'text/plain';
        } else if (!isFormData(options.body)) {
            headers['Content-Type'] = 'application/json';
        }
    }
    return headers;
};

export const getRequestBody = (options: ApiRequestOptions): any => options.body;

const sendRequestInternal = async <T>(
    config: OpenAPIConfig,
    _options: ApiRequestOptions,
    url: string,
    body: any,
    formData: FormData | undefined,
    headers: Record<string, string>,
    onCancel: OnCancel,
    axiosClient: AxiosInstance,
    method: ApiRequestOptions['method']
): Promise<AxiosResponse<T>> => {
    const source: CancelTokenSource = CancelToken.source();

    const requestConfig: AxiosRequestConfig = {
        url,
        headers,
        data: body ?? formData,
        method,
        withCredentials: config.WITH_CREDENTIALS,
        cancelToken: source.token,
    };

    onCancel(() => source.cancel('用户中止了请求 (The user aborted a request).'));

    try {
        return await axiosClient.request(requestConfig);
    }
    catch (error) {
        throw error;
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
    if (response.status !== 204) return response.data;
    return undefined;
};

export const catchErrorCodes = (options: ApiRequestOptions, result: ApiResult): void => {
    const errors: Record<number, string> = {
        400: '错误的请求 (Bad Request)',
        401: '未授权 (Unauthorized)',
        403: '禁止访问 (Forbidden)',
        404: '未找到资源 (Not Found)',
        500: '服务器内部错误 (Internal Server Error)',
        502: '错误的网关 (Bad Gateway)',
        503: '服务不可用 (Service Unavailable)',
        ...(options.errors || {}),
    };
    const error = errors[result.status];
    if (error) {
        throw new ApiError(options, result, error);
    }
    if (!result.ok) {
        const errorStatus = result.status ?? '未知状态';
        const errorStatusText = result.statusText ?? '未知状态文本';
        const errorBody = (() => { try { return JSON.stringify(result.body, null, 2); } catch (e) { return undefined; } })();
        throw new ApiError(options, result, `通用错误: 状态码: ${errorStatus}; 状态文本: ${errorStatusText}; 响应体: ${errorBody}`);
    }
};

export const request = <T>(
    config: OpenAPIConfig,
    options: ApiRequestOptions
): CancelablePromise<T> => {
    return new CancelablePromise<T>(async (
        resolveRequest: (value: T | PromiseLike<T>) => void,
        rejectRequest: (reason?: any) => void,
        onCancel: OnCancel
    ) => {
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
                catchErrorCodes(options, result);
                resolveRequest(result.body);
            }
        } catch (error) {
            rejectRequest(error);
        }
    });
};
