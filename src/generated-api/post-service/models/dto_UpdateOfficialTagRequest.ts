/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type dto_UpdateOfficialTagRequest = {
    /**
     * 新的官方标签值，必填，并限制范围 (假设最大值为 3)
     */
    official_tag: number;
    /**
     * 帖子ID，必填
     */
    post_id: number;
};

