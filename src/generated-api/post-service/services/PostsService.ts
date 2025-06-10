/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { vo_BaseResponseWrapper } from '../models/vo_BaseResponseWrapper';
import type { vo_ListPostsByCursorResponseWrapper } from '../models/vo_ListPostsByCursorResponseWrapper';
import type { vo_ListUserPostPageResponseWrapper } from '../models/vo_ListUserPostPageResponseWrapper';
import type { vo_PostDetailResponseWrapper } from '../models/vo_PostDetailResponseWrapper';
import type { vo_PostTimelinePageResponseWrapper } from '../models/vo_PostTimelinePageResponseWrapper';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PostsService {
    /**
     * 创建新帖子 (独立表单字段及图片)
     * 使用提供的详情（作为独立表单字段）和图片文件创建一个新帖子。请求体应为 multipart/form-data。
     * @returns vo_PostDetailResponseWrapper 帖子创建成功
     * @throws ApiError
     */
    public static postApiV1PostPosts({
        formData,
    }: {
        formData: {
            /**
             * 帖子标题
             */
            title: string;
            /**
             * 帖子内容
             */
            content: string;
            /**
             * 单价 (可选, 大于等于0)
             */
            price_per_unit?: number;
            /**
             * 联系方式 (可选)
             */
            contact_info?: string;
            /**
             * 作者ID
             */
            author_id: string;
            /**
             * 作者头像 URL (可选, 需为有效URL)
             */
            author_avatar?: string;
            /**
             * 作者用户名
             */
            author_username: string;
            /**
             * 帖子图片文件 (可多选)
             */
            images: Blob;
        },
    }): CancelablePromise<vo_PostDetailResponseWrapper> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/post/posts',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `无效的请求负载或文件处理错误`,
                500: `创建帖子时发生内部服务器错误`,
            },
        });
    }
    /**
     * 获取指定用户的帖子列表 (公开, 游标加载)
     * 使用游标分页方式，检索特定用户公开发布的帖子列表。
     * @returns vo_ListPostsByCursorResponseWrapper 帖子检索成功" // 确保 vo.ListPostsByUserIDResponseWrapper 对应游标加载的响应结构
     * @throws ApiError
     */
    public static getApiV1PostPostsByAuthor({
        userId,
        pageSize,
        cursor,
    }: {
        /**
         * 要查询其帖子的用户 ID
         */
        userId: string,
        /**
         * 每页帖子数量
         */
        pageSize: number,
        /**
         * 游标（上一页最后一个帖子的 ID），首页省略
         */
        cursor?: number,
    }): CancelablePromise<vo_ListPostsByCursorResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/posts/by-author',
            query: {
                'user_id': userId,
                'cursor': cursor,
                'page_size': pageSize,
            },
            errors: {
                400: `无效的输入参数`,
                500: `检索帖子时发生内部服务器错误`,
            },
        });
    }
    /**
     * 获取我的帖子列表
     * 获取当前登录用户发布的帖子列表，支持按官方标签、标题、帖子状态筛选，并使用分页加载。UserID 从请求上下文中获取。
     * @returns vo_ListUserPostPageResponseWrapper 成功响应，包含用户帖子列表和总记录数
     * @throws ApiError
     */
    public static getApiV1PostPostsMine({
        page = 1,
        pageSize = 10,
        officialTag,
        title,
        status,
    }: {
        /**
         * 页码 (从1开始)
         */
        page?: number,
        /**
         * 每页数量
         */
        pageSize?: number,
        /**
         * 官方标签 (0:无标签, 1:官方认证, 2:预付保证金, 3:急速响应)
         */
        officialTag?: 0 | 1 | 2 | 3,
        /**
         * 标题模糊搜索关键词 (最大长度 255)
         */
        title?: string,
        /**
         * 帖子状态 (0:待审核, 1:审核通过, 2:拒绝)
         */
        status?: 0 | 1 | 2,
    }): CancelablePromise<vo_ListUserPostPageResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/posts/mine',
            query: {
                'page': page,
                'pageSize': pageSize,
                'officialTag': officialTag,
                'title': title,
                'status': status,
            },
            errors: {
                400: `无效的请求参数`,
                401: `用户未授权或认证失败`,
                500: `服务器内部错误`,
            },
        });
    }
    /**
     * 获取帖子时间线列表 (公开)
     * 根据指定条件（官方标签、标题、作者用户名）和游标分页获取帖子列表，按时间倒序排列。
     * @returns vo_PostTimelinePageResponseWrapper 成功响应，包含帖子列表和下一页游标信息
     * @throws ApiError
     */
    public static getApiV1PostPostsTimeline({
        lastCreatedAt,
        lastPostId,
        pageSize = 10,
        officialTag,
        title,
        authorUsername,
    }: {
        /**
         * 上一页最后一条记录的创建时间 (RFC3339格式, e.g., 2023-01-01T15:04:05Z)
         */
        lastCreatedAt?: string,
        /**
         * 上一页最后一条记录的帖子ID
         */
        lastPostId?: number,
        /**
         * 每页数量
         */
        pageSize?: number,
        /**
         * 官方标签 (0:无标签, 1:官方认证, 2:预付保证金, 3:急速响应)
         */
        officialTag?: 0 | 1 | 2 | 3,
        /**
         * 标题模糊搜索关键词 (最大长度 255)
         */
        title?: string,
        /**
         * 作者用户名模糊搜索关键词 (最大长度 50)
         */
        authorUsername?: string,
    }): CancelablePromise<vo_PostTimelinePageResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/posts/timeline',
            query: {
                'lastCreatedAt': lastCreatedAt,
                'lastPostId': lastPostId,
                'pageSize': pageSize,
                'officialTag': officialTag,
                'title': title,
                'authorUsername': authorUsername,
            },
            errors: {
                400: `无效的请求参数`,
                500: `服务器内部错误`,
            },
        });
    }
    /**
     * 删除指定ID的帖子
     * 通过帖子的 ID 软删除一个帖子。
     * @returns vo_BaseResponseWrapper 帖子删除成功
     * @throws ApiError
     */
    public static deleteApiV1PostPosts({
        id,
    }: {
        /**
         * 帖子 ID
         */
        id: number,
    }): CancelablePromise<vo_BaseResponseWrapper> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/post/posts/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `无效的帖子 ID 格式`,
                500: `删除帖子时发生内部服务器错误`,
            },
        });
    }
    /**
     * 获取指定ID的帖子详情 (公开)
     * 通过帖子的 ID 检索特定帖子的详细信息。同时，如果用户已登录（通过中间件注入UserID），则会尝试增加浏览量。
     * @returns vo_PostDetailResponseWrapper 帖子详情检索成功
     * @throws ApiError
     */
    public static getApiV1PostPosts({
        postId,
        xUserId,
    }: {
        /**
         * 帖子 ID
         */
        postId: number,
        /**
         * 用户 ID (由网关/中间件注入)
         */
        xUserId?: string,
    }): CancelablePromise<vo_PostDetailResponseWrapper> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/post/posts/{post_id}',
            path: {
                'post_id': postId,
            },
            headers: {
                'X-User-ID': xUserId,
            },
            errors: {
                400: `无效的帖子 ID 格式`,
                500: `检索帖子详情时发生内部服务器错误`,
            },
        });
    }
}
