/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { enums_IdentityType } from './enums_IdentityType';
export type vo_IdentityVO = {
    /**
     * 创建时间
     */
    created_at?: string;
    /**
     * 标识符（如账号、OpenID、手机号）
     */
    identifier?: string;
    /**
     * 身份 ID
     */
    identity_id?: number;
    /**
     * 身份类型（0=账号密码, 1=小程序, 2=手机号）
     */
    identity_type?: enums_IdentityType;
    /**
     * 更新时间
     */
    updated_at?: string;
    /**
     * 用户 ID
     */
    user_id?: string;
};

