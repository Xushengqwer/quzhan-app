/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
export type dto_AccountRegisterData = {
    /**
     * 使用 "Account" 校验器
     */
    account: string;
    /**
     * 这里没有自定义格式校验器，但如果需要在服务端检查密码一致性，可以添加 `eqfield=Password`，不过这通常在前端或服务层处理。
     */
    confirmPassword: string;
    /**
     * 使用 "Password" 校验器
     */
    password: string;
};

