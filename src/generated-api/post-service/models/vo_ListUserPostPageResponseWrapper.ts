/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { vo_ListUserPostPageVO } from './vo_ListUserPostPageVO';
export type vo_ListUserPostPageResponseWrapper = {
    /**
     * 响应码，0 表示成功
     */
    code?: number;
    /**
     * 实际的用户帖子列表分页数据
     */
    data?: vo_ListUserPostPageVO;
    /**
     * 响应消息
     */
    message?: string;
};

