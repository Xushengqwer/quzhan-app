/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { vo_PostResponse } from './vo_PostResponse';
export type vo_ListHotPostsByCursorResponse = {
    /**
     * 下一个游标，nil 表示无更多数据
     */
    next_cursor?: number;
    /**
     * 帖子列表
     */
    posts?: Array<vo_PostResponse>;
};

