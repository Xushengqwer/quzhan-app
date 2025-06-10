/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { vo_PostResponse } from './vo_PostResponse';
export type vo_PostTimelinePageVO = {
    /**
     * 下一页游标：创建时间，如果为nil表示没有下一页
     */
    nextCreatedAt?: string;
    /**
     * 下一页游标：帖子ID，如果为nil表示没有下一页
     */
    nextPostId?: number;
    /**
     * 当前页的帖子摘要列表
     */
    posts?: Array<vo_PostResponse>;
};

