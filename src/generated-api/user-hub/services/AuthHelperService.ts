/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { docs_SwaggerAPIEmptyResponse } from '../models/docs_SwaggerAPIEmptyResponse';
import type { dto_SendCaptchaRequest } from '../models/dto_SendCaptchaRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthHelperService {
    /**
     * 发送短信验证码
     * 向用户指定的手机号发送一个6位随机数字验证码，该验证码在5分钟内有效。
     * @returns docs_SwaggerAPIEmptyResponse 验证码发送成功（响应体中不包含验证码）
     * @throws ApiError
     */
    public static postApiV1UserHubAuthSendCaptcha({
        requestBody,
    }: {
        /**
         * 请求体，包含目标手机号
         */
        requestBody: dto_SendCaptchaRequest,
    }): CancelablePromise<docs_SwaggerAPIEmptyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/auth/send-captcha',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、手机号格式不正确)`,
                500: `系统内部错误 (如短信服务发送失败、Redis存储失败)`,
            },
        });
    }
}
