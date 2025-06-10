/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { docs_SwaggerAPIEmptyResponse } from '../models/docs_SwaggerAPIEmptyResponse';
import type { docs_SwaggerAPIProfileVOResponse } from '../models/docs_SwaggerAPIProfileVOResponse';
import type { docs_SwaggerAPIUserVOResponse } from '../models/docs_SwaggerAPIUserVOResponse';
import type { dto_CreateUserDTO } from '../models/dto_CreateUserDTO';
import type { dto_UpdateUserDTO } from '../models/dto_UpdateUserDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserManagementService {
    /**
     * 创建新用户 (管理员)
     * 管理员根据提供的角色和状态信息创建一个新的用户账户。用户ID由系统自动生成。
     * @returns docs_SwaggerAPIUserVOResponse 用户创建成功，返回新创建的用户信息
     * @throws ApiError
     */
    public static postApiV1UserHubUsers({
        requestBody,
    }: {
        /**
         * 创建用户请求，包含用户角色和初始状态
         */
        requestBody: dto_CreateUserDTO,
    }): CancelablePromise<docs_SwaggerAPIUserVOResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、角色或状态值无效)`,
                403: `权限不足 (非管理员操作)`,
                500: `系统内部错误 (如数据库操作失败)`,
            },
        });
    }
    /**
     * 获取用户信息
     * 根据提供的用户ID获取该用户的核心账户信息（角色、状态、创建/更新时间等）。
     * @returns docs_SwaggerAPIUserVOResponse 获取用户信息成功
     * @throws ApiError
     */
    public static getApiV1UserHubUsers({
        userId,
    }: {
        /**
         * 要查询的用户ID
         */
        userId: string,
    }): CancelablePromise<docs_SwaggerAPIUserVOResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-hub/users/{userID}',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                403: `权限不足 (非管理员或用户本人)`,
                404: `指定的用户不存在`,
                500: `系统内部错误 (如数据库查询失败)`,
            },
        });
    }
    /**
     * 更新用户信息 (管理员)
     * 管理员更新指定用户的角色和状态。
     * @returns docs_SwaggerAPIUserVOResponse 用户信息更新成功，返回更新后的用户信息
     * @throws ApiError
     */
    public static putApiV1UserHubUsers({
        userId,
        requestBody,
    }: {
        /**
         * 要更新的用户ID
         */
        userId: string,
        /**
         * 包含待更新角色和/或状态的请求体
         */
        requestBody: dto_UpdateUserDTO,
    }): CancelablePromise<docs_SwaggerAPIUserVOResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-hub/users/{userID}',
            path: {
                'userID': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、用户ID为空、角色或状态值无效)`,
                403: `权限不足 (非管理员操作)`,
                404: `指定的用户不存在`,
                500: `系统内部错误 (如数据库操作失败)`,
            },
        });
    }
    /**
     * 删除用户 (管理员)
     * 管理员（软）删除指定的用户账户及其所有关联数据（如身份、资料）。
     * @returns docs_SwaggerAPIEmptyResponse 用户删除成功
     * @throws ApiError
     */
    public static deleteApiV1UserHubUsers({
        userId,
    }: {
        /**
         * 要删除的用户ID
         */
        userId: string,
    }): CancelablePromise<docs_SwaggerAPIEmptyResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/user-hub/users/{userID}',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                403: `权限不足 (非管理员操作)`,
                404: `指定的用户不存在 (如果服务层认为删除不存在的用户是错误)`,
                500: `系统内部错误 (如数据库事务失败)`,
            },
        });
    }
    /**
     * 拉黑用户 (管理员)
     * 管理员将指定的用户账户状态设置为“拉黑”，阻止其登录或访问受限资源。
     * @returns docs_SwaggerAPIEmptyResponse 用户已成功拉黑
     * @throws ApiError
     */
    public static putApiV1UserHubUsersBlacklist({
        userId,
    }: {
        /**
         * 要拉黑的用户ID
         */
        userId: string,
    }): CancelablePromise<docs_SwaggerAPIEmptyResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-hub/users/{userID}/blacklist',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                403: `权限不足 (非管理员操作)`,
                404: `指定的用户不存在`,
                500: `系统内部错误 (如数据库操作失败)`,
            },
        });
    }
    /**
     * 获取指定用户资料 (管理员)
     * (管理员权限) 根据提供的用户ID，获取该用户的详细个人资料信息（昵称、头像等）。
     * @returns docs_SwaggerAPIProfileVOResponse 获取用户资料成功
     * @throws ApiError
     */
    public static getApiV1UserHubUsersProfile({
        userId,
    }: {
        /**
         * 要查询的用户ID
         */
        userId: string,
    }): CancelablePromise<docs_SwaggerAPIProfileVOResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-hub/users/{userID}/profile',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                403: `权限不足 (非管理员操作)`,
                404: `指定用户的资料不存在`,
                500: `系统内部错误 (如数据库查询失败)`,
            },
        });
    }
}
