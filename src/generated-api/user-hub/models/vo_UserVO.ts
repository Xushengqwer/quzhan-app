/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { enums_UserRole } from './enums_UserRole';
import type { enums_UserStatus } from './enums_UserStatus';
export type vo_UserVO = {
    /**
     * 创建时间
     */
    created_at?: string;
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
    /**
     * 用户角色（0=Admin, 1=User, 2=Guest）
     */
    user_role?: enums_UserRole;
};

