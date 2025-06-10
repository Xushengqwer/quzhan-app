/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { enums_Gender } from './enums_Gender';
export type vo_ProfileVO = {
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
     * 更新时间
     */
    updated_at?: string;
    /**
     * 用户 ID
     */
    user_id?: string;
};

