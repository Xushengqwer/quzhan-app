/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_SearchResult } from './models_SearchResult';
export type models_SwaggerSearchResultResponse = {
    /**
     * 业务自定义状态码，例如 0 代表成功，其他值代表特定错误。
     */
    code?: number;
    /**
     * 具体的搜索结果数据负载。使用 omitempty 可以在 Data 为空时不显示该字段。
     */
    data?: models_SearchResult;
    /**
     * 操作结果的文字描述，例如 "搜索成功" 或具体的错误信息。
     */
    message?: string;
};

