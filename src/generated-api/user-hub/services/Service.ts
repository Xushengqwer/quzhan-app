/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { docs_SwaggerAPILoginResponse } from '../models/docs_SwaggerAPILoginResponse';
import type { docs_SwaggerAPIUserinfoResponse } from '../models/docs_SwaggerAPIUserinfoResponse';
import type { dto_AccountLoginData } from '../models/dto_AccountLoginData';
import type { dto_AccountRegisterData } from '../models/dto_AccountRegisterData';
import type { dto_PhoneLoginOrRegisterData } from '../models/dto_PhoneLoginOrRegisterData';
import type { dto_WechatMiniProgramLoginData } from '../models/dto_WechatMiniProgramLoginData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class Service {
    /**
     * 账号密码登录
     * 用户通过提供账号和密码来获取认证令牌。
     * @returns docs_SwaggerAPILoginResponse 登录成功，返回用户信息及访问和刷新令牌
     * @throws ApiError
     */
    public static postApiV1UserHubAccountLogin({
        requestBody,
        xPlatform = 'web',
    }: {
        /**
         * 登录信息 (账号、密码)
         */
        requestBody: dto_AccountLoginData,
        /**
         * 客户端平台类型
         */
        xPlatform?: 'web' | 'wechat' | 'app',
    }): CancelablePromise<docs_SwaggerAPILoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/account/login',
            headers: {
                'X-Platform': xPlatform,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、平台类型无效) 或 业务逻辑错误 (如账号不存在、密码错误、用户状态异常)`,
                500: `系统内部错误 (如数据库操作失败、令牌生成失败)`,
            },
        });
    }
    /**
     * 账号密码注册
     * 用户通过提供账号、密码和确认密码来创建新账户。
     * @returns docs_SwaggerAPIUserinfoResponse 注册成功，返回用户信息（通常只有用户ID）
     * @throws ApiError
     */
    public static postApiV1UserHubAccountRegister({
        requestBody,
    }: {
        /**
         * 注册信息 (账号、密码、确认密码)
         */
        requestBody: dto_AccountRegisterData,
    }): CancelablePromise<docs_SwaggerAPIUserinfoResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/account/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、必填项缺失) 或 业务逻辑错误 (如账号已存在、密码不一致)`,
                500: `系统内部错误 (如数据库操作失败、密码加密失败)`,
            },
        });
    }
    /**
     * 手机号登录或注册
     * 用户通过提供手机号和接收到的短信验证码来登录或自动注册账户。
     * @returns docs_SwaggerAPILoginResponse 登录或注册成功，返回用户信息及访问和刷新令牌
     * @throws ApiError
     */
    public static postApiV1UserHubPhoneLogin({
        requestBody,
        xPlatform = 'web',
    }: {
        /**
         * 登录/注册信息 (手机号、验证码)
         */
        requestBody: dto_PhoneLoginOrRegisterData,
        /**
         * 客户端平台类型
         */
        xPlatform?: 'web' | 'wechat' | 'app',
    }): CancelablePromise<docs_SwaggerAPILoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/phone/login',
            headers: {
                'X-Platform': xPlatform,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、平台类型无效) 或 业务逻辑错误 (如验证码错误或过期、用户状态异常)`,
                500: `系统内部错误 (如数据库操作失败、令牌生成失败、Redis操作失败)`,
            },
        });
    }
    /**
     * 微信小程序登录或注册
     * 用户通过提供微信小程序 wx.login() 获取的 code，进行登录或（如果首次登录）自动注册账户。
     * @returns docs_SwaggerAPILoginResponse 登录或注册成功，返回用户信息及访问和刷新令牌
     * @throws ApiError
     */
    public static postApiV1UserHubWechatLogin({
        requestBody,
        xPlatform = 'wechat',
    }: {
        /**
         * 包含微信小程序 code 的请求体
         */
        requestBody: dto_WechatMiniProgramLoginData,
        /**
         * 客户端平台类型
         */
        xPlatform?: 'web' | 'wechat' | 'app',
    }): CancelablePromise<docs_SwaggerAPILoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-hub/wechat/login',
            headers: {
                'X-Platform': xPlatform,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `请求参数无效 (如JSON格式错误、code为空、平台类型无效) 或 业务逻辑错误 (如微信 code 无效或已过期、用户状态异常)`,
                500: `系统内部错误 (如调用微信API失败、数据库操作失败、令牌生成失败)`,
            },
        });
    }
}
