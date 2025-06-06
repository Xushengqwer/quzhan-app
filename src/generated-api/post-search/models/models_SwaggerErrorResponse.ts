/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type models_SwaggerErrorResponse = {
    /**
     * 业务自定义错误码。
     */
    code?: number;
    /**
     * 错误响应中 data 字段通常为 null 或不包含有效业务数据，这里使用 interface{}。
     */
    data?: any;
    /**
     * 错误的文字描述。
     */
    message?: string;
};

