/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
export type dto_UpdateUserDTO = {
    /**
     * 用户状态（0=Active, 1=Blacklisted），可选
     */
    status?: 0 | 1;
    /**
     * 用户角色（0=Admin, 1=User, 2=Guest），可选
     */
    user_role?: 0 | 1 | 2;
};

