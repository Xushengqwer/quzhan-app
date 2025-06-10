/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_AuditPostRequest = {
    /**
     * 为 PostID 也添加一个 example
     */
    post_id: number;
    reason?: string;
    /**
     * Status 表示帖子的审核状态。
     * 0: 待审核 (Pending)
     * 1: 审核通过 (Approved)
     * 2: 拒绝 (Rejected)
     */
    status?: number;
};

