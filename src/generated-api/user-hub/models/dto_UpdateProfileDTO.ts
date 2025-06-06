/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { enums_Gender } from './enums_Gender';
export type dto_UpdateProfileDTO = {
    /**
     * 城市 (可选更新)
     */
    city?: string;
    /**
     * 性别（0=未知, 1=男, 2=女）(可选更新)
     */
    gender?: enums_Gender;
    /**
     * 昵称 (可选更新)
     */
    nickname?: string;
    /**
     * 省份 (可选更新)
     */
    province?: string;
};

