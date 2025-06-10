/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { enums_OfficialTag } from './enums_OfficialTag';
import type { enums_Status } from './enums_Status';
export type vo_PostResponse = {
    /**
     * 审核原因 (如果 Status 为拒绝，则可能包含原因)
     */
    audit_reason?: string;
    /**
     * 作者头像
     */
    author_avatar?: string;
    /**
     * 作者ID
     */
    author_id?: string;
    /**
     * 作者用户名
     */
    author_username?: string;
    /**
     * 创建时间
     */
    created_at?: string;
    /**
     * 帖子ID
     */
    id?: number;
    /**
     * 官方标签 (0=无, 1=官方认证, ...)
     */
    official_tag?: enums_OfficialTag;
    /**
     * 帖子状态，0=待审核, 1=已审核, 2=拒绝
     */
    status?: enums_Status;
    /**
     * 帖子标题
     */
    title?: string;
    /**
     * 更新时间
     */
    updated_at?: string;
    /**
     * 浏览量
     */
    view_count?: number;
};

