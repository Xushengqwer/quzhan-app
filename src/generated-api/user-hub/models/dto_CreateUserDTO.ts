/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_CreateUserDTO = {
    /**
     * 用户状态（0=活跃, 1=拉黑）
     * - 必填字段，验证状态枚举值
     */
    status?: 0 | 1;
    /**
     * 用户角色（0=管理员, 1=普通用户, 2=客人）
     * - 必填字段，验证角色枚举值
     */
    user_role?: 0 | 1 | 2;
};

