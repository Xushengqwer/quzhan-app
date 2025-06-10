/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_CreateIdentityDTO } from '../models/dto_CreateIdentityDTO';
import type { dto_UpdateIdentityDTO } from '../models/dto_UpdateIdentityDTO';
import type { response_APIResponse_vo_Empty } from '../models/response_APIResponse_vo_Empty';
import type { response_APIResponse_vo_IdentityList } from '../models/response_APIResponse_vo_IdentityList';
import type { response_APIResponse_vo_IdentityTypeList } from '../models/response_APIResponse_vo_IdentityTypeList';
import type { response_APIResponse_vo_IdentityVO } from '../models/response_APIResponse_vo_IdentityVO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IdentityManagementService {
    /**
     * 创建新身份
     * 用户或管理员为指定用户绑定一种新的登录方式（如新的账号密码、关联社交账号等）。
     * @returns response_APIResponse_vo_IdentityVO 身份创建成功，返回新创建的身份信息
     * @throws ApiError
     */
    public static postApiV1UserHubIdentities({
        requestBody,
    }: {
        /**
         * 创建身份请求的详细信息，包括用户ID、身份类型、标识符和凭证
         */
        requestBody: dto_CreateIdentityDTO,
    }): CancelablePromise<response_APIResponse_vo_IdentityVO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/identities',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、必填项缺失) 或 业务逻辑错误 (如身份标识已存在)`,
                500: `系统内部错误 (如数据库操作失败、密码加密失败)`,
            },
        });
    }
    /**
     * 更新身份信息
     * 用户或管理员修改指定身份ID的凭证信息（例如，重置密码）。
     * @returns response_APIResponse_vo_IdentityVO 身份信息更新成功，返回更新后的身份信息
     * @throws ApiError
     */
    public static putApiV1UserHubIdentities({
        identityId,
        requestBody,
    }: {
        /**
         * 要更新的身份记录的唯一ID
         */
        identityId: number,
        /**
         * 更新身份请求的详细信息，主要包含新的凭证
         */
        requestBody: dto_UpdateIdentityDTO,
    }): CancelablePromise<response_APIResponse_vo_IdentityVO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-hub/identities/{identityID}',
            path: {
                'identityID': identityId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、身份ID格式无效、新凭证无效)`,
                404: `指定的身份记录不存在`,
                500: `系统内部错误 (如数据库操作失败、密码加密失败)`,
            },
        });
    }
    /**
     * 删除身份
     * 用户或管理员注销或移除某个特定的登录方式（身份记录）。
     * @returns response_APIResponse_vo_Empty 身份删除成功
     * @throws ApiError
     */
    public static deleteApiV1UserHubIdentities({
        identityId,
    }: {
        /**
         * 要删除的身份记录的唯一ID
         */
        identityId: number,
    }): CancelablePromise<response_APIResponse_vo_Empty> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/user-hub/identities/{identityID}',
            path: {
                'identityID': identityId,
            },
            errors: {
                400: `请求参数无效 (如身份ID格式无效)`,
                404: `指定的身份记录不存在 (如果服务层认为删除不存在的记录是错误)`,
                500: `系统内部错误 (如数据库操作失败)`,
            },
        });
    }
    /**
     * 获取用户的所有身份信息
     * 管理员或用户本人查看指定用户ID关联的所有登录方式/身份凭证信息（不含敏感凭证内容）。
     * @returns response_APIResponse_vo_IdentityList 获取用户身份列表成功
     * @throws ApiError
     */
    public static getApiV1UserHubUsersIdentities({
        userId,
    }: {
        /**
         * 要查询的用户ID
         */
        userId: string,
    }): CancelablePromise<response_APIResponse_vo_IdentityList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-hub/users/{userID}/identities',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                404: `指定的用户不存在 (如果服务层检查用户存在性)`,
                500: `系统内部错误 (如数据库查询失败)`,
            },
        });
    }
    /**
     * 获取用户的所有身份类型
     * 用户或系统查看指定用户ID已绑定的所有登录方式的类型列表。
     * @returns response_APIResponse_vo_IdentityTypeList 获取用户身份类型列表成功
     * @throws ApiError
     */
    public static getApiV1UserHubUsersIdentityTypes({
        userId,
    }: {
        /**
         * 要查询的用户ID
         */
        userId: string,
    }): CancelablePromise<response_APIResponse_vo_IdentityTypeList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-hub/users/{userID}/identity-types',
            path: {
                'userID': userId,
            },
            errors: {
                400: `请求参数无效 (如用户ID为空)`,
                404: `指定的用户不存在 (如果服务层检查用户存在性)`,
                500: `系统内部错误 (如数据库查询失败)`,
            },
        });
    }
}
