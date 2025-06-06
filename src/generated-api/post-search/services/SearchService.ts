/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_SwaggerSearchResultResponse } from '../models/models_SwaggerSearchResultResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SearchService {
    /**
     * 搜索帖子
     * 根据关键词、分页、排序等条件搜索帖子列表
     * @returns models_SwaggerSearchResultResponse 搜索成功，返回匹配的帖子列表及分页信息。
     * @throws ApiError
     */
    public static getApiV1SearchSearch({
        q,
        page = 1,
        size = 10,
        sortBy = 'updated_at',
        sortOrder = 'desc',
    }: {
        /**
         * 搜索关键词
         */
        q?: string,
        /**
         * 页码 (从1开始)
         */
        page?: number,
        /**
         * 每页数量
         */
        size?: number,
        /**
         * 排序字段 (例如: updated_at, view_count, _score)
         */
        sortBy?: string,
        /**
         * 排序顺序 (asc 或 desc)
         */
        sortOrder?: 'asc' | 'desc',
    }): CancelablePromise<models_SwaggerSearchResultResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/search/search',
            query: {
                'q': q,
                'page': page,
                'size': size,
                'sort_by': sortBy,
                'sort_order': sortOrder,
            },
            errors: {
                400: `请求参数无效，例如页码超出范围或排序字段不支持。`,
                500: `服务器内部错误，搜索服务遇到未预期的问题。`,
            },
        });
    }
}
