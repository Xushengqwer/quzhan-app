/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { enums_Gender } from './enums_Gender';
import type { enums_UserRole } from './enums_UserRole';
import type { enums_UserStatus } from './enums_UserStatus';
export type vo_UserWithProfileVO = {
    /**
     * 头像 URL
     */
    avatar_url?: string;
    /**
     * 城市
     */
    city?: string;
    /**
     * 创建时间
     */
    created_at?: string;
    /**
     * 性别（0=未知, 1=男, 2=女）
     */
    gender?: enums_Gender;
    /**
     * 昵称
     */
    nickname?: string;
    /**
     * 省份
     */
    province?: string;
    /**
     * 用户角色（0=Admin, 1=User, 2=Guest）
     */
    role?: enums_UserRole;
    /**
     * 用户状态（0=Active, 1=Blacklisted）
     */
    status?: enums_UserStatus;
    /**
     * 更新时间
     */
    updated_at?: string;
    /**
     * 用户 ID
     */
    user_id?: string;
};

