/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { docs_SwaggerAPIMyAccountDetailResponse } from '../models/docs_SwaggerAPIMyAccountDetailResponse';
import type { docs_SwaggerAPIProfileVOResponse } from '../models/docs_SwaggerAPIProfileVOResponse';
import type { dto_UpdateProfileDTO } from '../models/dto_UpdateProfileDTO';
import type { response_APIResponse_map_string_string } from '../models/response_APIResponse_map_string_string';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfileManagementService {
    /**
     * 获取我的账户详情 (核心信息 + 资料)
     * 获取当前认证用户的核心账户信息（如角色、状态）和详细个人资料（如昵称、头像）。
     * @returns docs_SwaggerAPIMyAccountDetailResponse 获取账户详情成功
     * @throws ApiError
     */
    public static getApiV1UserHubProfile(): CancelablePromise<docs_SwaggerAPIMyAccountDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-hub/profile',
            errors: {
                401: `未授权或认证失败`,
                500: `系统内部错误 (如数据不一致或数据库查询失败)`,
            },
        });
    }
    /**
     * 更新我的用户资料
     * 当前认证用户更新自己的个人资料信息（如昵称、性别、地区等）。头像更新请使用专门的头像上传接口。
     * @returns docs_SwaggerAPIProfileVOResponse 资料更新成功，返回更新后的资料信息
     * @throws ApiError
     */
    public static putApiV1UserHubProfile({
        requestBody,
    }: {
        /**
         * 包含待更新字段的资料信息（不含头像URL）
         */
        requestBody: dto_UpdateProfileDTO,
    }): CancelablePromise<docs_SwaggerAPIProfileVOResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-hub/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误)`,
                401: `未授权或认证失败`,
                500: `系统内部错误 (如数据库操作失败或用户资料不存在)`,
            },
        });
    }
    /**
     * 上传我的头像
     * 当前认证用户上传自己的头像文件。成功后返回新的头像URL。
     * @returns response_APIResponse_map_string_string 头像上传成功，返回包含新头像URL的map
     * @throws ApiError
     */
    public static postApiV1UserHubProfileAvatar({
        formData,
    }: {
        formData: {
            /**
             * 头像文件 (multipart/form-data key: 'avatar')
             */
            avatar: Blob;
        },
    }): CancelablePromise<response_APIResponse_map_string_string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/profile/avatar',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `请求无效 (如文件过大、类型不支持、未提供文件)`,
                401: `未授权或认证失败`,
                500: `系统内部错误 (如文件上传到COS失败、数据库更新失败)`,
            },
        });
    }
}
