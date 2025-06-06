/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { docs_SwaggerAPIUserListResponse } from '../models/docs_SwaggerAPIUserListResponse';
import type { dto_UserQueryDTO } from '../models/dto_UserQueryDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserQueryService {
    /**
     * 分页查询用户及其资料 (管理员)
     * 管理员根据指定的过滤、排序和分页条件，查询用户列表及其关联的 Profile 信息。
     * @returns docs_SwaggerAPIUserListResponse 查询成功，返回用户列表和总记录数
     * @throws ApiError
     */
    public static postApiV1UserHubUsersQuery({
        requestBody,
    }: {
        /**
         * 查询条件 (过滤、排序、分页)
         */
        requestBody: dto_UserQueryDTO,
    }): CancelablePromise<docs_SwaggerAPIUserListResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/users/query',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、分页参数超出范围)`,
                403: `权限不足 (非管理员操作)`,
                500: `系统内部错误 (如数据库查询失败)`,
            },
        });
    }
}
