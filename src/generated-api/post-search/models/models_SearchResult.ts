/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { models_EsPostDocument } from './models_EsPostDocument';
export type models_SearchResult = {
    /**
     * 命中的帖子列表
     */
    hits?: Array<models_EsPostDocument>;
    /**
     * 当前页码
     */
    page?: number;
    /**
     * 当前页大小
     */
    size?: number;
    /**
     * UPRAVENO: Doba trvání dotazu v milisekundách (typ int64)
     */
    took_ms?: number;
    /**
     * 总命中数
     */
    total?: number;
};

