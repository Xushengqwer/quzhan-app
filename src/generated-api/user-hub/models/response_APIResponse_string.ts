/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
export type response_APIResponse_string = {
    /**
     * 响应状态码，0 表示成功，其他值表示错误
     */
    code?: number;
    /**
     * 响应数据，类型由 T 指定，若无数据则为 nil，且在 JSON 中省略
     */
    data?: string;
    /**
     * 可选的响应消息，若为空则不输出
     */
    message?: string;
};

