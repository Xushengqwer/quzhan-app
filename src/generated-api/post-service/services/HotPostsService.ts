/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { vo_ListPostsByCursorResponseWrapper } from '../models/vo_ListPostsByCursorResponseWrapper';
import type { vo_PostDetailResponseWrapper } from '../models/vo_PostDetailResponseWrapper';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HotPostsService {
    /**
     * 通过游标获取热门帖子
     * 使用基于游标的分页方式，检索热门帖子列表。使用查询参数来传递游标和数量限制。
     * @returns vo_ListPostsByCursorResponseWrapper 热门帖子检索成功。" // <--- 修改
     * @throws ApiError
     */
    public static getApiV1PostHotPosts({
        limit,
        lastPostId,
    }: {
        /**
         * 每页帖子数量
         */
        limit: number,
        /**
         * 上一页最后一个帖子的 ID，首页省略
         */
        lastPostId?: number,
    }): CancelablePromise<vo_ListPostsByCursorResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/hot-posts',
            query: {
                'last_post_id': lastPostId,
                'limit': limit,
            },
            errors: {
                400: `无效的输入参数（例如，无效的 limit 或 last_post_id 格式）" // <--- 修改`,
                500: `检索热门帖子时发生内部服务器错误" // <--- 修改`,
            },
        });
    }
    /**
     * 根据帖子 ID 获取热门帖子详情
     * 通过帖子的 ID 检索特定热门帖子的详细信息。需要在 URL 路径中提供帖子 ID，并从上下文中获取 UserID。
     * @returns vo_PostDetailResponseWrapper 热门帖子详情检索成功" // <--- 修改
     * @throws ApiError
     */
    public static getApiV1PostHotPosts1({
        postId,
    }: {
        /**
         * 帖子 ID
         */
        postId: number,
    }): CancelablePromise<vo_PostDetailResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/hot-posts/{post_id}',
            path: {
                'post_id': postId,
            },
            errors: {
                400: `无效的帖子 ID 格式" // <--- 修改`,
                401: `在上下文中未找到用户 ID（未授权）" // <--- 修改`,
                404: `热门帖子详情未找到" // <-- 添加404情况`,
                500: `检索热门帖子详情时发生内部服务器错误" // <--- 修改`,
            },
        });
    }
}
