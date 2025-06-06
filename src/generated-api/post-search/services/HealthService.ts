/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_SwaggerHealthCheckResponse } from '../models/models_SwaggerHealthCheckResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * 健康检查
     * 检查服务存活状态
     * @returns models_SwaggerHealthCheckResponse 服务存活
     * @throws ApiError
     */
    public static getApiV1SearchHealth(): CancelablePromise<models_SwaggerHealthCheckResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/search/_health',
            errors: {
                503: `服务不存活（通常不会发生，除非服务进程已挂）`,
            },
        });
    }
}
