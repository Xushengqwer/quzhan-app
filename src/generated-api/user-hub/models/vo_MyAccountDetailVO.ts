/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { enums_Gender } from './enums_Gender';
import type { enums_UserRole } from './enums_UserRole';
import type { enums_UserStatus } from './enums_UserStatus';
export type vo_MyAccountDetailVO = {
    avatar_url?: string;
    city?: string;
    /**
     * 可以是 User 的创建时间
     */
    created_at?: string;
    gender?: enums_Gender;
    /**
     * 来自 UserProfile 实体
     */
    nickname?: string;
    province?: string;
    /**
     * 来自 User 实体
     */
    status?: enums_UserStatus;
    /**
     * 可以是 User 或 Profile 中较新的更新时间
     */
    updated_at?: string;
    user_id?: string;
    /**
     * 来自 User 实体
     */
    user_role?: enums_UserRole;
};

