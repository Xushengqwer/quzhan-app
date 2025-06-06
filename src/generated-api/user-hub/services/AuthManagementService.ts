/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { docs_SwaggerAPIEmptyResponse } from '../models/docs_SwaggerAPIEmptyResponse';
import type { docs_SwaggerAPITokenPairResponse } from '../models/docs_SwaggerAPITokenPairResponse';
import type { dto_RefreshTokenRequest } from '../models/dto_RefreshTokenRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthManagementService {
    /**
     * 退出登录
     * 用户请求吊销其当前的认证令牌（通常是 Refresh Token），使其失效。客户端应在调用此接口后清除本地存储的令牌。
     * @returns docs_SwaggerAPIEmptyResponse 退出登录成功
     * @throws ApiError
     */
    public static postApiV1UserHubAuthLogout({
        authorization,
    }: {
        /**
         * Bearer <需要吊销的令牌>
         */
        authorization: string,
    }): CancelablePromise<docs_SwaggerAPIEmptyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/auth/logout',
            headers: {
                'Authorization': authorization,
            },
            errors: {
                400: `请求格式错误 (如缺少 Authorization 头或格式非 Bearer)`,
                401: `认证失败 (通常由 AuthMiddleware 处理，此接口本身逻辑较少触发)`,
                500: `系统内部错误 (如 Redis 操作失败)`,
            },
        });
    }
    /**
     * 刷新令牌
     * 使用有效的 Refresh Token 获取一对新的 Access Token 和 Refresh Token。支持从请求体或 Cookie 中获取 Refresh Token。
     * @returns docs_SwaggerAPITokenPairResponse 刷新成功，返回新的令牌对
     * @throws ApiError
     */
    public static postApiV1UserHubAuthRefreshToken({
        requestBody,
    }: {
        /**
         * 请求体 (可选)，包含 refresh_token 字段
         */
        requestBody?: dto_RefreshTokenRequest,
    }): CancelablePromise<docs_SwaggerAPITokenPairResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/auth/refresh-token',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数错误 (如未提供有效的 Refresh Token)`,
                401: `认证失败 (Refresh Token 无效、已过期、已被吊销或用户状态异常)`,
                500: `系统内部错误 (如数据库操作失败、令牌生成失败、Redis 操作失败)`,
            },
        });
    }
}
