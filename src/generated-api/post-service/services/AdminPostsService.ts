/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_AuditPostRequest } from '../models/dto_AuditPostRequest';
import type { dto_UpdateOfficialTagRequest } from '../models/dto_UpdateOfficialTagRequest';
import type { vo_BaseResponseWrapper } from '../models/vo_BaseResponseWrapper';
import type { vo_ListPostsAdminResponseWrapper } from '../models/vo_ListPostsAdminResponseWrapper';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminPostsService {
    /**
     * 按条件列出帖子 (管理员)
     * 出于管理目的，根据各种过滤条件检索分页的帖子列表。使用查询参数进行过滤和分页。
     * @returns vo_ListPostsAdminResponseWrapper 帖子检索成功" // <--- 修改
     * @throws ApiError
     */
    public static getApiV1PostAdminPosts({
        page,
        pageSize,
        id,
        title,
        authorUsername,
        status,
        officialTag,
        viewCountMin,
        viewCountMax,
        orderBy = 'created_at',
        orderDesc = false,
    }: {
        /**
         * 页码（从 1 开始）
         */
        page: number,
        /**
         * 每页帖子数量
         */
        pageSize: number,
        /**
         * 按精确的帖子 ID 过滤
         */
        id?: number,
        /**
         * 按帖子标题过滤（模糊匹配）
         */
        title?: string,
        /**
         * 按作者用户名过滤（模糊匹配）
         */
        authorUsername?: string,
        /**
         * 按帖子状态过滤 (0=待审核, 1=已审核, 2=已拒绝)
         */
        status?: 0 | 1 | 2,
        /**
         * 按官方标签过滤 (例如, 0=无, 1=官方认证)
         */
        officialTag?: 0 | 1 | 2 | 3,
        /**
         * 按最小浏览量过滤
         */
        viewCountMin?: number,
        /**
         * 按最大浏览量过滤
         */
        viewCountMax?: number,
        /**
         * 排序字段 (created_at 或 updated_at)
         */
        orderBy?: 'created_at' | 'updated_at',
        /**
         * 是否降序排序 (true 为 DESC, false/省略为 ASC)
         */
        orderDesc?: boolean,
    }): CancelablePromise<vo_ListPostsAdminResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/admin/posts',
            query: {
                'id': id,
                'title': title,
                'author_username': authorUsername,
                'status': status,
                'official_tag': officialTag,
                'view_count_min': viewCountMin,
                'view_count_max': viewCountMax,
                'order_by': orderBy,
                'order_desc': orderDesc,
                'page': page,
                'page_size': pageSize,
            },
            errors: {
                400: `无效的输入参数（例如，无效的 page, page_size, status）" // <--- 修改`,
                500: `检索帖子时发生内部服务器错误" // <--- 修改`,
            },
        });
    }
    /**
     * 审核帖子
     * 管理员更新帖子的状态（以及可选的原因）。需要在请求体中提供审核详情。
     * @returns vo_BaseResponseWrapper 帖子审核成功" // <--- 修改 (无 Data)
     * @throws ApiError
     */
    public static postApiV1PostAdminPostsAudit({
        requestBody,
    }: {
        /**
         * 审核帖子请求体
         */
        requestBody: dto_AuditPostRequest,
    }): CancelablePromise<vo_BaseResponseWrapper> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/post/admin/posts/audit',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `无效的请求负载（例如，缺少字段，无效的状态）" // <--- 修改`,
                404: `帖子未找到" // <-- 添加404情况`,
                500: `审核过程中发生内部服务器错误" // <--- 修改`,
            },
        });
    }
    /**
     * 更新帖子官方标签 (管理员)
     * 管理员更新特定帖子的官方标签。需要在 URL 路径中提供帖子 ID，并在请求体中提供标签详情。
     * @returns vo_BaseResponseWrapper 官方标签更新成功" // <--- 修改 (无 Data)
     * @throws ApiError
     */
    public static putApiV1PostAdminPostsOfficialTag({
        id,
        requestBody,
    }: {
        /**
         * 要更新的帖子 ID
         */
        id: number,
        /**
         * 更新官方标签请求体 (请求体中的 PostID 是冗余的，请使用路径中的 ID)
         */
        requestBody: dto_UpdateOfficialTagRequest,
    }): CancelablePromise<vo_BaseResponseWrapper> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/post/admin/posts/{id}/official-tag',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `无效的请求负载，无效的标签值，或路径 ID 与请求体 ID 不匹配" // <--- 修改`,
                404: `帖子未找到" // <--- 修改`,
                500: `更新标签时发生内部服务器错误" // <--- 修改`,
            },
        });
    }
}
