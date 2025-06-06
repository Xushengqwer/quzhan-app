/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_UserQueryDTO = {
    /**
     * 精确匹配条件（如 user_id="123", status=0）
     */
    filters?: Record<string, any>;
    /**
     * 模糊匹配条件（如 username LIKE "%test%"）
     */
    like_filters?: Record<string, string>;
    /**
     * 排序字段（如 "created_at DESC"）
     */
    order_by?: string;
    /**
     * 页码，默认 1
     */
    page?: number;
    /**
     * 每页大小，默认 10
     */
    page_size?: number;
    /**
     * 时间范围条件（如 created_at 在某个范围内）
     */
    time_range_filters?: Record<string, Array<string>>;
};

