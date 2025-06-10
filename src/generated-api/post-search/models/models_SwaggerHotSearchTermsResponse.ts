/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { models_HotSearchTerm } from './models_HotSearchTerm';
export type models_SwaggerHotSearchTermsResponse = {
    /**
     * 业务自定义状态码，例如 0 代表成功，其他值代表特定错误。
     */
    code?: number;
    /**
     * 告诉前端哪些词是热门的。
     */
    data?: models_HotSearchTerm;
    /**
     * 操作结果的文字描述，例如 "搜索成功" 或具体的错误信息。
     */
    message?: string;
};

