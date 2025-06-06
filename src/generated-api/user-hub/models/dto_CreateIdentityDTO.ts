/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { enums_IdentityType } from './enums_IdentityType';
export type dto_CreateIdentityDTO = {
    /**
     * 凭证（如密码哈希、UnionID）
     */
    credential: string;
    /**
     * 标识符（如账号、OpenID、手机号）
     */
    identifier: string;
    /**
     * 身份类型（0=账号密码, 1=小程序, 2=手机号）
     */
    identity_type: enums_IdentityType;
    /**
     * 用户 ID
     */
    user_id: string;
};

