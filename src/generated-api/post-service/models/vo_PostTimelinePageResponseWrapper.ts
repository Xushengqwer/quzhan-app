/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { vo_PostTimelinePageVO } from './vo_PostTimelinePageVO';
export type vo_PostTimelinePageResponseWrapper = {
    /**
     * 响应码，0 表示成功
     */
    code?: number;
    /**
     * 实际的帖子时间线分页数据
     */
    data?: vo_PostTimelinePageVO;
    /**
     * 响应消息
     */
    message?: string;
};

