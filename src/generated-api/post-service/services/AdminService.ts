/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { vo_BaseResponseWrapper } from '../models/vo_BaseResponseWrapper';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * 管理员删除帖子 (Admin delete post)
     * 管理员软删除指定ID的帖子 (Admin soft deletes a post with the specified ID)
     * @returns vo_BaseResponseWrapper 帖子删除成功
     * @throws ApiError
     */
    public static deleteApiV1PostAdminPosts({
        postId,
    }: {
        /**
         * 帖子ID (Post ID)
         */
        postId: string,
    }): CancelablePromise<vo_BaseResponseWrapper> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/post/admin/posts/{post_id}',
            path: {
                'post_id': postId,
            },
            errors: {
                400: `无效的帖子ID格式`,
                401: `管理员未登录或无权限`,
                404: `帖子未找到`,
                500: `删除帖子时发生内部服务器错误`,
            },
        });
    }
}
