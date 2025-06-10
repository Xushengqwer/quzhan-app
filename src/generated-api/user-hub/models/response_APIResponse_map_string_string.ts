/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { map_string_string } from './map_string_string';
export type response_APIResponse_map_string_string = {
    /**
     * 响应状态码，0 表示成功，其他值表示错误
     */
    code?: number;
    /**
     * 响应数据，类型由 T 指定，若无数据则为 nil，且在 JSON 中省略
     */
    data?: map_string_string;
    /**
     * 可选的响应消息，若为空则不输出
     */
    message?: string;
};

